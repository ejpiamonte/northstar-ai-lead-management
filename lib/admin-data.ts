// lib/admin-data.ts
import type { LeadTier } from '@/lib/automation-types';

/** Row shapes that mirror supabase/migrations/001_northstar_init.sql. Read-only, no schema changes. */

export type LeadStatus =
  | 'new'
  | 'analyzing'
  | 'assigned'
  | 'contacted'
  | 'qualified'
  | 'appointment_set'
  | 'won'
  | 'lost';

export interface LeadAnalysis {
  service_category?: string;
  intent?: string;
  urgency?: string;
  estimated_budget_usd?: number;
  score?: number;
  confidence?: number;
  summary?: string;
  key_signals?: string[];
  risks?: string[];
  recommended_next_step?: string;
  suggested_reply_subject?: string;
  suggested_reply_body?: string;
  provider?: string;
  model?: string;
}

export interface LeadRow {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  phone: string | null;
  service_interest: string | null;
  budget_range: string | null;
  timeline: string | null;
  message: string;
  source: string;
  status: LeadStatus;
  tier: LeadTier | null;
  score: number | null;
  ai_analysis: LeadAnalysis | null;
  assigned_to: string | null;
  assigned_at: string | null;
  is_demo: boolean;
  created_at: string;
  salespeople?: { name: string } | null;
}

export interface SalespersonRow {
  id: string;
  name: string;
  email: string;
  role_title: string;
  specialty: string;
  tier_focus: LeadTier;
  max_open_leads: number;
  calendar_url: string | null;
  timezone: string;
  active: boolean;
}

export interface AppointmentRow {
  id: string;
  lead_id: string;
  salesperson_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: 'proposed' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  meeting_url: string | null;
  notes: string | null;
  leads?: { full_name: string; company: string | null } | null;
  salespeople?: { name: string } | null;
}

export interface EmailLogRow {
  id: string;
  lead_id: string | null;
  email_type: 'lead_acknowledgment' | 'rep_notification' | 'follow_up';
  direction: 'outbound' | 'internal';
  to_email: string;
  from_email: string;
  subject: string;
  body: string;
  status: 'queued' | 'mocked' | 'sent' | 'failed';
  provider: string | null;
  is_mock: boolean;
  error: string | null;
  sent_at: string | null;
  created_at: string;
  leads?: { full_name: string } | null;
}

export const OPEN_STATUSES: LeadStatus[] = ['assigned', 'contacted', 'qualified', 'appointment_set'];

/** Throws on a Supabase error so app/admin/error.tsx renders. */
export function unwrap<T>(res: { data: T | null; error: { message: string } | null }, ctx: string): T {
  if (res.error) throw new Error(`${ctx}: ${res.error.message}`);
  return (res.data ?? ([] as unknown)) as T;
}