import type { AutomationStep, LeadTier } from '@/lib/automation-types';
import type { Analysis, LeadInput } from './schema';
import { scoreLead, type ScoreBreakdown } from './scoring';
import { chooseSalesperson, classifyTier, type Salesperson } from './routing';

export interface EmailDraft {
  email_type: 'lead_acknowledgment' | 'rep_notification';
  direction: 'outbound' | 'internal';
  to: string;
  subject: string;
  body: string;
}

export interface PipelineResult {
  analysis: Analysis;
  /** Points behind the score. Null when the analysis came from a model rather than the heuristic. */
  breakdown: ScoreBreakdown | null;
  tier: LeadTier;
  tierRule: string;
  rep: Salesperson;
  routeRule: string;
  emails: EmailDraft[];
  appointmentAt: string | null;
  steps: AutomationStep[];
  durationMs: number;
}

export function nextBusinessDayAt(hourUtc: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(hourUtc, 0, 0, 0);
  return d;
}

export function draftEmails(input: LeadInput, analysis: Analysis, tier: LeadTier, rep: Salesperson): EmailDraft[] {
  const signature = `\n\n${rep.name}\n${rep.role_title}, Northstar Digital${rep.calendar_url ? `\nBook a time: ${rep.calendar_url}` : ''}`;
  return [
    {
      email_type: 'lead_acknowledgment',
      direction: 'outbound',
      to: input.email,
      subject: analysis.suggested_reply_subject,
      body: `${analysis.suggested_reply_body}${signature}`,
    },
    {
      email_type: 'rep_notification',
      direction: 'internal',
      to: rep.email,
      subject: `New ${tier}-tier lead: ${input.full_name}${input.company ? ` (${input.company})` : ''}`,
      body: [
        `Score: ${analysis.score}/100 (${tier} tier)`,
        `Category: ${analysis.service_category} | Urgency: ${analysis.urgency}`,
        `Budget estimate: $${analysis.estimated_budget_usd.toLocaleString('en-US')}`,
        '',
        analysis.summary,
        '',
        `Next step: ${analysis.recommended_next_step}`,
        `Signals: ${analysis.key_signals.join('; ') || 'none'}`,
        `Risks: ${analysis.risks.join('; ') || 'none'}`,
      ].join('\n'),
    },
  ];
}

/**
 * The full qualification workflow without a database: score, tier, route, draft emails,
 * and propose a call. Used by the public form when no database is configured and by the
 * demo dashboard generator, so both show exactly what the live rules would do.
 */
export function runLeadPipeline(
  input: LeadInput,
  reps: Salesperson[],
  openCounts: Map<string, number>,
  options: { now?: Date; persisted?: boolean; durations?: number[]; analysis?: Analysis } = {},
): PipelineResult {
  const now = options.now ?? new Date();
  const durations = options.durations ?? [3, 1, 42, 6, 2, 9, 5, 2];
  const scored = options.analysis ? { analysis: options.analysis, breakdown: null } : scoreLead(input);
  const { analysis, breakdown } = scored;
  const { tier, rule: tierRule } = classifyTier(analysis);
  const { rep, rule: routeRule } = chooseSalesperson(tier, reps, openCounts, input.region);
  const emails = draftEmails(input, analysis, tier, rep);
  const appointmentAt = tier === 'high' ? nextBusinessDayAt(17, now).toISOString() : null;

  let clock = now.getTime();
  const step = (
    k: number,
    key: string,
    label: string,
    status: AutomationStep['status'],
    detail: string,
    output?: Record<string, unknown>,
  ): AutomationStep => {
    const s = {
      key,
      label,
      status,
      started_at: new Date(clock).toISOString(),
      duration_ms: durations[k] ?? 5,
      detail,
      output,
    };
    clock += s.duration_ms;
    return s;
  };

  const steps: AutomationStep[] = [
    step(0, 'validate_payload', 'Validate form submission', 'success', `Payload accepted for ${input.email}`),
    step(
      1,
      'check_demo_mode',
      'Check Demo Mode toggle',
      'success',
      'Demo Mode: AI and email providers are never called.',
    ),
    options.persisted === false
      ? step(
          2,
          'persist_lead',
          'Save lead record',
          'skipped',
          'No database configured, so the lead was processed in memory and not stored.',
        )
      : step(2, 'persist_lead', 'Save lead record', 'success', 'Lead created with status "new"'),
    step(
      3,
      'ai_analysis',
      'Analyze lead with AI',
      'success',
      options.analysis
        ? 'Pre-recorded example analysis used, no OpenAI call made.'
        : 'Demo Mode: deterministic mock analyzer used, no OpenAI call made.',
      {
        score: analysis.score,
        category: analysis.service_category,
      },
    ),
    step(4, 'apply_tier_rules', 'Apply tier rules', 'success', `${tier} tier: ${tierRule}`, {
      tier,
      score: analysis.score,
    }),
    step(5, 'assign_salesperson', 'Assign salesperson', 'success', routeRule, { salesperson: rep.name }),
    step(
      6,
      'generate_emails',
      'Generate and log emails',
      'success',
      `${emails.length} emails drafted as mock messages. Nothing was sent.`,
    ),
    tier === 'high'
      ? step(
          7,
          'propose_appointment',
          'Propose discovery call',
          'success',
          `45-minute call proposed with ${rep.name} for ${new Date(appointmentAt!).toUTCString()}.`,
        )
      : step(
          7,
          'propose_appointment',
          'Propose discovery call',
          'skipped',
          `Only high-tier leads get an automatic proposal. This lead is ${tier} tier.`,
        ),
  ];

  return {
    analysis: { ...analysis },
    breakdown,
    tier,
    tierRule,
    rep,
    routeRule,
    emails,
    appointmentAt,
    steps,
    durationMs: clock - now.getTime(),
  };
}
