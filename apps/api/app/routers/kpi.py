from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case, and_, text
from datetime import datetime, timezone, timedelta

from app.database import get_db
from app.models.application import Application
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.manager_nps import ManagerNPS
from app.models.user import User
from app.core.rbac import require_recruiter

router = APIRouter(prefix="/kpi", tags=["kpi"])

SENIORITY_LABELS = {
    "estagio": "Estágio",
    "assistente": "Assistente",
    "junior": "Júnior",
    "pleno": "Pleno",
    "senior": "Sênior",
    "coordenador": "Coordenador",
    "consultor": "Consultor",
    "executivo": "Executivo",
    "socio": "Sócio",
    "diretoria": "Diretoria",
}

SOURCE_LABELS = {
    "linkedin": "LinkedIn",
    "hunting": "Hunting",
    "indicacao": "Indicação",
    "consultoria": "Consultoria",
    "banco_interno": "Banco Interno",
    "job_board": "Job Board",
    "other": "Outro",
}


@router.get("")
async def get_kpi(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_recruiter),
):
    now = datetime.now(timezone.utc)
    six_months_ago = now - timedelta(days=180)

    # ── 1. SLA por nível ─────────────────────────────────────────────────────
    sla_rows = await db.execute(
        select(
            Job.seniority_level,
            func.avg(
                func.extract("epoch", Job.closed_at - Job.published_at) / 86400
            ).label("avg_days"),
            func.count(Job.id).label("count"),
        )
        .where(
            Job.status == "closed",
            Job.closed_at.isnot(None),
            Job.published_at.isnot(None),
        )
        .group_by(Job.seniority_level)
    )
    sla_by_seniority = [
        {
            "seniority": row.seniority_level or "sem_nivel",
            "label": SENIORITY_LABELS.get(row.seniority_level or "", "Sem nível"),
            "avg_days": round(float(row.avg_days), 1) if row.avg_days else 0,
            "count": row.count,
        }
        for row in sla_rows.all()
    ]

    # SLA geral (todas as vagas publicadas abertas)
    open_sla_rows = await db.execute(
        select(
            Job.seniority_level,
            func.avg(
                func.extract("epoch", func.now() - Job.published_at) / 86400
            ).label("avg_days_open"),
            func.count(Job.id).label("count"),
        )
        .where(
            Job.status == "published",
            Job.published_at.isnot(None),
        )
        .group_by(Job.seniority_level)
    )
    sla_open = [
        {
            "seniority": row.seniority_level or "sem_nivel",
            "label": SENIORITY_LABELS.get(row.seniority_level or "", "Sem nível"),
            "avg_days_open": round(float(row.avg_days_open), 1) if row.avg_days_open else 0,
            "count": row.count,
        }
        for row in open_sla_rows.all()
    ]

    # ── 2. Tempo aprovação → aceite ───────────────────────────────────────────
    offer_rows = await db.execute(
        select(
            func.avg(
                func.extract("epoch", Application.offer_accepted_at - Application.offer_sent_at) / 86400
            ).label("avg_days"),
            func.count(Application.id).label("count"),
        )
        .where(
            Application.offer_sent_at.isnot(None),
            Application.offer_accepted_at.isnot(None),
        )
    )
    offer_row = offer_rows.one()
    offer_acceptance = {
        "avg_days": round(float(offer_row.avg_days), 1) if offer_row.avg_days else None,
        "count": offer_row.count,
    }

    # Desistências (offer sent but no acceptance within 30 days)
    dropout_result = await db.execute(
        select(func.count(Application.id))
        .where(
            Application.offer_sent_at.isnot(None),
            Application.offer_accepted_at.is_(None),
            Application.status.in_(["rejected", "withdrawn"]),
        )
    )
    dropout_count = dropout_result.scalar() or 0

    # ── 3. Taxa de assertividade ──────────────────────────────────────────────
    # Hired >= 180 days ago (passed 6-month mark)
    assertive_result = await db.execute(
        select(func.count(Application.id))
        .where(
            Application.status == "hired",
            Application.hired_at.isnot(None),
            Application.hired_at <= six_months_ago,
        )
    )
    assertive_count = assertive_result.scalar() or 0

    total_hired_result = await db.execute(
        select(func.count(Application.id))
        .where(Application.status == "hired")
    )
    total_hired = total_hired_result.scalar() or 0

    hired_180_result = await db.execute(
        select(func.count(Application.id))
        .where(
            Application.status == "hired",
            Application.hired_at.isnot(None),
            Application.hired_at <= six_months_ago,
        )
    )
    hired_180 = hired_180_result.scalar() or 0

    assertiveness_rate = round((hired_180 / assertive_count * 100), 1) if assertive_count > 0 else None

    # ── 4. Origem das contratações ────────────────────────────────────────────
    source_rows = await db.execute(
        select(
            Application.source,
            func.count(Application.id).label("count"),
        )
        .where(Application.status == "hired")
        .group_by(Application.source)
        .order_by(func.count(Application.id).desc())
    )
    source_data = [
        {
            "source": row.source or "other",
            "label": SOURCE_LABELS.get(row.source or "other", row.source or "Outro"),
            "count": row.count,
        }
        for row in source_rows.all()
    ]
    total_source = sum(s["count"] for s in source_data)
    for s in source_data:
        s["pct"] = round(s["count"] / total_source * 100, 1) if total_source > 0 else 0

    # ── 5. NPS dos gestores ───────────────────────────────────────────────────
    nps_fields = ["profile_adherence", "analyst_satisfaction", "communication", "experience"]
    nps_labels = {
        "profile_adherence": "Aderência do perfil",
        "analyst_satisfaction": "Satisfação com a analista",
        "communication": "Comunicação",
        "experience": "Experiência no processo",
    }
    nps_data = {}
    for field in nps_fields:
        col = getattr(ManagerNPS, field)
        rows = await db.execute(
            select(col, func.count(ManagerNPS.id).label("count"))
            .group_by(col)
        )
        breakdown = {"otimo": 0, "bom": 0, "regular": 0, "ruim": 0}
        for row in rows.all():
            if row[0]:
                breakdown[row[0]] = row[1]
        total = sum(breakdown.values())
        nps_data[field] = {
            "label": nps_labels[field],
            "breakdown": breakdown,
            "total": total,
        }

    nps_total_result = await db.execute(select(func.count(ManagerNPS.id)))
    nps_total = nps_total_result.scalar() or 0

    # ── 6. Cotas ──────────────────────────────────────────────────────────────
    total_candidates_result = await db.execute(select(func.count(Candidate.id)))
    total_candidates = total_candidates_result.scalar() or 0

    pcd_result = await db.execute(
        select(func.count(Candidate.id)).where(Candidate.is_pcd.is_(True))
    )
    pcd_count = pcd_result.scalar() or 0

    apprentice_result = await db.execute(
        select(func.count(Candidate.id)).where(Candidate.is_young_apprentice.is_(True))
    )
    apprentice_count = apprentice_result.scalar() or 0

    pcd_pct = round(pcd_count / total_candidates * 100, 1) if total_candidates > 0 else 0
    apprentice_pct = round(apprentice_count / total_candidates * 100, 1) if total_candidates > 0 else 0

    # ── Resposta ──────────────────────────────────────────────────────────────
    return {
        "sla": {
            "closed": sla_by_seniority,
            "open": sla_open,
        },
        "offer_acceptance": {
            **offer_acceptance,
            "dropout_count": dropout_count,
        },
        "assertiveness": {
            "rate": assertiveness_rate,
            "hired_180_days": hired_180,
            "total_hired": total_hired,
        },
        "source": source_data,
        "nps": {
            "total_responses": nps_total,
            "dimensions": nps_data,
        },
        "quota": {
            "total_candidates": total_candidates,
            "pcd": {"count": pcd_count, "pct": pcd_pct},
            "young_apprentice": {"count": apprentice_count, "pct": apprentice_pct},
        },
    }
