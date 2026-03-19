from django.apps import AppConfig


class LocatairesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'locataires'

    def ready(self):
        import locataires.signals
