export type JobStatus = "draft" | "published" | "paused" | "closed";
export type JobType = "full_time" | "part_time" | "contract" | "internship";
export type JobModality = "remote" | "hybrid" | "onsite";

export interface Job {
  id: string;
  company_id: string;
  title: string;
  slug: string;
  description: string;
  requirements?: string;
  location?: string;
  job_type?: JobType;
  modality?: JobModality;
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  status: JobStatus;
  published_at?: string;
  closes_at?: string;
  tags: string[];
  created_at: string;
}
