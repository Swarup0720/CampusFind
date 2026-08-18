from django.db import models
from django.conf import settings

class College(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, default='')
    latitude = models.FloatField(default=20.2526)
    longitude = models.FloatField(default=85.7956)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Shop(models.Model):
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='shops', null=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shop'
    )
    phone = models.CharField(max_length=20)
    whatsapp_number = models.CharField(
        max_length=20,
        blank=True,
        default='',
        help_text="Shopkeeper's WhatsApp number in normalized format, e.g. 919348957645 (country code + number, no + or spaces)"
    )
    upi_id = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text="Shopkeeper's UPI VPA / ID (e.g. 9853000001@paytm, rohitshop@okaxis)"
    )
    upi_name = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text="Payee Name displayed on UPI payment screen"
    )
    qr_code_image = models.URLField(
        blank=True,
        default='',
        help_text="Direct URL to shopkeeper's static QR code if available"
    )
    location_name = models.CharField(max_length=255, help_text="e.g. Block 1 Ground Floor, ITER Campus")
    latitude = models.FloatField(default=20.2526)
    longitude = models.FloatField(default=85.7956)
    opening_time = models.TimeField(default='08:00:00')
    closing_time = models.TimeField(default='21:00:00')
    is_open = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_upi_payment_uri(self, amount: float = 0.0, order_code: str = '') -> str:
        """Construct standard UPI URI (upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...)"""
        vpa = self.upi_id or f"{self.phone}@upi"
        payee = self.upi_name or self.name
        note = f"Order_{order_code}" if order_code else "CampusFind_Order"
        clean_payee = payee.replace(" ", "%20")
        clean_note = note.replace(" ", "%20")
        if amount > 0:
            return f"upi://pay?pa={vpa}&pn={clean_payee}&am={amount:.2f}&cu=INR&tn={clean_note}"
        return f"upi://pay?pa={vpa}&pn={clean_payee}&cu=INR&tn={clean_note}"

    def __str__(self):
        return f"{self.name} ({self.location_name})"
