# notifications/emails.py

from django.core.mail import send_mail
from django.conf import settings


def envoyer_email(sujet, message, destinataire):
    """
    Email centralisé propre
    """

    send_mail(
        subject=sujet,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[destinataire],
        fail_silently=False,
    )