from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.company import Company
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, RefreshRequest, UserOut
from app.schemas.company import CompanyOut
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.exceptions import ConflictError
from app.core.rbac import require_admin
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterCompanyRequest(BaseModel):
    company_name: str
    company_slug: str
    admin_email: str
    admin_password: str
    admin_full_name: str


class RegisterCompanyResponse(BaseModel):
    user: UserOut
    company: CompanyOut
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


@router.post("/register-company", response_model=RegisterCompanyResponse, status_code=status.HTTP_201_CREATED)
async def register_company(payload: RegisterCompanyRequest, db: AsyncSession = Depends(get_db)):
    """Create a company and its first admin user in a single atomic operation."""
    slug_check = await db.execute(select(Company).where(Company.slug == payload.company_slug))
    if slug_check.scalar_one_or_none():
        raise ConflictError("Company slug already taken")

    email_check = await db.execute(select(User).where(User.email == payload.admin_email))
    if email_check.scalar_one_or_none():
        raise ConflictError("Email already registered")

    company = Company(
        name=payload.company_name,
        slug=payload.company_slug,
    )
    db.add(company)
    await db.flush()

    user = User(
        email=payload.admin_email,
        hashed_password=hash_password(payload.admin_password),
        full_name=payload.admin_full_name,
        role="admin",
        company_id=company.id,
        is_verified=True,
    )
    db.add(user)
    await db.flush()

    token_extra = {"role": user.role, "company_id": str(company.id)}
    return RegisterCompanyResponse(
        user=UserOut.model_validate(user),
        company=CompanyOut.model_validate(company),
        access_token=create_access_token(user.id, extra=token_extra),
        refresh_token=create_refresh_token(user.id),
    )


class InviteUserRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "recruiter"


@router.post("/invite-user", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def invite_user(
    payload: InviteUserRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Admin creates a new user (recruiter/admin) bound to their company."""
    if payload.role not in ("recruiter", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'recruiter' or 'admin'")
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise ConflictError("Email already registered")
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        company_id=current_user.company_id,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    await db.flush()
    return user


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )
    db.add(user)
    await db.flush()
    return user


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive")

    user.last_login_at = datetime.now(timezone.utc)

    token_extra = {"role": user.role, "company_id": str(user.company_id) if user.company_id else None}
    return TokenResponse(
        access_token=create_access_token(user.id, extra=token_extra),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    from jose import JWTError
    try:
        data = decode_token(payload.refresh_token)
        if data.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        user_id = data["sub"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    token_extra = {"role": user.role, "company_id": str(user.company_id) if user.company_id else None}
    return TokenResponse(
        access_token=create_access_token(user.id, extra=token_extra),
        refresh_token=create_refresh_token(user.id),
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
