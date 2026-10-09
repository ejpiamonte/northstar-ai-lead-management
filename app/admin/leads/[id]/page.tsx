// app/admin/leads/[id]/page.tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  unwrap,
  type AppointmentRow,
  type EmailLogRow,
  type LeadRow,
  type SalespersonRow,
} from '@/lib/admin-data';
import type { AutomationRun, LeadActivity } from '@/lib/automation-types';
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

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return { title: 'Lead' };
  const { data } = await getAdminClient().from('leads').select('full_name').eq('id', id).maybeSingle();
  return { title: data?.full_name ?? 'Lead' };
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const db = getAdminClient();
  const leadRes = await db
    .from('leads')
    .select('*, salespeople(name)')
    .eq('id', id)
    .maybeSingle<LeadRow>();
  if (leadRes.error) throw new Error(`Load lead: ${leadRes.error.message}`);
  const lead = leadRes.data;
  if (!lead) notFound();

  const [runsRes, activitiesRes, emailsRes, apptRes, repRes] = await Promise.all([
    db
      .from('automation_runs')
      .select('*')
      .eq('lead_id', id)
      .order('started_at', { ascending: false })
      .limit(5),
    db
      .from('lead_activities')
      .select('id, activity_type, title, description, created_at, metadata')
      .eq('lead_id', id)
      .order('created_at', { ascending: true }),
    db.from('email_logs').select('*').eq('lead_id', id).order('created_at', { ascending: true }),
    db.from('appointments').select('*').eq('lead_id', id).order('scheduled_at', { ascending: true }),
    lead.assigned_to
      ? db.from('salespeople').select('*').eq('id', lead.assigned_to).maybeSingle<SalespersonRow>()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const runs = unwrap<AutomationRun[]>(runsRes, 'Load runs');
  const activities = unwrap<LeadActivity[]>(activitiesRes, 'Load activities');
  const emails = unwrap<EmailLogRow[]>(emailsRes, 'Load emails');
  const appts = unwrap<AppointmentRow[]>(apptRes, 'Load appointments');
  const rep = repRes.data as SalespersonRow | null;

  const a = lead.ai_analysis;
  const latestRun = runs[0];

  return (
    <>
      <p className="mb-3 text-sm">
        <Link href="/admin/leads" className={linkCls}>
          Back to leads
        </Link>
      </p>

      <PageHeader
        title={lead.full_name}
        description={`${lead.company ?? 'No company'} · received ${fmtDateTime(lead.created_at)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {lead.is_demo && <Badge tone="gold">Demo lead</Badge>}
            <TierBadge tier={lead.tier} />
            <StatusBadge status={lead.status} />
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card title="Enquiry">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <a href={`mailto:${lead.email}`} className={linkCls}>
                  {lead.email}
                </a>
              </Field>
              <Field label="Phone">{lead.phone ?? '–'}</Field>
              <Field label="Service interest">{lead.service_interest ?? '–'}</Field>
              <Field label="Budget range">{lead.budget_range ?? '–'}</Field>
              <Field label="Timeline">{lead.timeline ?? '–'}</Field>
              <Field label="Source">{humanize(lead.source)}</Field>
            </dl>
            <p className="mt-5 whitespace-pre-wrap border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-700">
              {lead.message}
            </p>
          </Card>

          <Card title="AI analysis">
            {!a ? (
              <p className="text-sm text-slate-600">This lead has not been analyzed yet.</p>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <p>
                    <span className="text-3xl font-semibold tabular-nums text-[#0B1F3A] [font-family:var(--font-display)]">
                      {a.score ?? lead.score ?? '–'}
                    </span>
                    <span className="text-slate-500"> / 100</span>
                  </p>
                  <p className="text-slate-600">
                    {humanize(a.service_category)} · {humanize(a.intent)} · {humanize(a.urgency)} urgency
                  </p>
                  <p className="text-slate-600">Budget estimate {fmtUsd(a.estimated_budget_usd)}</p>
                  {typeof a.confidence === 'number' && (
                    <p className="text-slate-600">Confidence {Math.round(a.confidence * 100)}%</p>
                  )}
                </div>
                {a.summary && <p className="text-sm leading-relaxed text-slate-700">{a.summary}</p>}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-[#0B1F3A]">Signals</h3>
                    <BulletList items={a.key_signals ?? []} />
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-[#0B1F3A]">Risks</h3>
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
                  Analyzed by {a.provider ?? 'unknown'}
                  {a.model ? ` (${a.model})` : ''}.
                </p>
              </div>
            )}
          </Card>

          {latestRun ? (
            <AutomationLogView run={latestRun} activities={activities} />
          ) : (
            <Card title="Automation audit trail">
              <p className="text-sm text-slate-600">
                No automation run is linked to this lead. Leads created outside the webhook have no audit
                trail.
              </p>
            </Card>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card title="Assignment">
            {rep ? (
              <dl className="flex flex-col gap-4">
                <Field label="Salesperson">
                  <span className="font-semibold">{rep.name}</span>
                  <span className="block text-slate-500">{rep.role_title}</span>
                </Field>
                <Field label="Assigned">{fmtDateTime(lead.assigned_at)}</Field>
                <Field label="Contact">
                  <a href={`mailto:${rep.email}`} className={linkCls}>
                    {rep.email}
                  </a>
                </Field>
              </dl>
            ) : (
              <p className="text-sm text-slate-600">No salesperson is assigned.</p>
            )}
          </Card>

          <Card title="Appointments">
            {appts.length === 0 ? (
              <p className="text-sm text-slate-600">No appointment proposed. Only high-tier leads get one automatically.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {appts.map((p) => (
                  <li key={p.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[#0B1F3A]">{fmtDateTime(p.scheduled_at)}</p>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {p.duration_minutes} minutes{p.notes ? ` · ${p.notes}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Emails">
            {emails.length === 0 ? (
              <p className="text-sm text-slate-600">No emails were logged for this lead.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {emails.map((m) => (
                  <li key={m.id} className="rounded-xl ring-1 ring-slate-200">
                    <details>
                      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#F2B544]">
                        <span className="min-w-0 truncate font-medium text-[#0B1F3A]">{m.subject}</span>
                        <StatusBadge status={m.status} />
                      </summary>
                      <div className="border-t border-slate-100 px-3 py-3 text-sm">
                        <p className="text-xs text-slate-500">
                          To {m.to_email} · {humanize(m.email_type)}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap leading-relaxed text-slate-700">{m.body}</p>
                        {m.error && <p className="mt-2 text-xs text-red-700">Error: {m.error}</p>}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}