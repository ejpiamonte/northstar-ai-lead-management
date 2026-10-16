/**
 * Deterministic demo pipeline.
 *
 * Every person, company, and enquiry is fictional. Leads are synthesised from a seeded random
 * generator and then run through the real scoring and routing engine (lib/engine), with each rep's
 * open-lead load tracked over time, so tiers and assignments are exactly what the live rules produce.
 */
import seed from '@/data/seed-leads.json';
import type { AppointmentRow, EmailLogRow, LeadRow, LeadStatus } from '@/lib/admin-data';
import type { AutomationRun, LeadActivity, LeadTier } from '@/lib/automation-types';
import { runLeadPipeline } from '@/lib/engine/pipeline';
import type { ScoreBreakdown } from '@/lib/engine/scoring';
import type { Analysis, LeadInput, Region } from '@/lib/engine/schema';
import { SCENARIOS, type Rep, type Scenario, type ScenarioId } from '@/lib/scenarios';

export interface DemoLead extends LeadRow {
  region: Region;
  rep: Rep;
  breakdown: ScoreBreakdown | null;
  tierRule: string;
  routeRule: string;
  run: AutomationRun;
  activities: LeadActivity[];
  emails: EmailLogRow[];
  appointment: AppointmentRow | null;
  /** Automated acknowledgement time (ms). */
  autoReplyMs: number;
  /** Time until the assigned rep first followed up (ms), or null if not yet. */
  followUpMs: number | null;
  withinTarget: boolean | null;
  closedAt: string | null;
  showcase?: 'high' | 'mid' | 'low';
}

/* ------------------------------------------------------------------ */
/* Seeded randomness                                                   */
/* ------------------------------------------------------------------ */

