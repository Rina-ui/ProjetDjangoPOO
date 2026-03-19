from django.apps import AppConfig


class ComptabiliteConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'comptabilite'

    def ready(self):
        import comptabilite.signals
