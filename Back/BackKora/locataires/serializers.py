from rest_framework import serializers
from .models import Locataire, Bail


class LocataireSerializer(serializers.ModelSerializer):
    class Meta:
        model = Locataire
        fields = '__all__'


class BailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bail
        fields = '__all__'