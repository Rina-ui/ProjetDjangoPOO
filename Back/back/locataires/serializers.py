from rest_framework import serializers
from .models import Locataire, Bail


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
