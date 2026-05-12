from datetime import datetime
from sqlalchemy import String, Text, Enum as SAEnum, ForeignKey, Integer, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.base import UUIDMixin


class AIInsight(Base, UUIDMixin):
    __tablename__ = "ai_insights"

    entity_type: Mapped[str] = mapped_column(
        SAEnum("candidate", "application", "assessment_result", name="insight_entity_type"),
        nullable=False,
        index=True,
    )
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    insight_type: Mapped[str] = mapped_column(
        SAEnum(
            "resume_analysis", "culture_fit", "skill_match",
            "interview_questions", "red_flags", "overall_summary",
            name="insight_type",
        ),
        nullable=False,
    )
    prompt_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    completion_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    content: Mapped[dict] = mapped_column(JSON, nullable=False)
    raw_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
