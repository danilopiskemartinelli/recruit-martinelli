from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
from slugify import slugify
import uuid

from app.database import get_db
from app.models.job import Job
from app.models.user import User
from app.schemas.job import JobCreate, JobUpdate, JobOut
from app.core.rbac import require_recruiter
from app.core.exceptions import NotFoundError, ForbiddenError
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=PaginatedResponse[JobOut])
async def list_jobs(
    params: PaginationParams = Depends(),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    q = select(Job).where(Job.company_id == current_user.company_id)
    if status:
        q = q.where(Job.status == status)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    result = await db.execute(q.offset(params.offset).limit(params.page_size).order_by(Job.created_at.desc()))
    return PaginatedResponse.build(result.scalars().all(), total, params)


@router.get("/public", response_model=PaginatedResponse[JobOut])
async def list_public_jobs(
    params: PaginationParams = Depends(),
    company_slug: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    from app.models.company import Company
    q = select(Job).where(Job.status == "published")
    if company_slug:
        company_q = await db.execute(select(Company).where(Company.slug == company_slug))
        company = company_q.scalar_one_or_none()
        if company:
            q = q.where(Job.company_id == company.id)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    result = await db.execute(q.offset(params.offset).limit(params.page_size))
    return PaginatedResponse.build(result.scalars().all(), total, params)


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
async def create_job(
    payload: JobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    job = Job(
        **payload.model_dump(),
        company_id=current_user.company_id,
        created_by=current_user.id,
        slug=slugify(payload.title),
    )
    db.add(job)
    await db.flush()
    return job


@router.get("/{job_id}", response_model=JobOut)
async def get_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise NotFoundError("Job not found")
    return job


@router.patch("/{job_id}", response_model=JobOut)
async def update_job(
    job_id: uuid.UUID,
    payload: JobUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    result = await db.execute(select(Job).where(Job.id == job_id, Job.company_id == current_user.company_id))
    job = result.scalar_one_or_none()
    if not job:
        raise NotFoundError("Job not found")

    updates = payload.model_dump(exclude_none=True)
    if updates.get("status") == "published" and not job.published_at:
        updates["published_at"] = datetime.now(timezone.utc)

    for k, v in updates.items():
        setattr(job, k, v)
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    result = await db.execute(select(Job).where(Job.id == job_id, Job.company_id == current_user.company_id))
    job = result.scalar_one_or_none()
    if not job:
        raise NotFoundError("Job not found")
    await db.delete(job)
