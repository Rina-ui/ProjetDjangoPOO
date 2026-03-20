from rest_framework import serializers
from .models import Utilisateur, Proprietaire, AuditLog


from rest_framework import serializers
from .models import Utilisateur, Proprietaire, AuditLog


class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = '__all__'
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        user = Utilisateur.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            role=validated_data.get('role', 'LOCATAIRE')
        )

        if user.role == 'PROPRIETAIRE':
            Proprietaire.objects.create(
                utilisateur=user,
                nom=user.username,
                prenom="",
                email=user.email,
                telephone=""
            )

        return user

class ProprietaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proprietaire
        fields = '__all__'


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'