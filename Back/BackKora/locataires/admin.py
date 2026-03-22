from django.contrib import admin

from .models import Locataire, Bail


@admin.register(Locataire)
class LocataireAdmin(admin.ModelAdmin):
    list_display = ('nom', 'prenom', 'email', 'telephone', 'actif', 'date_inscription')
    list_filter = ('actif',)
    search_fields = ('nom', 'prenom', 'email')
    readonly_fields = ('date_inscription',)


@admin.register(Bail)
class BailAdmin(admin.ModelAdmin):
    list_display = ('locataire', 'bien', 'date_entree', 'date_sortie', 'loyer_initial', 'actif')
    list_filter = ('actif',)
    search_fields = ('locataire__nom', 'bien__adresse')
    readonly_fields = ('date_creation',)
