import uuid
from django.db import models
from django.conf import settings
from apps.shops.models import Shop
from apps.products.models import Product, ProductVariant

class Reservation(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PAYMENT_SUBMITTED = 'PAYMENT_SUBMITTED', 'Payment Submitted'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        READY = 'READY', 'Ready for Pickup'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        REJECTED = 'REJECTED', 'Rejected'
        EXPIRED = 'EXPIRED', 'Expired'

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        VERIFIED = 'VERIFIED', 'Verified'
        FAILED = 'FAILED', 'Failed'

    class PaymentMethod(models.TextChoices):
        UPI_QR = 'UPI_QR', 'UPI QR Code'
        CASH = 'CASH', 'Cash on Pickup'

    reservation_code = models.CharField(max_length=50, unique=True, editable=False, db_index=True)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reservations')
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='reservations')
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING, db_index=True)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.UPI_QR)
    payment_reference = models.CharField(max_length=100, blank=True, default='', help_text="UPI Transaction ID / UTR number")
    payment_submitted_at = models.DateTimeField(null=True, blank=True)
    pickup_eta_minutes = models.PositiveIntegerField(default=20)
    pickup_deadline = models.DateTimeField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.reservation_code:
            code_num = uuid.uuid4().hex[:6].upper()
            self.reservation_code = f"RES-2026-{code_num}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reservation_code} ({self.student.username} @ {self.shop.name} - {self.status})"


class ReservationItem(models.Model):
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    @property
    def item_name(self):
        if self.variant:
            return self.variant.name
        return self.product.name

    def __str__(self):
        name = self.variant.name if self.variant else self.product.name
        return f"{name} x {self.quantity} (₹{self.total_price})"
