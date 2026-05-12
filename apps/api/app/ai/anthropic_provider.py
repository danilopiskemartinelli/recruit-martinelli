import json
import httpx

from app.ai.base_provider import AIProvider, ResumeAnalysis, AnswerScore, CandidateInsight
from app.config import settings


class AnthropicProvider(AIProvider):
    """Anthropic Claude provider."""

    def __init__(self):
        self.api_key = settings.anthropic_api_key
        self.model = settings.anthropic_model

    async def _chat(self, prompt: str, temperature: float = 0.3) -> str:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "max_tokens": 2048,
                    "temperature": temperature,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            resp.raise_for_status()
            return resp.json()["content"][0]["text"]

    async def analyze_resume(self, resume_text: str, job_description: str, job_requirements: str) -> ResumeAnalysis:
        prompt = f"""Analise o currículo em relação à vaga. Retorne SOMENTE JSON válido, sem markdown.

CURRÍCULO: {resume_text}
VAGA: {job_description}
REQUISITOS: {job_requirements}

JSON: summary, strengths (list), weaknesses (list), skill_match_score (float 0-100),
skills_matched (list), skills_missing (list), experience_fit (str), recommendation (str)"""
        content = await self._chat(prompt)
        return ResumeAnalysis(**json.loads(content))

    async def score_open_answer(self, question: str, answer: str, rubric: str | None = None) -> AnswerScore:
        rubric_text = f"\nRubrica: {rubric}" if rubric else ""
        prompt = f"""Avalie a resposta. Retorne SOMENTE JSON.
PERGUNTA: {question}
RESPOSTA: {answer}{rubric_text}
JSON: score (0-100), feedback, key_points_covered (list), key_points_missing (list)"""
        content = await self._chat(prompt)
        return AnswerScore(**json.loads(content))

    async def generate_candidate_insight(self, candidate_data: dict, job_data: dict, answers_data: list[dict]) -> CandidateInsight:
        prompt = f"""Gere insight do candidato. Retorne SOMENTE JSON.
CANDIDATO: {json.dumps(candidate_data, ensure_ascii=False)}
VAGA: {json.dumps(job_data, ensure_ascii=False)}
JSON: overall_score, culture_fit_score, technical_score, communication_score,
red_flags (list), highlights (list), interview_questions (list), summary"""
        content = await self._chat(prompt)
        return CandidateInsight(**json.loads(content))

    async def generate_interview_questions(self, candidate_data: dict, job_data: dict, focus_areas: list[str] | None = None) -> list[str]:
        focus = f"\nFoco: {', '.join(focus_areas)}" if focus_areas else ""
        prompt = f"""10 perguntas de entrevista. Retorne SOMENTE array JSON.
CANDIDATO: {json.dumps(candidate_data, ensure_ascii=False)}
VAGA: {json.dumps(job_data, ensure_ascii=False)}{focus}"""
        content = await self._chat(prompt)
        return json.loads(content)
