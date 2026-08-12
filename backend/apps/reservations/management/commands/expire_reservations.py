from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from apps.reservations.models import Reservation
from apps.reservations.services import ReservationService
from apps.inventory.models import Inventory

class Command(BaseCommand):
    help = 'Auto-expires past pickup deadline reservations and releases reserved inventory'

    def handle(self, *args, **options):
        now = timezone.now()
        overdue_reservations = Reservation.objects.filter(
            status__in=[Reservation.Status.PENDING, Reservation.Status.ACCEPTED],
            pickup_deadline__lt=now
        )

        count = 0
        for reservation in overdue_reservations:
            with transaction.atomic():
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

                reservation.status = Reservation.Status.EXPIRED
                reservation.save()
                count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully expired {count} overdue reservations."))
