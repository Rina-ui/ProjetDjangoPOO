from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    InscriptionView,
    ConnexionView,
    ProfilView,
    Activer2FAView,
    Confirmer2FAView,
    Desactiver2FAView,
)

urlpatterns = [
    path('inscription/', InscriptionView.as_view(), name='inscription'),
    path('connexion/', ConnexionView.as_view(), name='connexion'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profil/', ProfilView.as_view(), name='profil'),
    path('2fa/activer/', Activer2FAView.as_view(), name='activer_2fa'),
    path('2fa/confirmer/', Confirmer2FAView.as_view(), name='confirmer_2fa'),
    path('2fa/desactiver/', Desactiver2FAView.as_view(), name='desactiver_2fa'),
]
