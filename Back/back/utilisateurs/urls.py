from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UtilisateurViewSet, ProprietaireViewSet, AuditLogViewSet

router = DefaultRouter()
router.register(r'users',        UtilisateurViewSet)
router.register(r'proprietaires', ProprietaireViewSet)
router.register(r'audit',        AuditLogViewSet)

urlpatterns = [path('', include(router.urls))]
