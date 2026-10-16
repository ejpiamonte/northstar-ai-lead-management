import Link from 'next/link';
import { getLeads } from '@/lib/data';
import { EmptyState, PageHeader, StatusBadge, TableShell, TierBadge, fmtDateTime, td, th } from '@/components/admin/ui';

export const metadata = { title: 'Meetings' };

export default async function AppointmentsPage() {
  const leads = await getLeads();
  const now = Date.now();
  const rows = leads
    .filter((l) => l.appointment)
    .map((l) => ({ lead: l, appt: l.appointment! }))
    .sort((a, b) => b.appt.scheduled_at.localeCompare(a.appt.scheduled_at));
  const upcoming = rows.filter((r) => Date.parse(r.appt.scheduled_at) > now);
  const past = rows.filter((r) => Date.parse(r.appt.scheduled_at) <= now);

  const table = (items: typeof rows) => (
    <TableShell>
      <thead className="bg-slate-50">
        <tr>
          <th className={th}>When</th>
          <th className={th}>Lead</th>
          <th className={th}>Tier</th>
          <th className={th}>With</th>
          <th className={th}>Status</th>
          <th className={th}>Agenda</th>
        </tr>
      </thead>
      <tbody>
        {items.map(({ lead, appt }) => (
          <tr key={appt.id} className="hover:bg-slate-50">
            <td className={`${td} whitespace-nowrap`}>
              {fmtDateTime(appt.scheduled_at)}
              <span className="block text-xs text-slate-500">{appt.duration_minutes} min</span>
            </td>
            <td className={td}>
              <Link href={`/admin/leads/${lead.id}`} className="font-medium hover:underline">
                {lead.full_name}
              </Link>
              <span className="block text-xs text-slate-500">{lead.company ?? 'No company'}</span>
            </td>
            <td className={td}>
              <TierBadge tier={lead.tier} />
            </td>
            <td className={td}>{lead.rep.name}</td>
            <td className={td}>
              <StatusBadge status={appt.status} />
            </td>
            <td className={`${td} max-w-sm text-slate-600`}>{appt.notes}</td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );

  return (
    <>
      <PageHeader
        title="Meetings"
        description="High-tier leads get a 45-minute discovery call proposed automatically on the next business day. Others are booked by the rep once qualified."
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No meetings yet"
          body="Meetings appear here once a high-tier lead arrives or a rep books one."
        />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 font-semibold">Upcoming ({upcoming.length})</h2>
            {upcoming.length ? table(upcoming) : <p className="text-sm text-slate-500">Nothing scheduled.</p>}
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Past ({past.length})</h2>
            {past.length ? table(past) : <p className="text-sm text-slate-500">No past meetings.</p>}
          </section>
        </div>
      )}
    </>
  );
}
