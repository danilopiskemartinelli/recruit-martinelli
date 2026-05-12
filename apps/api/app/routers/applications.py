from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
import uuid

from app.database import get_db
from app.models.application import Application, ApplicationAssessment, AssessmentAnswer
from app.models.user import User
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationOut, AssessmentSubmit, ApplicationAssessmentOut
from app.core.rbac import require_recruiter
from app.core.exceptions import NotFoundError, ConflictError, UnprocessableError
from app.core.pagination import PaginationParams, PaginatedResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("", response_model=PaginatedResponse[ApplicationOut])
async def list_applications(
    params: PaginationParams = Depends(),
    job_id: uuid.UUID | None = None,
    appl_status: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    q = select(Application).where(Application.company_id == current_user.company_id)
    if job_id:
        q = q.where(Application.job_id == job_id)
    if appl_status:
        q = q.where(Application.status == appl_status)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar()
    result = await db.execute(q.offset(params.offset).limit(params.page_size).order_by(Application.applied_at.desc()))
    return PaginatedResponse.build(result.scalars().all(), total, params)


@router.patch("/{application_id}", response_model=ApplicationOut)
async def update_application(
    application_id: uuid.UUID,
    payload: ApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    result = await db.execute(
        select(Application).where(Application.id == application_id, Application.company_id == current_user.company_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise NotFoundError("Application not found")

    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(app, k, v)
    return app


@router.post("/{application_id}/invite-assessment/{assessment_id}", response_model=ApplicationAssessmentOut)
async def invite_for_assessment(
    application_id: uuid.UUID,
    assessment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    import secrets
    from datetime import timedelta

    result = await db.execute(
        select(Application).where(Application.id == application_id, Application.company_id == current_user.company_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise NotFoundError("Application not found")

    aa = ApplicationAssessment(
        application_id=application_id,
        assessment_id=assessment_id,
        invitation_token=secrets.token_urlsafe(32),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        invitation_sent_at=datetime.now(timezone.utc),
        status="invited",
    )
    db.add(aa)
    await db.flush()
    return aa


@router.get("/session/{token}", response_model=ApplicationAssessmentOut)
async def get_assessment_session(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ApplicationAssessment).where(ApplicationAssessment.invitation_token == token)
    )
    aa = result.scalar_one_or_none()
    if not aa:
        raise NotFoundError("Assessment session not found")
    if aa.expires_at and aa.expires_at < datetime.now(timezone.utc):
        raise UnprocessableError("Assessment invitation has expired")
    return aa


@router.post("/session/{token}/submit", status_code=status.HTTP_200_OK)
async def submit_assessment(
    token: str,
    payload: AssessmentSubmit,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ApplicationAssessment).where(ApplicationAssessment.invitation_token == token)
    )
    aa = result.scalar_one_or_none()
    if not aa:
        raise NotFoundError("Session not found")
    if aa.status in ("completed", "expired"):
        raise UnprocessableError(f"Session is already {aa.status}")

    now = datetime.now(timezone.utc)
    if not aa.started_at:
        aa.started_at = now

    for ans in payload.answers:
        answer = AssessmentAnswer(
            application_assessment_id=aa.id,
            question_id=ans.question_id,
            answer_text=ans.answer_text,
            selected_options=ans.selected_options,
            answer_boolean=ans.answer_boolean,
            rating_value=ans.rating_value,
            answered_at=now,
        )
        db.add(answer)

    aa.completed_at = now
    aa.status = "completed"
    aa.time_taken_seconds = payload.time_taken_seconds

    return {"submitted": True, "completed_at": now.isoformat()}
