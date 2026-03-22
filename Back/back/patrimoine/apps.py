# patrimoine/apps.py

from django.apps import AppConfig


class PatrimoineConfig(AppConfig):
    """
    Configuration de l'application patrimoine.
    """

    default_auto_field = 'django.db.models.BigAutoField'

    # Nom de l'application
    name = 'patrimoine'

    def ready(self):
        """
        Méthode appelée au démarrage de Django.
        Sert à enregistrer les signaux.
        """