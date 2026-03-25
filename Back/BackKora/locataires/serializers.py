from rest_framework import serializers
from .models import Locataire, Bail, Reservation


class LocataireSerializer(serializers.ModelSerializer):
    class Meta:
        model = Locataire
        fields = '__all__'


class BailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bail
        fields = '__all__'


class ReservationSerializer(serializers.ModelSerializer):
    locataire = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Reservation
        fields = '__all__'
        read_only_fields = ('locataire', 'statut', 'date_creation', 'date_modification')

    def validate(self, attrs):
        date_debut = attrs.get('date_debut', getattr(self.instance, 'date_debut', None))
        date_fin = attrs.get('date_fin', getattr(self.instance, 'date_fin', None))
        bien = attrs.get('bien', getattr(self.instance, 'bien', None))

        if date_debut and date_fin and date_fin < date_debut:
            raise serializers.ValidationError({'date_fin': 'La date de fin doit etre superieure ou egale a la date de debut.'})

        if bien and bien.statut == 'LOUE':
            raise serializers.ValidationError({'bien': 'Ce bien est deja loue et ne peut pas etre reserve.'})

        if bien and date_debut and date_fin:
            conflits = Reservation.objects.filter(
                bien=bien,
                statut__in=[Reservation.STATUT_EN_ATTENTE, Reservation.STATUT_CONFIRMEE],
                date_debut__lte=date_fin,
                date_fin__gte=date_debut,
            )
            if self.instance:
                conflits = conflits.exclude(pk=self.instance.pk)
            if conflits.exists():
                raise serializers.ValidationError({'non_field_errors': 'Une reservation existe deja sur cette periode pour ce bien.'})

        return attrs


class ReservationReadSerializer(serializers.ModelSerializer):
    bien_info = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = '__all__'

    def get_bien_info(self, obj):
        return {
            'id': obj.bien_id,
            'adresse': obj.bien.adresse,
            'statut': obj.bien.statut,
        }
