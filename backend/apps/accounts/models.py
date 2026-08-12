from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = 'STUDENT', 'Student'
        SHOPKEEPER = 'SHOPKEEPER', 'Shopkeeper'
        ADMIN = 'ADMIN', 'Admin'

    full_name = models.CharField(max_length=255, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, null=True, unique=True)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    college = models.ForeignKey('shops.College', on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_student(self):
        return self.role == self.Role.STUDENT

    def is_shopkeeper(self):
        return self.role == self.Role.SHOPKEEPER or self.is_superuser

    def is_campus_admin(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    @property
    def display_name(self):
        return self.full_name or self.first_name or self.username

    def __str__(self):
        return f"{self.display_name} ({self.role})"
