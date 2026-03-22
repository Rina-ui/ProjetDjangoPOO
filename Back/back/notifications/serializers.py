from rest_framework import serializers
from .models import Quittance, DemandeContact


class QuittanceSerializer(serializers.ModelSerializer):
    paiement_info = serializers.SerializerMethodField()

    class Meta:
        model = Quittance
        fields = '__all__'

    def get_paiement_info(self, obj):
        return {
            'montant':   obj.paiement.montant,
            'locataire': str(obj.paiement.bail.locataire),
            'bien':      obj.paiement.bail.bien.adresse,
        }


class DemandeContactSerializer(serializers.ModelSerializer):
    proprietaire_nom = serializers.CharField(source='proprietaire.__str__', read_only=True)

    class Meta:
        model = DemandeContact
        fields = '__all__'
