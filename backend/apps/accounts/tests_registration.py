from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.shops.models import College
from apps.accounts.serializers import RegisterSerializer

User = get_user_model()

class StudentRegistrationTestCase(TestCase):
    def setUp(self):
        self.college = College.objects.create(name="ITER College (SOA University)")
        self.client = APIClient()

    def test_successful_student_registration(self):
        payload = {
            'full_name': 'Rahul Kumar',
            'email': 'rahul@iter.ac.in',
            'phone': '9876543210',
            'password': 'password123'
        }
        serializer = RegisterSerializer(data=payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        self.assertEqual(user.role, User.Role.STUDENT)
        self.assertEqual(user.full_name, 'Rahul Kumar')
        self.assertEqual(user.phone, '9876543210')

        # Verify DB entry
        db_user = User.objects.get(email='rahul@iter.ac.in')
        self.assertEqual(db_user.role, User.Role.STUDENT)

    def test_duplicate_email_rejection(self):
        User.objects.create_user(
            username="existing_student",
            email="rahul@iter.ac.in",
            password="password123",
            phone="9876543211",
            role=User.Role.STUDENT
        )
        payload = {
            'full_name': 'Rahul Duplicate',
            'email': 'rahul@iter.ac.in',
            'phone': '9876543212',
            'password': 'password123'
        }
        serializer = RegisterSerializer(data=payload)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_invalid_phone_rejection(self):
        payload = {
            'full_name': 'Amit Das',
            'email': 'amit@iter.ac.in',
            'phone': '123', # Invalid length
            'password': 'password123'
        }
        serializer = RegisterSerializer(data=payload)
        self.assertFalse(serializer.is_valid())
        self.assertIn('phone', serializer.errors)

    def test_duplicate_phone_rejection(self):
        User.objects.create_user(
            username="existing_phone_user",
            email="unique_existing_phone@iter.ac.in",
            password="password123",
            phone="9876543210",
            role=User.Role.STUDENT
        )
        payload = {
            'full_name': 'Swarup Kumar',
            'email': 'swarup@iter.ac.in',
            'phone': '9876543210', # Duplicate phone
            'password': 'password123'
        }
        serializer = RegisterSerializer(data=payload)
        self.assertFalse(serializer.is_valid())
        self.assertIn('phone', serializer.errors)
