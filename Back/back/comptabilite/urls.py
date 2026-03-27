from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaiementViewSet, DepenseViewSet, enregistrer_paiement

router = DefaultRouter()
router.register(r'paiements', PaiementViewSet)
router.register(r'depenses',  DepenseViewSet)

urlpatterns = [
    path('paiements/enregistrer/', enregistrer_paiement, name='enregistrer-paiement'),
    path('', include(router.urls)),
]
