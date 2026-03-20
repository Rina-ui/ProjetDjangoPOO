from django.apps import AppConfig


class TonAppConfig(AppConfig):
    name = 'notifications'

    def ready(self):
        import notifications.signals