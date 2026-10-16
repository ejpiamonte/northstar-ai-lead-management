import Link from 'next/link';
import { getLeads } from '@/lib/data';
import AutomationLogView from '@/components/AutomationLogView';
import { PageHeader, Stat, StatusBadge, TableShell, fmtDateTime, fmtMs, linkCls, td, th } from '@/components/admin/ui';

export const metadata = { title: 'Run history' };

const PAGE_SIZE = 30;

export default async function RunsPage({ searchParams }: { searchParams: Promise<{ run?: string; page?: string }> }) {
  const { run: selectedId, page: pageParam } = await searchParams;
  const leads = await getLeads();
  const runs = leads.map((l) => ({ run: l.run, lead: l }));
  const selected = selectedId ? runs.find((r) => r.run.id === selectedId) : undefined;
  const pages = Math.max(1, Math.ceil(runs.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(pageParam) || 1));
  const visible = runs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const durations = runs.map((r) => r.run.duration_ms ?? 0).sort((a, b) => a - b);
  const skippedCalls = runs.filter((r) =>
    r.run.steps.some((s) => s.key === 'propose_appointment' && s.status === 'skipped'),
  ).length;

  return (
    <>
      <PageHeader
        title="Run history"
        description="One automation run per enquiry: every step, its timing, and its result. Select a run to read its audit trail."
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Runs" value={String(runs.length)} hint="Last 30 days" />
        <Stat
          label="Median run time"
          value={fmtMs(durations[Math.floor(durations.length / 2)] ?? 0)}
          hint="Form received to reply drafted"
        />
        <Stat
          label="Failed runs"
          value={String(runs.filter((r) => r.run.status === 'failed').length)}
          hint={`${skippedCalls} runs skipped the call proposal (not high tier)`}
        />
      </section>

      {selected && (
        <div className="mb-8">
          <p className="mb-3 text-sm">
            <Link href="/admin/runs" className={linkCls}>
              Close audit trail
            </Link>{' '}
            ·{' '}
            <Link href={`/admin/leads/${selected.lead.id}`} className={linkCls}>
              Open lead
            </Link>
          </p>
          <AutomationLogView run={selected.run} activities={selected.lead.activities} />
        </div>
      )}

      <TableShell>
        <thead className="bg-slate-50">
          <tr>
            <th className={th}>Started</th>
            <th className={th}>Lead</th>
            <th className={th}>Trigger</th>
            <th className={th}>Steps</th>
            <th className={`${th} text-right`}>Duration</th>
            <th className={th}>Status</th>
            <th className={th} />
          </tr>
        </thead>
        <tbody>
          {visible.map(({ run, lead }) => (
            <tr key={run.id} className={run.id === selectedId ? 'bg-[#FDF3DC]/40' : 'hover:bg-slate-50'}>
              <td className={`${td} whitespace-nowrap`}>{fmtDateTime(run.started_at)}</td>
              <td className={td}>
                <Link href={`/admin/leads/${lead.id}`} className="font-medium hover:underline">
                  {lead.full_name}
                </Link>
              </td>
              <td className={td}>{run.trigger}</td>
              <td className={td}>
                {run.steps.filter((s) => s.status === 'success').length}/{run.steps.length} completed
              </td>
              <td className={`${td} text-right tabular-nums`}>{fmtMs(run.duration_ms)}</td>
              <td className={td}>
                <StatusBadge status={run.status} />
              </td>
              <td className={td}>
                <Link href={`/admin/runs?run=${run.id}${page > 1 ? `&page=${page}` : ''}`} className={linkCls}>
                  Audit trail
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>
            Page {page} of {pages}
          </span>
          <span className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/runs?page=${page - 1}`}
                className="rounded-lg bg-white px-3 py-1.5 font-semibold ring-1 ring-slate-300"
              >
                Previous
              </Link>
            )}
            {page < pages && (
              <Link
                href={`/admin/runs?page=${page + 1}`}
                className="rounded-lg bg-white px-3 py-1.5 font-semibold ring-1 ring-slate-300"
              >
                Next
              </Link>
            )}
          </span>
        </nav>
      )}
    </>
  );
}
