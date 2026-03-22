from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BienViewSet, CategorieViewSet, TypeBienViewSet

router = DefaultRouter()
router.register(r'biens',       BienViewSet)
router.register(r'categories',  CategorieViewSet)
router.register(r'types-biens', TypeBienViewSet)

urlpatterns = [path('', include(router.urls))]
