import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from app.config import settings


def generate_document_pdf(
    document_type: str,
    company_name: str,
    candidate_name: str,
    candidate_email: str,
    job_title: str,
    content_html: str,
    output_path: str,
) -> str:
    """Generate a PDF document for signing. Returns the output path."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=2.5 * cm,
        leftMargin=2.5 * cm,
        topMargin=2.5 * cm,
        bottomMargin=2.5 * cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title", parent=styles["Title"], fontSize=16, spaceAfter=20, alignment=TA_CENTER)
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=11, spaceAfter=10, leading=16)
    meta_style = ParagraphStyle("Meta", parent=styles["Normal"], fontSize=9, textColor=colors.grey)

    type_labels = {
        "offer_letter": "Carta de Oferta",
        "nda": "Acordo de Confidencialidade (NDA)",
        "assessment_consent": "Termo de Consentimento para Avaliação",
        "employment_contract": "Contrato de Trabalho",
    }

    story = [
        Paragraph(company_name, styles["Heading2"]),
        Spacer(1, 0.3 * cm),
        Paragraph(type_labels.get(document_type, document_type), title_style),
        HRFlowable(width="100%", thickness=1, color=colors.lightgrey),
        Spacer(1, 0.5 * cm),
        Paragraph(f"<b>Candidato:</b> {candidate_name}", body_style),
        Paragraph(f"<b>E-mail:</b> {candidate_email}", body_style),
        Paragraph(f"<b>Vaga:</b> {job_title}", body_style),
        Paragraph(f"<b>Data:</b> {datetime.utcnow().strftime('%d/%m/%Y')}", body_style),
        Spacer(1, 0.8 * cm),
        HRFlowable(width="100%", thickness=1, color=colors.lightgrey),
        Spacer(1, 0.5 * cm),
        Paragraph(content_html, body_style),
        Spacer(1, 2 * cm),
        Paragraph("_________________________________", body_style),
        Paragraph("Assinatura do Candidato", meta_style),
        Spacer(1, 0.3 * cm),
        Paragraph(f"Documento gerado em: {datetime.utcnow().isoformat()} UTC", meta_style),
    ]

    doc.build(story)
    return output_path


def embed_signature_in_pdf(
    original_path: str,
    signature_data: str,
    signer_name: str,
    signed_at: datetime,
    output_path: str,
) -> str:
    """Create a new PDF with the signature embedded as an annotation page."""
    from reportlab.platypus import Image
    import base64
    import tempfile

    styles = getSampleStyleSheet()
    meta_style = ParagraphStyle("Meta", parent=styles["Normal"], fontSize=9, textColor=colors.grey)
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=11)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    sig_doc = SimpleDocTemplate(output_path, pagesize=A4)
    story = [
        Paragraph("CERTIFICADO DE ASSINATURA DIGITAL", styles["Title"]),
        Spacer(1, 0.5 * cm),
        Paragraph(f"<b>Assinado por:</b> {signer_name}", body_style),
        Paragraph(f"<b>Data/Hora:</b> {signed_at.strftime('%d/%m/%Y %H:%M:%S')} UTC", body_style),
        Spacer(1, 1 * cm),
        Paragraph("Assinatura:", body_style),
    ]

    if signature_data and signature_data.startswith("data:image"):
        img_data = base64.b64decode(signature_data.split(",")[1])
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(img_data)
            tmp_path = tmp.name
        story.append(Image(tmp_path, width=8 * cm, height=3 * cm))
        os.unlink(tmp_path)

    sig_doc.build(story)
    return output_path
