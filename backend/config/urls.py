import os
from pathlib import Path
from django.contrib import admin
from django.urls import path, re_path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from django.http import FileResponse, Http404
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

def favicon_view(request):
    favicon_path = settings.BASE_DIR.parent / 'frontend' / 'dist' / 'favicon.ico'
    if os.path.exists(favicon_path):
        return FileResponse(open(favicon_path, 'rb'), content_type='image/x-icon')
    raise Http404()

urlpatterns = [
    # Django Admin Interface (protected for staff/superusers)
    path('django-admin/', admin.site.urls),
    
    # OpenAPI Swagger Docs (internal developer docs)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Internal API Endpoints
    path('api/auth/', include('apps.accounts.urls')),
    path('api/admin/', include('apps.accounts.admin_urls')),
    path('api/shops/', include('apps.shops.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/categories/', include('apps.products.category_urls')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/search/', include('apps.search.urls')),
    path('api/reservations/', include('apps.reservations.urls')),
    path('api/notifications/', include('apps.notifications.urls')),

    # Favicon
    path('favicon.ico', favicon_view, name='favicon'),

    # SPA Catch-all: Route all other web paths to the built React application
    re_path(r'^(?!api/|django-admin/|static/|media/).*$', TemplateView.as_view(template_name='index.html'), name='spa_index'),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
