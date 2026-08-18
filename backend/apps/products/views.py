from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Category, Product, ProductAttribute, AttributeOption, ProductVariant
from .serializers import (
    CategorySerializer, ProductSerializer, ProductAttributeSerializer,
    AttributeOptionSerializer, ProductVariantSerializer
)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=True, methods=['get'])
    def attributes(self, request, pk=None):
        category = self.get_object()
        attributes = ProductAttribute.objects.filter(category=category)
        serializer = ProductAttributeSerializer(attributes, many=True)
        return Response(serializer.data)


class ProductAttributeViewSet(viewsets.ModelViewSet):
    queryset = ProductAttribute.objects.all()
    serializer_class = ProductAttributeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = ProductAttribute.objects.all()
        category_id = self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs


class AttributeOptionViewSet(viewsets.ModelViewSet):
    queryset = AttributeOption.objects.all()
    serializer_class = AttributeOptionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = AttributeOption.objects.all()
        attribute_id = self.request.query_params.get('attribute')
        if attribute_id:
            qs = qs.filter(attribute_id=attribute_id)
        return qs


class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.filter(is_active=True)
    serializer_class = ProductVariantSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = ProductVariant.objects.filter(is_active=True)
        product_id = self.request.query_params.get('product')
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'variants', 'attributes']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).prefetch_related('attributes', 'variants')
        category_id = self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs

    @action(detail=True, methods=['get'])
    def variants(self, request, pk=None):
        product = self.get_object()
        variants = product.variants.filter(is_active=True)
        serializer = ProductVariantSerializer(variants, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def attributes(self, request, pk=None):
        product = self.get_object()
        attributes = product.attributes.all()
        serializer = ProductAttributeSerializer(attributes, many=True)
        return Response(serializer.data)
