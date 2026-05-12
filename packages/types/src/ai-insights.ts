export interface ResumeAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  skill_match_score: number;
  skills_matched: string[];
  skills_missing: string[];
  experience_fit: string;
  recommendation: string;
}

export interface CandidateInsight {
  overall_score: number;
  culture_fit_score: number;
  technical_score: number;
  communication_score: number;
  red_flags: string[];
  highlights: string[];
  interview_questions: string[];
  summary: string;
}

export interface AIInsight {
  id: string;
  entity_type: "candidate" | "application" | "assessment_result";
  entity_id: string;
  insight_type: string;
  provider: string;
  content: ResumeAnalysis | CandidateInsight | Record<string, unknown>;
  created_at: string;
}
