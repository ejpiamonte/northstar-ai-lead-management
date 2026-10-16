import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mockAnalysis, parseBudgetUsd, scoreLead } from '../lib/engine/scoring';
import { chooseSalesperson, classifyTier, type Salesperson } from '../lib/engine/routing';
import { runLeadPipeline } from '../lib/engine/pipeline';
import { LeadInput } from '../lib/engine/schema';
import { getDemoLeads } from '../lib/demo/generate';
import { SCENARIOS } from '../lib/scenarios';

const NOW = new Date('2026-10-17T15:00:00Z');

const rep = (id: string, tier: Salesperson['tier_focus'], max = 5, territory?: string): Salesperson => ({
  id,
  name: id,
  email: `${id}@example.com`,
  role_title: 'Rep',
  tier_focus: tier,
  max_open_leads: max,
  calendar_url: null,
  territory,
});

const input = (over: Partial<LeadInput> = {}): LeadInput => ({
  full_name: 'Test Person',
  email: 'test@example.com',
  message: 'We would like an AI workflow that reads emails and updates our CRM automatically.',
  source: 'website_form',
  ...over,
});

describe('scoring', () => {
  it('parses budget ranges to a midpoint', () => {
    assert.equal(parseBudgetUsd('$25,000 - $50,000'), 37500);
    assert.equal(parseBudgetUsd('Under $2,000'), 2000);
    assert.equal(parseBudgetUsd('$50k+'), 50000);
    assert.equal(parseBudgetUsd('Not sure yet'), 0);
    assert.equal(parseBudgetUsd(undefined), 0);
  });

  it('explains every point of the score', () => {
    const { analysis, breakdown } = scoreLead(
      input({ company: 'Acme', phone: '555', budget_range: '$25,000 - $50,000', timeline: 'As soon as possible' }),
    );
    assert.equal(analysis.score, breakdown.fit + breakdown.budget + breakdown.urgency + breakdown.completeness);
    assert.equal(analysis.service_category, 'ai_automation');
    assert.deepEqual(mockAnalysis(input()), scoreLead(input()).analysis);
  });

  it('reads support requests as support', () => {
    const a = mockAnalysis(input({ message: 'Our checkout page is broken, can you fix it?' }));
    assert.equal(a.service_category, 'support_maintenance');
    assert.equal(a.intent, 'support_request');
  });
});

describe('tier rules', () => {
  it('applies thresholds and special cases', () => {
    assert.equal(classifyTier({ score: 80, service_category: 'website', estimated_budget_usd: 0 }).tier, 'high');
    assert.equal(
      classifyTier({ score: 60, service_category: 'ai_automation', estimated_budget_usd: 12000 }).tier,
      'high',
    );
    assert.equal(
      classifyTier({ score: 60, service_category: 'support_maintenance', estimated_budget_usd: 1000 }).tier,
      'low',
    );
    assert.equal(classifyTier({ score: 60, service_category: 'web_app', estimated_budget_usd: 0 }).tier, 'mid');
    assert.equal(classifyTier({ score: 20, service_category: 'web_app', estimated_budget_usd: 0 }).tier, 'low');
  });
});

describe('routing', () => {
  const reps = [rep('high-a', 'high', 2), rep('mid-a', 'mid', 2), rep('low-a', 'low', 2)];

  it('routes to the tier owner while under capacity', () => {
    assert.equal(chooseSalesperson('high', reps, new Map()).rep.id, 'high-a');
  });

  it('falls back to the next tier when the owner is full', () => {
    const r = chooseSalesperson('high', reps, new Map([['high-a', 2]]));
    assert.equal(r.rep.id, 'mid-a');
    assert.match(r.rule, /at capacity/);
  });

  it('routes to the least-loaded rep when everyone is full', () => {
    const r = chooseSalesperson(
      'mid',
      reps,
      new Map([
        ['high-a', 3],
        ['mid-a', 2],
        ['low-a', 2],
      ]),
    );
    assert.equal(r.rep.id, 'low-a');
  });

  it('prefers reps in the lead territory', () => {
    const team = [rep('na', 'high', 5, 'North America'), rep('emea', 'high', 5, 'EMEA')];
    assert.equal(chooseSalesperson('high', team, new Map(), 'EMEA').rep.id, 'emea');
    assert.equal(chooseSalesperson('high', team, new Map([['emea', 5]]), 'EMEA').rep.id, 'na');
  });

  it('rejects an empty roster', () => {
    assert.throws(() => chooseSalesperson('high', [], new Map()), /No active salespeople/);
  });
});

describe('pipeline and demo data', () => {
  it('runs end to end without a database', () => {
    const r = runLeadPipeline(
      input({ budget_range: '$50,000+', timeline: 'As soon as possible', company: 'Acme' }),
      SCENARIOS.smb.reps,
      new Map(),
      { persisted: false, now: NOW },
    );
    assert.equal(r.tier, 'high');
    assert.equal(r.steps.length, 8);
    assert.equal(r.steps.find((s) => s.key === 'persist_lead')?.status, 'skipped');
    assert.ok(r.appointmentAt);
  });

  it('is deterministic within the hour', () => {
    const ids = (d: Date) => getDemoLeads('enterprise', d).map((l) => `${l.id}:${l.tier}:${l.rep.id}`);
    assert.deepEqual(ids(NOW), ids(new Date(NOW.getTime() + 30 * 60_000)));
  });

  it('keeps every showcase lead on its intended tier', () => {
    for (const s of ['smb', 'enterprise'] as const) {
      for (const l of getDemoLeads(s, NOW).filter((x) => x.showcase))
        assert.equal(l.tier, l.showcase, `${s} ${l.full_name}`);
    }
  });

  it('assigns every generated lead with the real tier rule', () => {
    for (const s of ['smb', 'enterprise'] as const) {
      for (const l of getDemoLeads(s, NOW)) {
        assert.equal(classifyTier(l.ai_analysis as Parameters<typeof classifyTier>[0]).tier, l.tier);
        assert.ok(SCENARIOS[s].reps.some((r) => r.id === l.assigned_to));
      }
    }
  });
});
