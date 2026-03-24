from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LocataireViewSet, BailViewSet, VisiteViewSet, BienSauvegardeViewSet

router = DefaultRouter()
router.register(r'locataires', LocataireViewSet)
router.register(r'baux',       BailViewSet)
router.register(r'visites',    VisiteViewSet,        basename='visite')
router.register(r'sauvegardes', BienSauvegardeViewSet, basename='sauvegarde')

urlpatterns = [path('', include(router.urls))]
