from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CollegeViewSet, ShopViewSet

router = DefaultRouter()
router.register(r'colleges', CollegeViewSet, basename='college')
router.register(r'', ShopViewSet, basename='shop')

urlpatterns = [
    path('', include(router.urls)),
]
