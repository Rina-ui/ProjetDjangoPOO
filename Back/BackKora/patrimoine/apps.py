# patrimoine/apps.py

from django.apps import AppConfig


class PatrimoineConfig(AppConfig):
    """
    Configuration de l'application patrimoine.
    """

    default_auto_field = 'django.db.models.BigAutoField'  # 🔥 recommandé (id auto moderne)
    name = 'patrimoine'  # nom de l'app

    def ready(self):
        """
        Méthode appelée au démarrage de Django.
        Sert à enregistrer des signaux ou initialisations.
        """
        import patrimoine.signals  # 🔥 pour activer les signaux