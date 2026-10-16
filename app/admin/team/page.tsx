import Link from 'next/link';
import { getLeads, getScenario } from '@/lib/data';
import { summarize } from '@/lib/insights';
import { PageHeader, TableShell, TierBadge, humanize, td, th } from '@/components/admin/ui';
import { duration, minutesLabel, pct } from '@/lib/format';

export const metadata = { title: 'Team' };

export default async function TeamPage() {
  const [leads, scenario] = await Promise.all([getLeads(), getScenario()]);
  const s = summarize(leads, scenario);
  const rows = s.workload.map(({ rep, open, assigned30d }) => {
    const mine = leads.filter((l) => l.assigned_to === rep.id);
    const followed = mine.filter((l) => l.followUpMs !== null);
    const sorted = followed.map((l) => l.followUpMs!).sort((a, b) => a - b);
    return {
      rep,
      open,
      assigned30d,
      won: mine.filter((l) => l.status === 'won').length,
      meetings: mine.filter((l) => l.status === 'appointment_set' || l.status === 'won').length,
      medianFollowUp: sorted.length ? sorted[Math.floor(sorted.length / 2)]! : null,
      onTarget: followed.length ? followed.filter((l) => l.withinTarget).length / followed.length : null,
      overflow: mine.filter((l) => /capacity/.test(l.routeRule)).length,
    };
  });

  return (
    <>
      <PageHeader
        title="Sales team"
        description={`Who receives which leads, how loaded they are, and how quickly they follow up. Routing sends each tier to its owner${
          scenario.id === 'enterprise' ? ' within the lead’s territory' : ''
        }, then to the least-loaded backup when someone is at capacity.`}
      />
      <TableShell>
        <thead className="bg-slate-50">
          <tr>
            <th className={th}>Salesperson</th>
            <th className={th}>Handles</th>
            {scenario.id === 'enterprise' && <th className={th}>Territory</th>}
            <th className={th}>Open / capacity</th>
            <th className={`${th} text-right`}>Assigned (30 d)</th>
            <th className={`${th} text-right`}>Median follow-up</th>
            <th className={`${th} text-right`}>On target</th>
            <th className={`${th} text-right`}>Meetings</th>
            <th className={`${th} text-right`}>Won</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const ratio = Math.min(1, r.open / r.rep.max_open_leads);
            return (
              <tr key={r.rep.id} className="hover:bg-slate-50">
                <td className={td}>
                  <Link href={`/admin/leads?owner=${r.rep.id}`} className="font-medium hover:underline">
                    {r.rep.name}
                  </Link>
                  <span className="block text-xs text-slate-500">{r.rep.role_title}</span>
                </td>
                <td className={td}>
                  <TierBadge tier={r.rep.tier_focus} />
                  <span className="block pt-1 text-xs text-slate-500">{humanize(r.rep.specialty)}</span>
                </td>
                {scenario.id === 'enterprise' && <td className={td}>{r.rep.territory}</td>}
                <td className={td}>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded bg-slate-100">
                      <div
                        className={`h-full rounded-r ${ratio >= 1 ? 'bg-[#d03b3b]' : 'bg-[#2a78d6]'}`}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                    <span className="tabular-nums">
                      {r.open}/{r.rep.max_open_leads}
                    </span>
                  </div>
                  {r.overflow > 0 && <span className="text-xs text-slate-500">{r.overflow} received as backup</span>}
                </td>
                <td className={`${td} text-right tabular-nums`}>{r.assigned30d}</td>
                <td className={`${td} text-right tabular-nums`}>
                  {r.medianFollowUp !== null ? duration(r.medianFollowUp) : '–'}
                  <span className="block text-xs text-slate-500">
                    target {minutesLabel(scenario.responseTargetMinutes[r.rep.tier_focus])}
                  </span>
                </td>
                <td className={`${td} text-right tabular-nums`}>{r.onTarget !== null ? pct(r.onTarget) : '–'}</td>
                <td className={`${td} text-right tabular-nums`}>{r.meetings}</td>
                <td className={`${td} text-right tabular-nums`}>{r.won}</td>
              </tr>
            );
          })}
        </tbody>
      </TableShell>
      <p className="mt-4 text-sm text-slate-500">
        Follow-up time is from the automated acknowledgement to the rep&apos;s first personal reply. Click a name to see
        their leads.
      </p>
    </>
  );
}
