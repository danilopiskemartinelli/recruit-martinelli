from pydantic import BaseModel, EmailStr
from datetime import datetime
import uuid


class CandidateCreate(BaseModel):
    email: EmailStr
    full_name: str
    phone: str | None = None
    linkedin_url: str | None = None
    location: str | None = None
    summary: str | None = None
    skills: list[str] = []
    experience_years: int | None = None
    source: str | None = None
    gdpr_consent: bool = False


class CandidateUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    linkedin_url: str | None = None
    location: str | None = None
    summary: str | None = None
    skills: list[str] | None = None
    experience_years: int | None = None


class CandidateOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    phone: str | None
    linkedin_url: str | None
    resume_url: str | None
    location: str | None
    summary: str | None
    skills: list[str]
    experience_years: int | None
    source: str | None
    created_at: datetime

    class Config:
        from_attributes = True
