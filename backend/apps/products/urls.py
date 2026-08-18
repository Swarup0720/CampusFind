from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, ProductAttributeViewSet, AttributeOptionViewSet, ProductVariantViewSet
)

router = DefaultRouter()
router.register(r'attributes', ProductAttributeViewSet, basename='product-attribute')
router.register(r'options', AttributeOptionViewSet, basename='attribute-option')
router.register(r'variants', ProductVariantViewSet, basename='product-variant')
router.register(r'', ProductViewSet, basename='product')

urlpatterns = [
    path('', include(router.urls)),
]
