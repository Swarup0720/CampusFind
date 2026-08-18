from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Reservation
from .serializers import ReservationSerializer, CreateReservationInputSerializer
from .services import ReservationService
from apps.accounts.permissions import IsShopkeeper

class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role == 'ADMIN':
            return Reservation.objects.prefetch_related('items', 'items__product').select_related('shop', 'student').order_by('-created_at')
        if user.role == 'SHOPKEEPER':
            if hasattr(user, 'shop') and user.shop:
                return Reservation.objects.filter(shop=user.shop).prefetch_related('items', 'items__product').select_related('shop', 'student').order_by('-created_at')
            return Reservation.objects.none()
        return Reservation.objects.filter(student=user).prefetch_related('items', 'items__product').select_related('shop', 'student').order_by('-created_at')

    def create(self, request, *args, **kwargs):
        serializer = CreateReservationInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reservation = ReservationService.create_reservation(
            student=request.user,
            shop_id=serializer.validated_data['shop_id'],
            items_data=serializer.validated_data['items'],
            pickup_eta_minutes=serializer.validated_data.get('pickup_eta_minutes', 20)
        )

        return Response(ReservationSerializer(reservation).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='submit-payment')
    def submit_payment(self, request, pk=None):
        reservation = self.get_object()
        ref = request.data.get('payment_reference', '')
        method = request.data.get('payment_method', 'UPI_QR')
        updated = ReservationService.submit_payment(
            reservation=reservation,
            user=request.user,
            payment_reference=ref,
            payment_method=method
        )
        return Response(ReservationSerializer(updated).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        reservation = self.get_object()
        updated = ReservationService.cancel_reservation(reservation, request.user)
        return Response(ReservationSerializer(updated).data)

    @action(detail=True, methods=['post'], permission_classes=[IsShopkeeper])
    def accept(self, request, pk=None):
        reservation = self.get_object()
        updated = ReservationService.accept_reservation(reservation, request.user)
        return Response(ReservationSerializer(updated).data)

    @action(detail=True, methods=['post'], permission_classes=[IsShopkeeper])
    def ready(self, request, pk=None):
        reservation = self.get_object()
        updated = ReservationService.mark_ready(reservation, request.user)
        return Response(ReservationSerializer(updated).data)

    @action(detail=True, methods=['post'], permission_classes=[IsShopkeeper])
    def complete(self, request, pk=None):
        reservation = self.get_object()
        updated = ReservationService.complete_reservation(reservation, request.user)
        return Response(ReservationSerializer(updated).data)

    @action(detail=True, methods=['post'], permission_classes=[IsShopkeeper])
    def reject(self, request, pk=None):
        reservation = self.get_object()
        updated = ReservationService.reject_reservation(reservation, request.user)
        return Response(ReservationSerializer(updated).data)
