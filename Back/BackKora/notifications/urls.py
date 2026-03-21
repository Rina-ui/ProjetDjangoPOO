# notifications/urls.py

from rest_framework.routers import DefaultRouter
from .views import QuittanceViewSet, DemandeContactViewSet

router = DefaultRouter()
router.register(r'quittances', QuittanceViewSet, basename='quittance')
router.register(r'demandes', DemandeContactViewSet, basename='demande')

urlpatterns = router.urls