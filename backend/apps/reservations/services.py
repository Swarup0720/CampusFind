from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from rest_framework.exceptions import ValidationError
from .models import Reservation, ReservationItem
from apps.inventory.models import Inventory
from apps.notifications.services import NotificationService

class ReservationService:

    @classmethod
    def create_reservation(cls, student, shop_id, items_data, pickup_eta_minutes=20):
        if not items_data:
            raise ValidationError("Reservation must contain at least one item.")

        deadline = timezone.now() + timedelta(minutes=int(pickup_eta_minutes))

        with transaction.atomic():
            total_amount = 0
            items_to_create = []
            inventories_to_update = []

            for item_info in items_data:
                product_id = item_info['product_id']
                qty = int(item_info.get('quantity', 1))

                if qty <= 0:
                    raise ValidationError("Quantity must be greater than 0.")

                # Row-level locking to prevent race conditions
                try:
                    inventory = Inventory.objects.select_for_update().get(
                        shop_id=shop_id,
                        product_id=product_id,
                        is_available=True
                    )
                except Inventory.DoesNotExist:
                    raise ValidationError(f"Product {product_id} is not available in shop {shop_id}.")

                available = inventory.quantity - inventory.reserved_quantity
                if available < qty:
                    raise ValidationError(
                        f"Insufficient stock for '{inventory.product.name}'. Only {available} available."
                    )

                unit_price = inventory.price
                item_total = unit_price * qty
                total_amount += item_total

                # Reserve stock
                inventory.reserved_quantity += qty
                inventories_to_update.append(inventory)

                items_to_create.append({
                    'product': inventory.product,
                    'quantity': qty,
                    'unit_price': unit_price,
                    'total_price': item_total
                })

            # Save reserved quantities
            for inv in inventories_to_update:
                inv.save()

            # Create Reservation
            reservation = Reservation.objects.create(
                student=student,
                shop_id=shop_id,
                status=Reservation.Status.PENDING,
                pickup_eta_minutes=pickup_eta_minutes,
                pickup_deadline=deadline,
                total_amount=total_amount
            )

            # Create Reservation Items
            for item in items_to_create:
                ReservationItem.objects.create(
                    reservation=reservation,
                    product=item['product'],
                    quantity=item['quantity'],
                    unit_price=item['unit_price'],
                    total_price=item['total_price']
                )

        # Trigger notification outside transaction to avoid blocking DB commit
        try:
            NotificationService.send_reservation_notification(reservation)
        except Exception as e:
            # Notification service error must not roll back successful reservation
            pass

        return reservation

    @classmethod
    def accept_reservation(cls, reservation, user):
        cls._verify_shopkeeper_access(reservation, user)
        if reservation.status != Reservation.Status.PENDING:
            raise ValidationError(f"Cannot accept reservation in status '{reservation.status}'.")

        reservation.status = Reservation.Status.ACCEPTED
        reservation.save()

        NotificationService.create_web_notification(
            reservation=reservation,
            recipient=reservation.student,
            message=f"Your reservation {reservation.reservation_code} has been accepted by {reservation.shop.name}!"
        )
        return reservation

    @classmethod
    def mark_ready(cls, reservation, user):
        cls._verify_shopkeeper_access(reservation, user)
        if reservation.status not in [Reservation.Status.PENDING, Reservation.Status.ACCEPTED]:
            raise ValidationError(f"Cannot mark ready from status '{reservation.status}'.")

        reservation.status = Reservation.Status.READY
        reservation.save()

        NotificationService.create_web_notification(
            reservation=reservation,
            recipient=reservation.student,
            message=f"Your order {reservation.reservation_code} is READY for pickup at {reservation.shop.name}!"
        )
        return reservation

    @classmethod
    def complete_reservation(cls, reservation, user):
        cls._verify_shopkeeper_access(reservation, user)
        if reservation.status not in [Reservation.Status.ACCEPTED, Reservation.Status.READY, Reservation.Status.PENDING]:
            raise ValidationError(f"Cannot complete reservation in status '{reservation.status}'.")

        with transaction.atomic():
            for item in reservation.items.all():
                try:
                    inventory = Inventory.objects.select_for_update().get(
                        shop=reservation.shop,
                        product=item.product
                    )
                    inventory.quantity = max(0, inventory.quantity - item.quantity)
                    inventory.reserved_quantity = max(0, inventory.reserved_quantity - item.quantity)
                    inventory.save()
                except Inventory.DoesNotExist:
                    pass

            reservation.status = Reservation.Status.COMPLETED
            reservation.save()

        NotificationService.create_web_notification(
            reservation=reservation,
            recipient=reservation.student,
            message=f"Reservation {reservation.reservation_code} completed. Thank you!"
        )
        return reservation

    @classmethod
    def cancel_reservation(cls, reservation, user, reason="Cancelled by user"):
        if user.role == 'STUDENT' and reservation.student != user:
            raise ValidationError("You cannot cancel another student's reservation.")

        if reservation.status in [Reservation.Status.COMPLETED, Reservation.Status.CANCELLED, Reservation.Status.REJECTED, Reservation.Status.EXPIRED]:
            raise ValidationError(f"Reservation is already in final status '{reservation.status}'.")

        with transaction.atomic():
            cls._release_reserved_stock(reservation)
            reservation.status = Reservation.Status.CANCELLED
            reservation.save()

        return reservation

    @classmethod
    def reject_reservation(cls, reservation, user, reason="Rejected by shopkeeper"):
        cls._verify_shopkeeper_access(reservation, user)
        if reservation.status in [Reservation.Status.COMPLETED, Reservation.Status.CANCELLED, Reservation.Status.REJECTED, Reservation.Status.EXPIRED]:
            raise ValidationError(f"Reservation is already in status '{reservation.status}'.")

        with transaction.atomic():
            cls._release_reserved_stock(reservation)
            reservation.status = Reservation.Status.REJECTED
            reservation.save()

        NotificationService.create_web_notification(
            reservation=reservation,
            recipient=reservation.student,
            message=f"Your reservation {reservation.reservation_code} was declined by {reservation.shop.name}."
        )
        return reservation

    @classmethod
    def _release_reserved_stock(cls, reservation):
        for item in reservation.items.all():
            try:
                inventory = Inventory.objects.select_for_update().get(
                    shop=reservation.shop,
                    product=item.product
                )
                inventory.reserved_quantity = max(0, inventory.reserved_quantity - item.quantity)
                inventory.save()
            except Inventory.DoesNotExist:
                pass

    @classmethod
    def _verify_shopkeeper_access(cls, reservation, user):
        if user.is_superuser or user.role == 'ADMIN':
            return
        if user.role != 'SHOPKEEPER' or not hasattr(user, 'shop') or user.shop != reservation.shop:
            raise ValidationError("You do not have permission to manage this shop's reservations.")
