import re

from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Utilisateur, Proprietaire, AuditLog


class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'date_creation']
        read_only_fields = ['id', 'date_creation']


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = Utilisateur
        fields = ['username', 'email', 'first_name', 'last_name', 'role', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Les mots de passe ne correspondent pas.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = Utilisateur(**validated_data)
        user.set_password(password)
        user.save()
        # Crée le profil selon le rôle
        if user.role == 'PROPRIETAIRE':
            Proprietaire.objects.create(
                utilisateur=user,
                nom=user.last_name,
                prenom=user.first_name,
                email=user.email,
                telephone='',
            )
        return user


class KoraTokenSerializer(TokenObtainPairSerializer):
    """JWT enrichi avec le rôle et le nom complet."""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role']      = user.role
        token['username']  = user.username
        token['email']     = user.email
        token['full_name'] = f"{user.first_name} {user.last_name}".strip() or user.username
        return token


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get('request'),
            username=attrs.get('username'),
            password=attrs.get('password'),
        )
        if not user or not user.is_active:
            raise serializers.ValidationError('Identifiants invalides.')
        attrs['user'] = user
        return attrs


class TwoFALoginSerializer(serializers.Serializer):
    challenge_token = serializers.CharField(required=False, allow_blank=False)
    username = serializers.CharField(required=False, allow_blank=False)
    code = serializers.CharField(required=False, allow_blank=False)
    otp = serializers.CharField(required=False, allow_blank=False)

    def validate(self, attrs):
        code = attrs.get('code') or attrs.get('otp')
        if not code:
            raise serializers.ValidationError('Le champ code (ou otp) est obligatoire.')
        if not re.fullmatch(r'\d{6}', code):
            raise serializers.ValidationError('Le code OTP doit contenir exactement 6 chiffres.')

        if not attrs.get('challenge_token') and not attrs.get('username'):
            raise serializers.ValidationError('challenge_token ou username est obligatoire.')

        attrs['code'] = code
        return attrs


class TwoFASetupResponseSerializer(serializers.Serializer):
    qr_code = serializers.CharField()
    secret = serializers.CharField()
    qr = serializers.CharField()
    otpauth_url = serializers.CharField()
    base32 = serializers.CharField()


class TwoFAVerifySerializer(serializers.Serializer):
    code = serializers.CharField(required=False, allow_blank=False)
    otp = serializers.CharField(required=False, allow_blank=False)

    def validate(self, attrs):
        code = attrs.get('code') or attrs.get('otp')
        if not code:
            raise serializers.ValidationError('Le champ code (ou otp) est obligatoire.')
        if not re.fullmatch(r'\d{6}', code):
            raise serializers.ValidationError('Le code OTP doit contenir exactement 6 chiffres.')
        attrs['code'] = code
        return attrs


class TwoFADisableSerializer(serializers.Serializer):
    code = serializers.CharField(required=False, allow_blank=False)
    otp = serializers.CharField(required=False, allow_blank=False)
    password = serializers.CharField(required=False, allow_blank=False, write_only=True)

    def validate(self, attrs):
        code = attrs.get('code') or attrs.get('otp')
        password = attrs.get('password')

        if not code and not password:
            raise serializers.ValidationError('Fournissez un code OTP ou le mot de passe.')
        if code and not re.fullmatch(r'\d{6}', code):
            raise serializers.ValidationError('Le code OTP doit contenir exactement 6 chiffres.')

        attrs['code'] = code
        return attrs


class ProprietaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proprietaire
        fields = '__all__'


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'
