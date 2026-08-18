from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.permissions import IsAdminUserOrSuperuser
from apps.accounts.models import User
from apps.accounts.serializers import UserSerializer
from apps.shops.models import Shop
from apps.shops.serializers import ShopSerializer
from apps.products.models import Product, Category, ProductAttribute, AttributeOption, ProductVariant
from apps.products.serializers import (
    ProductSerializer, CategorySerializer, ProductAttributeSerializer,
    AttributeOptionSerializer, ProductVariantSerializer
)
from apps.inventory.models import Inventory
from apps.inventory.serializers import InventorySerializer
from apps.reservations.models import Reservation
from apps.reservations.serializers import ReservationSerializer
from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer

class AdminStatsView(APIView):
    permission_classes = [IsAdminUserOrSuperuser]

    def get(self, request):
        total_shops = Shop.objects.count()
        total_products = Product.objects.count()
        total_variants = ProductVariant.objects.count()
        total_attributes = ProductAttribute.objects.count()
        total_reservations = Reservation.objects.count()
        completed_reservations = Reservation.objects.filter(status=Reservation.Status.COMPLETED)
        total_revenue = sum(r.total_amount for r in completed_reservations)
        low_stock_count = Inventory.objects.filter(quantity__lte=5).count()
        failed_notifications = Notification.objects.filter(status=Notification.Status.FAILED).count()

        return Response({
            'total_shops': total_shops,
            'total_products': total_products,
            'total_variants': total_variants,
            'total_attributes': total_attributes,
            'total_reservations': total_reservations,
            'total_revenue': float(total_revenue),
            'low_stock_count': low_stock_count,
            'failed_notifications': failed_notifications,
        })

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUserOrSuperuser]

class AdminShopViewSet(viewsets.ModelViewSet):
    queryset = Shop.objects.all().order_by('-created_at')
    serializer_class = ShopSerializer
    permission_classes = [IsAdminUserOrSuperuser]

class AdminCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUserOrSuperuser]

class AdminProductAttributeViewSet(viewsets.ModelViewSet):
    queryset = ProductAttribute.objects.all().order_by('name')
    serializer_class = ProductAttributeSerializer
    permission_classes = [IsAdminUserOrSuperuser]

class AdminAttributeOptionViewSet(viewsets.ModelViewSet):
    queryset = AttributeOption.objects.all().order_by('attribute', 'display_name')
    serializer_class = AttributeOptionSerializer
    permission_classes = [IsAdminUserOrSuperuser]

class AdminProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all().order_by('product', 'name')
    serializer_class = ProductVariantSerializer
    permission_classes = [IsAdminUserOrSuperuser]

class AdminProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [IsAdminUserOrSuperuser]

class AdminInventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all().order_by('-created_at')
    serializer_class = InventorySerializer
    permission_classes = [IsAdminUserOrSuperuser]

class AdminReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all().order_by('-created_at')
    serializer_class = ReservationSerializer
    permission_classes = [IsAdminUserOrSuperuser]

class AdminNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Notification.objects.all().order_by('-created_at')
    serializer_class = NotificationSerializer
    permission_classes = [IsAdminUserOrSuperuser]
