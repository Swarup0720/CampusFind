from rest_framework import serializers
from .models import Category, ProductAttribute, AttributeOption, Product, ProductVariant

class AttributeOptionSerializer(serializers.ModelSerializer):
    attribute_name = serializers.ReadOnlyField(source='attribute.name')

    class Meta:
        model = AttributeOption
        fields = ('id', 'attribute', 'attribute_name', 'value', 'display_name', 'created_at')


class ProductAttributeSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    options = AttributeOptionSerializer(many=True, read_only=True)

    class Meta:
        model = ProductAttribute
        fields = ('id', 'name', 'category', 'category_name', 'data_type', 'is_required', 'is_filterable', 'options', 'created_at')


class CategorySerializer(serializers.ModelSerializer):
    attributes = ProductAttributeSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ('id', 'name', 'description', 'is_active', 'attributes', 'created_at', 'updated_at')


class ProductVariantSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    attribute_options_detail = AttributeOptionSerializer(source='attribute_options', many=True, read_only=True)
    attribute_option_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=AttributeOption.objects.all(), source='attribute_options', write_only=True, required=False
    )

    class Meta:
        model = ProductVariant
        fields = (
            'id', 'product', 'product_name', 'sku', 'name', 'price',
            'attribute_options', 'attribute_options_detail', 'attribute_option_ids',
            'image', 'is_active', 'created_at', 'updated_at'
        )


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    attributes_detail = ProductAttributeSerializer(source='attributes', many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    attribute_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=ProductAttribute.objects.all(), source='attributes', write_only=True, required=False
    )

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'description', 'category', 'category_name', 'base_price',
            'brand', 'image', 'unit', 'has_variants', 'attributes', 'attributes_detail',
            'attribute_ids', 'variants', 'is_active', 'created_at', 'updated_at'
        )
