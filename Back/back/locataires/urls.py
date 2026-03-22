from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LocataireViewSet, BailViewSet

router = DefaultRouter()
router.register(r'locataires', LocataireViewSet)
router.register(r'baux',       BailViewSet)

urlpatterns = [path('', include(router.urls))]
