from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.database import get_db
from app.models.assessment import Assessment, Question
from app.models.user import User
from app.schemas.assessment import QuestionCreate, QuestionOut
from app.core.rbac import require_recruiter
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/questions", tags=["questions"])


class QuestionUpdate(QuestionCreate):
    order_index: int | None = None
    type: str | None = None
    content: str | None = None


@router.get("/{question_id}", response_model=QuestionOut)
async def get_question(
    question_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    result = await db.execute(
        select(Question)
        .join(Assessment, Assessment.id == Question.assessment_id)
        .where(Question.id == question_id, Assessment.company_id == current_user.company_id)
    )
    q = result.scalar_one_or_none()
    if not q:
        raise NotFoundError("Question not found")
    return q


@router.patch("/{question_id}", response_model=QuestionOut)
async def update_question(
    question_id: uuid.UUID,
    payload: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    result = await db.execute(
        select(Question)
        .join(Assessment, Assessment.id == Question.assessment_id)
        .where(Question.id == question_id, Assessment.company_id == current_user.company_id)
    )
    q = result.scalar_one_or_none()
    if not q:
        raise NotFoundError("Question not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(q, k, v)
    return q


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    result = await db.execute(
        select(Question)
        .join(Assessment, Assessment.id == Question.assessment_id)
        .where(Question.id == question_id, Assessment.company_id == current_user.company_id)
    )
    q = result.scalar_one_or_none()
    if not q:
        raise NotFoundError("Question not found")
    await db.delete(q)


class ReorderItem(QuestionOut):
    id: uuid.UUID
    order_index: int

    class Config:
        from_attributes = True


@router.post("/reorder", status_code=status.HTTP_204_NO_CONTENT)
async def reorder_questions(
    assessment_id: uuid.UUID,
    items: list[ReorderItem],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    assessment_result = await db.execute(
        select(Assessment).where(
            Assessment.id == assessment_id,
            Assessment.company_id == current_user.company_id,
        )
    )
    if not assessment_result.scalar_one_or_none():
        raise NotFoundError("Assessment not found")

    ids = [str(item.id) for item in items]
    result = await db.execute(
        select(Question).where(
            Question.assessment_id == assessment_id,
            Question.id.in_(ids),
        )
    )
    questions = {str(q.id): q for q in result.scalars().all()}

    for item in items:
        if str(item.id) in questions:
            questions[str(item.id)].order_index = item.order_index
