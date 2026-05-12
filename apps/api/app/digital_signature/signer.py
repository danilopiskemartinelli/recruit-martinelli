import secrets
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.digital_signature.pdf_generator import generate_document_pdf, embed_signature_in_pdf
from app.digital_signature.hasher import sha256_file
from app.digital_signature.audit_writer import write_audit
from app.config import settings


async def create_signature_request(
    db: AsyncSession,
    application_id: uuid.UUID,
    company_id: uuid.UUID,
    document_type: str,
    company_name: str,
    candidate_name: str,
    candidate_email: str,
    job_title: str,
    document_content: str,
    requested_by_id: uuid.UUID,
) -> dict:
    from app.models.digital_signature import DigitalSignature

    token = secrets.token_urlsafe(32)
    doc_path = f"{settings.local_upload_dir}/signatures/{application_id}_{document_type}.pdf"

    generate_document_pdf(
        document_type=document_type,
        company_name=company_name,
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        job_title=job_title,
        content_html=document_content,
        output_path=doc_path,
    )

    doc_hash = sha256_file(doc_path)

    sig = DigitalSignature(
        application_id=application_id,
        company_id=company_id,
        document_type=document_type,
        document_url=doc_path,
        document_hash=doc_hash,
        signer_name=candidate_name,
        signer_email=candidate_email,
        signature_token=token,
        token_expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        status="pending",
    )
    db.add(sig)
    await db.flush()

    await write_audit(
        db=db,
        entity_type="digital_signature",
        entity_id=sig.id,
        action="created",
        company_id=company_id,
        user_id=requested_by_id,
        details={"document_type": document_type, "hash": doc_hash},
    )

    return {"signature_id": sig.id, "token": token, "document_hash": doc_hash}


async def process_signature(
    db: AsyncSession,
    token: str,
    signature_data: str,
    signer_ip: str,
    signer_user_agent: str,
) -> dict:
    from sqlalchemy import select
    from app.models.digital_signature import DigitalSignature
    from app.core.exceptions import NotFoundError, UnprocessableError

    result = await db.execute(
        select(DigitalSignature).where(DigitalSignature.signature_token == token)
    )
    sig = result.scalar_one_or_none()

    if not sig:
        raise NotFoundError("Signature request not found")

    now = datetime.now(timezone.utc)
    if sig.token_expires_at < now:
        sig.status = "expired"
        raise UnprocessableError("Signature token has expired")

    if sig.status != "pending":
        raise UnprocessableError(f"Signature is already {sig.status}")

    signed_path = sig.document_url.replace(".pdf", "_signed.pdf")
    embed_signature_in_pdf(
        original_path=sig.document_url,
        signature_data=signature_data,
        signer_name=sig.signer_name,
        signed_at=now,
        output_path=signed_path,
    )

    signed_hash = sha256_file(signed_path)

    sig.status = "signed"
    sig.signed_at = now
    sig.signer_ip = signer_ip
    sig.signer_user_agent = signer_user_agent
    sig.signature_data = signature_data
    sig.signed_document_url = signed_path
    sig.signed_document_hash = signed_hash

    await write_audit(
        db=db,
        entity_type="digital_signature",
        entity_id=sig.id,
        action="signed",
        company_id=sig.company_id,
        details={"signed_hash": signed_hash, "ip": signer_ip},
    )

    return {"signed": True, "signed_document_hash": signed_hash}
