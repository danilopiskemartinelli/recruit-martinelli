from pydantic import BaseModel
from datetime import datetime
import uuid


class CompanyCreate(BaseModel):
    name: str
    slug: str
    domain: str | None = None
    plan: str = "free"


class CompanyUpdate(BaseModel):
    name: str | None = None
    domain: str | None = None
    logo_url: str | None = None
    plan: str | None = None
    max_recruiters: int | None = None
    max_jobs: int | None = None
    settings: dict | None = None


class CompanyOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    domain: str | None
    logo_url: str | None
    plan: str
    is_active: bool
    max_recruiters: int
    max_jobs: int
    created_at: datetime

    class Config:
        from_attributes = True
