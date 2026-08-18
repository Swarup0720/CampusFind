from rest_framework import serializers
from .models import Reservation, ReservationItem
from apps.products.serializers import ProductSerializer, ProductVariantSerializer
from apps.shops.serializers import ShopSerializer


class ReservationItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_brand = serializers.ReadOnlyField(source='product.brand')
    variant_name = serializers.ReadOnlyField(source='variant.name')
    item_name = serializers.ReadOnlyField()

    class Meta:
        model = ReservationItem
        fields = ('id', 'product', 'product_name', 'variant', 'variant_name', 'item_name', 'product_brand', 'quantity', 'unit_price', 'total_price')


class ReservationSerializer(serializers.ModelSerializer):
    items = ReservationItemSerializer(many=True, read_only=True)
    shop_name = serializers.ReadOnlyField(source='shop.name')
    shop_location = serializers.ReadOnlyField(source='shop.location_name')
    shop_phone = serializers.ReadOnlyField(source='shop.phone')
    shop_upi_id = serializers.ReadOnlyField(source='shop.upi_id')
    shop_upi_name = serializers.ReadOnlyField(source='shop.upi_name')
    shop_qr_code_image = serializers.ReadOnlyField(source='shop.qr_code_image')
    upi_payment_uri = serializers.SerializerMethodField()
    student_username = serializers.ReadOnlyField(source='student.username')
    whatsapp_notification_status = serializers.SerializerMethodField()
    whatsapp_link = serializers.SerializerMethodField()
    whatsapp_error = serializers.SerializerMethodField()

    def get_upi_payment_uri(self, obj):
        if obj.shop:
            return obj.shop.get_upi_payment_uri(
                amount=float(obj.total_amount),
                order_code=obj.reservation_code
            )
        return ""

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
            'shop_name', 'shop_location', 'shop_phone', 'shop_upi_id', 'shop_upi_name',
            'shop_qr_code_image', 'upi_payment_uri', 'status', 'payment_status',
            'payment_method', 'payment_reference', 'payment_submitted_at',
            'pickup_eta_minutes', 'pickup_deadline', 'total_amount', 'items',
            'whatsapp_notification_status', 'whatsapp_link', 'whatsapp_error', 'created_at', 'updated_at'
        )
        read_only_fields = ('reservation_code', 'student', 'status', 'payment_status', 'total_amount', 'created_at')


class CreateReservationInputSerializer(serializers.Serializer):
    shop_id = serializers.IntegerField()
    pickup_eta_minutes = serializers.IntegerField(default=20)
    items = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False
    )


class SubmitPaymentInputSerializer(serializers.Serializer):
    payment_reference = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    payment_method = serializers.CharField(max_length=20, default='UPI_QR')
