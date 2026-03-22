from rest_framework import serializers
from .models import Categorie, TypeBien, Bien


class CategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = '__all__'


class TypeBienSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeBien
        fields = '__all__'


class BienSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bien
        fields = '__all__'