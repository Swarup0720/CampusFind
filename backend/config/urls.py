from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # OpenAPI Swagger Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # API endpoints
    path('api/auth/', include('apps.accounts.urls')),
    path('api/admin/', include('apps.accounts.admin_urls')),
    path('api/shops/', include('apps.shops.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/categories/', include('apps.products.category_urls')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/search/', include('apps.search.urls')),
    path('api/reservations/', include('apps.reservations.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
]
