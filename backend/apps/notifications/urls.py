from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, WhatsAppConfigStatusView

router = DefaultRouter()
router.register(r'logs', NotificationViewSet, basename='notification_logs')

urlpatterns = [
    path('whatsapp-config/', WhatsAppConfigStatusView.as_view(), name='whatsapp_config_status'),
    path('', include(router.urls)),
]
