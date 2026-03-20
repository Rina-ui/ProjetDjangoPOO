from rest_framework import serializers
from .models import Quittance, DemandeContact


class QuittanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quittance
        fields = '__all__'
        extra_kwargs = {
            'envoyee': {'required': False}
        }


class DemandeContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeContact
        fields = '__all__'
        extra_kwargs = {
            'statut': {'required': False},
            'reponse_admin': {'required': False},
            'date_traitement': {'required': False}
        }