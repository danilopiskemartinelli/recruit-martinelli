from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
import uuid


class ApplicationCreate(BaseModel):
    job_id: uuid.UUID
    candidate_email: str
    candidate_name: str
    candidate_phone: str | None = None
    cover_letter: str | None = None
    source: str | None = None
    gdpr_consent: bool = False


class ApplicationUpdate(BaseModel):
    status: str | None = None
    recruiter_notes: str | None = None
    rejection_reason: str | None = None


class AssessmentAnswerSubmit(BaseModel):
    question_id: uuid.UUID
    answer_text: str | None = None
    selected_options: list[str] | None = None
    answer_boolean: bool | None = None
    rating_value: int | None = None


class AssessmentSubmit(BaseModel):
    answers: list[AssessmentAnswerSubmit]
    time_taken_seconds: int | None = None


class ApplicationOut(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    candidate_id: uuid.UUID
    company_id: uuid.UUID
    status: str
    current_stage_index: int
    cover_letter: str | None
    source: str | None
    applied_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplicationAssessmentOut(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    assessment_id: uuid.UUID
    status: str
    invitation_token: str | None
    started_at: datetime | None
    completed_at: datetime | None
    expires_at: datetime | None
    score: Decimal | None
    passed: bool | None

    class Config:
        from_attributes = True
