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


class ProprietaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proprietaire
        fields = '__all__'


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'