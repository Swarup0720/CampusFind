import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.shops.models import College, Shop
from apps.products.models import Category, Product
from apps.inventory.models import Inventory
from apps.reservations.models import Reservation
from apps.reservations.services import ReservationService
from apps.search.services import NaturalSearchService
from apps.notifications.models import Notification

User = get_user_model()

class CampusFindTestCase(TestCase):
    def setUp(self):
        self.college = College.objects.create(name="ITER College")

        self.student = User.objects.create_user(
            username="test_student",
            email="test_student@iter.ac.in",
            password="password123",
            role=User.Role.STUDENT,
            college=self.college
        )
        self.shopkeeper_user = User.objects.create_user(
            username="test_shopkeeper",
            email="test_shopkeeper@iter.ac.in",
            password="password123",
            role=User.Role.SHOPKEEPER,
            college=self.college
        )

        self.shop = Shop.objects.create(
            name="Campus Stationery",
            location_name="Block 1",
            owner=self.shopkeeper_user,
            phone="9876543210",
            college=self.college,
            is_open=True
        )

        self.category = Category.objects.create(name="Stationery")

        self.blue_pen = Product.objects.create(
            name="Blue Ball Pen",
            category=self.category,
            brand="Cello"
        )
        self.black_pen = Product.objects.create(
            name="Black Ball Pen",
            category=self.category,
            brand="Reynolds"
        )

        self.inventory1 = Inventory.objects.create(
            shop=self.shop,
            product=self.blue_pen,
            price=20.00,
            quantity=10,
            reserved_quantity=0,
            is_available=True
        )
        self.inventory2 = Inventory.objects.create(
            shop=self.shop,
            product=self.black_pen,
            price=25.00,
            quantity=2,
            reserved_quantity=0,
            is_available=True
        )

    def test_natural_search_parser(self):
        query_res = NaturalSearchService.search_inventory("I need a blue pen under 30")
        self.assertEqual(query_res['count'], 1)
        self.assertEqual(query_res['results'][0]['product'], "Blue Ball Pen")
        self.assertEqual(query_res['results'][0]['price'], 20.00)

    def test_successful_reservation(self):
        items = [{'product_id': self.blue_pen.id, 'quantity': 2}]
        res = ReservationService.create_reservation(self.student, self.shop.id, items, pickup_eta_minutes=20)

        self.inventory1.refresh_from_db()
        self.assertEqual(res.status, Reservation.Status.PENDING)
        self.assertEqual(res.total_amount, 40.00)
        self.assertEqual(self.inventory1.reserved_quantity, 2)
        self.assertEqual(self.inventory1.available_quantity, 8)

    def test_insufficient_stock_raises_error(self):
        items = [{'product_id': self.black_pen.id, 'quantity': 5}] # stock is 2
        with self.assertRaises(Exception):
            ReservationService.create_reservation(self.student, self.shop.id, items, pickup_eta_minutes=20)

    def test_shopkeeper_workflow_accept_ready_complete(self):
        items = [{'product_id': self.blue_pen.id, 'quantity': 1}]
        res = ReservationService.create_reservation(self.student, self.shop.id, items, pickup_eta_minutes=15)

        # Accept
        res = ReservationService.accept_reservation(res, self.shopkeeper_user)
        self.assertEqual(res.status, Reservation.Status.ACCEPTED)

        # Ready
        res = ReservationService.mark_ready(res, self.shopkeeper_user)
        self.assertEqual(res.status, Reservation.Status.READY)

        # Complete
        res = ReservationService.complete_reservation(res, self.shopkeeper_user)
        self.assertEqual(res.status, Reservation.Status.COMPLETED)

        self.inventory1.refresh_from_db()
        self.assertEqual(self.inventory1.quantity, 9)
        self.assertEqual(self.inventory1.reserved_quantity, 0)
        self.assertEqual(self.inventory1.available_quantity, 9)

    def test_cancel_reservation_releases_stock(self):
        items = [{'product_id': self.blue_pen.id, 'quantity': 3}]
        res = ReservationService.create_reservation(self.student, self.shop.id, items, pickup_eta_minutes=20)

        self.inventory1.refresh_from_db()
        self.assertEqual(self.inventory1.reserved_quantity, 3)

        ReservationService.cancel_reservation(res, self.student)
        self.inventory1.refresh_from_db()
        self.assertEqual(self.inventory1.reserved_quantity, 0)
        self.assertEqual(self.inventory1.quantity, 10)

    def test_mock_notification_log(self):
        items = [{'product_id': self.blue_pen.id, 'quantity': 1}]
        res = ReservationService.create_reservation(self.student, self.shop.id, items, pickup_eta_minutes=20)

        notif = Notification.objects.filter(reservation=res).first()
        self.assertIsNotNone(notif)
        self.assertEqual(notif.status, Notification.Status.SENT)
        self.assertIn("RES-2026", notif.message)
