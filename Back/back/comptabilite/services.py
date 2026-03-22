from decimal import Decimal
from django.db.models import Sum

from comptabilite.models import Paiement, Depense


class BalanceComptable:
    """Classe utilitaire pour les calculs comptables."""

    @staticmethod
    def calculer_revenus(bien, date_debut, date_fin):
        """Somme des paiements validés sur la période pour un bien."""
        return (
            Paiement.objects.filter(
                bail__bien=bien,
                statut='VALIDE',
                date_paiement__gte=date_debut,
                date_paiement__lte=date_fin,
            ).aggregate(total=Sum('montant'))['total']
            or Decimal('0')
        )

    @staticmethod
    def calculer_depenses(bien, date_debut, date_fin):
        """Somme des dépenses sur la période pour un bien."""
        return (
            Depense.objects.filter(
                bien=bien,
                date_depense__gte=date_debut,
                date_depense__lte=date_fin,
            ).aggregate(total=Sum('montant'))['total']
            or Decimal('0')
        )

    @staticmethod
    def calculer_benefice_net(bien, date_debut, date_fin):
        """Bénéfice net = Revenus - Dépenses."""
        revenus = BalanceComptable.calculer_revenus(bien, date_debut, date_fin)
        depenses = BalanceComptable.calculer_depenses(bien, date_debut, date_fin)
        return revenus - depenses

    @staticmethod
    def exporter_donnees_fiscales(proprietaire, date_debut, date_fin):
        """Retourne un dict avec détails par bien + totaux pour un propriétaire."""
        biens = proprietaire.biens.all()
        details = []
        total_revenus = Decimal('0')
        total_depenses = Decimal('0')

        for bien in biens:
            revenus = BalanceComptable.calculer_revenus(bien, date_debut, date_fin)
            depenses = BalanceComptable.calculer_depenses(bien, date_debut, date_fin)
            details.append({
                'bien': str(bien),
                'revenus': revenus,
                'depenses': depenses,
                'benefice_net': revenus - depenses,
            })
            total_revenus += revenus
            total_depenses += depenses

        return {
            'proprietaire': str(proprietaire),
            'periode': f"{date_debut} - {date_fin}",
            'details': details,
            'total_revenus': total_revenus,
            'total_depenses': total_depenses,
            'benefice_net_total': total_revenus - total_depenses,
        }
