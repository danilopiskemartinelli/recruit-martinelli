import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession


async def write_audit(
    db: AsyncSession,
    entity_type: str,
    entity_id: uuid.UUID,
    action: str,
    company_id: uuid.UUID | None = None,
    user_id: uuid.UUID | None = None,
    details: dict | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> None:
    from app.models.digital_signature import AuditLog

    log = AuditLog(
        company_id=company_id,
        user_id=user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        details=details or {},
        ip_address=ip_address,
        user_agent=user_agent,
        occurred_at=datetime.now(timezone.utc),
    )
    db.add(log)
    await db.flush()
