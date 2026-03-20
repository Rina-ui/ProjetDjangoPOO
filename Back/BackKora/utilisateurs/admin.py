from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Utilisateur, Proprietaire, AuditLog


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_active', 'date_creation')
    list_filter = ('role', 'is_active')
    search_fields = ('username', 'email')
    fieldsets = UserAdmin.fieldsets + (
        ('Informations supplémentaires', {'fields': ('role',)}),
    )


@admin.register(Proprietaire)
class ProprietaireAdmin(admin.ModelAdmin):
    list_display = ('nom', 'prenom', 'email', 'telephone', 'actif', 'date_inscription')
    list_filter = ('actif',)
    search_fields = ('nom', 'prenom', 'email')
    readonly_fields = ('date_inscription',)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('utilisateur', 'action', 'modele', 'objet_id', 'date_action')
    list_filter = ('action', 'modele')
    search_fields = ('action', 'modele')
    readonly_fields = ('utilisateur', 'action', 'modele', 'objet_id', 'ancien_valeur', 'nouvelle_valeur', 'date_action')
