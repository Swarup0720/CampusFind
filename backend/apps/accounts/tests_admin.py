from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.shops.models import College

User = get_user_model()

class AdminPermissionTestCase(TestCase):
    def setUp(self):
        self.college = College.objects.create(name="ITER College")
        self.student = User.objects.create_user(
            username="student_user",
            email="student_admin_test@iter.ac.in",
            password="password123",
            role=User.Role.STUDENT
        )
        self.admin = User.objects.create_user(
            username="admin_user",
            email="admin_admin_test@iter.ac.in",
            password="adminpassword123",
            role=User.Role.ADMIN,
            is_staff=True
        )
        self.client = APIClient()

    def test_student_cannot_access_admin_stats(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get('/api/admin/stats/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_access_admin_stats(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_shops', response.data)
        self.assertIn('total_reservations', response.data)
