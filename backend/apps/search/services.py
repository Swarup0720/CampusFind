import re
from django.db.models import Q, F
from apps.inventory.models import Inventory
from apps.products.models import Category

class NaturalSearchService:
    KNOWN_COLORS = ['blue', 'black', 'red', 'green', 'yellow', 'white', 'pink', 'purple']
    COMMON_CATEGORIES = {
        'stationery': ['pen', 'pencil', 'notebook', 'register', 'eraser', 'sharpener', 'ruler', 'calculator', 'paper', 'binder', 'stapler'],
        'food': ['maggi', 'coffee', 'tea', 'sandwich', 'biscuit', 'chips', 'noodle', 'patty', 'sosa', 'roll', 'juice', 'water'],
        'electronics': ['cable', 'charger', 'usb', 'earphone', 'headphone', 'mouse', 'adapter', 'powerbank'],
        'printing': ['print', 'printout', 'xerox', 'copy', 'scan', 'lamination', 'binding'],
        'personal care': ['soap', 'shampoo', 'toothpaste', 'brush', 'sanitizer', 'tissue', 'deodorant']
    }

    @classmethod
    def parse_query(cls, raw_query: str) -> dict:
        query_clean = raw_query.lower().strip()
        parsed_filters = {
            'product': '',
            'color': None,
            'max_price': None,
            'category': None,
            'keywords': []
        }

        # 1. Extract price constraint (e.g. "under 30", "below 500", "under rs 50", "< 100")
        price_match = re.search(r'(?:under|below|rs\.?|₹|less than|<)\s*(\d+)', query_clean)
        if price_match:
            parsed_filters['max_price'] = float(price_match.group(1))
            query_clean = re.sub(r'(?:under|below|rs\.?|₹|less than|<)\s*\d+', '', query_clean)

        # 2. Extract colors
        for color in cls.KNOWN_COLORS:
            if re.search(rf'\b{color}\b', query_clean):
                parsed_filters['color'] = color
                break

        # 3. Clean common conversational filler phrases
        stop_words = ['i', 'need', 'a', 'an', 'want', 'where', 'can', 'get', 'buy', 'looking', 'for', 'any', 'some', 'please', 'show', 'me']
        tokens = [w for w in re.split(r'\W+', query_clean) if w and w not in stop_words]

        parsed_filters['keywords'] = tokens
        parsed_filters['product'] = ' '.join(tokens)

        # 4. Infer Category if keyword matches
        for cat_name, items in cls.COMMON_CATEGORIES.items():
            if any(t in items for t in tokens):
                parsed_filters['category'] = cat_name
                break

        return parsed_filters

    @classmethod
    def search_inventory(cls, raw_query: str, shop_id=None, category_id=None, max_price=None):
        parsed = cls.parse_query(raw_query)
        effective_max_price = max_price if max_price is not None else parsed.get('max_price')

        # Filter inventory where stock > reserved_quantity and shop is active & open
        queryset = Inventory.objects.select_related(
            'shop', 'product', 'product__category'
        ).filter(
            is_available=True,
            shop__is_active=True,
            shop__is_open=True
        ).annotate(
            curr_available=F('quantity') - F('reserved_quantity')
        ).filter(curr_available__gt=0)

        if shop_id:
            queryset = queryset.filter(shop_id=shop_id)

        if category_id:
            queryset = queryset.filter(product__category_id=category_id)

        if effective_max_price is not None:
            queryset = queryset.filter(price__lte=effective_max_price)

        # Apply search conditions
        keywords = parsed.get('keywords', [])
        color = parsed.get('color')

        if keywords:
            q_objects = Q()
            for token in keywords:
                q_objects |= Q(product__name__icontains=token)
                q_objects |= Q(product__description__icontains=token)
                q_objects |= Q(product__brand__icontains=token)
                q_objects |= Q(product__category__name__icontains=token)

            queryset = queryset.filter(q_objects)

        if color:
            queryset = queryset.filter(
                Q(product__name__icontains=color) | Q(product__description__icontains=color)
            )

        queryset = queryset.order_by('price')

        results = []
        for inv in queryset:
            results.append({
                'id': inv.id,
                'product_id': inv.product.id,
                'product': inv.product.name,
                'description': inv.product.description,
                'brand': inv.product.brand,
                'category': inv.product.category.name if inv.product.category else 'General',
                'image': inv.product.image,
                'unit': inv.product.unit,
                'shop_id': inv.shop.id,
                'shop': inv.shop.name,
                'shop_phone': inv.shop.phone,
                'location_name': inv.shop.location_name,
                'price': float(inv.price),
                'quantity': inv.quantity,
                'reserved_quantity': inv.reserved_quantity,
                'available_quantity': inv.available_quantity,
                'shop_is_open': inv.shop.is_open,
                'approx_distance_m': 150  # Default campus walking distance
            })

        return {
            'query': raw_query,
            'filters': parsed,
            'count': len(results),
            'message': f"This item is not available in any store." if len(results) == 0 else f"Found {len(results)} items.",
            'results': results
        }
