import json
import httpx

from app.ai.base_provider import AIProvider, ResumeAnalysis, AnswerScore, CandidateInsight
from app.config import settings


class OpenAIProvider(AIProvider):
    """OpenAI provider (GPT-4o)."""

    def __init__(self):
        self.api_key = settings.openai_api_key
        self.model = settings.openai_model

    async def _chat(self, messages: list[dict], temperature: float = 0.3) -> str:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json={"model": self.model, "messages": messages, "temperature": temperature, "response_format": {"type": "json_object"}},
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    async def analyze_resume(self, resume_text: str, job_description: str, job_requirements: str) -> ResumeAnalysis:
        prompt = f"""Analise o currículo em relação à vaga e retorne JSON.

CURRÍCULO: {resume_text}
VAGA: {job_description}
REQUISITOS: {job_requirements}

JSON com: summary, strengths (list), weaknesses (list), skill_match_score (float 0-100),
skills_matched (list), skills_missing (list), experience_fit (str), recommendation (str)"""

        content = await self._chat([{"role": "user", "content": prompt}])
        return ResumeAnalysis(**json.loads(content))

    async def score_open_answer(self, question: str, answer: str, rubric: str | None = None) -> AnswerScore:
        rubric_text = f"\nRubrrica: {rubric}" if rubric else ""
        prompt = f"""Avalie a resposta. PERGUNTA: {question}\nRESPOSTA: {answer}{rubric_text}
JSON: score (0-100), feedback, key_points_covered (list), key_points_missing (list)"""
        content = await self._chat([{"role": "user", "content": prompt}])
        return AnswerScore(**json.loads(content))

    async def generate_candidate_insight(self, candidate_data: dict, job_data: dict, answers_data: list[dict]) -> CandidateInsight:
        prompt = f"""Insight do candidato para a vaga.
CANDIDATO: {json.dumps(candidate_data, ensure_ascii=False)}
VAGA: {json.dumps(job_data, ensure_ascii=False)}
RESPOSTAS: {json.dumps(answers_data, ensure_ascii=False)}
JSON: overall_score, culture_fit_score, technical_score, communication_score,
red_flags (list), highlights (list), interview_questions (list), summary"""
        content = await self._chat([{"role": "user", "content": prompt}])
        return CandidateInsight(**json.loads(content))

    async def generate_interview_questions(self, candidate_data: dict, job_data: dict, focus_areas: list[str] | None = None) -> list[str]:
        focus = f"\nFoco: {', '.join(focus_areas)}" if focus_areas else ""
        prompt = f"""10 perguntas de entrevista personalizadas.
CANDIDATO: {json.dumps(candidate_data, ensure_ascii=False)}
VAGA: {json.dumps(job_data, ensure_ascii=False)}{focus}
Retorne JSON array de strings."""
        content = await self._chat([{"role": "user", "content": prompt}])
        return json.loads(content)
