from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Locataire, Bail, Reservation
from .serializers import (
    LocataireSerializer,
    BailSerializer,
    ReservationSerializer,
    ReservationReadSerializer,
)


class LocataireViewSet(viewsets.ModelViewSet):
    queryset = Locataire.objects.all()
    serializer_class = LocataireSerializer


class BailViewSet(viewsets.ModelViewSet):
    queryset = Bail.objects.all()
    serializer_class = BailSerializer


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.select_related('bien', 'locataire', 'locataire__utilisateur').all()
    permission_classes = [AllowAny]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user

        # Pour GET (liste/detail), exposer toutes les reservations.
        if self.action in ['list', 'retrieve']:
            return self.queryset

        if user.is_superuser or user.is_staff or getattr(user, 'role', None) == 'ADMIN':
            return self.queryset

        locataire = getattr(user, 'profil_locataire', None)
        if not locataire:
            return Reservation.objects.none()

        return self.queryset.filter(locataire=locataire)

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ReservationReadSerializer
        return ReservationSerializer

    def perform_create(self, serializer):
        locataire = getattr(self.request.user, 'profil_locataire', None)

        # Autorise aussi un locataire explicite quand la requete est anonyme/public.
        if not locataire:
            locataire_id = self.request.data.get('locataire')
            if locataire_id:
                locataire = Locataire.objects.filter(pk=locataire_id).first()

        if not locataire:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Seul un locataire peut creer une reservation.')
        serializer.save(locataire=locataire)

    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        reservation = self.get_object()

        if reservation.statut == Reservation.STATUT_ANNULEE:
            return Response({'detail': 'La reservation est deja annulee.'}, status=status.HTTP_400_BAD_REQUEST)

        reservation.statut = Reservation.STATUT_ANNULEE
        reservation.save(update_fields=['statut', 'date_modification'])
        data = ReservationReadSerializer(reservation, context={'request': request}).data
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def confirmer(self, request, pk=None):
        reservation = self.get_object()
        user = request.user

        if not (user.is_superuser or user.is_staff or getattr(user, 'role', None) == 'ADMIN'):
            return Response({'detail': 'Action reservee a un administrateur.'}, status=status.HTTP_403_FORBIDDEN)

        reservation.statut = Reservation.STATUT_CONFIRMEE
        reservation.save(update_fields=['statut', 'date_modification'])
        data = ReservationReadSerializer(reservation, context={'request': request}).data
        return Response(data, status=status.HTTP_200_OK)

