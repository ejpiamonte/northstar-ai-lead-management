import { cookies } from 'next/headers';
import { getDemoLeads, scenarioOfLeadId, type DemoLead } from '@/lib/demo/generate';
import { parseScenarioId, SCENARIO_COOKIE, SCENARIOS, type Scenario } from '@/lib/scenarios';

/**
 * Data access for the /admin workflow demo.
 *
 * The admin area has no authentication, so it only ever reads the generated demo pipeline and never
 * queries the database. Showing real submissions would require sign-in and authorization first.
 */

export async function getScenario(): Promise<Scenario> {
  const store = await cookies();
  return SCENARIOS[parseScenarioId(store.get(SCENARIO_COOKIE)?.value)];
}

export async function getLeads(): Promise<DemoLead[]> {
  return getDemoLeads((await getScenario()).id);
}

/** Lead ids encode their scenario, so deep links keep working after the visitor switches. */
export async function getLead(id: string): Promise<{ lead: DemoLead; scenario: Scenario } | null> {
  const scenarioId = scenarioOfLeadId(id) ?? (await getScenario()).id;
  const lead = getDemoLeads(scenarioId).find((l) => l.id === id);
  return lead ? { lead, scenario: SCENARIOS[scenarioId] } : null;
}
