import type { Role } from "./common";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  company_id: string | null;
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
