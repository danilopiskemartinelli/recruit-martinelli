from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
import uuid


class QuestionCreate(BaseModel):
    order_index: int
    type: str
    content: str
    points: Decimal = Decimal("1.0")
    is_required: bool = True
    time_limit_seconds: int | None = None
    options: dict | None = None
    correct_answer: str | None = None
    explanation: str | None = None
    media_url: str | None = None


class QuestionOut(BaseModel):
    id: uuid.UUID
    order_index: int
    type: str
    content: str
    points: Decimal
    is_required: bool
    options: dict | None
    media_url: str | None

    class Config:
        from_attributes = True


class AssessmentCreate(BaseModel):
    title: str
    description: str | None = None
    type: str = "quiz"
    time_limit_minutes: int | None = None
    passing_score: Decimal | None = None
    randomize_questions: bool = False
    show_results_to_candidate: bool = True
    instructions: str | None = None


class AssessmentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    time_limit_minutes: int | None = None
    passing_score: Decimal | None = None
    status: str | None = None
    instructions: str | None = None


class AssessmentOut(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    title: str
    description: str | None
    type: str
    time_limit_minutes: int | None
    passing_score: Decimal | None
    randomize_questions: bool
    show_results_to_candidate: bool
    status: str
    questions: list[QuestionOut] = []
    created_at: datetime

    class Config:
        from_attributes = True
