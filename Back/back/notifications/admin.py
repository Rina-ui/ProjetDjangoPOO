from django.contrib import admin

from .models import Quittance, DemandeContact


@admin.register(Quittance)
class QuittanceAdmin(admin.ModelAdmin):
    list_display = ('paiement', 'date_generation', 'envoyee')
    list_filter = ('envoyee',)
    readonly_fields = ('date_generation',)


@admin.register(DemandeContact)
class DemandeContactAdmin(admin.ModelAdmin):
    list_display = ('sujet', 'proprietaire', 'type_demande', 'statut', 'date_creation', 'date_traitement')
    list_filter = ('statut', 'type_demande')
    search_fields = ('sujet', 'message')
    readonly_fields = ('date_creation', 'date_traitement')
