from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AuditLogViewSet,
    Disable2FAView,
    KoraLoginView,
    Login2FAView,
    MeView,
    ProprietaireViewSet,
    RegisterView,
    Setup2FAView,
    UtilisateurViewSet,
    Verify2FAView,
)

router = DefaultRouter()
router.register(r'users', UtilisateurViewSet)
router.register(r'proprietaires', ProprietaireViewSet)
router.register(r'audit', AuditLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('api/auth/login/', KoraLoginView.as_view(), name='token_obtain'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/me/', MeView.as_view(), name='me'),
    path('api/auth/2fa/setup/', Setup2FAView.as_view(), name='2fa_setup'),
    path('api/auth/2fa/verify/', Verify2FAView.as_view(), name='2fa_verify'),
    path('api/auth/2fa/login/', Login2FAView.as_view(), name='2fa_login'),
    path('api/auth/2fa/disable/', Disable2FAView.as_view(), name='2fa_disable'),
]
