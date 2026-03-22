<<<<<<< HEAD
# notifications/urls.py

=======
from django.urls import include, path
>>>>>>> features_Lionel
from rest_framework.routers import DefaultRouter
from .views import QuittanceViewSet, DemandeContactViewSet

router = DefaultRouter()
<<<<<<< HEAD
router.register(r'quittances', QuittanceViewSet, basename='quittance')
router.register(r'demandes', DemandeContactViewSet, basename='demande')

urlpatterns = router.urls
=======
router.register(r'quittances', QuittanceViewSet)
router.register(r'demandes', DemandeContactViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
>>>>>>> features_Lionel
