from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid

from app.database import get_db
from app.models.company import Company
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyOut
from app.core.rbac import require_admin, require_recruiter
from app.core.exceptions import NotFoundError, ConflictError
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("", response_model=PaginatedResponse[CompanyOut])
async def list_companies(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    total = (await db.execute(select(func.count()).select_from(Company))).scalar()
    result = await db.execute(select(Company).offset(params.offset).limit(params.page_size))
    return PaginatedResponse.build(result.scalars().all(), total, params)


@router.post("", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
async def create_company(
    payload: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    existing = await db.execute(select(Company).where(Company.slug == payload.slug))
    if existing.scalar_one_or_none():
        raise ConflictError("Company slug already taken")

    company = Company(**payload.model_dump())
    db.add(company)
    await db.flush()
    return company


@router.get("/{company_id}", response_model=CompanyOut)
async def get_company(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise NotFoundError("Company not found")
    if current_user.role != "admin" and current_user.company_id != company_id:
        raise NotFoundError("Company not found")
    return company


@router.patch("/{company_id}", response_model=CompanyOut)
async def update_company(
    company_id: uuid.UUID,
    payload: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise NotFoundError("Company not found")

    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(company, k, v)
    return company
