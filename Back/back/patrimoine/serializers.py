from rest_framework import serializers
from .models import Bien, Categorie, TypeBien, PhotoBien


class CategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = '__all__'


class TypeBienSerializer(serializers.ModelSerializer):
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)

    class Meta:
        model = TypeBien
        fields = '__all__'


class PhotoBienSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = PhotoBien
        fields = ['id', 'image', 'legende', 'ordre']

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class BienSerializer(serializers.ModelSerializer):
    loyer_total      = serializers.SerializerMethodField()
    categorie_nom    = serializers.CharField(source='categorie.nom', read_only=True)
    type_bien_nom    = serializers.CharField(source='type_bien.nom', read_only=True)
    proprietaire_nom = serializers.SerializerMethodField()
    photos_list      = PhotoBienSerializer(source='photos_bien', many=True, read_only=True)
    modele_3d_url    = serializers.SerializerMethodField()

    class Meta:
        model  = Bien
        fields = [
            'id', 'adresse', 'description',
            'loyer_hc', 'charges', 'loyer_total',
            'statut', 'en_ligne', 'motif_rejet',
            'categorie', 'categorie_nom',
            'type_bien', 'type_bien_nom',
            'proprietaire', 'proprietaire_nom',
            'equipements', 'latitude', 'longitude',
            'modele_3d', 'modele_3d_url',
            'photos_list',
            'taux_commission',
            'bail_actif',
            'visite_en_cours',
            'date_creation', 'date_modification',
        ]
        extra_kwargs = {
            'proprietaire': {'required': False},
            'modele_3d':    {'required': False},
        }

    def get_loyer_total(self, obj):
        return obj.calculer_loyer_total()

    def get_proprietaire_nom(self, obj):
        return str(obj.proprietaire)

    def get_modele_3d_url(self, obj):
        if obj.modele_3d:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.modele_3d.url)
            return obj.modele_3d.url
        return None