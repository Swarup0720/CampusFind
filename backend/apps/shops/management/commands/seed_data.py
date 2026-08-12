import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.shops.models import College, Shop
from apps.products.models import Category, Product
from apps.inventory.models import Inventory

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds realistic data for ITER College: 20 shops, 50+ products, 100+ inventory records'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting database seeding process..."))

        # 1. Create College
        college, _ = College.objects.get_or_create(
            name="ITER College (SOA University)",
            defaults={
                'address': 'Jagamara, Khandagiri, Bhubaneswar, Odisha 751030',
                'latitude': 20.2526,
                'longitude': 85.7956,
                'is_active': True
            }
        )

        # 2. Create Admin User
        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={
                'email': 'admin@iter.ac.in',
                'role': User.Role.ADMIN,
                'college': college,
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password("admin123")
            admin_user.save()

        # 3. Create Sample Student Accounts
        students_data = [
            ("student", "student@iter.ac.in", "9876543210"),
            ("student2", "student2@iter.ac.in", "9876543211"),
            ("student3", "student3@iter.ac.in", "9876543212"),
            ("rohan_cs", "rohan@iter.ac.in", "9876543213")
        ]
        for uname, email, phone in students_data:
            s_user, s_created = User.objects.get_or_create(
                username=uname,
                defaults={
                    'email': email,
                    'phone': phone,
                    'role': User.Role.STUDENT,
                    'college': college
                }
            )
            if s_created:
                s_user.set_password("password123")
                s_user.save()

        # 4. Create Categories
        categories_data = [
            ("Stationery", "Pens, notebooks, files, registers, calculators, and exam supplies"),
            ("Food", "Snacks, beverages, instant noodles, sandwiches, and bakery items"),
            ("Electronics", "Chargers, cables, earphones, peripherals, and tech accessories"),
            ("Printing", "Photocopying, printing services, binding, and lamination"),
            ("Personal Care", "Hygiene essentials, soaps, tissues, and daily care products"),
            ("Medicine", "First aid supplies, pain relievers, and health essentials")
        ]
        cat_objs = {}
        for cname, cdesc in categories_data:
            cat, _ = Category.objects.get_or_create(
                name=cname,
                defaults={'description': cdesc, 'is_active': True}
            )
            cat_objs[cname] = cat

        # 5. Create 50+ Campus Products
        products_data = [
            # Stationery
            ("Blue Ball Pen", "Smooth writing 0.7mm ball point pen", "Stationery", "Cello", "https://images.unsplash.com/photo-1585336261026-8f5786372966?w=300", "piece"),
            ("Black Ball Pen", "Quick dry black ink ball pen for exams", "Stationery", "Reynolds", "https://images.unsplash.com/photo-1585336261026-8f5786372966?w=300", "piece"),
            ("Blue Gel Pen", "Waterproof gel pen for fast writing", "Stationery", "Pentonic", "https://images.unsplash.com/photo-1585336261026-8f5786372966?w=300", "piece"),
            ("Black Gel Pen", "Dark bold gel pen for diagram labeling", "Stationery", "Pilot", "https://images.unsplash.com/photo-1585336261026-8f5786372966?w=300", "piece"),
            ("Red Ball Pen", "Red ink pen for corrections and notes", "Stationery", "Flair", "https://images.unsplash.com/photo-1585336261026-8f5786372966?w=300", "piece"),
            ("Highlighter Pack", "Set of 4 neon color highlighters", "Stationery", "Faber-Castell", "https://images.unsplash.com/photo-1569300305886-f64858b4f624?w=300", "pack"),
            ("Classmate Notebook (180 pages)", "Single line long notebook for lecture notes", "Stationery", "Classmate", "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300", "piece"),
            ("Classmate Notebook (300 pages)", "Thick 6-subject spiral notebook", "Stationery", "Classmate", "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300", "piece"),
            ("Practical Lab Journal", "Interleaved lab file with hard cover", "Stationery", "Target", "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300", "piece"),
            ("Casio Scientific Calculator FX-991EX", "Non-programmable scientific calculator with 552 functions", "Stationery", "Casio", "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=300", "piece"),
            ("Sticky Notes Pack", "Yellow 3x3 inch sticky notes (100 sheets)", "Stationery", "3M Post-It", "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300", "pack"),
            ("A4 Paper Ream (500 sheets)", "75 GSM bright white printing paper", "Stationery", "JK Copier", "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300", "ream"),
            ("Folder Document Bag", "Plastic button folder file for certificates", "Stationery", "Solo", "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300", "piece"),

            # Food & Snacks
            ("Maggi Masala Noodles", "Classic 2-minute instant noodles", "Food", "Nestle", "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300", "packet"),
            ("Maggi Special Atta Noodles", "Healthy whole wheat masala noodles", "Food", "Nestle", "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300", "packet"),
            ("Cold Coffee Bottle", "Chilled cream coffee 200ml", "Food", "Amul", "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300", "bottle"),
            ("Hot Nescafe Coffee", "Freshly brewed hot milk coffee", "Food", "Nescafe", "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300", "cup"),
            ("Veg Cheese Sandwich", "Grilled double layer vegetable sandwich", "Food", "Campus Bakery", "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300", "piece"),
            ("Paneer Patty", "Crispy oven baked paneer puff", "Food", "Campus Bakery", "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300", "piece"),
            ("Hot Samosa (2 pcs)", "Fresh spicy potato stuffed samosas with chutney", "Food", "Snack Corner", "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300", "plate"),
            ("Lays Potato Chips (Blue)", "Magic Masala flavor potato chips", "Food", "Lays", "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300", "packet"),
            ("Fresh Mango Juice", "200ml tetrapack mango juice", "Food", "Real Juice", "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300", "pack"),
            ("Mineral Water Bottle 1L", "Purified drinking water bottle", "Food", "Kinley", "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=300", "bottle"),

            # Electronics
            ("USB Type-C Charging Cable", "Fast charging 65W braided Type-C cable 1m", "Electronics", "Boat", "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300", "piece"),
            ("Micro USB Cable", "Standard Android charging data cable", "Electronics", "Portronics", "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300", "piece"),
            ("Wired Earphones 3.5mm", "In-ear stereo headphones with microphone", "Electronics", "Realme", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300", "piece"),
            ("Wireless Optical Mouse", "2.4GHz wireless laptop mouse with USB dongle", "Electronics", "Logitech", "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300", "piece"),
            ("Power Bank 10000mAh", "Dual USB fast output power bank", "Electronics", "Mi", "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=300", "piece"),

            # Printing
            ("Black & White Printing", "A4 single sided laser printing per page", "Printing", "Digital Print", "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=300", "page"),
            ("Color Printing", "High resolution color printout per page", "Printing", "Digital Print", "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=300", "page"),
            ("Spiral Document Binding", "Plastic ring binding with front clear cover", "Printing", "Digital Print", "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=300", "document"),
            ("A4 Document Lamination", "Hot pouch lamination for ID/certificates", "Printing", "Digital Print", "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=300", "page"),

            # Personal Care & Medicine
            ("Hand Sanitizer 100ml", "70% alcohol rinse free sanitizer", "Personal Care", "Dettol", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300", "bottle"),
            ("Paracetamol 650mg", "Strip of 10 fever & pain reliever tablets", "Medicine", "Dolo 650", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300", "strip"),
            ("Band-Aid Strip Box", "Waterproof adhesive bandages 10 strips", "Medicine", "Johnson & Johnson", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300", "box"),
            ("Pocket Tissue Pack", "3-ply soft facial tissue pack", "Personal Care", "Paseo", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300", "pack")
        ]

        prod_objs = {}
        for pname, pdesc, cname, brand, img, unit in products_data:
            prod, _ = Product.objects.get_or_create(
                name=pname,
                defaults={
                    'description': pdesc,
                    'category': cat_objs.get(cname),
                    'brand': brand,
                    'image': img,
                    'unit': unit,
                    'is_active': True
                }
            )
            prod_objs[pname] = prod

        # 6. Create 20 ITER Campus Shops & Shopkeepers
        shops_data = [
            ("Campus Stationery", "Block 1 Ground Floor", "9853000001", "block1_sk"),
            ("Central Xerox Hub", "Main Academic Block Room 102", "9853000002", "xerox_sk"),
            ("Campus Cafe & Bakery", "Student Activity Center", "9853000003", "cafe_sk"),
            ("Fresh Juice Corner", "Hostel Block 2 Quad", "9853000004", "juice_sk"),
            ("Tech Accessories & Mobiles", "Gate 1 Shopping Complex", "9853000005", "tech_sk"),
            ("Campus Book Store", "Library Building Ground Floor", "9853000006", "book_sk"),
            ("Medical Store & Care", "Campus Health Center", "9853000007", "med_sk"),
            ("General Store & Mart", "Boys Hostel Complex", "9853000008", "mart_sk"),
            ("Snack Point & Maggi Corner", "Block 3 Quad", "9853000009", "maggi_sk"),
            ("Print Hub & Lamination", "Block 2 Annex", "9853000010", "printhub_sk"),
            ("Daily Essentials & Dairy", "Girls Hostel Block 4", "9853000011", "dairy_sk"),
            ("Campus Refreshment Hub", "Near Open Air Auditorium", "9853000012", "refresh_sk"),
            ("Smart Tech & Repairs", "Underpass Passage", "9853000013", "smarttech_sk"),
            ("Quick Food Express", "Central Cafeteria Hall", "9853000014", "quickfood_sk"),
            ("Student Stationery Mart", "Block 4 Foyer", "9853000015", "studstationery_sk"),
            ("Campus Pharma & Wellness", "Adjacent to Gate 2", "9853000016", "pharma_sk"),
            ("Digital Copy Centre", "Engineering Block 2nd Floor", "9853000017", "copy_sk"),
            ("Morning Breeze Snacks", "Sports Complex Canteen", "9853000018", "sportsnack_sk"),
            ("Heritage Books & Gifts", "Admin Block Corridor", "9853000019", "heritage_sk"),
            ("Night Owl Canteen", "Hostel Block 6 Plaza", "9853000020", "nightowl_sk")
        ]

        shop_objs = []
        for sname, sloc, sphone, sk_uname in shops_data:
            sk_user, _ = User.objects.get_or_create(
                username=sk_uname,
                defaults={
                    'email': f"{sk_uname}@iter.ac.in",
                    'phone': sphone,
                    'role': User.Role.SHOPKEEPER,
                    'college': college
                }
            )
            if _:
                sk_user.set_password("password123")
                sk_user.save()

            shop, _ = Shop.objects.get_or_create(
                name=sname,
                defaults={
                    'college': college,
                    'description': f"Official campus outlet at {sloc}",
                    'owner': sk_user,
                    'phone': sphone,
                    'location_name': sloc,
                    'is_open': True,
                    'is_active': True
                }
            )
            shop_objs.append(shop)

        # 7. Create 100+ Inventory items across the shops
        # Custom price matrix per product
        price_map = {
            "Blue Ball Pen": 20.00,
            "Black Ball Pen": 20.00,
            "Blue Gel Pen": 25.00,
            "Black Gel Pen": 25.00,
            "Red Ball Pen": 15.00,
            "Highlighter Pack": 120.00,
            "Classmate Notebook (180 pages)": 65.00,
            "Classmate Notebook (300 pages)": 130.00,
            "Practical Lab Journal": 85.00,
            "Casio Scientific Calculator FX-991EX": 1250.00,
            "Sticky Notes Pack": 45.00,
            "A4 Paper Ream (500 sheets)": 280.00,
            "Folder Document Bag": 35.00,

            "Maggi Masala Noodles": 14.00,
            "Maggi Special Atta Noodles": 18.00,
            "Cold Coffee Bottle": 40.00,
            "Hot Nescafe Coffee": 20.00,
            "Veg Cheese Sandwich": 45.00,
            "Paneer Patty": 30.00,
            "Hot Samosa (2 pcs)": 20.00,
            "Lays Potato Chips (Blue)": 20.00,
            "Fresh Mango Juice": 25.00,
            "Mineral Water Bottle 1L": 20.00,

            "USB Type-C Charging Cable": 199.00,
            "Micro USB Cable": 149.00,
            "Wired Earphones 3.5mm": 299.00,
            "Wireless Optical Mouse": 499.00,
            "Power Bank 10000mAh": 899.00,

            "Black & White Printing": 3.00,
            "Color Printing": 10.00,
            "Spiral Document Binding": 30.00,
            "A4 Document Lamination": 25.00,

            "Hand Sanitizer 100ml": 50.00,
            "Paracetamol 650mg": 32.00,
            "Band-Aid Strip Box": 40.00,
            "Pocket Tissue Pack": 15.00
        }

        inventory_count = 0
        for shop in shop_objs:
            # Assign 5 to 10 products per shop based on shop type
            for pname, prod in prod_objs.items():
                should_add = False
                if "Stationery" in shop.name or "Book" in shop.name:
                    if prod.category and prod.category.name in ["Stationery", "Personal Care"]:
                        should_add = True
                elif "Xerox" in shop.name or "Print" in shop.name or "Copy" in shop.name:
                    if prod.category and prod.category.name in ["Printing", "Stationery"]:
                        should_add = True
                elif "Cafe" in shop.name or "Juice" in shop.name or "Snack" in shop.name or "Canteen" in shop.name or "Food" in shop.name or "Refreshment" in shop.name:
                    if prod.category and prod.category.name in ["Food"]:
                        should_add = True
                elif "Tech" in shop.name or "Smart" in shop.name:
                    if prod.category and prod.category.name in ["Electronics", "Stationery"]:
                        should_add = True
                elif "Pharma" in shop.name or "Medical" in shop.name:
                    if prod.category and prod.category.name in ["Medicine", "Personal Care"]:
                        should_add = True
                else:
                    # General Stores carry a mix
                    if random.random() < 0.4:
                        should_add = True

                if should_add:
                    price = price_map.get(pname, 50.00)
                    qty = random.randint(5, 30)
                    inv, created = Inventory.objects.get_or_create(
                        shop=shop,
                        product=prod,
                        defaults={
                            'price': price,
                            'quantity': qty,
                            'reserved_quantity': 0,
                            'is_available': True
                        }
                    )
                    inventory_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded database!\n"
            f"- 1 College: {college.name}\n"
            f"- 20 Shops & Shopkeeper accounts created\n"
            f"- 4 Student accounts created\n"
            f"- {len(prod_objs)} Products created across {len(cat_objs)} Categories\n"
            f"- {inventory_count} Inventory records seeded"
        ))
