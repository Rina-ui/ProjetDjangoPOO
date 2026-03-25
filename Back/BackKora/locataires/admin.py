from django.contrib import admin

from .models import Locataire, Bail, Reservation


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


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('id', 'bien', 'locataire', 'date_debut', 'date_fin', 'statut', 'date_creation')
    list_filter = ('statut', 'date_creation', 'date_debut', 'date_fin')
    search_fields = ('bien__adresse', 'locataire__nom', 'locataire__prenom', 'locataire__email')
    readonly_fields = ('date_creation', 'date_modification')

