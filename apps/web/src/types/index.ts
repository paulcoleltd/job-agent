export interface Job {
  id: string;
  source: string;
  company: string;
  title: string;
  location?: string;
  remote_type?: string;
  salary_min?: number;
  salary_max?: number;
  description?: string;
  apply_url?: string;
  match_score?: number;
  status: string;
  discovered_at?: string;
}

export interface Application {
  id: string;
  job_id: string;
  status: string;
  submitted_at?: string;
  submission_mode?: string;
  notes?: string;
  created_at?: string;
}

export interface AgentRun {
  id: string;
  agent_name: string;
  started_at: string;
  ended_at?: string;
  status: string;
  summary?: Record<string, unknown>;
}

export interface UserProfile {
  cv_text?: string;
  skills: string[];
  preferences: Record<string, unknown>;
}
