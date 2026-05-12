export type QuestionType = "multiple_choice" | "true_false" | "open_text" | "code" | "rating_scale" | "file_upload";
export type AssessmentType = "quiz" | "coding" | "personality" | "technical" | "mixed";
export type AssessmentStatus = "draft" | "active" | "archived";

export interface QuestionOption {
  id: string;
  text: string;
  is_correct?: boolean;
}

export interface Question {
  id: string;
  assessment_id: string;
  order_index: number;
  type: QuestionType;
  content: string;
  points: number;
  is_required: boolean;
  time_limit_seconds?: number;
  options?: QuestionOption[];
  media_url?: string;
}

export interface Assessment {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  type: AssessmentType;
  time_limit_minutes?: number;
  passing_score?: number;
  randomize_questions: boolean;
  show_results_to_candidate: boolean;
  status: AssessmentStatus;
  questions: Question[];
  created_at: string;
}
