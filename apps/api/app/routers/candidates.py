from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid

from app.database import get_db
from app.models.candidate import Candidate
from app.models.user import User
from app.schemas.candidate import CandidateCreate, CandidateUpdate, CandidateOut
from app.core.rbac import require_recruiter
from app.core.exceptions import NotFoundError
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter(prefix="/candidates", tags=["candidates"])


@router.get("", response_model=PaginatedResponse[CandidateOut])
async def list_candidates(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_recruiter),
):
    total = (await db.execute(select(func.count()).select_from(Candidate))).scalar()
    result = await db.execute(select(Candidate).offset(params.offset).limit(params.page_size))
    return PaginatedResponse.build(result.scalars().all(), total, params)


@router.post("", response_model=CandidateOut, status_code=status.HTTP_201_CREATED)
async def create_candidate(
    payload: CandidateCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_recruiter),
):
    candidate = Candidate(**payload.model_dump())
    db.add(candidate)
    await db.flush()
    return candidate


@router.get("/{candidate_id}", response_model=CandidateOut)
async def get_candidate(
    candidate_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_recruiter),
):
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    c = result.scalar_one_or_none()
    if not c:
        raise NotFoundError("Candidate not found")
    return c


@router.patch("/{candidate_id}", response_model=CandidateOut)
async def update_candidate(
    candidate_id: uuid.UUID,
    payload: CandidateUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_recruiter),
):
    result = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    c = result.scalar_one_or_none()
    if not c:
        raise NotFoundError("Candidate not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(c, k, v)
    return c
