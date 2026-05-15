import uuid as _uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class PsychInvite(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "psych_invites"

    token: Mapped[str] = mapped_column(String(36), unique=True, index=True, nullable=False,
                                        default=lambda: str(_uuid.uuid4()))
    application_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    application = relationship("Application", back_populates="psych_invite")
    response: Mapped["PsychResponse | None"] = relationship("PsychResponse", back_populates="invite", uselist=False)


class PsychResponse(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "psych_responses"

    invite_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("psych_invites.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    big_five_answers: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    stress_answers: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    depression_answers: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    motivators_answers: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    disc_answers: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    qa_answers: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    scores: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    invite: Mapped["PsychInvite"] = relationship("PsychInvite", back_populates="response")
