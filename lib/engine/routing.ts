import type { LeadTier } from '@/lib/automation-types';
import type { Analysis } from './schema';

/* ------------------------------------------------------------------ */
/* Deterministic tiering and assignment rules                          */
/* ------------------------------------------------------------------ */

export interface Salesperson {
  id: string;
  name: string;
  email: string;
  role_title: string;
  tier_focus: LeadTier;
  max_open_leads: number;
  calendar_url: string | null;
  /** Enterprise demo only. When set, leads are routed within the matching territory first. */
  territory?: string;
}

export function classifyTier(a: Pick<Analysis, 'score' | 'service_category' | 'estimated_budget_usd'>): {
  tier: LeadTier;
  rule: string;
} {
  if (a.score >= 75) return { tier: 'high', rule: `Score ${a.score} is 75 or higher` };
  if (a.service_category === 'ai_automation' && a.estimated_budget_usd >= 10_000) {
    return {
      tier: 'high',
      rule: `AI automation with budget $${a.estimated_budget_usd.toLocaleString('en-US')} (10,000 or more)`,
    };
  }
  if (a.service_category === 'support_maintenance' && a.estimated_budget_usd < 2_500) {
    return { tier: 'low', rule: 'Support request with budget under $2,500' };
  }
  if (a.score >= 40) return { tier: 'mid', rule: `Score ${a.score} is between 40 and 74` };
  return { tier: 'low', rule: `Score ${a.score} is below 40` };
}

const FALLBACK_ORDER: Record<LeadTier, LeadTier[]> = {
  high: ['high', 'mid', 'low'],
  mid: ['mid', 'high', 'low'],
  low: ['low', 'mid', 'high'],
};

/**
 * Picks the least-loaded rep whose tier focus matches, falling back to the next tier when
 * everyone is at capacity. With a territory, reps in that territory are tried first.
 */
export function chooseSalesperson(
  tier: LeadTier,
  reps: Salesperson[],
  openCounts: Map<string, number>,
  territory?: string,
): { rep: Salesperson; rule: string } {
  if (reps.length === 0) throw new Error('No active salespeople available for assignment');

  const load = (r: Salesperson) => openCounts.get(r.id) ?? 0;
  const local = territory ? reps.filter((r) => r.territory === territory) : [];
  const pools: { reps: Salesperson[]; where: string }[] = local.length
    ? [
        { reps: local, where: ` in ${territory}` },
        { reps, where: '' },
      ]
    : [{ reps, where: '' }];

  for (const pool of pools) {
    for (const focus of FALLBACK_ORDER[tier]) {
      const candidates = pool.reps
        .filter((r) => r.tier_focus === focus && load(r) < r.max_open_leads)
        .sort((a, b) => load(a) - load(b) || a.name.localeCompare(b.name));
      if (candidates.length > 0) {
        const rep = candidates[0];
        const crossTerritory = territory && local.length && !pool.where ? ` (${territory} team at capacity)` : '';
        const rule =
          focus === tier
            ? `${tier} tier routes to ${rep.name}${pool.where} (${load(rep)}/${rep.max_open_leads} open leads)${crossTerritory}`
            : `${tier} tier primary rep${pool.where} at capacity, routed to ${rep.name} (${focus} tier fallback)${crossTerritory}`;
        return { rep, rule };
      }
    }
  }

  const rep = [...reps].sort((a, b) => load(a) - load(b) || a.name.localeCompare(b.name))[0];
  return { rep, rule: `Every rep is at capacity, routed to least loaded rep ${rep.name}` };
}
