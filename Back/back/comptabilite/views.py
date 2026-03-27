import logging
from decimal import Decimal, InvalidOperation

from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from locataires.models import Bail
from .models import Paiement, Depense
from .serializers import PaiementSerializer, DepenseSerializer

logger = logging.getLogger(__name__)


class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.all()
    serializer_class = PaiementSerializer

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        paiement = self.get_object()
        paiement.valider()
        return Response({'success': True, 'message': 'Paiement validé'})

    @action(detail=True, methods=['post'])
    def annuler(self, request, pk=None):
        paiement = self.get_object()
        paiement.annuler()
        return Response({'success': True, 'message': 'Paiement annulé'})


class DepenseViewSet(viewsets.ModelViewSet):
    queryset = Depense.objects.all()
    serializer_class = DepenseSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enregistrer_paiement(request):
    """
    Endpoint appelé par le frontend après un paiement FedaPay réussi.
    Crée un Paiement en base → le signal génère automatiquement
    la quittance PDF et l'envoie par email.
    """
    data = request.data

    # --- Montant (obligatoire) ---
    try:
        montant = Decimal(str(data.get('montant', 0)))
        if montant <= 0:
            return Response({'error': 'Montant invalide'}, status=status.HTTP_400_BAD_REQUEST)
    except (InvalidOperation, TypeError, ValueError):
        return Response({'error': 'Montant invalide'}, status=status.HTTP_400_BAD_REQUEST)

    # --- Trouver le bail ---
    bien_id = data.get('bien_id')
    bail = None

    if bien_id:
        bail = Bail.objects.filter(bien_id=bien_id, actif=True).first()

    if not bail:
        # Fallback : chercher un bail actif lié au locataire connecté
        bail = Bail.objects.filter(
            locataire__utilisateur=request.user, actif=True
        ).first()

    if not bail:
        return Response(
            {'error': 'Aucun bail actif trouvé pour cet utilisateur.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    reference = str(data.get('reference', ''))[:255]

    paiement = Paiement.objects.create(
        bail=bail,
        montant=montant,
        date_paiement=timezone.now().date(),
        methode='FEDAPAY',
        reference_fedapay=reference,
        statut='VALIDE',
    )

    logger.info(
        "Paiement FedaPay #%s créé (ref=%s, bail=%s, montant=%s)",
        paiement.pk, reference, bail.pk, montant,
    )

    return Response(
        {
            'success': True,
            'paiement_id': paiement.pk,
            'message': 'Paiement enregistré. Quittance générée et envoyée par email.',
        },
        status=status.HTTP_201_CREATED,
    )
