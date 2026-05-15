import asyncio
from decimal import Decimal
from app.worker import celery_app


def _run(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="scoring.score_assessment", bind=True, max_retries=2)
def score_assessment(self, application_assessment_id: str):
    """Score completed assessment: auto-score objective questions, queue AI for open text."""
    try:
        _run(_score_assessment_async(application_assessment_id))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)


async def _score_assessment_async(application_assessment_id: str):
    from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
    from sqlalchemy.orm import sessionmaker, selectinload
    from sqlalchemy import select
    from datetime import datetime, timezone

    from app.config import settings
    from app.models.application import ApplicationAssessment, AssessmentAnswer
    from app.models.assessment import Question

    engine = create_async_engine(settings.database_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        result = await db.execute(
            select(ApplicationAssessment)
            .options(selectinload(ApplicationAssessment.answers).selectinload(AssessmentAnswer.question))
            .options(selectinload(ApplicationAssessment.assessment))
            .where(ApplicationAssessment.id == application_assessment_id)
        )
        aa = result.scalar_one_or_none()
        if not aa:
            return

        total_points = Decimal("0")
        earned_points = Decimal("0")

        for answer in aa.answers:
            q: Question = answer.question
            total_points += q.points

            if q.type == "multiple_choice" and q.correct_answer and answer.selected_options:
                correct = set(q.correct_answer.split(","))
                selected = set(answer.selected_options)
                if correct == selected:
                    answer.is_correct = True
                    answer.points_earned = q.points
                    earned_points += q.points
                else:
                    answer.is_correct = False
                    answer.points_earned = Decimal("0")

            elif q.type == "true_false" and q.correct_answer is not None and answer.answer_boolean is not None:
                expected = q.correct_answer.lower() == "true"
                answer.is_correct = answer.answer_boolean == expected
                answer.points_earned = q.points if answer.is_correct else Decimal("0")
                earned_points += answer.points_earned

        if total_points > 0:
            aa.score = (earned_points / total_points * 100).quantize(Decimal("0.01"))
            if aa.assessment.passing_score:
                aa.passed = aa.score >= aa.assessment.passing_score

        await db.commit()
    await engine.dispose()
