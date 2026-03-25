from rest_framework import serializers
from .models import Categorie, TypeBien, Bien, PhotoBien


class CategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = '__all__'


class TypeBienSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeBien
        fields = '__all__'


class PhotoBienSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PhotoBien
        fields = ["id", "image", "image_url", "date_creation"]

    def get_image_url(self, obj):
        if not obj.image:
            return None

        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url


class BienSerializer(serializers.ModelSerializer):
    photos_files = PhotoBienSerializer(many=True, read_only=True)

    class Meta:
        model = Bien
        fields = '__all__'
