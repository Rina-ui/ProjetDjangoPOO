from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategorieViewSet, TypeBienViewSet, BienViewSet

router = DefaultRouter()
router.register(r'categories', CategorieViewSet)
router.register(r'types-bien', TypeBienViewSet)
router.register(r'biens', BienViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]