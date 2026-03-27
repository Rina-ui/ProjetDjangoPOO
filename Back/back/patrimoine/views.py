from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from utilisateurs.models import Proprietaire
from .models import Bien, Categorie, TypeBien, PhotoBien
from .serializers import BienSerializer, CategorieSerializer, TypeBienSerializer, PhotoBienSerializer


class BienViewSet(viewsets.ModelViewSet):
    queryset         = Bien.objects.all()
    serializer_class = BienSerializer
    parser_classes   = [MultiPartParser, JSONParser]
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['statut', 'categorie', 'proprietaire', 'en_ligne']
    search_fields    = ['adresse', 'description']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'role', '') == 'ADMIN':
            return Bien.objects.all()
        if getattr(user, 'role', '') == 'PROPRIETAIRE':
            return Bien.objects.filter(proprietaire__utilisateur=user)
        return Bien.objects.filter(en_ligne=True)

    def get_serializer_context(self):
        return {'request': self.request}

    def create(self, request, *args, **kwargs):
        try:
            proprietaire = Proprietaire.objects.get(utilisateur=request.user)
        except Proprietaire.DoesNotExist:
            return Response({'error': 'Profil propriétaire introuvable'}, status=400)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        bien = serializer.save(proprietaire=proprietaire)
        return Response(
            {'success': True, 'data': BienSerializer(bien, context={'request': request}).data},
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def changer_statut(self, request, pk=None):
        bien = self.get_object()
        nouveau_statut = request.data.get('statut')
        if not nouveau_statut or nouveau_statut not in dict(Bien.STATUT_CHOICES):
            return Response({'error': 'Statut invalide'}, status=400)
        bien.changer_statut(nouveau_statut)
        return Response({'success': True, 'message': 'Statut mis à jour'})

    @action(detail=True, methods=['post'])
    def mettre_en_ligne(self, request, pk=None):
        bien = self.get_object()
        bien.mettre_en_ligne()
        return Response({'success': True, 'message': 'Bien mis en ligne'})

    @action(detail=True, methods=['get'])
    def loyer_total(self, request, pk=None):
        bien = self.get_object()
        return Response({'loyer_total': bien.calculer_loyer_total()})

    @action(detail=True, methods=['post'])
    def upload_photo(self, request, pk=None):
        bien  = self.get_object()
        image = request.FILES.get('image')
        if not image:
            return Response({'error': 'No image provided'}, status=400)
        photo = PhotoBien.objects.create(
            bien=bien,
            image=image,
            legende=request.data.get('legende', ''),
            ordre=request.data.get('ordre', 0)
        )
        return Response(PhotoBienSerializer(photo).data, status=201)

    @action(detail=True, methods=['post'])
    def upload_3d(self, request, pk=None):
        bien    = self.get_object()
        fichier = request.FILES.get('modele_3d')
        if not fichier:
            return Response({'error': 'No file provided'}, status=400)
        bien.modele_3d = fichier
        bien.save()
        return Response({
            'success': True,
            'url': request.build_absolute_uri(bien.modele_3d.url)
        })

    @action(detail=True, methods=['post'])
    def demander_validation(self, request, pk=None):
        """Propriétaire soumet son bien pour validation."""
        bien = self.get_object()
        if bien.statut not in ['VACANT', 'EN_VENTE', 'REJETE']:
            return Response({'error': 'Ce bien ne peut pas être soumis'}, status=400)
        bien.statut = 'EN_ATTENTE_VALIDATION'
        bien.motif_rejet = ''
        bien.save()
        return Response({'success': True, 'message': 'Bien soumis pour validation'})

    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        """Admin valide un bien → il devient visible en ligne."""
        bien = self.get_object()
        if bien.statut != 'EN_ATTENTE_VALIDATION':
            return Response({'error': 'Ce bien n\'est pas en attente de validation'}, status=400)
        bien.statut   = 'VACANT'
        bien.en_ligne = True
        bien.motif_rejet = ''
        bien.save()
        return Response({'success': True, 'message': 'Bien validé et mis en ligne'})

    @action(detail=True, methods=['post'])
    def rejeter(self, request, pk=None):
        """Admin rejette un bien avec un motif."""
        bien = self.get_object()
        motif = request.data.get('motif', '')
        if not motif:
            return Response({'error': 'Motif obligatoire'}, status=400)
        bien.statut      = 'REJETE'
        bien.en_ligne    = False
        bien.motif_rejet = motif
        bien.save()
        return Response({'success': True, 'message': 'Bien rejeté'})

    @action(detail=True, methods=['post'])
    def activer_bail(self, request, pk=None):
        """Admin active le bail → débloque le paiement côté client."""
        bien = self.get_object()
        bien.bail_actif = True
        bien.statut     = 'LOUE'
        bien.save()
        return Response({'success': True, 'message': 'Bail activé'})

    @action(detail=True, methods=['post'])
    def desactiver_bail(self, request, pk=None):
        """Admin désactive le bail (fin de contrat)."""
        bien = self.get_object()
        bien.bail_actif      = False
        bien.visite_en_cours = False
        bien.statut          = 'VACANT'
        bien.save()
        return Response({'success': True, 'message': 'Bail désactivé'})




class CategorieViewSet(viewsets.ModelViewSet):
    queryset         = Categorie.objects.all()
    serializer_class = CategorieSerializer


class TypeBienViewSet(viewsets.ModelViewSet):
    queryset         = TypeBien.objects.all()
    serializer_class = TypeBienSerializer