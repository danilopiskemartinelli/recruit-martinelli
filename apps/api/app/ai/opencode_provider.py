import json
import httpx

from app.ai.base_provider import AIProvider, ResumeAnalysis, AnswerScore, CandidateInsight
from app.config import settings


class OpenCodeProvider(AIProvider):
    """OpenCode AI provider (OpenAI-compatible API)."""

    def __init__(self):
        self.api_key = settings.opencode_api_key
        self.base_url = settings.opencode_api_base_url
        self.model = "opencode-default"

    async def _chat(self, messages: list[dict], temperature: float = 0.3) -> str:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                json={"model": self.model, "messages": messages, "temperature": temperature},
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    async def analyze_resume(self, resume_text: str, job_description: str, job_requirements: str) -> ResumeAnalysis:
        prompt = f"""Analise o currículo abaixo em relação à vaga e retorne um JSON válido.

CURRÍCULO:
{resume_text}

DESCRIÇÃO DA VAGA:
{job_description}

REQUISITOS:
{job_requirements}

Retorne SOMENTE este JSON:
{{
  "summary": "resumo em 2-3 frases",
  "strengths": ["ponto forte 1", "ponto forte 2"],
  "weaknesses": ["ponto fraco 1"],
  "skill_match_score": 85.0,
  "skills_matched": ["Python", "FastAPI"],
  "skills_missing": ["Kubernetes"],
  "experience_fit": "Ótimo fit - 5 anos de experiência relevante",
  "recommendation": "Recomendado para próxima etapa"
}}"""

        content = await self._chat([{"role": "user", "content": prompt}])
        data = json.loads(content)
        return ResumeAnalysis(**data)

    async def score_open_answer(self, question: str, answer: str, rubric: str | None = None) -> AnswerScore:
        rubric_text = f"\nRUBRICA: {rubric}" if rubric else ""
        prompt = f"""Avalie a resposta abaixo e retorne um JSON válido.

PERGUNTA: {question}
RESPOSTA: {answer}{rubric_text}

Retorne SOMENTE este JSON:
{{
  "score": 75.0,
  "feedback": "Boa resposta mas faltou detalhar X",
  "key_points_covered": ["ponto 1", "ponto 2"],
  "key_points_missing": ["ponto faltante"]
}}"""

        content = await self._chat([{"role": "user", "content": prompt}])
        data = json.loads(content)
        return AnswerScore(**data)

    async def generate_candidate_insight(
        self, candidate_data: dict, job_data: dict, answers_data: list[dict]
    ) -> CandidateInsight:
        prompt = f"""Gere um insight completo sobre o candidato para a vaga. Retorne JSON válido.

CANDIDATO: {json.dumps(candidate_data, ensure_ascii=False)}
VAGA: {json.dumps(job_data, ensure_ascii=False)}
RESPOSTAS: {json.dumps(answers_data, ensure_ascii=False)}

Retorne SOMENTE este JSON:
{{
  "overall_score": 78.0,
  "culture_fit_score": 80.0,
  "technical_score": 75.0,
  "communication_score": 82.0,
  "red_flags": ["flag 1"],
  "highlights": ["destaque 1", "destaque 2"],
  "interview_questions": ["pergunta 1", "pergunta 2", "pergunta 3"],
  "summary": "resumo executivo do candidato"
}}"""

        content = await self._chat([{"role": "user", "content": prompt}])
        data = json.loads(content)
        return CandidateInsight(**data)

    async def generate_interview_questions(
        self, candidate_data: dict, job_data: dict, focus_areas: list[str] | None = None
    ) -> list[str]:
        focus = f"\nFOCO: {', '.join(focus_areas)}" if focus_areas else ""
        prompt = f"""Gere 10 perguntas de entrevista personalizadas. Retorne JSON array.

CANDIDATO: {json.dumps(candidate_data, ensure_ascii=False)}
VAGA: {json.dumps(job_data, ensure_ascii=False)}{focus}

Retorne SOMENTE um array JSON: ["pergunta 1", "pergunta 2", ...]"""

        content = await self._chat([{"role": "user", "content": prompt}])
        return json.loads(content)
