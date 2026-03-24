from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UtilisateurViewSet,
    ProprietaireViewSet,
    AuditLogViewSet, RegisterView,
    LoginView
)

router = DefaultRouter()
router.register(r'utilisateurs', UtilisateurViewSet)
router.register(r'proprietaires', ProprietaireViewSet)
router.register(r'auditlogs', AuditLogViewSet)

urlpatterns = [
    # path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('api/', include(router.urls)),
]