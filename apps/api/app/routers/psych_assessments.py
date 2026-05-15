import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, status, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.psych_assessment import PsychInvite, PsychResponse
from app.models.application import Application
from app.models.user import User
from app.schemas.psych_assessment import (
    PsychInviteCreate, PsychInviteOut, PsychSubmitPayload, PsychResultsOut,
)
from app.core.rbac import require_recruiter
from app.core.exceptions import NotFoundError
from app.core.psych_questions import (
    BIG_FIVE_QUESTIONS, STRESS_QUESTIONS, DEPRESSION_QUESTIONS,
    MOTIVATORS_GROUPS, DISC_DIMENSIONS, QA_QUESTIONS,
)
from app.core.psych_scoring import calculate_scores

router = APIRouter(tags=["psych-assessments"])


# ── Public endpoints (no auth required) ─────────────────────────────────────

@router.get("/psych-assessments/{token}")
async def get_assessment(token: str, db: AsyncSession = Depends(get_db)):
    """Return assessment metadata and question data for the candidate."""
    result = await db.execute(
        select(PsychInvite)
        .where(PsychInvite.token == token)
        .options(selectinload(PsychInvite.response))
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Link de assessment inválido.")
    if invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Este link de assessment expirou.")
    if invite.completed_at:
        raise HTTPException(status_code=409, detail="Este assessment já foi concluído.")

    return {
        "token": token,
        "expires_at": invite.expires_at,
        "tests": {
            "big_five": {
                "title": "Big Five",
                "instruction": "Leia as afirmações e pense o quanto elas descrevem você, enumerando-as em termos de intensidade. Não existem respostas certas ou erradas, o importante é que você responda de forma sincera.",
                "scale": {"min": 1, "max": 7, "labels": {
                    "1": "Não me descreve",
                    "4": "Descreve-me na média",
                    "7": "Descreve-me muito bem",
                }},
                "questions": BIG_FIVE_QUESTIONS,
            },
            "stress": {
                "title": "Nível de Estresse",
                "instruction": "Para cada questão, escolha uma das alternativas de acordo com como você se sentiu no último mês.",
                "scale": {"min": 0, "max": 4, "labels": {
                    "0": "Nunca",
                    "1": "Quase nunca",
                    "2": "Algumas vezes",
                    "3": "Com bastante frequência",
                    "4": "Quase sempre",
                }},
                "questions": STRESS_QUESTIONS,
            },
            "depression": {
                "title": "Sintomático de Depressão",
                "instruction": "Assinale as respostas que chegam mais próximo de como você tem se sentido nos últimos 7 dias, não apenas como você tem se sentido hoje.",
                "questions": DEPRESSION_QUESTIONS,
            },
            "motivators": {
                "title": "Motivadores",
                "instruction": "Marque as opções de acordo com o que você realmente sente.",
                "scale": {"min": 0, "max": 5, "labels": {
                    "0": "Nunca",
                    "1": "Quase nunca",
                    "2": "Poucas vezes",
                    "3": "Normalmente",
                    "4": "Quase sempre",
                    "5": "O tempo todo",
                }},
                "groups": MOTIVATORS_GROUPS,
            },
            "disc": {
                "title": "DISC",
                "instruction": "Marque de acordo com o que você pensa sobre você mesmo(a). Marque apenas uma opção por grupo.",
                "dimensions": DISC_DIMENSIONS,
            },
            "qa": {
                "title": "Quociente de Adversidade",
                "instruction": "Marque as opções de acordo com o que você realmente sente.",
                "scale": {"min": 1, "max": 5, "labels": {
                    "1": "Nunca",
                    "2": "Pouco",
                    "3": "Médio",
                    "4": "Na maioria das vezes",
                    "5": "Sempre",
                }},
                "questions": QA_QUESTIONS,
            },
        },
    }


@router.post("/psych-assessments/{token}/submit", status_code=status.HTTP_201_CREATED)
async def submit_assessment(
    token: str,
    payload: PsychSubmitPayload,
    db: AsyncSession = Depends(get_db),
):
    """Receive candidate answers, compute scores, and persist the response."""
    result = await db.execute(
        select(PsychInvite).where(PsychInvite.token == token)
    )
    invite = result.scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Link de assessment inválido.")
    if invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Este link de assessment expirou.")
    if invite.completed_at:
        raise HTTPException(status_code=409, detail="Este assessment já foi concluído.")

    now = datetime.now(timezone.utc)
    response = PsychResponse(
        invite_id=invite.id,
        big_five_answers=payload.big_five_answers,
        stress_answers=payload.stress_answers,
        depression_answers=payload.depression_answers,
        motivators_answers=payload.motivators_answers,
        disc_answers=payload.disc_answers,
        qa_answers=payload.qa_answers,
        completed_at=now,
    )
    response.scores = calculate_scores(response)
    db.add(response)

    invite.completed_at = now
    await db.flush()

    return {"message": "Assessment concluído com sucesso!", "response_id": response.id}


# ── Recruiter endpoints (auth required) ─────────────────────────────────────

@router.post(
    "/applications/{app_id}/psych-invite",
    response_model=PsychInviteOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_psych_invite(
    app_id: uuid.UUID,
    payload: PsychInviteCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    """Create (or return existing) a psych assessment invite for an application."""
    app_result = await db.execute(
        select(Application).where(
            Application.id == str(app_id),
            Application.company_id == current_user.company_id,
        )
    )
    application = app_result.scalar_one_or_none()
    if not application:
        raise NotFoundError("Application not found")

    # Check if there's already an incomplete invite
    existing = await db.execute(
        select(PsychInvite).where(
            PsychInvite.application_id == str(app_id),
            PsychInvite.completed_at.is_(None),
        )
    )
    invite = existing.scalar_one_or_none()
    if not invite:
        invite = PsychInvite(
            application_id=str(app_id),
            expires_at=datetime.now(timezone.utc) + timedelta(days=payload.expires_in_days),
            sent_at=datetime.now(timezone.utc),
        )
        db.add(invite)
        await db.flush()

    base_url = str(request.base_url).rstrip("/")
    assessment_url = f"{base_url}/portal/assessment/{invite.token}"

    out = PsychInviteOut.model_validate(invite)
    out.assessment_url = assessment_url
    return out


@router.get("/applications/{app_id}/psych-results", response_model=PsychResultsOut)
async def get_psych_results(
    app_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_recruiter),
):
    """Get the completed psych assessment results for an application."""
    app_result = await db.execute(
        select(Application).where(
            Application.id == str(app_id),
            Application.company_id == current_user.company_id,
        )
    )
    if not app_result.scalar_one_or_none():
        raise NotFoundError("Application not found")

    result = await db.execute(
        select(PsychResponse)
        .join(PsychInvite, PsychResponse.invite_id == PsychInvite.id)
        .where(PsychInvite.application_id == str(app_id))
        .order_by(PsychResponse.completed_at.desc())
    )
    response = result.scalar_one_or_none()
    if not response:
        raise HTTPException(status_code=404, detail="No completed assessment found for this application.")
    return response
