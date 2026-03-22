from django.contrib import admin

from .models import Categorie, TypeBien, Bien


@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    list_display = ('nom', 'description', 'date_creation')
    search_fields = ('nom',)
    readonly_fields = ('date_creation',)


@admin.register(TypeBien)
class TypeBienAdmin(admin.ModelAdmin):
    list_display = ('nom', 'categorie', 'date_creation')
    list_filter = ('categorie',)
    search_fields = ('nom',)
    readonly_fields = ('date_creation',)


@admin.register(Bien)
class BienAdmin(admin.ModelAdmin):
    list_display = ('adresse', 'proprietaire', 'categorie', 'statut', 'en_ligne', 'loyer_hc', 'date_creation')
    list_filter = ('statut', 'en_ligne', 'categorie')
    search_fields = ('adresse', 'description')
    readonly_fields = ('date_creation', 'date_modification')
