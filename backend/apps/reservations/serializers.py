from rest_framework import serializers
from .models import Reservation, ReservationItem
from apps.products.serializers import ProductSerializer
from apps.shops.serializers import ShopSerializer


class ReservationItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_brand = serializers.ReadOnlyField(source='product.brand')

    class Meta:
        model = ReservationItem
        fields = ('id', 'product', 'product_name', 'product_brand', 'quantity', 'unit_price', 'total_price')


class ReservationSerializer(serializers.ModelSerializer):
    items = ReservationItemSerializer(many=True, read_only=True)
    shop_name = serializers.ReadOnlyField(source='shop.name')
    shop_location = serializers.ReadOnlyField(source='shop.location_name')
    shop_phone = serializers.ReadOnlyField(source='shop.phone')
    student_username = serializers.ReadOnlyField(source='student.username')
    # Returns the status of the most recent WhatsApp notification for this reservation.
    # 'MOCK' = dev mode (no real WhatsApp sent), 'SENT' = delivered, 'FAILED' = error, None = no notification yet.
    whatsapp_notification_status = serializers.SerializerMethodField()
    whatsapp_link = serializers.SerializerMethodField()
    whatsapp_error = serializers.SerializerMethodField()

    def get_whatsapp_notification_status(self, obj):
        latest = obj.notifications.filter(channel='WHATSAPP').order_by('-created_at').first()
        return latest.status if latest else None

    def get_whatsapp_link(self, obj):
        from apps.notifications.services import NotificationService
        res = NotificationService.create_shopkeeper_whatsapp_link(obj)
        return res.get('link')

    def get_whatsapp_error(self, obj):
        from apps.notifications.services import NotificationService
        res = NotificationService.create_shopkeeper_whatsapp_link(obj)
        return res.get('error')

    class Meta:
        model = Reservation
        fields = (
            'id', 'reservation_code', 'student', 'student_username', 'shop',
            'shop_name', 'shop_location', 'shop_phone', 'status', 'pickup_eta_minutes',
            'pickup_deadline', 'total_amount', 'items',
            'whatsapp_notification_status', 'whatsapp_link', 'whatsapp_error', 'created_at', 'updated_at'
        )
        read_only_fields = ('reservation_code', 'student', 'status', 'total_amount', 'created_at')


class CreateReservationInputSerializer(serializers.Serializer):
    shop_id = serializers.IntegerField()
    pickup_eta_minutes = serializers.IntegerField(default=20)
    items = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False
    )
