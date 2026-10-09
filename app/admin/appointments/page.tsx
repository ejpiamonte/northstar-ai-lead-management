// app/admin/appointments/page.tsx
import Link from 'next/link';
import { getAdminClient } from '@/lib/supabase/admin';
import { unwrap, type AppointmentRow } from '@/lib/admin-data';
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  TableShell,
  fmtDateTime,
  linkCls,
  td,
  th,
} from '@/components/admin/ui';

export const metadata = { title: 'Appointments' };
export const dynamic = 'force-dynamic';

export default async function AppointmentsPage() {
  const res = await getAdminClient()
    .from('appointments')
    .select('*, leads(full_name, company), salespeople(name)')
    .order('scheduled_at', { ascending: true })
    .limit(200);
  const rows = unwrap<AppointmentRow[]>(res, 'Load appointments');

  const now = Date.now();
  const upcoming = rows.filter((r) => new Date(r.scheduled_at).getTime() >= now);
  const past = rows.filter((r) => new Date(r.scheduled_at).getTime() < now).reverse();

  const Table = ({ items }: { items: AppointmentRow[] }) => (
    <TableShell>
      <thead>
        <tr>
          <th className={th}>When</th>
          <th className={th}>Lead</th>
          <th className={th}>Salesperson</th>
          <th className={th}>Length</th>
          <th className={th}>Status</th>
          <th className={th}>Notes</th>
        </tr>
      </thead>
      <tbody>
        {items.map((r) => (
          <tr key={r.id} className="hover:bg-slate-50/70">
            <td className={`${td} whitespace-nowrap font-medium text-[#0B1F3A]`}>{fmtDateTime(r.scheduled_at)}</td>
            <td className={td}>
              <Link href={`/admin/leads/${r.lead_id}`} className={linkCls}>
                {r.leads?.full_name ?? 'Unknown lead'}
              </Link>
              {r.leads?.company && <p className="text-xs text-slate-500">{r.leads.company}</p>}
            </td>
            <td className={td}>{r.salespeople?.name ?? '–'}</td>
            <td className={`${td} whitespace-nowrap`}>{r.duration_minutes} min</td>
            <td className={td}>
              <StatusBadge status={r.status} />
            </td>
            <td className={`${td} max-w-xs text-slate-600`}>{r.notes ?? '–'}</td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Discovery calls the automation proposed for high-tier leads."
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No appointments yet"
          body="When a lead scores into the high tier, the webhook proposes a 45-minute call with the assigned salesperson and it shows up here."
          href="/admin/leads"
          cta="View leads"
        />
      ) : (
        <div className="flex flex-col gap-8">
          <section aria-labelledby="upcoming">
            <h2 id="upcoming" className="mb-3 text-base font-semibold text-[#0B1F3A] [font-family:var(--font-display)]">
              Upcoming ({upcoming.length})
            </h2>
            {upcoming.length ? (
              <Table items={upcoming} />
            ) : (
              <p className="rounded-2xl bg-white p-5 text-sm text-slate-600 ring-1 ring-slate-200">
                Nothing is scheduled ahead.
              </p>
            )}
          </section>
          {past.length > 0 && (
            <section aria-labelledby="past">
              <h2 id="past" className="mb-3 text-base font-semibold text-[#0B1F3A] [font-family:var(--font-display)]">
                Past ({past.length})
              </h2>
              <Table items={past} />
            </section>
          )}
        </div>
      )}
    </>
  );
}