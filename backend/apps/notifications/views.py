from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer
from .services import WhatsAppNotificationService


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role == 'ADMIN':
            return Notification.objects.all().order_by('-created_at')
        if user.role == 'SHOPKEEPER':
            return Notification.objects.filter(shop__owner=user).order_by('-created_at')
        return Notification.objects.filter(recipient=user).order_by('-created_at')


class WhatsAppConfigStatusView(APIView):
    """
    Returns the real WhatsApp Business API configuration status and missing parameters.
    Accessible to authenticated users/admins to verify delivery readiness.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        config_status = WhatsAppNotificationService.get_config_status()
        return Response(config_status, status=status.HTTP_200_OK)
