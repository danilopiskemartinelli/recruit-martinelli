from sqlalchemy import String, Text, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class ManagerNPS(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "manager_nps"

    job_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    manager_name: Mapped[str] = mapped_column(String(255), nullable=False)
    manager_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    profile_adherence: Mapped[str] = mapped_column(
        SAEnum("otimo", "bom", "regular", "ruim", name="nps_rating"), nullable=False
    )
    analyst_satisfaction: Mapped[str] = mapped_column(
        SAEnum("otimo", "bom", "regular", "ruim", name="nps_rating"), nullable=False
    )
    communication: Mapped[str] = mapped_column(
        SAEnum("otimo", "bom", "regular", "ruim", name="nps_rating"), nullable=False
    )
    experience: Mapped[str] = mapped_column(
        SAEnum("otimo", "bom", "regular", "ruim", name="nps_rating"), nullable=False
    )
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)

    job = relationship("Job")
