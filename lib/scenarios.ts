import type { LeadTier } from '@/lib/automation-types';
import type { Region } from '@/lib/engine/schema';
import type { Salesperson } from '@/lib/engine/routing';

/**
 * Demo scenarios. Both run the same scoring and routing engine; only the team, volume,
 * and response targets change.
 */

export type ScenarioId = 'smb' | 'enterprise';

export interface Rep extends Salesperson {
  specialty: string;
  timezone: string;
}

export interface Scenario {
  id: ScenarioId;
  label: string;
  company: string;
  tagline: string;
  monthlyLeads: number;
  sampleSize: number;
  regions: [Region, number][];
  /** Target time for a person to follow up, by tier. */
  responseTargetMinutes: Record<LeadTier, number>;
  /** Typical first human follow-up delay, by tier (median minutes). */
  followUpMedianMinutes: Record<LeadTier, number>;
  impact: { triageMinutes: number; hourlyCost: number; manualResponseHours: number };
  reps: Rep[];
}

const cal = (slug: string) => `https://cal.northstardigital.example/${slug}`;

const rep = (
  n: number,
  name: string,
  role_title: string,
  tier_focus: LeadTier,
  max_open_leads: number,
  specialty: string,
  timezone: string,
  territory?: Region,
): Rep => ({
  id: `5a000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  name,
  email: `${name.split(' ')[0]!.toLowerCase()}@northstardigital.example`,
  role_title,
  tier_focus,
  max_open_leads,
  calendar_url: cal(name.split(' ')[0]!.toLowerCase()),
  specialty,
  timezone,
  territory,
});

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  smb: {
    id: 'smb',
    label: 'Small business',
    company: 'Northstar Digital',
    tagline: '3-person sales team · one shared inbox',
    monthlyLeads: 48,
    sampleSize: 48,
    regions: [
      ['North America', 0.8],
      ['EMEA', 0.15],
      ['APAC', 0.05],
    ],
    responseTargetMinutes: { high: 60, mid: 8 * 60, low: 48 * 60 },
    followUpMedianMinutes: { high: 35, mid: 4 * 60, low: 20 * 60 },
    impact: { triageMinutes: 12, hourlyCost: 40, manualResponseHours: 9 },
    reps: [
      rep(1, 'Sarah Whitfield', 'Principal AI Automation Lead', 'high', 8, 'ai_automation', 'America/Los_Angeles'),
      rep(2, 'Alex Moreno', 'Senior Web App Consultant', 'mid', 12, 'web_app', 'America/New_York'),
      rep(3, 'Maria Santos', 'Client Success and Support Lead', 'low', 20, 'support', 'Europe/London'),
    ],
  },
  enterprise: {
    id: 'enterprise',
    label: 'Enterprise',
    company: 'Northstar Group',
    tagline: '12 reps · North America, EMEA, APAC territories',
    monthlyLeads: 900,
    sampleSize: 260,
    regions: [
      ['North America', 0.5],
      ['EMEA', 0.32],
      ['APAC', 0.18],
    ],
    responseTargetMinutes: { high: 15, mid: 4 * 60, low: 24 * 60 },
    followUpMedianMinutes: { high: 11, mid: 2.5 * 60, low: 12 * 60 },
    impact: { triageMinutes: 9, hourlyCost: 55, manualResponseHours: 26 },
    reps: [
      rep(
        11,
        'Jordan Ellis',
        'Enterprise Account Executive',
        'high',
        14,
        'ai_automation',
        'America/New_York',
        'North America',
      ),
      rep(12, 'Priya Raman', 'Enterprise Account Executive', 'high', 14, 'web_app', 'America/Chicago', 'North America'),
      rep(13, 'Marcus Lee', 'Mid-Market Account Executive', 'mid', 26, 'web_app', 'America/Denver', 'North America'),
      rep(
        14,
        'Dana Brooks',
        'Mid-Market Account Executive',
        'mid',
        26,
        'website',
        'America/Los_Angeles',
        'North America',
      ),
      rep(15, 'Nate Coleman', 'Customer Success Manager', 'low', 40, 'support', 'America/New_York', 'North America'),
      rep(21, 'Sophie Laurent', 'Enterprise Account Executive', 'high', 14, 'ai_automation', 'Europe/Paris', 'EMEA'),
      rep(22, 'Tobias Krüger', 'Enterprise Account Executive', 'high', 14, 'consulting', 'Europe/Berlin', 'EMEA'),
      rep(23, 'Amira Haddad', 'Mid-Market Account Executive', 'mid', 26, 'web_app', 'Europe/London', 'EMEA'),
      rep(24, 'Liam O’Connor', 'Customer Success Manager', 'low', 40, 'support', 'Europe/Dublin', 'EMEA'),
      rep(31, 'Kenji Watanabe', 'Enterprise Account Executive', 'high', 14, 'ai_automation', 'Asia/Tokyo', 'APAC'),
      rep(32, 'Mei Lin Tan', 'Mid-Market Account Executive', 'mid', 26, 'web_app', 'Asia/Singapore', 'APAC'),
      rep(33, 'Olivia Grant', 'Customer Success Manager', 'low', 40, 'support', 'Australia/Sydney', 'APAC'),
    ],
  },
};

export const SCENARIO_IDS: ScenarioId[] = ['smb', 'enterprise'];
export const SCENARIO_COOKIE = 'ns_scenario';
export const parseScenarioId = (v: string | null | undefined): ScenarioId =>
  v === 'enterprise' ? 'enterprise' : 'smb';
