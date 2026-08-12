from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    shop_name = serializers.ReadOnlyField(source='shop.name')
    reservation_code = serializers.ReadOnlyField(source='reservation.reservation_code')
    status_display = serializers.ReadOnlyField(source='get_status_display')

    class Meta:
        model = Notification
        fields = (
            'id', 'reservation', 'reservation_code', 'shop', 'shop_name',
            'recipient', 'recipient_phone', 'notification_type',
            'message', 'channel', 'status', 'status_display',
            'provider_message_id', 'error_message',
            'sent_at', 'created_at'
        )
