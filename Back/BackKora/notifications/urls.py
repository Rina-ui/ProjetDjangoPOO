from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import QuittanceViewSet, DemandeContactViewSet

router = DefaultRouter()
router.register(r'quittances', QuittanceViewSet)
router.register(r'demandes', DemandeContactViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]