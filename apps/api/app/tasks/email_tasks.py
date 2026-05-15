import asyncio
from app.worker import celery_app
from app.notifications.smtp_client import send_email
from app.notifications.template_engine import render_template


def _run(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="email.send_assessment_invitation", bind=True, max_retries=3)
def send_assessment_invitation(self, to_email: str, candidate_name: str, job_title: str, invitation_token: str, expires_at: str):
    try:
        html, text = render_template("assessment_invitation", {
            "candidate_name": candidate_name,
            "job_title": job_title,
            "invitation_token": invitation_token,
            "expires_at": expires_at,
        })
        _run(send_email(
            to=to_email,
            subject=f"Convite para avaliação: {job_title}",
            html_body=html,
            text_body=text or None,
        ))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))


@celery_app.task(name="email.send_application_received", bind=True, max_retries=3)
def send_application_received(self, to_email: str, candidate_name: str, job_title: str, company_name: str):
    try:
        html, text = render_template("application_received", {
            "candidate_name": candidate_name,
            "job_title": job_title,
            "company_name": company_name,
        })
        _run(send_email(
            to=to_email,
            subject=f"Candidatura recebida: {job_title}",
            html_body=html,
            text_body=text or None,
        ))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))


@celery_app.task(name="email.send_signature_ready", bind=True, max_retries=3)
def send_signature_ready(self, to_email: str, candidate_name: str, document_type: str, signature_token: str):
    try:
        html, text = render_template("signature_ready", {
            "candidate_name": candidate_name,
            "document_type": document_type,
            "signature_token": signature_token,
        })
        _run(send_email(
            to=to_email,
            subject="Documento pronto para assinatura",
            html_body=html,
            text_body=text or None,
        ))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
