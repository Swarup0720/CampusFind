import uuid
from django.db import models
from django.conf import settings
from apps.shops.models import Shop
from apps.products.models import Product

class Reservation(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ACCEPTED = 'ACCEPTED', 'Accepted'
        READY = 'READY', 'Ready for Pickup'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        REJECTED = 'REJECTED', 'Rejected'
        EXPIRED = 'EXPIRED', 'Expired'

    reservation_code = models.CharField(max_length=50, unique=True, editable=False)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reservations')
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='reservations')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    pickup_eta_minutes = models.PositiveIntegerField(default=20)
    pickup_deadline = models.DateTimeField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} x {self.quantity} (₹{self.total_price})"