function mulberry32(seedValue: number) {
  let a = seedValue;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rng = () => number;
const between = (rng: Rng, min: number, max: number) => min + rng() * (max - min);
const int = (rng: Rng, min: number, max: number) => Math.floor(between(rng, min, max + 1));
const pick = <T>(rng: Rng, items: readonly T[]) => items[Math.floor(rng() * items.length)]!;
function weighted<T>(rng: Rng, items: readonly (readonly [T, number])[]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let roll = rng() * total;
  for (const [item, w] of items) {
    roll -= w;
    if (roll <= 0) return item;
  }
  return items[items.length - 1]![0];
}
/** Log-normal-ish delay around a median, in ms. */
const delayAround = (rng: Rng, medianMinutes: number) =>
  Math.round(medianMinutes * Math.exp(between(rng, -0.9, 0.9)) * 60_000);

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const pad = (n: number) => String(n).padStart(12, '0');

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

const FIRST = [
  'Avery',
  'Jamal',
  'Chloe',
  'Mateo',
  'Hannah',
  'Ravi',
  'Grace',
  'Diego',
  'Noor',
  'Ethan',
  'Leila',
  'Owen',
  'Yuki',
  'Isabel',
  'Samuel',
  'Fatima',
  'Lucas',
  'Ana',
  'Connor',
  'Mia',
  'Tariq',
  'Elena',
  'Ben',
  'Zara',
  'Felix',
  'Aisha',
  'Hugo',
  'Nina',
  'Kofi',
  'Laura',
];
const LAST = [
  'Patel',
  'Nguyen',
  'Okafor',
  'Schmidt',
  'Rossi',
  'Kowalski',
  'Haddad',
  'Fischer',
  'Garcia',
  'Kim',
  'Andersson',
  'Murphy',
  'Silva',
  'Dubois',
  'Tanaka',
  'Clarke',
  'Mensah',
  'Novak',
  'Reyes',
  'Bauer',
  'Ito',
  'Walsh',
  'Costa',
  'Iyer',
  'Moreau',
];
const PREFIX = [
  'Halden',
  'Brightwell',
  'Corvid',
  'Larkspur',
  'Bluewater',
  'Summit',
  'Redwood',
  'Ironbridge',
  'Kestrel',
  'Northgate',
  'Silverline',
  'Oakmont',
  'Harbourside',
  'Granite',
  'Willow',
  'Crescent',
  'Pinecrest',
  'Lumen',
  'Copperfield',
  'Westbrook',
];
const INDUSTRY: [string, string][] = [
  ['Freight', 'logistics'],
  ['Dental Partners', 'dental'],
  ['Health Group', 'healthcare'],
  ['Legal', 'legal'],
  ['Manufacturing', 'manufacturing'],
  ['Realty', 'real estate'],
  ['Retail', 'retail'],
  ['Insurance', 'insurance'],
  ['Architects', 'architecture'],
  ['Fitness', 'fitness'],
  ['Labs', 'biotech'],
  ['Hotels', 'hospitality'],
  ['Energy', 'energy'],
  ['Foods', 'food'],
  ['Software', 'software'],
  ['Accounting', 'accounting'],
];
const TOOLS = [
  'HubSpot',
  'Salesforce',
  'NetSuite',
  'QuickBooks',
  'Zendesk',
  'Shopify',
  'Airtable',
  'Monday.com',
  'Xero',
];

type Service =
  | 'AI workflow automation'
  | 'Custom web application'
  | 'Website design and build'
  | 'Support and maintenance'
  | 'Consulting'
  | 'Something else';

const MESSAGES: Record<Service, string[]> = {
  'AI workflow automation': [
    'Our {team}-person operations team re-keys orders from email into {tool} every day. We want an AI workflow that reads the emails, updates {tool}, and flags exceptions for a person to approve.',
    'We receive about 300 support tickets a week. We are looking for an AI agent that drafts replies from our help center and routes anything sensitive to a person. We use {tool}.',
    'Finance spends two days every month matching invoices to purchase orders. Can you automate the matching and only send us the mismatches? We run {tool}.',
    'We want new deals in {tool} to create projects automatically, with Slack alerts for the delivery team. Today it is all spreadsheets and copy-paste.',
  ],
  'Custom web application': [
    'We need a customer portal where our {industry} clients can upload documents, track status, and message our team. Today it is all email and phone calls.',
    'We want to replace a stack of spreadsheets with an internal tool for scheduling field technicians, plus a dashboard for managers.',
    'We have validated an idea for a booking platform for {industry} businesses and need a team to design and build the MVP.',
  ],
  'Website design and build': [
    'Our website is five years old and does not work well on phones. We would like a redesign with a clearer services section and online booking.',
    'We are launching a new product line and need a landing page and a refreshed Shopify site.',
  ],
  'Support and maintenance': [
    'The contact form on our WordPress site stopped sending emails after a plugin update. Can someone fix it?',
    'Looking for a monthly support retainer covering hosting, updates, and small fixes on our existing site.',
    'Checkout on our site is broken on mobile since yesterday. Need help asap.',
  ],
  Consulting: [
    'We are a {team}-person {industry} company and want an outside technology audit and a 12-month roadmap.',
    'We need advice on whether to build or buy a client management system before our next funding round.',
  ],
  'Something else': [
    'Saw your work on LinkedIn and wanted to learn more about what you do.',
    'Is this the right place to ask about partnership opportunities?',
  ],
};

const SERVICE_MIX: Record<ScenarioId, [Service, number][]> = {
  smb: [
    ['AI workflow automation', 0.26],
    ['Custom web application', 0.18],
    ['Website design and build', 0.2],
    ['Support and maintenance', 0.22],
    ['Consulting', 0.06],
    ['Something else', 0.08],
  ],
  enterprise: [
    ['AI workflow automation', 0.36],
    ['Custom web application', 0.24],
    ['Website design and build', 0.08],
    ['Support and maintenance', 0.14],
    ['Consulting', 0.11],
    ['Something else', 0.07],
  ],
};
const BUDGET_MIX: Record<ScenarioId, [string, number][]> = {
  smb: [
    ['Not sure yet', 0.25],
    ['Under $2,000', 0.22],
    ['$2,000 - $10,000', 0.28],
    ['$10,000 - $25,000', 0.17],
    ['$25,000 - $50,000', 0.06],
    ['$50,000+', 0.02],
  ],
  enterprise: [
    ['Not sure yet', 0.2],
    ['Under $2,000', 0.06],
    ['$2,000 - $10,000', 0.16],
    ['$10,000 - $25,000', 0.24],
    ['$25,000 - $50,000', 0.2],
    ['$50,000+', 0.14],
  ],
};
const TIMELINES: [string, number][] = [
  ['As soon as possible', 0.22],
  ['Within a month', 0.28],
  ['This quarter', 0.3],
  ['Just exploring', 0.2],
];
const SOURCES: Record<ScenarioId, [string, number][]> = {
  smb: [
    ['website_form', 0.7],
    ['referral', 0.15],
    ['linkedin', 0.1],
    ['event', 0.05],
  ],
  enterprise: [
    ['website_form', 0.5],
    ['paid_search', 0.18],
    ['linkedin', 0.12],
    ['partner', 0.1],
    ['event', 0.1],
  ],
};

/* Progression odds after first contact, by tier: [qualified, meeting, won]. */
const PROGRESS: Record<LeadTier, [number, number, number]> = {
  high: [0.78, 0.65, 0.45],
  mid: [0.55, 0.4, 0.35],
  low: [0.3, 0.12, 0.3],
};

/* ------------------------------------------------------------------ */
/* Showcase leads (pinned, recent)                                     */
/* ------------------------------------------------------------------ */

type ShowcaseSpec = { key: 'high' | 'mid' | 'low'; minutesAgo: number; input: LeadInput; narrativeFrom?: number };

const seedLead = (k: number) => seed.leads[k]!;
const seedInput = (k: number, region: Region): LeadInput => {
  const l = seedLead(k);
  return {
    full_name: l.full_name,
    email: l.email,
    company: l.company,
    phone: l.phone ?? undefined,
    service_interest: l.service_interest,
    budget_range: l.budget_range,
    timeline: l.timeline,
    message: l.message,
    source: 'website_form',
    region,
  };
};

const SHOWCASE: Record<ScenarioId, ShowcaseSpec[]> = {
  smb: [
    { key: 'high', minutesAgo: 38, input: seedInput(0, 'North America'), narrativeFrom: 0 },
    { key: 'mid', minutesAgo: 95, input: seedInput(1, 'North America'), narrativeFrom: 1 },
    { key: 'low', minutesAgo: 150, input: seedInput(2, 'EMEA'), narrativeFrom: 2 },
  ],
  enterprise: [
    {
      key: 'high',
      minutesAgo: 22,
      input: {
        full_name: 'Ingrid Solberg',
        email: 'ingrid.solberg@nordhavnshipping.example',
        company: 'Nordhavn Shipping Group',
        phone: '+47 555 01 822',
        service_interest: 'AI workflow automation',
        budget_range: '$50,000+',
        timeline: 'As soon as possible',
        message:
          'I run operations for a 1,200-person shipping group across 9 ports. Customs documents arrive as PDFs in four languages and our clearance team re-keys them into SAP. We want an AI workflow that extracts the data, validates it against booking records, and routes exceptions to the right port team. Budget is approved and we need a partner this quarter; the current backlog is urgent.',
        source: 'website_form',
        region: 'EMEA',
      },
    },
    {
      key: 'mid',
      minutesAgo: 70,
      input: {
        full_name: 'Arjun Mehta',
        email: 'arjun.mehta@lotuscareclinics.example',
        company: 'Lotus Care Clinics',
        service_interest: 'Custom web application',
        budget_range: '$10,000 - $25,000',
        timeline: 'This quarter',
        message:
          'We operate 14 outpatient clinics in Singapore and Malaysia and want a patient portal for appointment changes, pre-visit forms, and secure messaging with front desks. It needs to integrate with our scheduling system.',
        source: 'paid_search',
        region: 'APAC',
      },
    },
    {
      key: 'low',
      minutesAgo: 125,
      input: {
        full_name: 'Kevin Park',
        email: 'kevin.park@ridgelinecu.example',
        company: 'Ridgeline Credit Union',
        service_interest: 'Support and maintenance',
        budget_range: 'Under $2,000',
        timeline: 'Within a month',
        message: 'A plugin on our branch-locator page is broken after an update. Can you fix it?',
        source: 'website_form',
        region: 'North America',
      },
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Generation                                                          */
/* ------------------------------------------------------------------ */

type Draft = { id: string; createdAt: number; input: LeadInput; showcase?: ShowcaseSpec };

function draftInputs(scenario: Scenario, rng: Rng, now: number): Draft[] {
  const drafts: Draft[] = [];
  const prefix = scenario.id === 'smb' ? 'a2000000' : 'a3000000';
  for (let n = 0; n < scenario.sampleSize; n++) {
    // Stratified over 30 days so volume is spread like a real inbox, with random jitter inside each slot.
    let createdAt = now - (0.15 + ((n + rng()) / scenario.sampleSize) * 29.8) * DAY;
    const d = new Date(createdAt);
    if ((d.getUTCDay() === 0 || d.getUTCDay() === 6) && rng() < 0.65) createdAt -= 2 * DAY;
    if (createdAt < now - 30 * DAY) createdAt += 3 * DAY;
    const service = weighted(rng, SERVICE_MIX[scenario.id]);
    const [suffix, industry] = pick(rng, INDUSTRY);
    const company = `${pick(rng, PREFIX)} ${suffix}${scenario.id === 'enterprise' && rng() < 0.4 ? ` ${pick(rng, ['Group', 'Holdings', 'International'])}` : ''}`;
    const first = pick(rng, FIRST);
    const last = pick(rng, LAST);
    const team = scenario.id === 'smb' ? int(rng, 4, 40) : int(rng, 80, 2000);
    const message = pick(rng, MESSAGES[service])
      .replaceAll('{team}', String(team))
      .replaceAll('{tool}', pick(rng, TOOLS))
      .replaceAll('{industry}', industry);
    const region = weighted(rng, scenario.regions);
    drafts.push({
      id: `${prefix}-0000-4000-8000-${pad(n + 1)}`,
      createdAt,
      input: {
        full_name: `${first} ${last}`,
        email: `${first}.${last}@${company.toLowerCase().replace(/[^a-z]+/g, '')}.example`.toLowerCase(),
        company: rng() < 0.9 ? company : undefined,
        phone: rng() < 0.55 ? `+1 555 01${int(rng, 10, 99)}` : undefined,
        service_interest: service,
        budget_range: weighted(rng, BUDGET_MIX[scenario.id]),
        timeline: weighted(rng, TIMELINES),
        message,
        source: weighted(rng, SOURCES[scenario.id]),
        region,
      },
    });
  }
  SHOWCASE[scenario.id].forEach((spec, k) => {
    const id =
      scenario.id === 'smb' ? seedLead(spec.narrativeFrom!).id : `a3000000-0000-4000-8000-9${pad(k + 1).slice(1)}`;
    drafts.push({ id, createdAt: now - spec.minutesAgo * MIN, input: spec.input, showcase: spec });
  });
  return drafts.sort((a, b) => a.createdAt - b.createdAt);
}

function generate(scenarioId: ScenarioId, now: number): DemoLead[] {
  const scenario = SCENARIOS[scenarioId];
  const rng = mulberry32(scenarioId === 'smb' ? 7331 : 9113);
  const leads: DemoLead[] = [];

  for (const draft of draftInputs(scenario, rng, now)) {
    // Open load per rep at the moment this lead arrived.
    const openCounts = new Map<string, number>();
    for (const prior of leads) {
      const closed = prior.closedAt && Date.parse(prior.closedAt) <= draft.createdAt;
      if (!closed) openCounts.set(prior.rep.id, (openCounts.get(prior.rep.id) ?? 0) + 1);
    }
    const durations = [
      int(rng, 2, 6),
      int(rng, 1, 3),
      int(rng, 35, 90),
      int(rng, 4, 12),
      int(rng, 1, 4),
      int(rng, 6, 20),
      int(rng, 3, 9),
      int(rng, 1, 4),
    ];
    // The pinned small-business examples carry a hand-written analysis (standing in for a model's output);
    // it still goes through the real tier and routing rules.
    const preset =
      draft.showcase?.narrativeFrom !== undefined
        ? (seedLead(draft.showcase.narrativeFrom).ai_analysis as Analysis)
        : undefined;
    const result = runLeadPipeline(draft.input, scenario.reps, openCounts, {
      now: new Date(draft.createdAt),
      durations,
      analysis: preset,
    });
    const rep = scenario.reps.find((r) => r.id === result.rep.id)!;
    const analysis = result.analysis;

    // Lifecycle after routing.
    const tier = result.tier;
    const timeline: { status: LeadStatus; at: number; title: string }[] = [];
    let closedAt: number | null = null;
    const followUp = draft.showcase ? null : delayAround(rng, scenario.followUpMedianMinutes[tier]);
    if (followUp !== null) {
      let t = draft.createdAt + followUp;
      timeline.push({ status: 'contacted', at: t, title: `${rep.name.split(' ')[0]} replied personally` });
      const [pq, pm, pw] = PROGRESS[tier];
      const steps: [LeadStatus, number, number, number, string][] = [
        ['qualified', pq, 1, 4, 'Qualified after discovery'],
        ['appointment_set', pm, 1, 5, 'Scoping meeting booked'],
        ['won', pw, 5, 14, 'Proposal accepted'],
      ];
      for (const [status, p, minD, maxD, title] of steps) {
        if (rng() < p) {
          t += between(rng, minD, maxD) * DAY;
          timeline.push({ status, at: t, title });
          if (status === 'won') closedAt = t;
        } else {
          if (rng() < 0.88) {
            t += between(rng, 2, 8) * DAY;
            timeline.push({
              status: 'lost',
              at: t,
              title: pick(rng, [
                'No budget this year',
                'Chose another vendor',
                'Went quiet after follow-ups',
                'Project postponed',
              ]),
            });
            closedAt = t;
          }
          break;
        }
      }
    }
    const reached = timeline.filter((s) => s.at <= now);
    const status: LeadStatus = reached.at(-1)?.status ?? 'assigned';
    const contactedAt = timeline[0] && timeline[0].at <= now ? timeline[0].at : null;

    const iso = (ms: number) => new Date(ms).toISOString();
    const runId = draft.id.replace(/^a/, 'b');
    const run: AutomationRun = {
      id: runId,
      lead_id: draft.id,
      trigger: draft.input.source === 'website_form' ? 'webhook' : draft.input.source,
      mode: 'demo',
      status: 'success',
      ai_provider: 'mock',
      model: 'heuristic-v1',
      duration_ms: result.durationMs,
      error: null,
      steps: result.steps,
      started_at: iso(draft.createdAt),
      completed_at: iso(draft.createdAt + result.durationMs),
    };

    const activities: LeadActivity[] = [
      {
        id: `${runId}-1`,
        activity_type: 'lead_received',
        title: 'Form submission received',
        description: `${draft.input.full_name}${draft.input.company ? ` (${draft.input.company})` : ''} submitted the contact form.`,
        created_at: iso(draft.createdAt),
      },
      {
        id: `${runId}-2`,
        activity_type: 'ai_analysis',
        title: `Scored ${analysis.score}/100 (${tier} tier)`,
        description: analysis.summary,
        created_at: iso(draft.createdAt + 60),
      },
      {
        id: `${runId}-3`,
        activity_type: 'assigned',
        title: `Assigned to ${rep.name}`,
        description: result.routeRule,
        created_at: iso(draft.createdAt + 80),
      },
      {
        id: `${runId}-4`,
        activity_type: 'email_logged',
        title: 'Acknowledgement and rep alert drafted',
        description: `Reply to ${draft.input.email} and alert to ${rep.email} (mock, not sent).`,
        created_at: iso(draft.createdAt + 95),
      },
    ];
    if (result.appointmentAt)
      activities.push({
        id: `${runId}-5`,
        activity_type: 'appointment_proposed',
        title: 'Discovery call proposed',
        description: `45 minutes with ${rep.name}.`,
        created_at: iso(draft.createdAt + 100),
      });
    reached.forEach((s, k) =>
      activities.push({
        id: `${runId}-h${k}`,
        activity_type: s.status === 'contacted' ? 'contacted' : 'status_change',
        title: s.title,
        description: `${rep.name} · status ${s.status.replace('_', ' ')}`,
        created_at: iso(s.at),
      }),
    );

    const emails: EmailLogRow[] = result.emails.map((e, k) => ({
      id: `${runId}-e${k}`,
      lead_id: draft.id,
      email_type: e.email_type,
      direction: e.direction,
      to_email: e.to,
      from_email: 'Northstar Digital <hello@northstardigital.example>',
      subject: k === 0 ? analysis.suggested_reply_subject : e.subject,
      body: k === 0 ? `${analysis.suggested_reply_body}\n\n${rep.name}\n${rep.role_title}, Northstar Digital` : e.body,
      status: 'mocked',
      provider: 'mock',
      is_mock: true,
      error: null,
      sent_at: null,
      created_at: iso(draft.createdAt + result.durationMs),
      leads: { full_name: draft.input.full_name },
    }));

    let appointment: AppointmentRow | null = null;
    const meetingStage = timeline.find((s) => s.status === 'appointment_set');
    if (result.appointmentAt || (meetingStage && meetingStage.at <= now)) {
      const scheduled = result.appointmentAt ? Date.parse(result.appointmentAt) : meetingStage!.at + 2 * DAY;
      const lostEarly = status === 'lost' && !meetingStage;
      appointment = {
        id: draft.id.replace(/^a/, 'd'),
        lead_id: draft.id,
        salesperson_id: rep.id,
        scheduled_at: iso(scheduled),
        duration_minutes: 45,
        status: lostEarly
          ? 'cancelled'
          : scheduled > now
            ? contactedAt
              ? 'confirmed'
              : 'proposed'
            : meetingStage || status === 'qualified'
              ? 'completed'
              : 'no_show',
        meeting_url: rep.calendar_url,
        notes: `Auto-proposed. ${analysis.recommended_next_step}`,
        leads: { full_name: draft.input.full_name, company: draft.input.company ?? null },
        salespeople: { name: rep.name },
      };
    }

    const followUpMs = contactedAt ? contactedAt - draft.createdAt : null;
    leads.push({
      id: draft.id,
      full_name: draft.input.full_name,
      email: draft.input.email,
      company: draft.input.company ?? null,
      phone: draft.input.phone ?? null,
      service_interest: draft.input.service_interest ?? null,
      budget_range: draft.input.budget_range ?? null,
      timeline: draft.input.timeline ?? null,
      message: draft.input.message,
      source: draft.input.source,
      status,
      tier,
      score: analysis.score,
      ai_analysis: { ...analysis, provider: 'mock', model: 'heuristic-v1' },
      assigned_to: rep.id,
      assigned_at: iso(draft.createdAt + result.durationMs),
      is_demo: true,
      created_at: iso(draft.createdAt),
      salespeople: { name: rep.name },
      region: draft.input.region ?? 'North America',
      rep,
      breakdown: result.breakdown,
      tierRule: result.tierRule,
      routeRule: result.routeRule,
      run,
      activities,
      emails,
      appointment,
      autoReplyMs: result.durationMs,
      followUpMs,
      withinTarget: followUpMs === null ? null : followUpMs <= scenario.responseTargetMinutes[tier] * MIN,
      closedAt: closedAt !== null ? iso(closedAt) : null,
      showcase: draft.showcase?.key,
    });
  }
  return leads.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

const cache = new Map<string, DemoLead[]>();

/** Demo leads for a scenario, newest first. Stable within the hour. */
export function getDemoLeads(scenarioId: ScenarioId, at: Date = new Date()): DemoLead[] {
  const hour = Math.floor(at.getTime() / HOUR) * HOUR;
  const key = `${scenarioId}:${hour}`;
  let rows = cache.get(key);
  if (!rows) {
    rows = generate(scenarioId, hour);
    cache.clear();
    cache.set(key, rows);
  }
  return rows;
}

export const scenarioOfLeadId = (id: string): ScenarioId | null =>
  /^[a-d]3/.test(id) ? 'enterprise' : /^[a-d][12]/.test(id) ? 'smb' : null;

/** Open-lead load per rep right now, for routing a new live-demo submission. */
export function currentOpenCounts(scenarioId: ScenarioId): Map<string, number> {
  const counts = new Map<string, number>();
  const now = Date.now();
  for (const l of getDemoLeads(scenarioId)) {
    if (!l.closedAt || Date.parse(l.closedAt) > now) counts.set(l.rep.id, (counts.get(l.rep.id) ?? 0) + 1);
  }
  return counts;
}
