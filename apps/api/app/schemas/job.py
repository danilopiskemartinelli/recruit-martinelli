from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
import uuid


class JobCreate(BaseModel):
    title: str
    description: str
    requirements: str | None = None
    location: str | None = None
    job_type: str | None = None
    modality: str | None = None
    salary_min: Decimal | None = None
    salary_max: Decimal | None = None
    salary_currency: str = "BRL"
    closes_at: datetime | None = None
    tags: list[str] = []


class JobUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    requirements: str | None = None
    location: str | None = None
    job_type: str | None = None
    modality: str | None = None
    salary_min: Decimal | None = None
    salary_max: Decimal | None = None
    status: str | None = None
    closes_at: datetime | None = None
    tags: list[str] | None = None


class JobOut(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    title: str
    slug: str
    description: str
    requirements: str | None
    location: str | None
    job_type: str | None
    modality: str | None
    salary_min: Decimal | None
    salary_max: Decimal | None
    salary_currency: str
    status: str
    published_at: datetime | None
    closes_at: datetime | None
    tags: list[str]
    created_at: datetime

    class Config:
        from_attributes = True
