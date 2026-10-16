import type { LeadTier } from '@/lib/automation-types';
import type { DemoLead } from '@/lib/demo/generate';
import { OPEN_STATUSES } from '@/lib/admin-data';
import type { Scenario } from '@/lib/scenarios';

const DAY = 86_400_000;

function median(values: number[]) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

export type DailyTierPoint = { date: string; label: string; high: number; mid: number; low: number };

export const FUNNEL: { key: string; label: string; statuses: string[] }[] = [
  { key: 'received', label: 'Received', statuses: [] },
  { key: 'contacted', label: 'Contacted', statuses: ['contacted', 'qualified', 'appointment_set', 'won'] },
  { key: 'qualified', label: 'Qualified', statuses: ['qualified', 'appointment_set', 'won'] },
  { key: 'meeting', label: 'Meeting booked', statuses: ['appointment_set', 'won'] },
  { key: 'won', label: 'Won', statuses: ['won'] },
];

export const isOpen = (l: DemoLead) => (OPEN_STATUSES as string[]).includes(l.status);

export function summarize(leads: DemoLead[], scenario: Scenario, now = Date.now()) {
  const tiers: LeadTier[] = ['high', 'mid', 'low'];
  const byTier = Object.fromEntries(tiers.map((t) => [t, leads.filter((l) => l.tier === t)])) as Record<
    LeadTier,
    DemoLead[]
  >;

  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const daily: DailyTierPoint[] = Array.from({ length: 30 }, (_, k) => {
    const d = new Date(start.getTime() - (29 - k) * DAY);
    const key = d.toISOString().slice(0, 10);
    const rows = leads.filter((l) => l.created_at.slice(0, 10) === key);
    return {
      date: key,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      high: rows.filter((l) => l.tier === 'high').length,
      mid: rows.filter((l) => l.tier === 'mid').length,
      low: rows.filter((l) => l.tier === 'low').length,
    };
  });

  const funnel = FUNNEL.map((f) => ({
    ...f,
    count: f.statuses.length ? leads.filter((l) => f.statuses.includes(l.status)).length : leads.length,
  }));

  const followed = leads.filter((l) => l.followUpMs !== null);
  const followUpByTier = Object.fromEntries(
    tiers.map((t) => {
      const rows = followed.filter((l) => l.tier === t);
      return [
        t,
        {
          medianMs: median(rows.map((l) => l.followUpMs!)),
          withinTarget: rows.length ? rows.filter((l) => l.withinTarget).length / rows.length : 0,
          targetMin: scenario.responseTargetMinutes[t],
          count: rows.length,
        },
      ];
    }),
  ) as Record<LeadTier, { medianMs: number; withinTarget: number; targetMin: number; count: number }>;

  const open = leads.filter(isOpen);
  const pipelineUsd = open.reduce((s, l) => s + (l.ai_analysis?.estimated_budget_usd ?? 0), 0);
  const wonUsd = leads
    .filter((l) => l.status === 'won')
    .reduce((s, l) => s + (l.ai_analysis?.estimated_budget_usd ?? 0), 0);

  const countBy = (f: (l: DemoLead) => string) => {
    const m = new Map<string, number>();
    for (const l of leads) m.set(f(l), (m.get(f(l)) ?? 0) + 1);
    return [...m.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  };

  const workload = scenario.reps.map((rep) => ({
    rep,
    open: open.filter((l) => l.assigned_to === rep.id).length,
    assigned30d: leads.filter((l) => l.assigned_to === rep.id).length,
  }));

  return {
    total: leads.length,
    byTier: Object.fromEntries(tiers.map((t) => [t, byTier[t].length])) as Record<LeadTier, number>,
    daily,
    funnel,
    medianAutoReplyMs: median(leads.map((l) => l.autoReplyMs)),
    followUpByTier,
    withinTarget: followed.length ? followed.filter((l) => l.withinTarget).length / followed.length : 0,
    open: open.length,
    pipelineUsd,
    wonUsd,
    meetings: leads.filter((l) => l.status === 'appointment_set' || l.status === 'won').length,
    fallbacks: leads.filter((l) => /capacity/.test(l.routeRule)).length,
    byService: countBy((l) => l.service_interest ?? 'Not stated'),
    bySource: countBy((l) => l.source),
    workload,
    oldestUnworkedMs: Math.max(
      0,
      ...leads.filter((l) => l.status === 'assigned').map((l) => now - Date.parse(l.created_at)),
    ),
  };
}
