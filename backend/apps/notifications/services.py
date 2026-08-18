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

        # Generate the structured personalized message format
        message = cls.generate_shopkeeper_whatsapp_message(reservation)
        normalized_recipient = cls.normalize_phone_number(shopkeeper_whatsapp_number)

        notification = Notification.objects.create(
            reservation=reservation,
            shop=shop,
            recipient=shop.owner,
            recipient_phone=normalized_recipient,
            notification_type='WHATSAPP_ORDER_INITIATED',
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
                f"{normalized_recipient}. Missing: {config_status['missing_credentials']}"
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

    @classmethod
    def normalize_phone_number(cls, phone_str: str) -> str:
        if not phone_str:
            return ""
        import re
        digits = re.sub(r'\D', '', phone_str)
        if len(digits) == 10:
            return f"91{digits}"
        elif len(digits) == 12 and digits.startswith('91'):
            return digits
        return digits

    @classmethod
    def generate_shopkeeper_whatsapp_message(cls, reservation) -> str:
        shop = reservation.shop
        shopkeeper_name = ""
        if shop.owner:
            name_to_use = shop.owner.first_name or shop.owner.full_name or shop.owner.username
            if name_to_use:
                shopkeeper_name = name_to_use.split()[0]

        items = reservation.items.all()
        if len(items) == 1:
            item = items[0]
            display_name = item.item_name
            items_text = f"Product:\n{display_name}\n\nQuantity:\n{item.quantity}\n\nAmount:\n₹{reservation.total_amount}"
            closing_text = "Please keep the requested item ready for pickup."
        else:
            bullet_items = "\n".join([f"• {item.item_name} × {item.quantity} (₹{item.total_price})" for item in items])
            items_text = f"Items:\n{bullet_items}\n\nTotal Amount:\n₹{reservation.total_amount}"
            closing_text = "Please keep the requested items ready for pickup."

        customer_name = reservation.student.full_name or reservation.student.display_name or reservation.student.username
        greeting = f"Hello {shopkeeper_name}," if shopkeeper_name else "Hello,"
        
        payment_info = ""
        if reservation.status == 'PAYMENT_SUBMITTED' or reservation.payment_status == 'SUBMITTED':
            ref_str = f"UTR: {reservation.payment_reference}" if reservation.payment_reference else "UPI Payment Confirmed"
            payment_info = f"\n\n💳 PAYMENT STATUS:\nPAID via UPI ({ref_str})"
        
        return (
            f"{greeting}\n\n"
            f"A customer has placed an order through CampusFind.\n\n"
            f"🛒 ORDER REQUEST\n"
            f"━━━━━━━━━━━━━━━━━━\n\n"
            f"{items_text}\n\n"
            f"Requested Pickup:\n"
            f"Within {reservation.pickup_eta_minutes} minutes\n\n"
            f"Customer:\n"
            f"{customer_name}\n\n"
            f"Order ID:\n"
            f"{reservation.reservation_code}"
            f"{payment_info}\n\n"
            f"{closing_text}\n\n"
            f"— CampusFind"
        )

    @classmethod
    def create_shopkeeper_whatsapp_link(cls, reservation) -> dict:
        shop = reservation.shop
        if not shop:
            return {'link': None, 'error': 'MISSING_SHOP'}

        whatsapp_number = (shop.whatsapp_number or '').strip()
        if not whatsapp_number:
            whatsapp_number = (shop.phone or '').strip()
        if not whatsapp_number and shop.owner:
            whatsapp_number = (shop.owner.phone or '').strip()

        if not whatsapp_number:
            return {'link': None, 'error': 'MISSING_NUMBER'}

        normalized = cls.normalize_phone_number(whatsapp_number)
        if len(normalized) < 10:
            return {'link': None, 'error': 'INVALID_NUMBER'}

        try:
            message = cls.generate_shopkeeper_whatsapp_message(reservation)
        except Exception:
            return {'link': None, 'error': 'GENERATION_FAILED'}

        import urllib.parse
        encoded = urllib.parse.quote(message)
        link = f"https://wa.me/{normalized}?text={encoded}"
        return {'link': link, 'error': None}
