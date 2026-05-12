export type ApplicationStatus =
  | "submitted" | "screening" | "assessment"
  | "interview" | "offer" | "hired" | "rejected" | "withdrawn";

export type AppAssessmentStatus =
  | "pending" | "invited" | "in_progress" | "completed" | "expired" | "skipped";

export interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  company_id: string;
  status: ApplicationStatus;
  current_stage_index: number;
  cover_letter?: string;
  source?: string;
  applied_at: string;
  updated_at: string;
}

export interface ApplicationAssessment {
  id: string;
  application_id: string;
  assessment_id: string;
  status: AppAssessmentStatus;
  invitation_token?: string;
  started_at?: string;
  completed_at?: string;
  expires_at?: string;
  score?: number;
  passed?: boolean;
}
