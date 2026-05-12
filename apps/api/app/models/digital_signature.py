from datetime import datetime
from sqlalchemy import String, Text, Boolean, Enum as SAEnum, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class DigitalSignature(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "digital_signatures"

    application_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    document_type: Mapped[str] = mapped_column(
        SAEnum(
            "offer_letter", "nda", "assessment_consent", "employment_contract",
            name="document_type",
        ),
        nullable=False,
    )
    document_url: Mapped[str] = mapped_column(Text, nullable=False)
    document_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    hash_algorithm: Mapped[str] = mapped_column(String(20), default="sha256", nullable=False)
    signer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    signer_email: Mapped[str] = mapped_column(String(255), nullable=False)
    signer_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    signer_user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum("pending", "signed", "rejected", "expired", name="signature_status"),
        default="pending",
        nullable=False,
    )
    signature_token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    signed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    token_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    signature_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    signed_document_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    signed_document_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)

    application = relationship("Application")


class AuditLog(Base, UUIDMixin):
    __tablename__ = "audit_logs"

    company_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
