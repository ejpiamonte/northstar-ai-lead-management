import Link from 'next/link';
import { getLeads, getScenario } from '@/lib/data';
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  TableShell,
  TierBadge,
  fmtDateTime,
  fmtUsd,
  td,
  th,
} from '@/components/admin/ui';
import FilterForm from '@/components/admin/FilterForm';
import { SOURCE_LABEL } from '@/lib/format';

export const metadata = { title: 'Leads' };

const PAGE_SIZE = 25;
type Search = { q?: string; tier?: string; status?: string; owner?: string; region?: string; page?: string };

const STATUS_OPTIONS = [
  ['', 'All statuses'],
  ['assigned', 'Assigned'],
  ['contacted', 'Contacted'],
  ['qualified', 'Qualified'],
  ['appointment_set', 'Meeting booked'],
  ['won', 'Won'],
  ['lost', 'Lost'],
] as const;

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const [all, scenario] = await Promise.all([getLeads(), getScenario()]);
  const q = (params.q ?? '').trim().toLowerCase();
  const rows = all.filter(
    (l) =>
      (!q ||
        [l.full_name, l.company ?? '', l.email, l.service_interest ?? ''].some((v) => v.toLowerCase().includes(q))) &&
      (!params.tier || l.tier === params.tier) &&
      (!params.status || l.status === params.status) &&
      (!params.owner || l.assigned_to === params.owner) &&
      (!params.region || l.region === params.region),
  );
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(params.page) || 1));
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const enterprise = scenario.id === 'enterprise';
  const href = (p: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, page: String(p) })) if (v) next.set(k, v);
    return `/admin/leads?${next}`;
  };
  const filtered = rows.length !== all.length;

  return (
    <>
      <PageHeader
        title="Leads"
        description="Every enquiry from the last 30 days with its score, tier, owner, and stage. Click a lead to see exactly why it was routed."
      />
      <FilterForm
        action="/admin/leads"
        query={params.q ?? ''}
        selects={[
          {
            name: 'tier',
            label: 'Tier',
            value: params.tier ?? '',
            options: [
              { value: '', label: 'All tiers' },
              { value: 'high', label: 'High tier' },
              { value: 'mid', label: 'Mid tier' },
              { value: 'low', label: 'Low tier' },
            ],
          },
          {
            name: 'status',
            label: 'Status',
            value: params.status ?? '',
            options: STATUS_OPTIONS.map(([value, label]) => ({ value, label })),
          },
          {
            name: 'owner',
            label: 'Owner',
            value: params.owner ?? '',
            options: [
              { value: '', label: 'All owners' },
              ...scenario.reps.map((r) => ({ value: r.id, label: r.name })),
            ],
          },
          ...(enterprise
            ? [
                {
                  name: 'region',
                  label: 'Territory',
                  value: params.region ?? '',
                  options: [
                    { value: '', label: 'All territories' },
                    ...['North America', 'EMEA', 'APAC'].map((r) => ({ value: r, label: r })),
                  ],
                },
              ]
            : []),
        ]}
      />
      {filtered && (
        <p className="mb-3 text-sm text-slate-600">
          {rows.length} of {all.length} leads match.{' '}
          <Link href="/admin/leads" className="font-semibold underline underline-offset-2">
            Clear filters
          </Link>
        </p>
      )}

      {visible.length === 0 ? (
        <EmptyState
          title="No leads match"
          body="Try a different search or clear the filters."
          href="/admin/leads"
          cta="Clear filters"
        />
      ) : (
        <TableShell>
          <thead className="bg-slate-50">
            <tr>
              <th className={th}>Lead</th>
              <th className={th}>Interest</th>
              <th className={`${th} text-right`}>Score</th>
              <th className={th}>Tier</th>
              <th className={th}>Owner</th>
              <th className={th}>Status</th>
              <th className={`${th} text-right`}>Budget est.</th>
              <th className={th}>Received</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className={td}>
                  <Link href={`/admin/leads/${l.id}`} className="font-medium text-[#0B1F3A] hover:underline">
                    {l.full_name}
                  </Link>
                  <span className="block text-xs text-slate-500">
                    {l.company ?? 'No company'} · {SOURCE_LABEL[l.source] ?? l.source}
                  </span>
                </td>
                <td className={td}>{l.service_interest ?? '–'}</td>
                <td className={`${td} text-right tabular-nums`}>{l.score}</td>
                <td className={td}>
                  <TierBadge tier={l.tier} />
                </td>
                <td className={td}>
                  {l.rep.name}
                  {enterprise && <span className="block text-xs text-slate-500">{l.region}</span>}
                </td>
                <td className={td}>
                  <StatusBadge status={l.status} />
                </td>
                <td className={`${td} text-right tabular-nums`}>{fmtUsd(l.ai_analysis?.estimated_budget_usd)}</td>
                <td className={`${td} whitespace-nowrap text-slate-600`}>{fmtDateTime(l.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>
            Page {page} of {pages}
          </span>
          <span className="flex gap-2">
            {page > 1 && (
              <Link
                href={href(page - 1)}
                className="rounded-lg bg-white px-3 py-1.5 font-semibold ring-1 ring-slate-300 hover:bg-slate-50"
              >
                Previous
              </Link>
            )}
            {page < pages && (
              <Link
                href={href(page + 1)}
                className="rounded-lg bg-white px-3 py-1.5 font-semibold ring-1 ring-slate-300 hover:bg-slate-50"
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
