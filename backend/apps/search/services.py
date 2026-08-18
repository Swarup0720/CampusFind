import re
from typing import Dict, Any, List, Optional, Tuple
from django.db.models import Q, F
from apps.products.models import Category, Product, ProductAttribute, AttributeOption, ProductVariant
from apps.inventory.models import Inventory

class ProductClarificationService:
    """
    Generic, dynamic, database-driven clarification and search service.
    Enforces strict Product Identity relevance:
      1. Product Name (VERY HIGH: +100 exact, +80 starts with, +60 contains)
      2. Product Variant Name (VERY HIGH: +50 exact, +40 contains)
      3. Category (HIGH: +40)
      4. Brand (MEDIUM: +20)
      5. Structured Attributes (MEDIUM: +15)
      6. Description (LOW: +5, ONLY as weak supporting signal)
    
    Zero AI / LLM dependencies.
    """

    STOP_WORDS = {
        'i', 'need', 'a', 'an', 'the', 'want', 'where', 'can', 'get', 'buy', 
        'looking', 'for', 'any', 'some', 'please', 'show', 'me', 'give', 
        'would', 'like', 'to', 'have', 'is', 'there', 'available', 'order', 'find'
    }

    @classmethod
    def clean_query_tokens(cls, raw_query: str) -> List[str]:
        cleaned = raw_query.lower()
        tokens = [w for w in re.split(r'[\s,\.\?!;:\(\)\[\]"\'\/]+', cleaned) if w]
        return [t for t in tokens if t not in cls.STOP_WORDS]

    @classmethod
    def extract_price_constraint(cls, raw_query: str) -> Tuple[Optional[float], str]:
        cleaned = raw_query.lower()
        match = re.search(r'(?:under|below|less than|upto|up to|rs\.?|₹|<)\s*(\d+(?:\.\d+)?)', cleaned)
        if match:
            max_price = float(match.group(1))
            cleaned = re.sub(r'(?:under|below|less than|upto|up to|rs\.?|₹|<)\s*\d+(?:\.\d+)?', '', cleaned)
            return max_price, cleaned
        return None, cleaned

    @classmethod
    def score_product_and_variants(
        cls,
        product: Product,
        variant: Optional[ProductVariant],
        query_lower: str,
        tokens: List[str]
    ) -> Tuple[int, int]:
        """
        Computes (primary_identity_score, description_score) deterministically.
        """
        primary_score = 0
        desc_score = 0

        p_name = product.name.lower().strip()
        v_name = variant.name.lower().strip() if variant else ""
        c_name = product.category.name.lower().strip() if product.category else ""
        b_name = product.brand.lower().strip() if product.brand else ""
        desc = product.description.lower().strip() if product.description else ""

        # 1. Product Name Scoring
        if query_lower == p_name:
            primary_score += 100
        elif p_name.startswith(query_lower) and len(query_lower) >= 2:
            primary_score += 80
        elif re.search(rf'\b{re.escape(p_name)}\b', query_lower) or re.search(rf'\b{re.escape(query_lower)}\b', p_name):
            primary_score += 60
        elif any(t == p_name for t in tokens):
            primary_score += 60

        # 2. Variant Name Scoring
        if v_name:
            if query_lower == v_name:
                primary_score += 50
            elif re.search(rf'\b{re.escape(query_lower)}\b', v_name) or re.search(rf'\b{re.escape(v_name)}\b', query_lower):
                primary_score += 40
            elif any(t == v_name for t in tokens):
                primary_score += 40

        # 3. Category Scoring
        if c_name:
            if query_lower == c_name or re.search(rf'\b{re.escape(c_name)}\b', query_lower) or any(t == c_name for t in tokens):
                primary_score += 40

        # 4. Brand Scoring
        if b_name:
            if query_lower == b_name or re.search(rf'\b{re.escape(b_name)}\b', query_lower) or any(t == b_name for t in tokens):
                primary_score += 20

        # 5. Structured Attribute Options Scoring
        opt_tokens = set()
        if variant:
            for opt in variant.attribute_options.all():
                o_val = opt.value.lower()
                o_disp = opt.display_name.lower()
                opt_tokens.add(o_val)
                opt_tokens.add(o_disp)
                if o_val == query_lower or o_disp == query_lower:
                    primary_score += 25
                elif re.search(rf'\b{re.escape(o_val)}\b', query_lower) or re.search(rf'\b{re.escape(o_disp)}\b', query_lower):
                    primary_score += 15
                elif any(t == o_val or t == o_disp for t in tokens):
                    primary_score += 15

        # 6. Compound Multi-Token Intent Matching
        # All query tokens must match identity fields (product name, variant name, category, brand, attributes)
        identity_words = set(re.findall(r'\w+', f"{p_name} {v_name} {c_name} {b_name} {' '.join(opt_tokens)}"))
        if tokens:
            matched_identity_tokens = [t for t in tokens if t in identity_words]
            if len(matched_identity_tokens) == len(tokens) and len(tokens) > 1:
                primary_score += 40  # Full compound match
            elif len(matched_identity_tokens) > 0 and len(tokens) > 1:
                # Partial token match on compound queries (e.g. "chips sandwich")
                # If only 1 out of 2 words matched identity, do not treat as full match
                pass

        # 7. Description Matching (Weak supporting signal ONLY)
        if desc:
            if query_lower in desc or any(re.search(rf'\b{re.escape(t)}\b', desc) for t in tokens):
                desc_score = 5

        return primary_score, desc_score

    @classmethod
    def find_matching_entities(cls, raw_query: str, cleaned_query: str, tokens: List[str]):
        """
        Extracts Product, Category, and AttributeOption from the database prioritizing Product Identity.
        """
        matched_products = []
        matched_categories = []
        matched_options = []

        query_text = cleaned_query.strip()
        joined_query = " " + query_text + " "

        # 1. Match active Products from database
        all_products = Product.objects.filter(is_active=True).select_related('category').prefetch_related('attributes', 'variants')
        for prod in all_products:
            p_name_lower = prod.name.lower()
            if re.search(rf'\b{re.escape(p_name_lower)}\b', joined_query) or any(t == p_name_lower for t in tokens):
                matched_products.append(prod)
            elif p_name_lower in query_text and len(p_name_lower) >= 3:
                matched_products.append(prod)

        # 2. Match active Categories from database
        all_categories = Category.objects.filter(is_active=True)
        for cat in all_categories:
            c_name_lower = cat.name.lower()
            if re.search(rf'\b{re.escape(c_name_lower)}\b', joined_query) or any(t == c_name_lower for t in tokens):
                matched_categories.append(cat)

        # 3. Match active Attribute Options from database
        all_options = AttributeOption.objects.select_related('attribute')
        for opt in all_options:
            val_lower = opt.value.lower()
            disp_lower = opt.display_name.lower()
            if re.search(rf'\b{re.escape(val_lower)}\b', joined_query) or re.search(rf'\b{re.escape(disp_lower)}\b', joined_query):
                matched_options.append(opt)
            elif any(t == val_lower or t == disp_lower for t in tokens):
                matched_options.append(opt)

        return matched_products, matched_categories, matched_options

    @classmethod
    def search_and_clarify(
        cls,
        raw_query: str,
        context: Optional[Dict[str, Any]] = None,
        selected_option_id: Optional[int] = None,
        shop_id: Optional[int] = None,
        category_id: Optional[int] = None,
        max_price_param: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Main search and clarification pipeline using weighted relevance scoring.
        """
        extracted_max_price, cleaned_text = cls.extract_price_constraint(raw_query)
        effective_max_price = max_price_param if max_price_param is not None else extracted_max_price
        tokens = cls.clean_query_tokens(cleaned_text)
        query_lower = " ".join(tokens) if tokens else cleaned_text.strip().lower()

        context = context or {}
        selected_option_ids = list(context.get('selected_option_ids', []))

        if selected_option_id and selected_option_id not in selected_option_ids:
            selected_option_ids.append(selected_option_id)

        # Retrieve or detect target product
        product_id = context.get('product_id')
        target_product = None
        if product_id:
            target_product = Product.objects.filter(id=product_id, is_active=True).first()

        matched_products, matched_categories, matched_options = cls.find_matching_entities(raw_query, cleaned_text, tokens)

        # Add newly matched options from query tokens
        for opt in matched_options:
            if opt.id not in selected_option_ids:
                selected_option_ids.append(opt.id)

        # If product was not in context, pick from matched products
        if not target_product and matched_products:
            # Score each matched product against the query to pick the highest relevance product
            scored_candidates = []
            for p in matched_products:
                score, _ = cls.score_product_and_variants(p, None, query_lower, tokens)
                scored_candidates.append((score, len(p.name), p))
            scored_candidates.sort(key=lambda x: (x[0], x[1]), reverse=True)
            target_product = scored_candidates[0][2]

        # Check if the query itself is just an attribute option for an existing context
        if not target_product and selected_option_ids:
            first_opt = AttributeOption.objects.filter(id__in=selected_option_ids).first()
            if first_opt:
                cand = Product.objects.filter(attributes=first_opt.attribute, is_active=True).first()
                if cand:
                    target_product = cand

        # CASE 1: Specific Product Identified
        if target_product:
            variants = list(target_product.variants.filter(is_active=True).prefetch_related('attribute_options'))

            # If product has NO variants or only 1 variant:
            if len(variants) <= 1:
                single_variant = variants[0] if variants else None
                return cls._build_inventory_results(
                    raw_query=raw_query,
                    product=target_product,
                    variant=single_variant,
                    shop_id=shop_id,
                    max_price=effective_max_price
                )

            # Determine relevant attributes for this product
            product_attr_ids = set(target_product.attributes.values_list('id', flat=True))
            if not product_attr_ids:
                product_attr_ids = set(AttributeOption.objects.filter(variants__in=variants).values_list('attribute_id', flat=True).distinct())

            # Only retain selected options that belong to this product's attributes
            relevant_selected_option_ids = list(
                AttributeOption.objects.filter(
                    id__in=selected_option_ids, attribute_id__in=product_attr_ids
                ).values_list('id', flat=True)
            )

            # Filter remaining variants matching all relevant selected attribute options
            filtered_variants = variants
            for opt_id in relevant_selected_option_ids:
                filtered_variants = [
                    v for v in filtered_variants if v.attribute_options.filter(id=opt_id).exists()
                ]

            # If exactly 1 variant matches, ambiguity is resolved!
            if len(filtered_variants) == 1:
                return cls._build_inventory_results(
                    raw_query=raw_query,
                    product=target_product,
                    variant=filtered_variants[0],
                    shop_id=shop_id,
                    max_price=effective_max_price
                )

            # If zero variants match the combination:
            if len(filtered_variants) == 0:
                return {
                    'query': raw_query,
                    'is_clarification': False,
                    'count': 0,
                    'message': f"No '{target_product.name}' variant matches the selected options.",
                    'results': []
                }

            # Multiple variants remain -> Detect next distinguishing attribute
            selected_opts_objs = AttributeOption.objects.filter(id__in=relevant_selected_option_ids).select_related('attribute')
            selected_attr_ids = {opt.attribute_id for opt in selected_opts_objs}

            # Inspect attributes used across filtered_variants
            product_attributes = list(target_product.attributes.all())
            unasked_attribute = None
            available_options_for_attr = []

            for attr in product_attributes:
                if attr.id not in selected_attr_ids:
                    opts = AttributeOption.objects.filter(
                        attribute=attr,
                        variants__in=filtered_variants
                    ).distinct()
                    if opts.count() > 1:
                        unasked_attribute = attr
                        available_options_for_attr = list(opts)
                        break

            # If an unasked distinguishing attribute exists, ask clarification!
            if unasked_attribute and available_options_for_attr:
                if len(selected_option_ids) == 0:
                    question = f"Which {target_product.name.lower()} are you looking for?"
                else:
                    question = f"Which {unasked_attribute.name.lower()} would you like for {target_product.name}?"

                clarification_options = [
                    {
                        'id': opt.id,
                        'name': opt.display_name,
                        'value': opt.value,
                        'attribute_name': unasked_attribute.name,
                    }
                    for opt in available_options_for_attr
                ]

                return {
                    'query': raw_query,
                    'is_clarification': True,
                    'clarification_question': question,
                    'clarification_options': clarification_options,
                    'context': {
                        'product_id': target_product.id,
                        'product_name': target_product.name,
                        'selected_option_ids': selected_option_ids,
                    },
                    'count': 0,
                    'results': []
                }

            # If all distinguishing attributes are specified or options are uniform:
            return cls._build_inventory_results_for_variants(
                raw_query=raw_query,
                product=target_product,
                variants=filtered_variants,
                shop_id=shop_id,
                max_price=effective_max_price
            )

        # CASE 2: No single product identified yet -> Run Weighted Relevance Search
        return cls._weighted_relevance_search(
            raw_query=raw_query,
            query_lower=query_lower,
            tokens=tokens,
            category_id=category_id or (matched_categories[0].id if matched_categories else None),
            shop_id=shop_id,
            max_price=effective_max_price
        )

    @classmethod
    def _weighted_relevance_search(
        cls,
        raw_query: str,
        query_lower: str,
        tokens: List[str],
        category_id: Optional[int] = None,
        shop_id: Optional[int] = None,
        max_price: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Executes weighted relevance ranking across all active inventory items.
        Strictly prioritizes Product Identity. Discards description-only matches when primary matches exist.
        """
        inv_qs = Inventory.objects.select_related(
            'shop', 'product', 'product__category', 'variant'
        ).prefetch_related(
            'variant__attribute_options'
        ).filter(
            shop__is_active=True
        )

        if category_id:
            inv_qs = inv_qs.filter(product__category_id=category_id)

        if shop_id:
            inv_qs = inv_qs.filter(shop_id=shop_id)

        if max_price is not None:
            inv_qs = inv_qs.filter(price__lte=max_price)

        # Score all inventory candidates
        primary_scored_items = []
        desc_only_items = []

        for inv in inv_qs:
            p_score, d_score = cls.score_product_and_variants(
                product=inv.product,
                variant=inv.variant,
                query_lower=query_lower,
                tokens=tokens
            )

            # If query has multiple tokens (e.g. "chips sandwich"):
            # Ensure compound intent: a candidate must not match one word in name and another in description.
            if len(tokens) > 1:
                p_name = inv.product.name.lower()
                v_name = inv.variant.name.lower() if inv.variant else ""
                ident = f"{p_name} {v_name}"
                matching_words = [t for t in tokens if t in ident]
                if len(matching_words) < len(tokens):
                    # Incomplete compound match -> do not award high primary score
                    if p_score < 40:
                        p_score = 0

            avail = inv.available_quantity
            item_dict = {
                'id': inv.id,
                'inventory_id': inv.id,
                'product_id': inv.product.id,
                'variant_id': inv.variant.id if inv.variant else None,
                'product': inv.variant.name if inv.variant else inv.product.name,
                'base_product_name': inv.product.name,
                'variant_name': inv.variant.name if inv.variant else '',
                'sku': inv.variant.sku if inv.variant else '',
                'description': inv.product.description,
                'brand': inv.product.brand,
                'category': inv.product.category.name if inv.product.category else 'General',
                'image': inv.variant.image if (inv.variant and inv.variant.image) else inv.product.image,
                'unit': inv.product.unit,
                'shop_id': inv.shop.id,
                'shop': inv.shop.name,
                'shop_phone': inv.shop.phone,
                'location_name': inv.shop.location_name,
                'price': float(inv.price),
                'quantity': inv.quantity,
                'reserved_quantity': inv.reserved_quantity,
                'available_quantity': avail,
                'is_in_stock': avail > 0,
                'shop_is_open': inv.shop.is_open,
                'approx_distance_m': 120,
                '_score': p_score
            }

            if p_score >= 15:
                primary_scored_items.append((p_score, inv.shop.is_open, avail, -float(inv.price), item_dict))
            elif d_score > 0:
                desc_only_items.append((d_score, inv.shop.is_open, avail, -float(inv.price), item_dict))

        # IF PRIMARY PRODUCT IDENTITY MATCHES EXIST:
        # Return ONLY primary matches! Description-only matches are discarded.
        if primary_scored_items:
            primary_scored_items.sort(key=lambda x: (x[0], x[1], x[2], x[3]), reverse=True)
            results = [item[4] for item in primary_scored_items]

            matched_label = results[0]['base_product_name'] if results else raw_query
            return {
                'query': raw_query,
                'is_clarification': False,
                'matched_product': matched_label,
                'count': len(results),
                'message': f"Found {len(results)} items matching '{raw_query}'.",
                'results': results
            }

        # IF NO PRIMARY IDENTITY MATCHES EXIST:
        # Do NOT return unrelated sandwiches as direct results for "chips"!
        if desc_only_items:
            desc_only_items.sort(key=lambda x: (x[0], x[1], x[2], x[3]), reverse=True)
            related = [item[4] for item in desc_only_items]
            return {
                'query': raw_query,
                'is_clarification': False,
                'count': 0,
                'message': f"No exact products found for '{raw_query}'.",
                'related_results': related,
                'results': []  # Must NOT appear as direct matches!
            }

        # NOTHING MATCHED
        return {
            'query': raw_query,
            'is_clarification': False,
            'count': 0,
            'message': f"This item is not available in any store.",
            'results': []
        }

    @classmethod
    def _build_inventory_results(
        cls,
        raw_query: str,
        product: Product,
        variant: Optional[ProductVariant],
        shop_id: Optional[int] = None,
        max_price: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Builds search results for an exact product variant or single-variant product.
        """
        inv_qs = Inventory.objects.select_related(
            'shop', 'product', 'product__category', 'variant'
        ).filter(
            product=product,
            shop__is_active=True
        )

        if variant:
            inv_qs = inv_qs.filter(variant=variant)

        if shop_id:
            inv_qs = inv_qs.filter(shop_id=shop_id)

        if max_price is not None:
            inv_qs = inv_qs.filter(price__lte=max_price)

        inv_qs = inv_qs.annotate(
            curr_available=F('quantity') - F('reserved_quantity')
        ).order_by('-shop__is_open', '-curr_available', 'price')

        results = []
        total_in_stock = 0

        for inv in inv_qs:
            avail = inv.available_quantity
            if avail > 0:
                total_in_stock += avail

            results.append({
                'id': inv.id,
                'inventory_id': inv.id,
                'product_id': inv.product.id,
                'variant_id': inv.variant.id if inv.variant else None,
                'product': inv.variant.name if inv.variant else inv.product.name,
                'base_product_name': inv.product.name,
                'variant_name': inv.variant.name if inv.variant else '',
                'sku': inv.variant.sku if inv.variant else '',
                'description': inv.product.description,
                'brand': inv.product.brand,
                'category': inv.product.category.name if inv.product.category else 'General',
                'image': inv.variant.image if (inv.variant and inv.variant.image) else inv.product.image,
                'unit': inv.product.unit,
                'shop_id': inv.shop.id,
                'shop': inv.shop.name,
                'shop_phone': inv.shop.phone,
                'location_name': inv.shop.location_name,
                'price': float(inv.price),
                'quantity': inv.quantity,
                'reserved_quantity': inv.reserved_quantity,
                'available_quantity': avail,
                'is_in_stock': avail > 0,
                'shop_is_open': inv.shop.is_open,
                'approx_distance_m': 120
            })

        item_title = variant.name if variant else product.name

        if not results or total_in_stock == 0:
            msg = f"'{item_title}' is currently out of stock across campus outlets."
        else:
            msg = f"Found {len([r for r in results if r['is_in_stock']])} campus shop(s) with available stock for '{item_title}'."

        return {
            'query': raw_query,
            'is_clarification': False,
            'matched_product': product.name,
            'matched_variant': variant.name if variant else None,
            'in_stock': total_in_stock > 0,
            'count': len(results),
            'message': msg,
            'results': results
        }

    @classmethod
    def _build_inventory_results_for_variants(
        cls,
        raw_query: str,
        product: Product,
        variants: List[ProductVariant],
        shop_id: Optional[int] = None,
        max_price: Optional[float] = None
    ) -> Dict[str, Any]:
        inv_qs = Inventory.objects.select_related(
            'shop', 'product', 'product__category', 'variant'
        ).filter(
            variant__in=variants,
            shop__is_active=True
        )

        if shop_id:
            inv_qs = inv_qs.filter(shop_id=shop_id)

        if max_price is not None:
            inv_qs = inv_qs.filter(price__lte=max_price)

        inv_qs = inv_qs.annotate(
            curr_available=F('quantity') - F('reserved_quantity')
        ).order_by('-shop__is_open', '-curr_available', 'price')

        results = []
        for inv in inv_qs:
            avail = inv.available_quantity
            results.append({
                'id': inv.id,
                'inventory_id': inv.id,
                'product_id': inv.product.id,
                'variant_id': inv.variant.id if inv.variant else None,
                'product': inv.variant.name if inv.variant else inv.product.name,
                'base_product_name': inv.product.name,
                'variant_name': inv.variant.name if inv.variant else '',
                'sku': inv.variant.sku if inv.variant else '',
                'description': inv.product.description,
                'brand': inv.product.brand,
                'category': inv.product.category.name if inv.product.category else 'General',
                'image': inv.variant.image if (inv.variant and inv.variant.image) else inv.product.image,
                'unit': inv.product.unit,
                'shop_id': inv.shop.id,
                'shop': inv.shop.name,
                'shop_phone': inv.shop.phone,
                'location_name': inv.shop.location_name,
                'price': float(inv.price),
                'quantity': inv.quantity,
                'reserved_quantity': inv.reserved_quantity,
                'available_quantity': avail,
                'is_in_stock': avail > 0,
                'shop_is_open': inv.shop.is_open,
                'approx_distance_m': 120
            })

        return {
            'query': raw_query,
            'is_clarification': False,
            'matched_product': product.name,
            'matched_variant': ", ".join([v.name for v in variants]),
            'count': len(results),
            'message': f"Found {len(results)} items for '{product.name}'.",
            'results': results
        }

