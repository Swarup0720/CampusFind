"""
seed_prototype_data — CampusFind Prototype Data Seeder
======================================================

Creates and normalizes prototype test data for real WhatsApp delivery verification:

    College:          ITER College
    Category:         Food & Snacks
    Student User:     Phone +91 7657094157 (login with 7657094157 / password123)
    Shopkeeper User:  Phone 9348957645 (username: chowmine_sk)
    Shop:             Chowmine Shop
    WhatsApp Number:  919348957645 (in database, retrieved dynamically)
    Product:          Veg Chowmine
    Inventory:        Chowmine Shop -> Veg Chowmine @ Rs.60, stock=10

Usage:
    python manage.py seed_prototype_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.shops.models import College, Shop
from apps.products.models import Category, Product
from apps.inventory.models import Inventory

User = get_user_model()


class Command(BaseCommand):
    help = (
        "Seeds prototype data for WhatsApp notification testing with Student (+91 7657094157) "
        "and Chowmine Shopkeeper (+91 9348957645)."
    )

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("=" * 60))
        self.stdout.write(self.style.NOTICE("CampusFind Prototype Data Seeder"))
        self.stdout.write(self.style.NOTICE("=" * 60))

        # ------------------------------------------------------------------ #
        # 1. College — ITER College
        # ------------------------------------------------------------------ #
        college = College.objects.filter(name__icontains='ITER College').first()
        if not college:
            college = College.objects.create(
                name="ITER College",
                address='Jagamara, Khandagiri, Bhubaneswar, Odisha 751030',
                latitude=20.2526,
                longitude=85.7956,
                is_active=True,
            )
            college_created = True
        else:
            college_created = False

        self.stdout.write(
            self.style.SUCCESS(f"  {'[CREATED]' if college_created else '[EXISTS ]'} College: {college.name}")
        )

        # ------------------------------------------------------------------ #
        # 2. Category — Food & Snacks
        # ------------------------------------------------------------------ #
        category = Category.objects.filter(name__icontains='Food').first()
        if not category:
            category = Category.objects.create(
                name="Food & Snacks",
                description='Campus food items including snacks, noodles, and quick bites',
                is_active=True,
            )
            cat_created = True
        else:
            cat_created = False

        self.stdout.write(
            self.style.SUCCESS(f"  {'[CREATED]' if cat_created else '[EXISTS ]'} Category: {category.name}")
        )

        # ------------------------------------------------------------------ #
        # 3. Prototype Student User — Phone: 7657094157 (+91 7657094157)
        # ------------------------------------------------------------------ #
        student_user = User.objects.filter(phone='7657094157').first()
        if not student_user:
            student_user = User.objects.filter(username='student').first()
            if student_user:
                student_user.phone = '7657094157'
                student_user.college = college
                student_user.save(update_fields=['phone', 'college'])
                student_created = False
                self.stdout.write(
                    self.style.SUCCESS(f"  [UPDATED ] Updated existing 'student' user phone to 7657094157")
                )
            else:
                student_user = User.objects.create_user(
                    username='student_7657094157',
                    email='student.7657094157@campusfind.local',
                    password='password123',
                    full_name='Campus Student',
                    phone='7657094157',
                    role=User.Role.STUDENT,
                    college=college,
                    is_active=True,
                )
                student_created = True
                self.stdout.write(
                    self.style.SUCCESS(f"  [CREATED ] Created Student User (+91 7657094157)")
                )
        else:
            self.stdout.write(
                self.style.SUCCESS(f"  [EXISTS  ] Student User: {student_user.username} (phone: +91 {student_user.phone})")
            )

        # ------------------------------------------------------------------ #
        # 4. Shopkeeper User — Demo Chowmine Shopkeeper
        # ------------------------------------------------------------------ #
        shopkeeper = User.objects.filter(username='chowmine_sk').first()
        if not shopkeeper:
            existing_phone_user = User.objects.filter(phone='9348957645').first()
            if existing_phone_user:
                shopkeeper = existing_phone_user
                shopkeeper.full_name = 'Demo Chowmine Shopkeeper'
                shopkeeper.role = User.Role.SHOPKEEPER
                shopkeeper.college = college
                shopkeeper.save(update_fields=['full_name', 'role', 'college'])
                sk_created = False
            else:
                shopkeeper = User.objects.create(
                    username='chowmine_sk',
                    email='chowmine.shopkeeper@campusfind.local',
                    full_name='Demo Chowmine Shopkeeper',
                    phone='9348957645',
                    role=User.Role.SHOPKEEPER,
                    college=college,
                    is_active=True,
                )
                shopkeeper.set_password('chowmine123')
                shopkeeper.save()
                sk_created = True
        else:
            sk_created = False

        self.stdout.write(
            self.style.SUCCESS(f"  {'[CREATED]' if sk_created else '[EXISTS ]'} Shopkeeper User: {shopkeeper.full_name}")
        )

        # ------------------------------------------------------------------ #
        # 5. Shop — Chowmine Shop
        #    WhatsApp number stored dynamically in DB as 919348957645
        # ------------------------------------------------------------------ #
        shop, shop_created = Shop.objects.get_or_create(
            name="Chowmine Shop",
            defaults={
                'college': college,
                'description': 'Authentic veg chowmine and Chinese snacks on ITER campus',
                'owner': shopkeeper,
                'phone': '9348957645',
                'whatsapp_number': '919348957645',
                'location_name': 'ITER College Campus',
                'latitude': 20.2526,
                'longitude': 85.7956,
                'opening_time': '09:00:00',
                'closing_time': '21:00:00',
                'is_open': True,
                'is_active': True,
            }
        )
        if not shop.whatsapp_number:
            shop.whatsapp_number = '919348957645'
            shop.save(update_fields=['whatsapp_number'])

        self.stdout.write(
            self.style.SUCCESS(
                f"  {'[CREATED]' if shop_created else '[EXISTS ]'} "
                f"Shop: {shop.name} | WhatsApp: {shop.whatsapp_number}"
            )
        )

        # ------------------------------------------------------------------ #
        # 6. Product — Veg Chowmine
        # ------------------------------------------------------------------ #
        product, prod_created = Product.objects.get_or_create(
            name="Veg Chowmine",
            defaults={
                'description': 'Fresh vegetable chowmine — campus favourite stir-fried noodles',
                'category': category,
                'brand': 'Chowmine Shop',
                'image': '',
                'unit': 'plate',
                'is_active': True,
            }
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"  {'[CREATED]' if prod_created else '[EXISTS ]'} Product: {product.name}"
            )
        )

        # ------------------------------------------------------------------ #
        # 7. Inventory -- Chowmine Shop -> Veg Chowmine @ Rs.60, stock=10
        # ------------------------------------------------------------------ #
        inventory = Inventory.objects.filter(shop=shop, product=product).first()
        if not inventory:
            inventory = Inventory.objects.create(
                shop=shop,
                product=product,
                price=60.00,
                quantity=10,
                reserved_quantity=0,
                is_available=True,
            )
            inv_created = True
        else:
            inventory.quantity = 10
            inventory.reserved_quantity = 0
            inventory.is_available = True
            inventory.save(update_fields=['quantity', 'reserved_quantity', 'is_available'])
            inv_created = False

        self.stdout.write(
            self.style.SUCCESS(
                f"  {'[CREATED]' if inv_created else '[EXISTS ]'} "
                f"Inventory: {product.name} @ {shop.name} | Rs.{inventory.price} | Stock: {inventory.available_quantity}"
            )
        )

        # ------------------------------------------------------------------ #
        # Summary
        # ------------------------------------------------------------------ #
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("Prototype data seeding complete!"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write("")
        self.stdout.write("  Data relationship:")
        self.stdout.write(f"    Student  -> Phone +91 7657094157 (login: 7657094157 / password123)")
        self.stdout.write(f"    Shop     -> {shop.name}")
        self.stdout.write(f"    Recipient-> +91 9348957645 (Shopkeeper WhatsApp)")
        self.stdout.write(f"    Product  -> {product.name} @ Rs.{inventory.price}")
        self.stdout.write(f"    Stock    -> {inventory.available_quantity} available")
        self.stdout.write("")
