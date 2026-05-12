from sqlalchemy import String, Boolean, Enum as SAEnum, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class Company(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    plan: Mapped[str] = mapped_column(
        SAEnum("free", "starter", "professional", "enterprise", name="company_plan"),
        default="free",
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    max_recruiters: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    max_jobs: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    settings: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)

    users = relationship("User", back_populates="company", foreign_keys="User.company_id")
    jobs = relationship("Job", back_populates="company")
    assessments = relationship("Assessment", back_populates="company")
