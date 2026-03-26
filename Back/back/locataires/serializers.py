from rest_framework import serializers
from .models import Locataire, Bail, Visitebien, BienSauvegarde


class LocataireSerializer(serializers.ModelSerializer):
    class Meta:
        model = Locataire
        fields = '__all__'


class BailSerializer(serializers.ModelSerializer):
    locataire_nom = serializers.CharField(source='locataire.__str__', read_only=True)
    bien_adresse  = serializers.CharField(source='bien.adresse', read_only=True)
    loyer_actuel  = serializers.DecimalField(source='loyer_initial', max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Bail
        fields = '__all__'

class BienMiniSerializer(serializers.Serializer):
    """Représentation minimaliste d'un bien pour les listes."""
    id           = serializers.IntegerField()
    adresse      = serializers.CharField()
    loyer_hc     = serializers.DecimalField(max_digits=12, decimal_places=2)
    statut       = serializers.CharField()
    description  = serializers.CharField()
    photo        = serializers.SerializerMethodField()
    proprietaire_nom = serializers.SerializerMethodField()

    def get_photo(self, obj):
        request = self.context.get('request')
        photo = obj.photos_bien.order_by('ordre').first()
        if photo and request:
            return request.build_absolute_uri(photo.image.url)
        return None

    def get_proprietaire_nom(self, obj):
        u = obj.proprietaire.utilisateur
        return f"{u.first_name} {u.last_name}".strip() or u.username


class VisiteSerializer(serializers.ModelSerializer):
    bien_detail = serializers.SerializerMethodField()

    class Meta:
        model  = Visitebien
        fields = ['id', 'bien', 'bien_detail', 'date_visite', 'statut', 'note', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_bien_detail(self, obj):
        b   = obj.bien
        req = self.context.get('request')
        photo = None
        if b.photos_bien.exists():
            img   = b.photos_bien.first().image
            photo = req.build_absolute_uri(img.url) if req else img.url
        return {
            'id':               b.id,
            'adresse':          b.adresse,
            'loyer_hc':         str(b.loyer_hc),
            'statut':           b.statut,
            'proprietaire_nom': str(b.proprietaire),
            'photo':            photo,
        }


class BienSauvegardeSerializer(serializers.ModelSerializer):
    bien_detail = serializers.SerializerMethodField()

    class Meta:
        model  = BienSauvegarde
        fields = ['id', 'bien', 'bien_detail', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_bien_detail(self, obj):
        return BienMiniSerializer(obj.bien, context=self.context).data