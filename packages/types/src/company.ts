export type CompanyPlan = "free" | "starter" | "professional" | "enterprise";

export interface Company {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo_url?: string;
  plan: CompanyPlan;
  is_active: boolean;
  max_recruiters: number;
  max_jobs: number;
  created_at: string;
}
