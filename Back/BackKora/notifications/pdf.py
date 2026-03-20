# notifications/pdf.py

from io import BytesIO
from django.core.files import File
from reportlab.pdfgen import canvas
from django.utils import timezone


def generer_pdf_quittance(quittance):
    """
    Génère un PDF et l'attache à la quittance
    """

    buffer = BytesIO()
    p = canvas.Canvas(buffer)

    p.drawString(100, 800, "QUITTANCE DE LOYER")
    p.drawString(100, 780, f"Paiement ID: {quittance.paiement.id}")
    p.drawString(100, 760, f"Date: {timezone.now()}")

    p.showPage()
    p.save()

    buffer.seek(0)

    return File(buffer, f"quittance_{quittance.id}.pdf")