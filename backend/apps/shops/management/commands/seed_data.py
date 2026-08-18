import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.shops.models import College, Shop
from apps.products.models import Category, Product, ProductAttribute, AttributeOption, ProductVariant
from apps.inventory.models import Inventory

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds dynamic categories, attributes, options, products, variants, and shop inventory for ITER College'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting dynamic product & attribute database seeding..."))

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

        # 3. Create Sample Students
        students_data = [
            ("student", "student@iter.ac.in", "9876543210"),
            ("student2", "student2@iter.ac.in", "9876543211"),
            ("rahul_student", "rahul@iter.ac.in", "9876543212"),
            ("rohan_cs", "rohan@iter.ac.in", "9876543213")
        ]
        for uname, email, phone in students_data:
            s_user = User.objects.filter(username=uname).first() or User.objects.filter(phone=phone).first()
            if not s_user:
                s_user = User.objects.create(
                    username=uname,
                    email=email,
                    phone=phone,
                    role=User.Role.STUDENT,
                    college=college
                )
                s_user.set_password("password123")
                s_user.save()
            else:
                s_user.username = uname
                s_user.email = email
                s_user.role = User.Role.STUDENT
                s_user.set_password("password123")
                s_user.save()

        # 4. Create 20 Campus Shops
        shops_info = [
            ("Rohit's Stationery & Xerox", "Adjacent to Gate 1 (Main Entrance)", "9853000001", "rohit_sk"),
            ("Saurav's Tech & Snack Point", "Block 1 Ground Floor, ITER Campus", "9853000002", "saurav_sk"),
            ("Campus Central Canteen", "Behind Student Activity Center", "9853000003", "canteen_sk"),
            ("Speedy Print & Binding Hub", "Engineering Block 1 Basement", "9853000004", "speedyprint_sk"),
            ("Green Corner Fresh Cafe", "Near ITER Open Amphitheater", "9853000005", "greencafe_sk"),
            ("ITER Book Bank & Supplies", "Central Library Building, Ground Floor", "9853000006", "bookbank_sk"),
            ("Red Cross Campus Pharma", "Campus Health Center", "9853000007", "pharma1_sk"),
            ("General Store & Mart", "Boys Hostel Complex", "9853000008", "mart_sk"),
            ("Snack Point & Maggi Corner", "Block 3 Quad", "9853000009", "maggi_sk"),
            ("Print Hub & Lamination", "Block 2 Annex", "9853000010", "printhub_sk"),
            ("Daily Essentials & Dairy", "Girls Hostel Block 4", "9853000011", "dairy_sk"),
            ("Campus Refreshment Hub", "Near Open Air Auditorium", "9853000012", "refresh_sk"),
            ("Smart Tech & Repairs", "Underpass Passage", "9853000013", "smarttech_sk"),
            ("Quick Food Express", "Central Cafeteria Hall", "9853000014", "quickfood_sk"),
            ("Student Stationery Mart", "Block 4 Foyer", "9853000015", "studstationery_sk"),
            ("Campus Pharma & Wellness", "Adjacent to Gate 2", "9853000016", "pharma2_sk"),
            ("Digital Copy Centre", "Engineering Block 2nd Floor", "9853000017", "copy_sk"),
            ("Morning Breeze Snacks", "Sports Complex Canteen", "9853000018", "sportsnack_sk"),
            ("Heritage Books & Gifts", "Admin Block Corridor", "9853000019", "heritage_sk"),
            ("Night Owl Canteen", "Hostel Block 6 Plaza", "9853000020", "nightowl_sk"),
        ]

        created_shops = []
        for name, loc, phone, owner_name in shops_info:
            sk_user = User.objects.filter(username=owner_name).first() or User.objects.filter(phone=phone).first()
            if not sk_user:
                sk_user = User.objects.create(
                    username=owner_name,
                    email=f'{owner_name}@campus.in',
                    role=User.Role.SHOPKEEPER,
                    college=college,
                    phone=phone
                )
                sk_user.set_password("shop123")
                sk_user.save()
            else:
                sk_user.username = owner_name
                sk_user.role = User.Role.SHOPKEEPER
                sk_user.set_password("shop123")
                sk_user.save()

            clean_handle = owner_name.replace("_sk", "").replace("_", "")
            upi_handle = f"{clean_handle}@okaxis"
            shop = Shop.objects.filter(owner=sk_user).first() or Shop.objects.filter(name=name, college=college).first()
            if not shop:
                shop = Shop.objects.create(
                    name=name,
                    college=college,
                    owner=sk_user,
                    location_name=loc,
                    phone=phone,
                    whatsapp_number=phone,
                    upi_id=upi_handle,
                    upi_name=name,
                    description=f"Official campus outlet at {loc}",
                    latitude=20.2526 + (random.uniform(-0.003, 0.003)),
                    longitude=85.7956 + (random.uniform(-0.003, 0.003)),
                    is_open=True,
                    is_active=True
                )
            else:
                shop.name = name
                shop.owner = sk_user
                shop.location_name = loc
                shop.phone = phone
                shop.whatsapp_number = phone
                shop.upi_id = upi_handle
                shop.upi_name = name
                shop.is_open = True
                shop.is_active = True
                shop.save()
            created_shops.append(shop)

        # 5. Create Categories
        categories_data = [
            ("Stationery", "Pens, notebooks, files, registers, calculators, and exam supplies"),
            ("Food", "Rolls, pizzas, snacks, beverages, instant noodles, sandwiches, and bakery items"),
            ("Electronics", "Chargers, cables, earphones, peripherals, and tech accessories"),
            ("Printing", "Photocopying, printing services, binding, and lamination"),
            ("Personal Care", "Hygiene essentials, soaps, tissues, and daily care products"),
        ]
        cat_map = {}
        for cname, cdesc in categories_data:
            cat, _ = Category.objects.get_or_create(
                name=cname,
                defaults={'description': cdesc, 'is_active': True}
            )
            cat_map[cname] = cat

        # 6. Create Dynamic Product Attributes and Options
        # A. Stationery Attributes
        attr_color, _ = ProductAttribute.objects.get_or_create(
            name="Color", category=cat_map["Stationery"], defaults={'data_type': 'select', 'is_filterable': True}
        )
        opt_blue, _ = AttributeOption.objects.get_or_create(attribute=attr_color, value="blue", defaults={'display_name': 'Blue'})
        opt_red, _ = AttributeOption.objects.get_or_create(attribute=attr_color, value="red", defaults={'display_name': 'Red'})
        opt_black, _ = AttributeOption.objects.get_or_create(attribute=attr_color, value="black", defaults={'display_name': 'Black'})
        opt_green, _ = AttributeOption.objects.get_or_create(attribute=attr_color, value="green", defaults={'display_name': 'Green'})

        attr_pen_type, _ = ProductAttribute.objects.get_or_create(
            name="Pen Type", category=cat_map["Stationery"], defaults={'data_type': 'select', 'is_filterable': True}
        )
        opt_ball, _ = AttributeOption.objects.get_or_create(attribute=attr_pen_type, value="ball", defaults={'display_name': 'Ball Pen'})
        opt_gel, _ = AttributeOption.objects.get_or_create(attribute=attr_pen_type, value="gel", defaults={'display_name': 'Gel Pen'})

        attr_pages, _ = ProductAttribute.objects.get_or_create(
            name="Pages", category=cat_map["Stationery"], defaults={'data_type': 'select', 'is_filterable': True}
        )
        opt_180p, _ = AttributeOption.objects.get_or_create(attribute=attr_pages, value="180", defaults={'display_name': '180 Pages'})
        opt_300p, _ = AttributeOption.objects.get_or_create(attribute=attr_pages, value="300", defaults={'display_name': '300 Pages'})

        # B. Food Attributes
        attr_filling, _ = ProductAttribute.objects.get_or_create(
            name="Filling", category=cat_map["Food"], defaults={'data_type': 'select', 'is_filterable': True}
        )
        opt_chicken, _ = AttributeOption.objects.get_or_create(attribute=attr_filling, value="chicken", defaults={'display_name': 'Chicken'})
        opt_veg, _ = AttributeOption.objects.get_or_create(attribute=attr_filling, value="veg", defaults={'display_name': 'Veg'})
        opt_paneer, _ = AttributeOption.objects.get_or_create(attribute=attr_filling, value="paneer", defaults={'display_name': 'Paneer'})
        opt_egg, _ = AttributeOption.objects.get_or_create(attribute=attr_filling, value="egg", defaults={'display_name': 'Egg'})

        attr_size, _ = ProductAttribute.objects.get_or_create(
            name="Size", category=cat_map["Food"], defaults={'data_type': 'select', 'is_filterable': True}
        )
        opt_small, _ = AttributeOption.objects.get_or_create(attribute=attr_size, value="small", defaults={'display_name': 'Small'})
        opt_med, _ = AttributeOption.objects.get_or_create(attribute=attr_size, value="medium", defaults={'display_name': 'Medium'})
        opt_large, _ = AttributeOption.objects.get_or_create(attribute=attr_size, value="large", defaults={'display_name': 'Large'})

        attr_pizza_type, _ = ProductAttribute.objects.get_or_create(
            name="Pizza Type", category=cat_map["Food"], defaults={'data_type': 'select', 'is_filterable': True}
        )
        opt_p_veg, _ = AttributeOption.objects.get_or_create(attribute=attr_pizza_type, value="veg", defaults={'display_name': 'Veg'})
        opt_p_chicken, _ = AttributeOption.objects.get_or_create(attribute=attr_pizza_type, value="chicken", defaults={'display_name': 'Chicken'})

        attr_bread, _ = ProductAttribute.objects.get_or_create(
            name="Bread Type", category=cat_map["Food"], defaults={'data_type': 'select', 'is_filterable': True}
        )
        opt_white_bread, _ = AttributeOption.objects.get_or_create(attribute=attr_bread, value="white", defaults={'display_name': 'White Bread'})
        opt_brown_bread, _ = AttributeOption.objects.get_or_create(attribute=attr_bread, value="brown", defaults={'display_name': 'Brown Bread'})

        # C. Electronics Attributes
        attr_cable_type, _ = ProductAttribute.objects.get_or_create(
            name="Cable Type", category=cat_map["Electronics"], defaults={'data_type': 'select', 'is_filterable': True}
        )
        opt_typec, _ = AttributeOption.objects.get_or_create(attribute=attr_cable_type, value="type-c", defaults={'display_name': 'USB Type-C'})
        opt_lightning, _ = AttributeOption.objects.get_or_create(attribute=attr_cable_type, value="lightning", defaults={'display_name': 'Lightning'})
        opt_microusb, _ = AttributeOption.objects.get_or_create(attribute=attr_cable_type, value="micro-usb", defaults={'display_name': 'Micro USB'})

        # 7. Create Products & Dynamic Variants
        # ----------------------------------------------------
        prod_pen, _ = Product.objects.get_or_create(
            name="Pen",
            category=cat_map["Stationery"],
            defaults={
                'description': 'Smooth writing pens for notes, exams, and sketching',
                'base_price': 10.00,
                'brand': 'Cello / Reynolds / Pentonic',
                'unit': 'piece',
                'has_variants': True,
                'image': 'https://images.unsplash.com/photo-1585336261026-8f5786372966?w=300'
            }
        )
        prod_pen.attributes.set([attr_color])

        v_blue_pen, _ = ProductVariant.objects.get_or_create(
            product=prod_pen, name="Blue Pen", defaults={'price': 10.00, 'image': prod_pen.image}
        )
        v_blue_pen.attribute_options.set([opt_blue])

        v_red_pen, _ = ProductVariant.objects.get_or_create(
            product=prod_pen, name="Red Pen", defaults={'price': 10.00, 'image': prod_pen.image}
        )
        v_red_pen.attribute_options.set([opt_red])

        v_black_pen, _ = ProductVariant.objects.get_or_create(
            product=prod_pen, name="Black Pen", defaults={'price': 10.00, 'image': prod_pen.image}
        )
        v_black_pen.attribute_options.set([opt_black])

        # PRODUCT 1B: Gel Pen (Stationery)
        prod_gel_pen, _ = Product.objects.get_or_create(
            name="Gel Pen",
            category=cat_map["Stationery"],
            defaults={
                'description': 'Waterproof gel ink pen for fast writing',
                'base_price': 20.00,
                'brand': 'Pentonic',
                'unit': 'piece',
                'has_variants': True,
                'image': 'https://images.unsplash.com/photo-1585336261026-8f5786372966?w=300'
            }
        )
        prod_gel_pen.attributes.set([attr_color])
        v_blue_gel, _ = ProductVariant.objects.get_or_create(
            product=prod_gel_pen, name="Blue Gel Pen", defaults={'price': 20.00, 'image': prod_gel_pen.image}
        )
        v_blue_gel.attribute_options.set([opt_blue])

        # ----------------------------------------------------
        # PRODUCT 2: Roll (Food) -> Single attribute: Filling
        prod_roll, _ = Product.objects.get_or_create(
            name="Roll",
            category=cat_map["Food"],
            defaults={
                'description': 'Freshly rolled hot paratha rolls with savory fillings and spicy chutney',
                'base_price': 60.00,
                'brand': 'Campus Rolls & Bites',
                'unit': 'piece',
                'has_variants': True,
                'image': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=300'
            }
        )
        prod_roll.attributes.set([attr_filling])

        v_chicken_roll, _ = ProductVariant.objects.get_or_create(
            product=prod_roll, name="Chicken Roll", defaults={'price': 80.00, 'image': prod_roll.image}
        )
        v_chicken_roll.attribute_options.set([opt_chicken])

        v_veg_roll, _ = ProductVariant.objects.get_or_create(
            product=prod_roll, name="Veg Roll", defaults={'price': 60.00, 'image': prod_roll.image}
        )
        v_veg_roll.attribute_options.set([opt_veg])

        v_paneer_roll, _ = ProductVariant.objects.get_or_create(
            product=prod_roll, name="Paneer Roll", defaults={'price': 70.00, 'image': prod_roll.image}
        )
        v_paneer_roll.attribute_options.set([opt_paneer])

        v_egg_roll, _ = ProductVariant.objects.get_or_create(
            product=prod_roll, name="Egg Roll", defaults={'price': 50.00, 'image': prod_roll.image}
        )
        v_egg_roll.attribute_options.set([opt_egg])

        # ----------------------------------------------------
        # PRODUCT 3: Pizza (Food) -> Multi-attribute: Size & Pizza Type
        prod_pizza, _ = Product.objects.get_or_create(
            name="Pizza",
            category=cat_map["Food"],
            defaults={
                'description': 'Stone-baked cheesy pizza with fresh toppings and Italian herbs',
                'base_price': 120.00,
                'brand': 'Campus Oven',
                'unit': 'piece',
                'has_variants': True,
                'image': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300'
            }
        )
        prod_pizza.attributes.set([attr_size, attr_pizza_type])

        pizza_combos = [
            ("Small Veg Pizza", opt_small, opt_p_veg, 120.00),
            ("Small Chicken Pizza", opt_small, opt_p_chicken, 160.00),
            ("Medium Veg Pizza", opt_med, opt_p_veg, 220.00),
            ("Medium Chicken Pizza", opt_med, opt_p_chicken, 280.00),
            ("Large Veg Pizza", opt_large, opt_p_veg, 350.00),
            ("Large Chicken Pizza", opt_large, opt_p_chicken, 420.00),
        ]
        pizza_variants = []
        for pname, o_size, o_type, p_price in pizza_combos:
            v_p, _ = ProductVariant.objects.get_or_create(
                product=prod_pizza, name=pname, defaults={'price': p_price, 'image': prod_pizza.image}
            )
            v_p.attribute_options.set([o_size, o_type])
            pizza_variants.append(v_p)

        # ----------------------------------------------------
        # PRODUCT 4: Notebook (Stationery) -> Single variant (Test Case 5: No clarification needed)
        prod_notebook, _ = Product.objects.get_or_create(
            name="Notebook",
            category=cat_map["Stationery"],
            defaults={
                'description': 'Classmate single-line long notebook 180 pages for lectures and lab notes',
                'base_price': 50.00,
                'brand': 'Classmate',
                'unit': 'piece',
                'has_variants': True,
                'image': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300'
            }
        )
        prod_notebook.attributes.set([attr_pages])
        v_notebook_180, _ = ProductVariant.objects.get_or_create(
            product=prod_notebook, name="Classmate Long Notebook (180 pages)", defaults={'price': 50.00, 'image': prod_notebook.image}
        )
        v_notebook_180.attribute_options.set([opt_180p])

        # ----------------------------------------------------
        # PRODUCT 5: Calculator (Stationery) -> Single product/variant
        prod_calc, _ = Product.objects.get_or_create(
            name="Calculator",
            category=cat_map["Stationery"],
            defaults={
                'description': 'Casio Scientific Calculator FX-991EX with 552 functions for engineering',
                'base_price': 1250.00,
                'brand': 'Casio',
                'unit': 'piece',
                'has_variants': True,
                'image': 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=300'
            }
        )
        v_calc, _ = ProductVariant.objects.get_or_create(
            product=prod_calc, name="Casio Scientific Calculator FX-991EX", defaults={'price': 1250.00, 'image': prod_calc.image}
        )

        # ----------------------------------------------------
        # PRODUCT 6: Sandwich (Food)
        prod_sandwich, _ = Product.objects.get_or_create(
            name="Sandwich",
            category=cat_map["Food"],
            defaults={
                'description': 'Grilled toasted sandwich served with potato chips and mint chutney',
                'base_price': 45.00,
                'brand': 'Campus Bakery',
                'unit': 'piece',
                'has_variants': True,
                'image': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300'
            }
        )
        prod_sandwich.attributes.set([attr_filling, attr_bread])
        v_veg_sw, _ = ProductVariant.objects.get_or_create(
            product=prod_sandwich, name="Veg Cheese Sandwich", defaults={'price': 50.00, 'image': prod_sandwich.image}
        )
        v_veg_sw.attribute_options.set([opt_veg, opt_white_bread])

        v_paneer_sw, _ = ProductVariant.objects.get_or_create(
            product=prod_sandwich, name="Paneer Grilled Sandwich", defaults={'price': 70.00, 'image': prod_sandwich.image}
        )
        v_paneer_sw.attribute_options.set([opt_paneer, opt_brown_bread])

        # ----------------------------------------------------
        # PRODUCT 7: Charging Cable (Electronics)
        prod_cable, _ = Product.objects.get_or_create(
            name="Charging Cable",
            category=cat_map["Electronics"],
            defaults={
                'description': 'Fast charging 65W braided durable cable 1m',
                'base_price': 199.00,
                'brand': 'Boat',
                'unit': 'piece',
                'has_variants': True,
                'image': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300'
            }
        )
        prod_cable.attributes.set([attr_cable_type])
        v_typec_cb, _ = ProductVariant.objects.get_or_create(
            product=prod_cable, name="USB Type-C Cable", defaults={'price': 199.00, 'image': prod_cable.image}
        )
        v_typec_cb.attribute_options.set([opt_typec])

        v_lightning_cb, _ = ProductVariant.objects.get_or_create(
            product=prod_cable, name="Lightning iPhone Cable", defaults={'price': 249.00, 'image': prod_cable.image}
        )
        v_lightning_cb.attribute_options.set([opt_lightning])

        # ----------------------------------------------------
        # PRODUCT 8: Potato Chips & Snacks (Food)
        attr_flavor, _ = ProductAttribute.objects.get_or_create(
            name="Flavor", category=cat_map["Food"], defaults={'data_type': 'select', 'is_filterable': True}
        )
        opt_salted, _ = AttributeOption.objects.get_or_create(attribute=attr_flavor, value="salted", defaults={'display_name': 'Classic Salted'})
        opt_masala, _ = AttributeOption.objects.get_or_create(attribute=attr_flavor, value="masala", defaults={'display_name': 'Masala'})
        opt_banana, _ = AttributeOption.objects.get_or_create(attribute=attr_flavor, value="banana", defaults={'display_name': 'Banana'})

        prod_chips, _ = Product.objects.get_or_create(
            name="Chips",
            category=cat_map["Food"],
            defaults={
                'description': 'Crispy potato chips, salted wafers, and crunchy snack packets',
                'base_price': 20.00,
                'brand': 'Lays / Kurkure / Balaji',
                'unit': 'packet',
                'has_variants': True,
                'image': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300'
            }
        )
        prod_chips.attributes.set([attr_flavor])

        v_lays_classic, _ = ProductVariant.objects.get_or_create(
            product=prod_chips, name="Lays Classic Salted Chips", defaults={'price': 20.00, 'image': prod_chips.image}
        )
        v_lays_classic.attribute_options.set([opt_salted])

        v_kurkure, _ = ProductVariant.objects.get_or_create(
            product=prod_chips, name="Kurkure Masala Munch", defaults={'price': 20.00, 'image': prod_chips.image}
        )
        v_kurkure.attribute_options.set([opt_masala])

        v_masala_chips, _ = ProductVariant.objects.get_or_create(
            product=prod_chips, name="Masala Chips", defaults={'price': 20.00, 'image': prod_chips.image}
        )
        v_masala_chips.attribute_options.set([opt_masala])

        v_banana_chips, _ = ProductVariant.objects.get_or_create(
            product=prod_chips, name="Banana Chips", defaults={'price': 30.00, 'image': prod_chips.image}
        )
        v_banana_chips.attribute_options.set([opt_banana])

        # 8. Seed Shop Inventory across 20 Campus Shops
        all_variants = [
            v_blue_pen, v_red_pen, v_black_pen, v_blue_gel,
            v_chicken_roll, v_veg_roll, v_paneer_roll, v_egg_roll,
            v_notebook_180, v_calc, v_veg_sw, v_paneer_sw,
            v_typec_cb, v_lightning_cb,
            v_lays_classic, v_kurkure, v_masala_chips, v_banana_chips
        ] + pizza_variants

        total_inventory_seeded = 0

        # Stationery shops have pens, notebooks, calculators
        stationery_shop_indices = [0, 3, 5, 9, 14, 16, 18]
        # Food shops have rolls, pizzas, sandwiches
        food_shop_indices = [1, 2, 4, 8, 11, 13, 17, 19]
        # Tech shops have cables, calculators
        tech_shop_indices = [1, 7, 12]

        for s_idx, shop in enumerate(created_shops):
            assigned_variants = []

            if s_idx in stationery_shop_indices:
                assigned_variants.extend([v_blue_pen, v_red_pen, v_blue_gel, v_notebook_180, v_calc])
                # Only 1 shop gets black pen in stock; others have 0 stock to test out-of-stock scenario (Test 6)
                if s_idx == 0:
                    # Shop 0 has Black Pen with 0 stock
                    inv, _ = Inventory.objects.update_or_create(
                        shop=shop,
                        product=v_black_pen.product,
                        variant=v_black_pen,
                        defaults={
                            'price': v_black_pen.price,
                            'quantity': 0,
                            'reserved_quantity': 0,
                            'is_available': True
                        }
                    )
                    total_inventory_seeded += 1
                elif s_idx == 3:
                    # Shop 3 has Black Pen with 0 stock
                    inv, _ = Inventory.objects.update_or_create(
                        shop=shop,
                        product=v_black_pen.product,
                        variant=v_black_pen,
                        defaults={
                            'price': v_black_pen.price,
                            'quantity': 0,
                            'reserved_quantity': 0,
                            'is_available': True
                        }
                    )
                    total_inventory_seeded += 1

            if s_idx in food_shop_indices:
                assigned_variants.extend([
                    v_chicken_roll, v_veg_roll, v_paneer_roll, v_egg_roll,
                    v_veg_sw, v_paneer_sw,
                    v_lays_classic, v_kurkure, v_masala_chips, v_banana_chips
                ] + pizza_variants)

            if s_idx in tech_shop_indices:
                assigned_variants.extend([v_typec_cb, v_lightning_cb, v_calc])

            # Populate stock
            for variant in assigned_variants:
                stock_qty = random.randint(5, 30)
                inv, _ = Inventory.objects.update_or_create(
                    shop=shop,
                    product=variant.product,
                    variant=variant,
                    defaults={
                        'price': variant.price + random.choice([0, 0, 2, -2]),
                        'quantity': stock_qty,
                        'reserved_quantity': 0,
                        'is_available': True
                    }
                )
                total_inventory_seeded += 1

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded dynamic database!\n"
            f"- {len(categories_data)} Categories\n"
            f"- {ProductAttribute.objects.count()} Dynamic Product Attributes\n"
            f"- {AttributeOption.objects.count()} Attribute Options\n"
            f"- {Product.objects.count()} Products\n"
            f"- {ProductVariant.objects.count()} Product Variants\n"
            f"- {len(created_shops)} Campus Shops\n"
            f"- {total_inventory_seeded} Shop Inventory records\n"
        ))
