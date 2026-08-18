from rest_framework import serializers
from .models import Inventory
from apps.products.serializers import ProductSerializer, ProductVariantSerializer
from apps.shops.serializers import ShopSerializer

class InventorySerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    variant_details = ProductVariantSerializer(source='variant', read_only=True)
    variant_name = serializers.ReadOnlyField(source='variant.name')
    item_name = serializers.ReadOnlyField()
    shop_name = serializers.ReadOnlyField(source='shop.name')
    shop_location = serializers.ReadOnlyField(source='shop.location_name')
    available_quantity = serializers.IntegerField(read_only=True)

    class Meta:
        model = Inventory
        fields = (
            'id', 'shop', 'shop_name', 'shop_location', 'product', 'product_details',
            'variant', 'variant_details', 'variant_name', 'item_name',
            'price', 'quantity', 'reserved_quantity', 'available_quantity',
            'is_available', 'created_at', 'updated_at'
        )
        read_only_fields = ('reserved_quantity', 'available_quantity')
