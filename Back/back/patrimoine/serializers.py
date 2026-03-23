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


class BienSerializer(serializers.ModelSerializer):
    loyer_total      = serializers.SerializerMethodField()
    categorie_nom    = serializers.CharField(source='categorie.nom', read_only=True)
    type_bien_nom    = serializers.CharField(source='type_bien.nom', read_only=True)
    proprietaire_nom = serializers.SerializerMethodField()

    class Meta:
        model = Bien
        fields = '__all__'

    def get_loyer_total(self, obj):
        return obj.calculer_loyer_total()

    def get_proprietaire_nom(self, obj):
        return str(obj.proprietaire)

class PhotoBienSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhotoBien
        fields = '__all__'


class BienSerializer(serializers.ModelSerializer):
    loyer_total      = serializers.SerializerMethodField()
    categorie_nom    = serializers.CharField(source='categorie.nom', read_only=True)
    type_bien_nom    = serializers.CharField(source='type_bien.nom', read_only=True)
    proprietaire_nom = serializers.SerializerMethodField()
    photos_list      = PhotoBienSerializer(source='photos_bien', many=True, read_only=True)
    modele_3d_url    = serializers.SerializerMethodField()

    class Meta:
        model  = Bien
        fields = '__all__'
        extra_kwargs = {
            'proprietaire': {'required': False}  # ← AJOUTE
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
        return None