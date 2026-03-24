from rest_framework import serializers
from .models import Utilisateur


class InscriptionSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Utilisateur
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'password']

    def create(self, validated_data):
        return Utilisateur.objects.create_user(**validated_data)


class ConnexionSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    otp_code = serializers.CharField(required=False, allow_blank=True, default='')


class ProfilSerializer(serializers.ModelSerializer):
    has_2fa = serializers.SerializerMethodField()

    class Meta:
        model = Utilisateur
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'has_2fa']
        read_only_fields = ['id', 'username', 'role']

    def get_has_2fa(self, obj):
        return bool(obj.otp_secret)


class Activer2FASerializer(serializers.Serializer):
    otp_code = serializers.CharField(min_length=6, max_length=6)


class Verifier2FASerializer(serializers.Serializer):
    otp_code = serializers.CharField(min_length=6, max_length=6)
