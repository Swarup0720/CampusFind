from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import College, Shop
from .serializers import CollegeSerializer, ShopSerializer
from apps.accounts.permissions import IsShopkeeper, IsAdminUserOrSuperuser

class CollegeViewSet(viewsets.ModelViewSet):
    queryset = College.objects.all()
    serializer_class = CollegeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class ShopViewSet(viewsets.ModelViewSet):
    queryset = Shop.objects.filter(is_active=True)
    serializer_class = ShopSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'nearby']:
            return [permissions.AllowAny()]
        if self.action in ['update', 'partial_update', 'toggle_open']:
            return [IsShopkeeper()]
        return [IsAdminUserOrSuperuser()]

    def get_queryset(self):
        queryset = Shop.objects.all()
        user = self.request.user
        if user.is_authenticated and user.role == 'SHOPKEEPER':
            return queryset.filter(owner=user)
        college_id = self.request.query_params.get('college')
        if college_id:
            queryset = queryset.filter(college_id=college_id)
        return queryset.filter(is_active=True)

    @action(detail=True, methods=['post'], permission_classes=[IsShopkeeper])
    def toggle_open(self, request, pk=None):
        shop = self.get_object()
        shop.is_open = not shop.is_open
        shop.save()
        return Response({'id': shop.id, 'is_open': shop.is_open, 'message': f"Shop is now {'OPEN' if shop.is_open else 'CLOSED'}"})
