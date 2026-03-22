from django.contrib import admin

from .models import Paiement, Depense


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ('bail', 'montant', 'date_paiement', 'methode', 'statut', 'date_creation')
    list_filter = ('statut', 'methode')
    search_fields = ('bail__locataire__nom', 'reference_fedapay')
    readonly_fields = ('date_creation',)


@admin.register(Depense)
class DepenseAdmin(admin.ModelAdmin):
    list_display = ('bien', 'type_depense', 'montant', 'date_depense', 'date_creation')
    list_filter = ('type_depense',)
    search_fields = ('description', 'bien__adresse')
    readonly_fields = ('date_creation',)
