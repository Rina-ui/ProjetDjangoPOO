from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UtilisateurViewSet, ProprietaireViewSet, AuditLogViewSet, Setup2FAView, Verify2FAView, Login2FAView

router = DefaultRouter()
router.register(r'users',        UtilisateurViewSet)
router.register(r'proprietaires', ProprietaireViewSet)
router.register(r'audit',        AuditLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('api/auth/2fa/setup/',  Setup2FAView.as_view(),  name='2fa_setup'),
    path('api/auth/2fa/verify/', Verify2FAView.as_view(), name='2fa_verify'),
    path('api/auth/2fa/login/',  Login2FAView.as_view(),  name='2fa_login'),
]
