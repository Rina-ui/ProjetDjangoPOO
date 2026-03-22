from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet

router = DefaultRouter()
router.register('conversations', ConversationViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]