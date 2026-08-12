from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Inventory
from .serializers import InventorySerializer
from apps.accounts.permissions import IsShopkeeper, IsAdminUserOrSuperuser

class InventoryViewSet(viewsets.ModelViewSet):
    serializer_class = InventorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = Inventory.objects.select_related('shop', 'product', 'product__category').all()
        shop_id = self.request.query_params.get('shop')
        product_id = self.request.query_params.get('product')

        if shop_id:
            queryset = queryset.filter(shop_id=shop_id)
        if product_id:
            queryset = queryset.filter(product_id=product_id)

        user = self.request.user
        if user.is_authenticated and user.role == 'SHOPKEEPER':
            if hasattr(user, 'shop') and user.shop:
                return queryset.filter(shop=user.shop)

        return queryset.filter(is_available=True, shop__is_open=True)

    @action(detail=True, methods=['patch'], permission_classes=[IsShopkeeper])
    def update_stock(self, request, pk=None):
        inventory = self.get_object()
        quantity = request.data.get('quantity')
        price = request.data.get('price')

        if quantity is not None:
            inventory.quantity = max(0, int(quantity))
        if price is not None:
            inventory.price = float(price)

        inventory.save()
        return Response(InventorySerializer(inventory).data)
