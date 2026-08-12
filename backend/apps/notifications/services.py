import os
import logging
import requests
from django.utils import timezone
from .models import Notification

logger = logging.getLogger(__name__)


class WhatsAppNotificationService:
    """
    CampusFind's central WhatsApp Business notification service.

    Architecture:
      Student order → ReservationService → WhatsAppNotificationService → WhatsApp Cloud API
                                                                       → Shopkeeper's phone

    Credentials & Config:
      - WHATSAPP_ACCESS_TOKEN
      - WHATSAPP_PHONE_NUMBER_ID
      - WHATSAPP_BUSINESS_ACCOUNT_ID
      - WHATSAPP_SENDER_NUMBER (e.g. 917657094157)

    Recipient:
      Dynamically retrieved from DB: reservation → shop → shop.whatsapp_number
    """

    @classmethod
    def get_config_status(cls):
        """
        Validates WhatsApp Business API configuration credentials.
        Returns detailed status object.
        """
        access_token = os.getenv('WHATSAPP_ACCESS_TOKEN', '').strip()
        phone_number_id = os.getenv('WHATSAPP_PHONE_NUMBER_ID', '').strip()
        business_account_id = os.getenv('WHATSAPP_BUSINESS_ACCOUNT_ID', '').strip()
        sender_number = os.getenv('WHATSAPP_SENDER_NUMBER', '').strip() or '917657094157'

        required = {
            'WHATSAPP_ACCESS_TOKEN': access_token,
            'WHATSAPP_PHONE_NUMBER_ID': phone_number_id,
            'WHATSAPP_BUSINESS_ACCOUNT_ID': business_account_id,
            'WHATSAPP_SENDER_NUMBER': sender_number,
        }

        missing = [key for key, val in required.items() if not val]

        if missing:
            return {
                'success': False,
                'configured': False,
                'mode': 'REAL_WHATSAPP_NOT_CONFIGURED',
                'sender_number': sender_number,
                'missing_credentials': missing,
                'message': (
                    f"Real WhatsApp delivery is not configured. "
                    f"Missing credentials: {', '.join(missing)}. "
                    f"Configure the WhatsApp Business sender credentials before testing."
                )
            }

        return {
            'success': True,
            'configured': True,
            'mode': 'REAL_WHATSAPP_CONFIGURED',
            'sender_number': sender_number,
            'phone_number_id': phone_number_id,
            'business_account_id': business_account_id,
            'missing_credentials': [],
            'message': "Real WhatsApp delivery is fully configured."
        }

    @classmethod
    def send_order_notification(cls, shopkeeper_whatsapp_number: str, reservation) -> Notification:
        """
        Sends a real WhatsApp message to the shopkeeper's phone number.
        Strict enforcement:
          - If credentials configured -> dispatch real HTTP call to WhatsApp Cloud API.
          - If credentials missing -> DO NOT pretend SENT or fallback silently.
                                     Record status=NOT_CONFIGURED with clear error details.
        """
        shop = reservation.shop

        items_str = "\n".join([
            f"{item.product.name} × {item.quantity}"
            for item in reservation.items.all()
        ])

        # Exact required message format
        total_formatted = int(reservation.total_amount) if float(reservation.total_amount).is_integer() else reservation.total_amount
        message = (
            f"🔔 NEW CAMPUSFIND PICKUP REQUEST\n\n"
            f"Reservation:\n{reservation.reservation_code}\n\n"
            f"Shop:\n{shop.name}\n\n"
            f"Product:\n{items_str}\n\n"
            f"Total:\n₹{total_formatted}\n\n"
            f"Customer:\nStudent #{reservation.student.id}\n\n"
            f"Pickup:\nWithin {reservation.pickup_eta_minutes} minutes\n\n"
            f"Please keep the order ready.\n\n"
            f"Thank you,\nCampusFind"
        )

        notification = Notification.objects.create(
            reservation=reservation,
            shop=shop,
            recipient=shop.owner,
            recipient_phone=shopkeeper_whatsapp_number,
            notification_type='NEW_RESERVATION',
            message=message,
            channel=Notification.Channel.WHATSAPP,
            status=Notification.Status.PENDING
        )

        config_status = cls.get_config_status()

        if not config_status['configured']:
            notification.status = Notification.Status.NOT_CONFIGURED
            notification.error_message = config_status['message']
            notification.save()
            logger.warning(
                f"[WHATSAPP NOT CONFIGURED] Reservation {reservation.reservation_code} -> "
                f"{shopkeeper_whatsapp_number}. Missing: {config_status['missing_credentials']}"
            )
            return notification

        # Real WhatsApp delivery attempt
        access_token = os.getenv('WHATSAPP_ACCESS_TOKEN', '').strip()
        phone_number_id = os.getenv('WHATSAPP_PHONE_NUMBER_ID', '').strip()
        cls._dispatch_real_whatsapp(notification, access_token, phone_number_id)
        return notification

    @classmethod
    def _dispatch_real_whatsapp(cls, notification: Notification, access_token: str, phone_number_id: str):
        """
        Dispatches a real WhatsApp message via the Meta Graph WhatsApp Cloud API.
        Sets status=SENT and stores provider_message_id ONLY if API returned success (HTTP 200/201).
        Sets status=FAILED with error_message if API returns any error.
        """
        url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": notification.recipient_phone,
            "type": "text",
            "text": {
                "preview_url": False,
                "body": notification.message
            }
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            response_data = response.json() if response.content else {}

            if response.status_code in [200, 201] and response_data.get('messages'):
                provider_id = response_data['messages'][0].get('id', '')
                notification.status = Notification.Status.SENT
                notification.provider_message_id = provider_id
                notification.sent_at = timezone.now()
                notification.error_message = ''
                logger.info(
                    f"[WHATSAPP DELIVERED] Reservation {notification.reservation.reservation_code} "
                    f"-> {notification.recipient_phone} | Provider ID: {provider_id}"
                )
            else:
                error_obj = response_data.get('error', {})
                error_detail = error_obj.get('message', response.text[:500])
                error_code = error_obj.get('code', response.status_code)
                notification.status = Notification.Status.FAILED
                notification.error_message = f"WhatsApp API Error (Code {error_code}, HTTP {response.status_code}): {error_detail}"
                logger.error(
                    f"[WHATSAPP FAILED] Reservation {notification.reservation.reservation_code} "
                    f"-> {notification.recipient_phone} | Error: {notification.error_message}"
                )

        except requests.exceptions.Timeout:
            notification.status = Notification.Status.FAILED
            notification.error_message = "WhatsApp API request timed out after 10 seconds."
            logger.error(f"[WHATSAPP TIMEOUT] Reservation {notification.reservation.reservation_code}")
        except Exception as exc:
            notification.status = Notification.Status.FAILED
            notification.error_message = f"Network or dispatch error: {str(exc)}"
            logger.error(f"[WHATSAPP ERROR] Reservation {notification.reservation.reservation_code} | {exc}")

        notification.save()


