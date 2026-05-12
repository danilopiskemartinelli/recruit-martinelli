from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import uuid

from app.database import get_db
from app.models.user import User
from app.models.ai_insight import AIInsight
from app.ai.provider_factory import get_ai_provider
from app.core.rbac import require_recruiter
from app.core.exceptions import NotFoundError
from app.config import settings

router = APIRouter(prefix="/insights", tags=["ai-insights"])


@router.post("/candidate/{candidate_id}/resume")
async def analyze_resume(
    candidate_id: uuid.UUID,
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    from app.models.candidate import Candidate
    from app.models.job import Job

    candidate_r = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    candidate = candidate_r.scalar_one_or_none()
    if not candidate or not candidate.resume_text:
        raise NotFoundError("Candidate or resume not found")

    job_r = await db.execute(select(Job).where(Job.id == job_id, Job.company_id == current_user.company_id))
    job = job_r.scalar_one_or_none()
    if not job:
        raise NotFoundError("Job not found")

    provider = get_ai_provider()
    analysis = await provider.analyze_resume(
        resume_text=candidate.resume_text,
        job_description=job.description,
        job_requirements=job.requirements or "",
    )

    insight = AIInsight(
        entity_type="candidate",
        entity_id=candidate_id,
        company_id=current_user.company_id,
        provider=settings.ai_provider,
        insight_type="resume_analysis",
        content=analysis.__dict__,
        created_at=datetime.now(timezone.utc),
    )
    db.add(insight)
    await db.flush()

    return {"insight_id": insight.id, "analysis": analysis.__dict__}


@router.post("/application/{application_id}/full-insight")
async def generate_full_insight(
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    from app.models.application import Application
    from app.models.candidate import Candidate
    from app.models.job import Job

    app_r = await db.execute(
        select(Application).where(Application.id == application_id, Application.company_id == current_user.company_id)
    )
    application = app_r.scalar_one_or_none()
    if not application:
        raise NotFoundError("Application not found")

    candidate_r = await db.execute(select(Candidate).where(Candidate.id == application.candidate_id))
    candidate = candidate_r.scalar_one_or_none()

    job_r = await db.execute(select(Job).where(Job.id == application.job_id))
    job = job_r.scalar_one_or_none()

    provider = get_ai_provider()
    insight_data = await provider.generate_candidate_insight(
        candidate_data={
            "name": candidate.full_name,
            "skills": candidate.skills,
            "experience_years": candidate.experience_years,
            "summary": candidate.summary,
            "resume": candidate.resume_text,
        },
        job_data={"title": job.title, "description": job.description, "requirements": job.requirements},
        answers_data=[],
    )

    insight = AIInsight(
        entity_type="application",
        entity_id=application_id,
        company_id=current_user.company_id,
        provider=settings.ai_provider,
        insight_type="overall_summary",
        content=insight_data.__dict__,
        created_at=datetime.now(timezone.utc),
    )
    db.add(insight)
    await db.flush()

    return {"insight_id": insight.id, "insight": insight_data.__dict__}


@router.post("/application/{application_id}/interview-questions")
async def get_interview_questions(
    application_id: uuid.UUID,
    focus_areas: list[str] | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    from app.models.application import Application
    from app.models.candidate import Candidate
    from app.models.job import Job

    app_r = await db.execute(
        select(Application).where(Application.id == application_id, Application.company_id == current_user.company_id)
    )
    application = app_r.scalar_one_or_none()
    if not application:
        raise NotFoundError("Application not found")

    candidate = (await db.execute(select(Candidate).where(Candidate.id == application.candidate_id))).scalar_one()
    job = (await db.execute(select(Job).where(Job.id == application.job_id))).scalar_one()

    provider = get_ai_provider()
    questions = await provider.generate_interview_questions(
        candidate_data={"name": candidate.full_name, "skills": candidate.skills},
        job_data={"title": job.title, "description": job.description},
        focus_areas=focus_areas,
    )

    return {"questions": questions}
