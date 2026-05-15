from pydantic import BaseModel
from datetime import datetime
import uuid


class PsychInviteCreate(BaseModel):
    application_id: uuid.UUID
    expires_in_days: int = 30


class PsychInviteOut(BaseModel):
    id: uuid.UUID
    token: str
    application_id: uuid.UUID
    expires_at: datetime
    completed_at: datetime | None = None
    sent_at: datetime | None = None
    assessment_url: str | None = None

    class Config:
        from_attributes = True


class PsychSubmitPayload(BaseModel):
    big_five_answers: dict[str, int]
    stress_answers: dict[str, int]
    depression_answers: dict[str, int]
    motivators_answers: dict[str, int]
    disc_answers: dict[str, list[float]]
    qa_answers: dict[str, int]


class PsychResultsOut(BaseModel):
    id: uuid.UUID
    invite_id: uuid.UUID
    completed_at: datetime
    scores: dict | None = None

    class Config:
        from_attributes = True