class NotificationService:
    """
    Facade for all notification dispatches.
    Retrieves shopkeeper WhatsApp number dynamically from DB:
      reservation → shop → shop.whatsapp_number
    """

    @classmethod
    def send_reservation_notification(cls, reservation) -> Notification:
        shop = reservation.shop

        # Retrieve WhatsApp number dynamically from DB — NEVER hardcoded
        shopkeeper_whatsapp = shop.whatsapp_number.strip() if shop.whatsapp_number else ''

        if not shopkeeper_whatsapp:
            shopkeeper_whatsapp = shop.phone.strip() if shop.phone else ''

        if not shopkeeper_whatsapp:
            logger.error(f"[WHATSAPP] Shop '{shop.name}' has no whatsapp_number or phone configured.")
            return Notification.objects.create(
                reservation=reservation,
                shop=shop,
                recipient=shop.owner,
                recipient_phone='',
                notification_type='NEW_RESERVATION',
                message='No shopkeeper WhatsApp number configured in database.',
                channel=Notification.Channel.WHATSAPP,
                status=Notification.Status.FAILED,
                error_message=f"Shop '{shop.name}' is missing a whatsapp_number in the database."
            )

        return WhatsAppNotificationService.send_order_notification(
            shopkeeper_whatsapp_number=shopkeeper_whatsapp,
            reservation=reservation
        )

    @classmethod
    def create_web_notification(cls, reservation, recipient, message: str) -> Notification:
        phone_val = (recipient.phone or '') if recipient else ''
        return Notification.objects.create(
            reservation=reservation,
            shop=reservation.shop,
            recipient=recipient,
            recipient_phone=phone_val,
            notification_type='STATUS_UPDATE',
            message=message,
            channel=Notification.Channel.WEB,
            status=Notification.Status.SENT,
            sent_at=timezone.now()
        )
