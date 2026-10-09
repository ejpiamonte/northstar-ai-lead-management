export type LeadTier = 'high' | 'mid' | 'low';
export type RunMode = 'demo' | 'live';
export type StepStatus = 'success' | 'warning' | 'skipped' | 'failed';
export type RunStatus = 'running' | 'success' | 'partial' | 'failed';

export interface AutomationStep {
  key: string;
  label: string;
  status: StepStatus;
  started_at: string;
  duration_ms: number;
  detail?: string;
  output?: Record<string, unknown>;
}

export interface AutomationRun {
  id: string;
  lead_id: string | null;
  trigger: string;
  mode: RunMode;
  status: RunStatus;
  ai_provider: string | null;
  model: string | null;
  duration_ms: number | null;
  error: string | null;
  steps: AutomationStep[];
  started_at: string;
  completed_at: string | null;
}

export interface LeadActivity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}
