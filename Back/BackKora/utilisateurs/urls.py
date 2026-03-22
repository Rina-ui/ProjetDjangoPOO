from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from utilisateurs.views import RegisterView, MeView

urlpatterns = [
                  path('admin/', admin.site.urls),

                  # ── AUTH JWT ──────────────────────────────────────────
                  path('api/auth/login/',   TokenObtainPairView.as_view(), name='token_obtain'),
                  path('api/auth/refresh/', TokenRefreshView.as_view(),    name='token_refresh'),
                  path('api/auth/register/', RegisterView.as_view(),       name='register'),
                  path('api/auth/me/',       MeView.as_view(),             name='me'),

                  # ── APPS ─────────────────────────────────────────────
                  path('api/patrimoine/',    include('patrimoine.urls')),
                  path('api/locataires/',    include('locataires.urls')),
                  path('api/comptabilite/',  include('comptabilite.urls')),
                  path('api/notifications/', include('notifications.urls')),
              ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)