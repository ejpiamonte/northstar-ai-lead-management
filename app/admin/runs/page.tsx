// app/admin/runs/page.tsx
import Link from 'next/link';
import { getAdminClient } from '@/lib/supabase/admin';
import { unwrap } from '@/lib/admin-data';
import type { AutomationRun, LeadActivity } from '@/lib/automation-types';
import AutomationLogView from '@/components/AutomationLogView';
import {
  Badge,
  EmptyState,
  PageHeader,
  StatusBadge,
  TableShell,
  fmtDateTime,
  fmtMs,
  linkCls,
  td,
  th,
} from '@/components/admin/ui';

export const metadata = { title: 'Run history' };
export const dynamic = 'force-dynamic';

type RunWithLead = AutomationRun & { leads: { full_name: string } | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function RunsPage({ searchParams }: { searchParams: Promise<{ run?: string }> }) {
  const { run: selectedId } = await searchParams;
  const db = getAdminClient();

  const res = await db
    .from('automation_runs')
    .select('*, leads(full_name)')
    .order('started_at', { ascending: false })
    .limit(100);
  const runs = unwrap<RunWithLead[]>(res, 'Load runs');

  const selected = selectedId && UUID.test(selectedId) ? runs.find((r) => r.id === selectedId) : undefined;
  let activities: LeadActivity[] = [];
  if (selected?.lead_id) {
    const actRes = await db
      .from('lead_activities')
      .select('id, activity_type, title, description, created_at, metadata')
      .eq('automation_run_id', selected.id)
      .order('created_at', { ascending: true });
    activities = unwrap<LeadActivity[]>(actRes, 'Load activities');
  }

  return (
    <>
      <PageHeader
        title="Run history"
        description="Every webhook execution with the steps the automation took. Select a run to read its audit trail."
      />

      {runs.length === 0 ? (
        <EmptyState
          title="No automation runs yet"
          body="Post a lead to /api/webhook/lead and the run appears here with each step, timing, and result."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {selected ? (
            <div>
              <p className="mb-3 text-sm">
                <Link href="/admin/runs" className={linkCls}>
                  Close audit trail
                </Link>
                {selected.lead_id && (
                  <>
                    {' · '}
                    <Link href={`/admin/leads/${selected.lead_id}`} className={linkCls}>
                      Open lead
                    </Link>
                  </>
                )}
              </p>
              <AutomationLogView run={selected} activities={activities} />
            </div>
          ) : selectedId ? (
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
              That run is not in the latest 100. Open it from its lead page instead.
            </p>
          ) : null}

          <TableShell>
            <thead>
              <tr>
                <th className={th}>Started</th>
                <th className={th}>Lead</th>
                <th className={th}>Status</th>
                <th className={th}>Mode</th>
                <th className={th}>AI</th>
                <th className={th}>Steps</th>
                <th className={th}>Duration</th>
                <th className={th}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className={r.id === selected?.id ? 'bg-[#FDF3DC]/50' : 'hover:bg-slate-50/70'}>
                  <td className={`${td} whitespace-nowrap`}>{fmtDateTime(r.started_at)}</td>
                  <td className={td}>
                    {r.lead_id ? (
                      <Link href={`/admin/leads/${r.lead_id}`} className={linkCls}>
                        {r.leads?.full_name ?? 'Lead'}
                      </Link>
                    ) : (
                      '–'
                    )}
                  </td>
                  <td className={td}>
                    <StatusBadge status={r.status} />
                  </td>
                  <td className={td}>
                    <Badge tone={r.mode === 'demo' ? 'gold' : 'green'}>{r.mode === 'demo' ? 'Demo' : 'Live'}</Badge>
                  </td>
                  <td className={`${td} text-slate-600`}>{r.ai_provider ?? '–'}</td>
                  <td className={`${td} tabular-nums`}>{r.steps?.length ?? 0}</td>
                  <td className={`${td} tabular-nums`}>{fmtMs(r.duration_ms)}</td>
                  <td className={`${td} text-right`}>
                    <Link href={`/admin/runs?run=${r.id}`} className={linkCls}>
                      View trail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </div>
      )}
    </>
  );
}