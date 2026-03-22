from ast import increment_lineno

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaiementViewSet, DepenseViewSet

router = DefaultRouter()
router.register(r'paiements', PaiementViewSet)
router.register(r'depenses', DepenseViewSet)

urlpatterns = [
    path('api/', include(router.urls))
]