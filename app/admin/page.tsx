import Link from 'next/link';
import type { ReactNode } from 'react';
import { getLeads, getScenario } from '@/lib/data';
import { summarize } from '@/lib/insights';
import { duration, minutesLabel, pct, usdCompact } from '@/lib/format';
import TierVolumeChart from '@/components/admin/TierVolumeChart';
import ImpactPanel from '@/components/admin/ImpactPanel';
import { Stat, StatusBadge, TierBadge, fmtDateTime } from '@/components/admin/ui';

export const metadata = { title: { absolute: 'Overview · Northstar workflow demo' } };

function Panel({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const small =
  'rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-slate-300 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#F2B544]';

export default async function DemoDashboard() {
  const [leads, scenario] = await Promise.all([getLeads(), getScenario()]);
  const s = summarize(leads, scenario);
  const high = leads.find((l) => l.showcase === 'high');
  const low = leads.find((l) => l.showcase === 'low');
  const funnelTop = s.funnel[0]!.count || 1;
  const serviceTop = s.byService[0]?.count ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Lead qualification and routing</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          Last 30 days at {scenario.company}. Every enquiry is scored, assigned to the right specialist, and answered
          within seconds. People spend their time on the conversations that matter.
        </p>
      </div>

      <section
        aria-labelledby="tour"
        className="grid gap-4 rounded-2xl bg-[#0B1F3A] p-5 text-white sm:p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,2fr)] lg:items-center"
      >
        <div>
          <h2 id="tour" className="font-semibold">
            Start here: a 2-minute tour
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            Follow one enquiry end to end, then switch between <b className="text-white">Small business</b> and{' '}
            <b className="text-white">Enterprise</b> above to see the same rules run a bigger team.
          </p>
        </div>
        <ol className="grid gap-3 sm:grid-cols-3">
          {[
            high && {
              n: 1,
              href: `/admin/leads/${high.id}`,
              title: 'A high-value enquiry',
              body: `${high.company}: scored ${high.score}, routed to ${high.rep.name.split(' ')[0]}, call proposed.`,
            },
            low && {
              n: 2,
              href: `/admin/leads/${low.id}`,
              title: 'A small support request',
              body: `Scored ${low.score} and sent straight to ${low.rep.name.split(' ')[0]} on the support team.`,
            },
            {
              n: 3,
              href: '/#contact',
              title: 'Send your own enquiry',
              body: 'Use a sample or write one. See the score, tier, and owner instantly.',
            },
          ]
            .filter(Boolean)
            .map((step) => {
              const t = step as { n: number; href: string; title: string; body: string };
              return (
                <li key={t.n}>
                  <Link
                    href={t.href}
                    className="block h-full rounded-xl bg-white/5 p-3.5 ring-1 ring-white/10 outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#F2B544]"
                  >
                    <span className="text-[10px] font-bold tracking-widest text-[#F2B544]">STEP {t.n}</span>
                    <span className="mt-1 block text-sm font-semibold">{t.title}</span>
                    <span className="mt-1 block text-xs text-slate-300">{t.body}</span>
                  </Link>
                </li>
              );
            })}
        </ol>
      </section>

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="New leads"
          value={String(s.total)}
          hint={
            scenario.sampleSize < scenario.monthlyLeads
              ? `Representative sample of ~${scenario.monthlyLeads} per month`
              : 'Last 30 days, all channels'
          }
        />
        <Stat
          label="Time to first reply"
          value={duration(s.medianAutoReplyMs)}
          hint={`Automated acknowledgement · vs ~${scenario.impact.manualResponseHours} h by hand`}
        />
        <Stat
          label="Follow-ups on target"
          value={pct(s.withinTarget)}
          hint={`High tier: median ${duration(s.followUpByTier.high.medianMs)} vs ${minutesLabel(scenario.responseTargetMinutes.high)} target`}
        />
        <Stat
          label="Open pipeline (est.)"
          value={usdCompact(s.pipelineUsd)}
          hint={`${s.open} open leads · ${usdCompact(s.wonUsd)} won this period`}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Daily leads by tier" hint="Last 30 days · hover a day for detail">
          <TierVolumeChart data={s.daily} />
        </Panel>
        <Panel title="Pipeline funnel" hint="Leads from the last 30 days by furthest stage reached">
          <ol className="space-y-3">
            {s.funnel.map((f, k) => (
              <li key={f.key} className="text-sm">
                <div className="mb-1 flex justify-between">
                  <span>{f.label}</span>
                  <span className="tabular-nums text-slate-600">
                    <b className="text-[#0B1F3A]">{f.count}</b>
                    {k > 0 && ` · ${pct(f.count / funnelTop)}`}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-slate-100">
                  <div className="h-full rounded-r bg-[#2a78d6]" style={{ width: `${(f.count / funnelTop) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-slate-500">
            {s.meetings} meetings booked. Lost leads are kept for reporting.
          </p>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="Response by tier" hint="How fast a person followed up after the automated reply">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="pb-2 font-medium">Tier</th>
                <th className="pb-2 font-medium">Target</th>
                <th className="pb-2 text-right font-medium">Median</th>
                <th className="pb-2 text-right font-medium">On target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(['high', 'mid', 'low'] as const).map((t) => {
                const r = s.followUpByTier[t];
                return (
                  <tr key={t}>
                    <td className="py-2.5">
                      <TierBadge tier={t} />
                      <span className="ml-2 text-xs text-slate-500">{s.byTier[t]}</span>
                    </td>
                    <td className="py-2.5 text-slate-600">{minutesLabel(r.targetMin)}</td>
                    <td className="py-2.5 text-right tabular-nums">{r.count ? duration(r.medianMs) : '–'}</td>
                    <td className="py-2.5 text-right tabular-nums font-semibold">
                      {r.count ? pct(r.withinTarget) : '–'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>

        <Panel
          title="Team workload"
          hint={`Open leads vs capacity${s.fallbacks ? ` · ${s.fallbacks} overflowed to a backup rep` : ''}`}
          action={
            <Link href="/admin/team" className={small}>
              Team
            </Link>
          }
        >
          <ul className="space-y-2.5">
            {s.workload.map(({ rep, open }) => {
              const ratio = Math.min(1, open / rep.max_open_leads);
              return (
                <li key={rep.id} className="text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="truncate">
                      {rep.name}
                      {rep.territory && <span className="text-xs text-slate-500"> · {rep.territory}</span>}
                    </span>
                    <span className="tabular-nums text-slate-600">
                      {open}/{rep.max_open_leads}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded bg-slate-100">
                    <div
                      className={`h-full rounded-r ${ratio >= 1 ? 'bg-[#d03b3b]' : 'bg-[#2a78d6]'}`}
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <ImpactPanel
          key={scenario.id}
          autoReplySeconds={s.medianAutoReplyMs / 1000}
          defaults={{
            monthlyLeads: scenario.monthlyLeads,
            triageMinutes: scenario.impact.triageMinutes,
            hourlyCost: scenario.impact.hourlyCost,
            manualResponseHours: scenario.impact.manualResponseHours,
          }}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Panel title="What people ask for" hint="Leads by service interest">
          <ul className="space-y-2.5">
            {s.byService.map((r) => (
              <li key={r.label} className="text-sm">
                <div className="flex justify-between">
                  <span>{r.label}</span>
                  <b className="tabular-nums">{r.count}</b>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded bg-slate-100">
                  <div
                    className="h-full rounded-r bg-[#2a78d6]"
                    style={{ width: `${(r.count / serviceTop) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Latest leads"
          hint="Scored, tiered, and assigned automatically"
          action={
            <Link href="/admin/leads" className={small}>
              All leads
            </Link>
          }
        >
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  {['Lead', 'Score', 'Tier', 'Owner', 'Status', 'Received'].map((h) => (
                    <th key={h} className="px-5 py-2.5 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.slice(0, 6).map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/admin/leads/${l.id}`} className="font-medium hover:underline">
                        {l.full_name}
                      </Link>
                      <span className="block text-xs text-slate-500">{l.company ?? 'No company'}</span>
                    </td>
                    <td className="px-5 py-3 tabular-nums">{l.score}</td>
                    <td className="px-5 py-3">
                      <TierBadge tier={l.tier} />
                    </td>
                    <td className="px-5 py-3">{l.rep.name}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-600">{fmtDateTime(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}
