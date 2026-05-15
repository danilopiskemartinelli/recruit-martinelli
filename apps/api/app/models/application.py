from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Text, Boolean, Enum as SAEnum, ForeignKey, SmallInteger, Numeric, DateTime, Integer, UniqueConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class Application(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("job_id", "candidate_id"),)

    job_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    candidate_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True
    )
    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        SAEnum(
            "submitted", "screening", "assessment", "interview",
            "offer", "hired", "rejected", "withdrawn",
            name="application_status",
        ),
        default="submitted",
        nullable=False,
    )
    current_stage_index: Mapped[int] = mapped_column(SmallInteger, default=0, nullable=False)
    cover_letter: Mapped[str | None] = mapped_column(Text, nullable=True)
    recruiter_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    referred_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    applied_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    job = relationship("Job", back_populates="applications")
    candidate = relationship("Candidate", back_populates="applications")
    application_assessments = relationship("ApplicationAssessment", back_populates="application")
    psych_invite = relationship("PsychInvite", back_populates="application", uselist=False)


class ApplicationAssessment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "application_assessments"

    application_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    assessment_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        SAEnum(
            "pending", "invited", "in_progress", "completed", "expired", "skipped",
            name="app_assessment_status",
        ),
        default="pending",
        nullable=False,
    )
    invitation_token: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    invitation_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    passed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    time_taken_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)

    application = relationship("Application", back_populates="application_assessments")
    assessment = relationship("Assessment")
    answers = relationship("AssessmentAnswer", back_populates="application_assessment")


class AssessmentAnswer(Base, UUIDMixin):
    __tablename__ = "assessment_answers"

    application_assessment_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("application_assessments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False
    )
    answer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    selected_options: Mapped[list | None] = mapped_column(JSON, nullable=True)
    answer_boolean: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    rating_value: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    file_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_correct: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    points_earned: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    ai_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    ai_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    answered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    application_assessment = relationship("ApplicationAssessment", back_populates="answers")
    question = relationship("Question")
