from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import uuid

from app.database import get_db
from app.models.user import User
from app.models.digital_signature import DigitalSignature
from app.digital_signature.signer import create_signature_request, process_signature
from app.digital_signature.hasher import verify_file
from app.core.rbac import require_recruiter
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/signatures", tags=["digital-signatures"])


class SignatureRequestBody(BaseModel):
    application_id: uuid.UUID
    document_type: str
    company_name: str
    candidate_name: str
    candidate_email: str
    job_title: str
    document_content: str


class SignBody(BaseModel):
    signature_data: str


@router.post("", status_code=status.HTTP_201_CREATED)
async def request_signature(
    payload: SignatureRequestBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    result = await create_signature_request(
        db=db,
        application_id=payload.application_id,
        company_id=current_user.company_id,
        document_type=payload.document_type,
        company_name=payload.company_name,
        candidate_name=payload.candidate_name,
        candidate_email=payload.candidate_email,
        job_title=payload.job_title,
        document_content=payload.document_content,
        requested_by_id=current_user.id,
    )
    return result


@router.get("/{token}")
async def get_signature_request(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DigitalSignature).where(DigitalSignature.signature_token == token))
    sig = result.scalar_one_or_none()
    if not sig:
        raise NotFoundError("Signature request not found")
    return {
        "id": sig.id,
        "document_type": sig.document_type,
        "signer_name": sig.signer_name,
        "status": sig.status,
        "token_expires_at": sig.token_expires_at,
        "document_url": sig.document_url,
    }


@router.post("/{token}/sign")
async def sign_document(
    token: str,
    payload: SignBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    return await process_signature(db=db, token=token, signature_data=payload.signature_data, signer_ip=ip, signer_user_agent=ua)


@router.get("/{token}/verify")
async def verify_signature(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(DigitalSignature).where(DigitalSignature.signature_token == token))
    sig = result.scalar_one_or_none()
    if not sig:
        raise NotFoundError("Signature not found")

    is_valid = False
    if sig.signed_document_url and sig.signed_document_hash:
        try:
            is_valid = verify_file(sig.signed_document_url, sig.signed_document_hash)
        except FileNotFoundError:
            is_valid = False

    return {
        "status": sig.status,
        "signer_name": sig.signer_name,
        "signer_email": sig.signer_email,
        "signed_at": sig.signed_at,
        "document_hash": sig.document_hash,
        "signed_document_hash": sig.signed_document_hash,
        "hash_valid": is_valid,
    }
