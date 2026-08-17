from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.shops.models import College, Shop
from apps.products.models import Category, Product
from apps.inventory.models import Inventory

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds WhatsApp integration demo data: Rohit's Shop (+91 7657094157) and Saurav's Shop (+91 9348957645)"

    def handle(self, *args, **options):
        self.stdout.write("Starting WhatsApp demo data seeding...")

        # 1. Create or get ITER College
        college, _ = College.objects.get_or_create(
            name="ITER College",
            defaults={
                'address': 'Jagamara, Khandagiri, Bhubaneswar, Odisha 751030',
                'latitude': 20.2526,
                'longitude': 85.7956,
                'is_active': True
            }
        )

        # 2. Create stationery category
        category, _ = Category.objects.get_or_create(
            name="Stationery",
            defaults={'description': 'Pens, notebooks, and exam supplies', 'is_active': True}
        )

        # 3. Free up phone numbers to avoid IntegrityError
        # Student will have phone = '7657094157'
        # Saurav shopkeeper will have phone = '9348957645'
        # Rohit shopkeeper will have phone = None (but Rohit's shop will have WhatsApp '7657094157')
        User.objects.filter(phone='7657094157').exclude(username='student').update(phone=None)
        User.objects.filter(phone='9348957645').exclude(username='saurav_sk').update(phone=None)

        # Ensure student user exists and has phone '7657094157'
        student_user, _ = User.objects.get_or_create(
            username="student",
            defaults={
                'email': 'student@iter.ac.in',
                'full_name': 'Student User',
                'phone': '7657094157',
                'role': User.Role.STUDENT,
                'college': college,
                'is_active': True
            }
        )
        student_user.set_password("password123")
        student_user.phone = '7657094157'
        student_user.save()

        # 4. Create shopkeeper users
        # Rohit
        rohit_user, _ = User.objects.get_or_create(
            username="rohit_sk",
            defaults={
                'email': 'rohit@campusfind.local',
                'full_name': 'Rohit',
                'phone': None,
                'role': User.Role.SHOPKEEPER,
                'college': college,
                'is_active': True
            }
        )
        rohit_user.set_password("password123")
        rohit_user.phone = None
        rohit_user.save()

        # Saurav
        saurav_user, _ = User.objects.get_or_create(
            username="saurav_sk",
            defaults={
                'email': 'saurav@campusfind.local',
                'full_name': 'Saurav',
                'phone': '9348957645',
                'role': User.Role.SHOPKEEPER,
                'college': college,
                'is_active': True
            }
        )
        saurav_user.set_password("password123")
        saurav_user.phone = '9348957645'
        saurav_user.save()

        # 5. Create shops
        rohit_shop, _ = Shop.objects.get_or_create(
            name="Rohit's Shop",
            defaults={
                'college': college,
                'description': 'Stationery and daily essentials by Rohit',
                'owner': rohit_user,
                'phone': '7657094157',
                'whatsapp_number': '7657094157',
                'location_name': 'Block 1 Ground Floor',
                'is_open': True,
                'is_active': True
            }
        )
        rohit_shop.whatsapp_number = '7657094157'
        rohit_shop.phone = '7657094157'
        rohit_shop.save()

        saurav_shop, _ = Shop.objects.get_or_create(
            name="Saurav's Shop",
            defaults={
                'college': college,
                'description': 'Snacks and stationery by Saurav',
                'owner': saurav_user,
                'phone': '9348957645',
                'whatsapp_number': '9348957645',
                'location_name': 'Block 3 Quad',
                'is_open': True,
                'is_active': True
            }
        )
        saurav_shop.whatsapp_number = '9348957645'
        saurav_shop.phone = '9348957645'
        saurav_shop.save()

        # 6. Create core products
        products_data = [
            ("Pen", "Smooth writing ball point pen", 10.00),
            ("Notebook", "Classmate single line notebook", 65.00),
            ("Pencil", "HB drawing pencil", 5.00),
            ("Calculator", "Casio Scientific Calculator", 1250.00),
            ("Marker", "Whiteboard marker pen", 20.00)
        ]

        for name, desc, price in products_data:
            product, _ = Product.objects.get_or_create(
                name=name,
                defaults={
                    'description': desc,
                    'category': category,
                    'unit': 'piece',
                    'is_active': True
                }
            )

            # Assign to Rohit's Shop
            Inventory.objects.update_or_create(
                shop=rohit_shop,
                product=product,
                defaults={
                    'price': price,
                    'quantity': 20,
                    'reserved_quantity': 0,
                    'is_available': True
                }
            )

            # Assign to Saurav's Shop
            Inventory.objects.update_or_create(
                shop=saurav_shop,
                product=product,
                defaults={
                    'price': price,
                    'quantity': 20,
                    'reserved_quantity': 0,
                    'is_available': True
                }
            )

        self.stdout.write(self.style.SUCCESS("Successfully seeded WhatsApp demo shops and products!"))
