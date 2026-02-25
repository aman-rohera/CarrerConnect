from django.apps import AppConfig


class SoulsConfig(AppConfig):
    name = 'souls'

def ready(self):
        import souls.signals
