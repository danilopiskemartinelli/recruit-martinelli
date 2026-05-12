from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class ResumeAnalysis:
    summary: str
    strengths: list[str]
    weaknesses: list[str]
    skill_match_score: float  # 0-100
    skills_matched: list[str]
    skills_missing: list[str]
    experience_fit: str
    recommendation: str


@dataclass
class AnswerScore:
    score: float  # 0-100
    feedback: str
    key_points_covered: list[str]
    key_points_missing: list[str]


@dataclass
class CandidateInsight:
    overall_score: float
    culture_fit_score: float
    technical_score: float
    communication_score: float
    red_flags: list[str]
    highlights: list[str]
    interview_questions: list[str]
    summary: str


class AIProvider(ABC):
    """Abstract base for all AI provider implementations."""

    @abstractmethod
    async def analyze_resume(
        self, resume_text: str, job_description: str, job_requirements: str
    ) -> ResumeAnalysis:
        """Analyze a candidate's resume against a job description."""
        ...

    @abstractmethod
    async def score_open_answer(
        self, question: str, answer: str, rubric: str | None = None
    ) -> AnswerScore:
        """Evaluate and score an open-text assessment answer."""
        ...

    @abstractmethod
    async def generate_candidate_insight(
        self, candidate_data: dict, job_data: dict, answers_data: list[dict]
    ) -> CandidateInsight:
        """Generate comprehensive insight for a candidate application."""
        ...

    @abstractmethod
    async def generate_interview_questions(
        self, candidate_data: dict, job_data: dict, focus_areas: list[str] | None = None
    ) -> list[str]:
        """Generate tailored interview questions."""
        ...
