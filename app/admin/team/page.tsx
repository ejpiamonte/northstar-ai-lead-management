// app/admin/team/page.tsx
import { getAdminClient } from '@/lib/supabase/admin';
import { OPEN_STATUSES, unwrap, type LeadRow, type SalespersonRow } from '@/lib/admin-data';
import { Badge, Card, EmptyState, PageHeader, TierBadge, humanize, linkCls } from '@/components/admin/ui';

export const metadata = { title: 'Salespeople' };
export const dynamic = 'force-dynamic';

type LeadLite = Pick<LeadRow, 'assigned_to' | 'status' | 'score'>;

export default async function TeamPage() {
  const db = getAdminClient();
  const [repsRes, leadsRes] = await Promise.all([
    db.from('salespeople').select('*').order('name'),
    db.from('leads').select('assigned_to, status, score').not('assigned_to', 'is', null).limit(2000),
  ]);
  const reps = unwrap<SalespersonRow[]>(repsRes, 'Load salespeople');
  const leads = unwrap<LeadLite[]>(leadsRes, 'Load assigned leads');

  if (reps.length === 0) {
    return (
      <>
        <PageHeader title="Salespeople" description="Who receives leads and how loaded they are." />
        <EmptyState
          title="No salespeople found"
          body="Run supabase/migrations/001_northstar_init.sql to seed Sarah, Alex, and Maria."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Salespeople"
        description="Who receives leads and how loaded they are. Routing follows the tier each lead scores into."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {reps.map((r) => {
          const mine = leads.filter((l) => l.assigned_to === r.id);
          const open = mine.filter((l) => OPEN_STATUSES.includes(l.status)).length;
          const won = mine.filter((l) => l.status === 'won').length;
          const scored = mine.filter((l) => l.score !== null);
          const avg = scored.length
            ? Math.round(scored.reduce((s, l) => s + (l.score ?? 0), 0) / scored.length)
            : null;
          const pct = Math.min(100, Math.round((open / r.max_open_leads) * 100));

          return (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-[#0B1F3A] [font-family:var(--font-display)]">{r.name}</h2>
                  <p className="text-sm text-slate-600">{r.role_title}</p>
                </div>
                <Badge tone={r.active ? 'green' : 'slate'}>{r.active ? 'Active' : 'Inactive'}</Badge>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <TierBadge tier={r.tier_focus} />
                <Badge>{humanize(r.specialty)}</Badge>
              </div>

              <div className="mt-5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-slate-600">Open leads</span>
                  <span className="tabular-nums font-medium text-[#0B1F3A]">
                    {open} of {r.max_open_leads}
                  </span>
                </div>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
                  role="img"
                  aria-label={`${open} of ${r.max_open_leads} open leads`}
                >
                  <div
                    className={`h-full rounded-full ${pct >= 90 ? 'bg-red-500' : 'bg-[#F2B544]'}`}
                    style={{ width: `${Math.max(pct, open > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Assigned</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-[#0B1F3A]">{mine.length}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Won</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-[#0B1F3A]">{won}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Average score</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-[#0B1F3A]">{avg ?? '–'}</dd>
                </div>
              </dl>

              <p className="mt-4 text-sm text-slate-600">
                <a href={`mailto:${r.email}`} className={linkCls}>
                  {r.email}
                </a>
                <span className="block text-xs text-slate-500">Timezone {r.timezone}</span>
                {r.calendar_url && (
                  <a href={r.calendar_url} className={`${linkCls} text-xs`} target="_blank" rel="noreferrer">
                    Booking page
                  </a>
                )}
              </p>
            </Card>
          );
        })}
      </div>
    </>
  );
}