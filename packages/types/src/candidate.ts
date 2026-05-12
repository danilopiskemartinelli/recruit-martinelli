export interface Candidate {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  linkedin_url?: string;
  resume_url?: string;
  location?: string;
  summary?: string;
  skills: string[];
  experience_years?: number;
  source?: string;
  created_at: string;
}
