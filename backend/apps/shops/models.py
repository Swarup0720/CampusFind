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
    location_name = models.CharField(max_length=255, help_text="e.g. Block 1 Ground Floor, ITER Campus")
    latitude = models.FloatField(default=20.2526)
    longitude = models.FloatField(default=85.7956)
    opening_time = models.TimeField(default='08:00:00')
    closing_time = models.TimeField(default='21:00:00')
    is_open = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.location_name})"
