from rest_framework import serializers
from .models import Inventory
from apps.products.serializers import ProductSerializer
from apps.shops.serializers import ShopSerializer

class InventorySerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    shop_name = serializers.ReadOnlyField(source='shop.name')
    shop_location = serializers.ReadOnlyField(source='shop.location_name')
    available_quantity = serializers.IntegerField(read_only=True)

    class Meta:
        model = Inventory
        fields = (
            'id', 'shop', 'shop_name', 'shop_location', 'product', 'product_details',
            'price', 'quantity', 'reserved_quantity', 'available_quantity',
            'is_available', 'created_at', 'updated_at'
        )
        read_only_fields = ('reserved_quantity', 'available_quantity')
