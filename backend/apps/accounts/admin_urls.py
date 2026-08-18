from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import (
    AdminStatsView, AdminUserViewSet, AdminShopViewSet,
    AdminCategoryViewSet, AdminProductAttributeViewSet,
    AdminAttributeOptionViewSet, AdminProductVariantViewSet,
    AdminProductViewSet, AdminInventoryViewSet,
    AdminReservationViewSet, AdminNotificationViewSet
)

router = DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin_users')
router.register(r'shops', AdminShopViewSet, basename='admin_shops')
router.register(r'categories', AdminCategoryViewSet, basename='admin_categories')
router.register(r'attributes', AdminProductAttributeViewSet, basename='admin_attributes')
router.register(r'options', AdminAttributeOptionViewSet, basename='admin_options')
router.register(r'variants', AdminProductVariantViewSet, basename='admin_variants')
router.register(r'products', AdminProductViewSet, basename='admin_products')
router.register(r'inventory', AdminInventoryViewSet, basename='admin_inventory')
router.register(r'reservations', AdminReservationViewSet, basename='admin_reservations')
router.register(r'notifications', AdminNotificationViewSet, basename='admin_notifications')

urlpatterns = [
    path('stats/', AdminStatsView.as_view(), name='admin_stats'),
    path('', include(router.urls)),
]
