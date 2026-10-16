import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLead } from '@/lib/data';
import AutomationLogView from '@/components/AutomationLogView';
import {
  Badge,
  Card,
  PageHeader,
  StatusBadge,
  TierBadge,
  fmtDateTime,
  fmtUsd,
  humanize,
  linkCls,
} from '@/components/admin/ui';
import { duration, minutesLabel, SOURCE_LABEL } from '@/lib/format';
import { CATEGORY_LABEL } from '@/lib/engine/scoring';
import type { ServiceCategory } from '@/lib/engine/schema';

export const dynamic = 'force-dynamic';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-[#0B1F3A]">{children}</dd>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-slate-500">None recorded.</p>;
  return (
    <ul className="flex flex-col gap-1.5 text-sm text-slate-700">
      {items.map((s) => (
        <li key={s} className="flex gap-2">
          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F2B544]" />
          {s}
        </li>
      ))}
    </ul>
  );
}

const PARTS = [
  ['fit', 'Service fit', 45],
  ['budget', 'Budget', 30],
  ['urgency', 'Urgency', 15],
  ['completeness', 'Completeness', 12],
] as const;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const found = await getLead((await params).id);
  return { title: found?.lead.full_name ?? 'Lead' };
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const found = await getLead((await params).id);
  if (!found) notFound();
  const { lead, scenario } = found;
  const a = lead.ai_analysis;
  const rep = lead.rep;
  const target = scenario.responseTargetMinutes[lead.tier ?? 'low'];

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-slate-500">
        <Link href="/admin/leads" className={linkCls}>
          Leads
        </Link>{' '}
        / <span aria-current="page">{lead.full_name}</span>
      </nav>

      <PageHeader
        title={lead.full_name}
        description={`${lead.company ?? 'No company'} · ${SOURCE_LABEL[lead.source] ?? lead.source} · received ${fmtDateTime(lead.created_at)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="gold">Demo lead</Badge>
            <TierBadge tier={lead.tier} />
            <StatusBadge status={lead.status} />
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card title="Why it was routed this way">
            <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div>
                <p>
                  <span className="text-4xl font-semibold tabular-nums">{lead.score}</span>
                  <span className="text-slate-500"> / 100</span>
                </p>
                {lead.breakdown ? (
                  <ul className="mt-3 space-y-2">
                    {PARTS.map(([key, label, max]) => (
                      <li key={key} className="text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>{label}</span>
                          <span className="tabular-nums">
                            {lead.breakdown![key]} / {max}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded bg-slate-100">
                          <div
                            className="h-full rounded-r bg-[#2a78d6]"
                            style={{ width: `${(lead.breakdown![key] / max) * 100}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-xs text-slate-500">
                    Scored by a pre-recorded example analysis standing in for a live model.
                  </p>
                )}
              </div>
              <ol className="space-y-3 text-sm">
                <li className="rounded-xl bg-slate-50 p-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tier rule</span>
                  <span className="mt-0.5 block">{lead.tierRule}</span>
                </li>
                <li className="rounded-xl bg-slate-50 p-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Routing</span>
                  <span className="mt-0.5 block">{lead.routeRule}</span>
                </li>
                <li className="rounded-xl bg-slate-50 p-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Response</span>
                  <span className="mt-0.5 block">
                    Automated reply in {duration(lead.autoReplyMs)}.{' '}
                    {lead.followUpMs !== null
                      ? `${rep.name.split(' ')[0]} followed up in ${duration(lead.followUpMs)} (target ${minutesLabel(target)}).`
                      : `Waiting for ${rep.name.split(' ')[0]} to follow up (target ${minutesLabel(target)}).`}
                  </span>
                </li>
              </ol>
            </div>
          </Card>

          <Card title="Enquiry">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">{lead.email}</Field>
              <Field label="Phone">{lead.phone ?? '–'}</Field>
              <Field label="Service interest">{lead.service_interest ?? '–'}</Field>
              <Field label="Budget range">{lead.budget_range ?? '–'}</Field>
              <Field label="Timeline">{lead.timeline ?? '–'}</Field>
              <Field label={scenario.id === 'enterprise' ? 'Territory' : 'Region'}>{lead.region}</Field>
            </dl>
            <p className="mt-5 whitespace-pre-wrap border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-700">
              {lead.message}
            </p>
          </Card>

          {a && (
            <Card title="AI analysis">
              <div className="flex flex-col gap-5">
                <p className="text-sm text-slate-600">
                  {CATEGORY_LABEL[a.service_category as ServiceCategory] ?? humanize(a.service_category)} ·{' '}
                  {humanize(a.intent)} · {humanize(a.urgency)} urgency · budget estimate{' '}
                  {fmtUsd(a.estimated_budget_usd)}
                  {typeof a.confidence === 'number' ? ` · confidence ${Math.round(a.confidence * 100)}%` : ''}
                </p>
                {a.summary && <p className="text-sm leading-relaxed text-slate-700">{a.summary}</p>}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Signals</h3>
                    <BulletList items={a.key_signals ?? []} />
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Risks</h3>
                    <BulletList items={a.risks ?? []} />
                  </div>
                </div>
                {a.recommended_next_step && (
                  <p className="rounded-xl bg-[#FDF3DC] p-4 text-sm text-[#6B4A06]">
                    <span className="font-semibold">Next step: </span>
                    {a.recommended_next_step}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  AI output is advisory. Deterministic rules set the tier and owner. Demo analysis: {a.provider} (
                  {a.model}).
                </p>
              </div>
            </Card>
          )}

          <AutomationLogView run={lead.run} activities={lead.activities} />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card title="Owner">
            <dl className="flex flex-col gap-4">
              <Field label="Salesperson">
                <span className="font-semibold">{rep.name}</span>
                <span className="block text-slate-500">
                  {rep.role_title}
                  {rep.territory ? ` · ${rep.territory}` : ''}
                </span>
              </Field>
              <Field label="Assigned">{fmtDateTime(lead.assigned_at)}</Field>
              <Field label="Calendar">{rep.calendar_url ?? '–'}</Field>
            </dl>
          </Card>

          <Card title="Meeting">
            {!lead.appointment ? (
              <p className="text-sm text-slate-600">
                No meeting yet. High-tier leads get a discovery call proposed automatically.
              </p>
            ) : (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{fmtDateTime(lead.appointment.scheduled_at)}</p>
                  <StatusBadge status={lead.appointment.status} />
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {lead.appointment.duration_minutes} minutes · {lead.appointment.notes}
                </p>
              </div>
            )}
          </Card>

          <Card title="Emails drafted">
            <ul className="flex flex-col gap-3">
              {lead.emails.map((m) => (
                <li key={m.id} className="rounded-xl ring-1 ring-slate-200">
                  <details>
                    <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#F2B544]">
                      <span className="min-w-0 truncate font-medium">{m.subject}</span>
                      <Badge tone={m.direction === 'internal' ? 'navy' : 'amber'}>
                        {m.direction === 'internal' ? 'Rep alert' : 'Reply to lead'}
                      </Badge>
                    </summary>
                    <div className="border-t border-slate-100 px-3 py-3 text-sm">
                      <p className="text-xs text-slate-500">To {m.to_email} · mock, not sent</p>
                      <p className="mt-2 whitespace-pre-wrap leading-relaxed text-slate-700">{m.body}</p>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
