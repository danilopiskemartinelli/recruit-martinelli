from decimal import Decimal
from sqlalchemy import String, Text, Boolean, Enum as SAEnum, ForeignKey, SmallInteger, Numeric, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class Assessment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "assessments"

    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_by: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[str] = mapped_column(
        SAEnum("quiz", "coding", "personality", "technical", "mixed", name="assessment_type"),
        default="quiz",
        nullable=False,
    )
    time_limit_minutes: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    passing_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    randomize_questions: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    show_results_to_candidate: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum("draft", "active", "archived", name="assessment_status"),
        default="draft",
        nullable=False,
    )

    company = relationship("Company", back_populates="assessments")
    creator = relationship("User", foreign_keys=[created_by])
    questions = relationship("Question", back_populates="assessment", order_by="Question.order_index")


class Question(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "questions"

    assessment_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    order_index: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    type: Mapped[str] = mapped_column(
        SAEnum(
            "multiple_choice", "true_false", "open_text", "code", "rating_scale", "file_upload",
            name="question_type",
        ),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    points: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=1.0, nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    time_limit_seconds: Mapped[int | None] = mapped_column(nullable=True)
    options: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    correct_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    media_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    assessment = relationship("Assessment", back_populates="questions")
