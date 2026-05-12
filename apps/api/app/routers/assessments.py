from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid

from app.database import get_db
from app.models.assessment import Assessment, Question
from app.models.user import User
from app.schemas.assessment import AssessmentCreate, AssessmentUpdate, AssessmentOut, QuestionCreate, QuestionOut
from app.core.rbac import require_recruiter
from app.core.exceptions import NotFoundError
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter(prefix="/assessments", tags=["assessments"])


@router.get("", response_model=PaginatedResponse[AssessmentOut])
async def list_assessments(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    q = select(Assessment).where(Assessment.company_id == current_user.company_id)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    result = await db.execute(q.offset(params.offset).limit(params.page_size))
    return PaginatedResponse.build(result.scalars().all(), total, params)


@router.post("", response_model=AssessmentOut, status_code=status.HTTP_201_CREATED)
async def create_assessment(
    payload: AssessmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    a = Assessment(**payload.model_dump(), company_id=current_user.company_id, created_by=current_user.id)
    db.add(a)
    await db.flush()
    return a


@router.get("/{assessment_id}", response_model=AssessmentOut)
async def get_assessment(
    assessment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id, Assessment.company_id == current_user.company_id)
    )
    a = result.scalar_one_or_none()
    if not a:
        raise NotFoundError("Assessment not found")
    return a


@router.patch("/{assessment_id}", response_model=AssessmentOut)
async def update_assessment(
    assessment_id: uuid.UUID,
    payload: AssessmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id, Assessment.company_id == current_user.company_id)
    )
    a = result.scalar_one_or_none()
    if not a:
        raise NotFoundError("Assessment not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(a, k, v)
    return a


@router.post("/{assessment_id}/questions", response_model=QuestionOut, status_code=status.HTTP_201_CREATED)
async def add_question(
    assessment_id: uuid.UUID,
    payload: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id, Assessment.company_id == current_user.company_id)
    )
    if not result.scalar_one_or_none():
        raise NotFoundError("Assessment not found")
    q = Question(**payload.model_dump(), assessment_id=assessment_id)
    db.add(q)
    await db.flush()
    return q
