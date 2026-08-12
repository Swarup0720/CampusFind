from django.db import models
from django.conf import settings
from apps.shops.models import Shop

class Notification(models.Model):
    class Channel(models.TextChoices):
        WHATSAPP = 'WHATSAPP', 'WhatsApp'
        WEB = 'WEB', 'Web Dashboard'
        EMAIL = 'EMAIL', 'Email'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SENT = 'SENT', 'Sent'
        FAILED = 'FAILED', 'Failed'
        NOT_CONFIGURED = 'NOT_CONFIGURED', 'Not Configured (Missing Credentials)'
        MOCK = 'MOCK', 'Mock (Dev Mode — No Real Message Sent)'


    reservation = models.ForeignKey(
        'reservations.Reservation',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )
    shop = models.ForeignKey(Shop, on_delete=models.SET_NULL, null=True, blank=True)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )
    recipient_phone = models.CharField(max_length=20, blank=True, default='')
    notification_type = models.CharField(max_length=50, default='NEW_RESERVATION')
    message = models.TextField()
    channel = models.CharField(max_length=20, choices=Channel.choices, default=Channel.WHATSAPP)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    provider_message_id = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text="WhatsApp Cloud API message ID returned on successful dispatch"
    )
    error_message = models.TextField(
        blank=True,
        default='',
        help_text="Error details if sending failed (never shown to students)"
    )
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.channel}] -> {self.recipient_phone or (self.recipient.username if self.recipient else 'Unknown')} ({self.status})"
