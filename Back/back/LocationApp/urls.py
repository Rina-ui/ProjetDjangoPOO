from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from comptabilite.views import enregistrer_paiement

urlpatterns = [
                  path('admin/', admin.site.urls),
                  path('', include('utilisateurs.urls')),

                  # ── Route directe pour le frontend ───────────────────
                  path('api/paiements/enregistrer/', enregistrer_paiement, name='enregistrer-paiement-alias'),

                  # ── APPS ─────────────────────────────────────────────
                  path('api/patrimoine/',    include('patrimoine.urls')),
                  path('api/locataires/',    include('locataires.urls')),
                  path('api/comptabilite/',  include('comptabilite.urls')),
                  path('api/notifications/', include('notifications.urls')),
                  path('api/chat/',          include('chat.urls')),
              ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)