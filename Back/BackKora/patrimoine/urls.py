<<<<<<< HEAD
# patrimoine/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BienViewSet, CategorieViewSet, TypeBienViewSet

router = DefaultRouter()

router.register(r'biens', BienViewSet)
router.register(r'categories', CategorieViewSet)
router.register(r'types-biens', TypeBienViewSet)

urlpatterns = [
    path('', include(router.urls)),
=======
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategorieViewSet, TypeBienViewSet, BienViewSet

router = DefaultRouter()
router.register(r'categories', CategorieViewSet)
router.register(r'types-bien', TypeBienViewSet)
router.register(r'biens', BienViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
>>>>>>> features_Lionel
]