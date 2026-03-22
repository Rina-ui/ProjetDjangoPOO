from rest_framework import serializers
from .models import Paiement, Depense


class PaiementSerializer(serializers.ModelSerializer):
    bail_info = serializers.SerializerMethodField()

    class Meta:
        model = Paiement
        fields = '__all__'

    def get_bail_info(self, obj):
        return {
            'locataire': str(obj.bail.locataire),
            'bien':      obj.bail.bien.adresse,
        }


class DepenseSerializer(serializers.ModelSerializer):
    bien_adresse = serializers.CharField(source='bien.adresse', read_only=True)

    class Meta:
        model = Depense
        fields = '__all__'
