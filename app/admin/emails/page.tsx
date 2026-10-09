// app/admin/emails/page.tsx
import Link from 'next/link';
import { getAdminClient } from '@/lib/supabase/admin';
import { unwrap, type EmailLogRow } from '@/lib/admin-data';
import {
  Badge,
  EmptyState,
  PageHeader,
  StatusBadge,
  fmtDateTime,
  humanize,
  linkCls,
} from '@/components/admin/ui';

export const metadata = { title: 'Email log' };
export const dynamic = 'force-dynamic';

export default async function EmailsPage() {
  const res = await getAdminClient()
    .from('email_logs')
    .select('*, leads(full_name)')
    .order('created_at', { ascending: false })
    .limit(100);
  const rows = unwrap<EmailLogRow[]>(res, 'Load emails');
  const mocked = rows.filter((r) => r.is_mock).length;

  return (
    <>
      <PageHeader
        title="Email log"
        description={
          rows.length
            ? `${rows.length} recent messages. ${mocked} were mock messages that were logged but never sent.`
            : 'Messages the automation wrote for leads and salespeople.'
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No emails logged"
          body="Each processed lead writes an acknowledgment to the lead and a notification to the assigned rep. In Demo Mode these are logged only."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((m) => (
            <li key={m.id} className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl px-5 py-4 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#F2B544]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#0B1F3A]">{m.subject}</p>
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      To {m.to_email} · {fmtDateTime(m.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={m.direction === 'internal' ? 'navy' : 'slate'}>
                      {m.direction === 'internal' ? 'Internal' : 'To lead'}
                    </Badge>
                    {m.is_mock && <Badge tone="gold">Mock</Badge>}
                    <StatusBadge status={m.status} />
                  </div>
                </summary>
                <div className="border-t border-slate-100 px-5 py-4 text-sm">
                  <dl className="grid gap-x-8 gap-y-1 text-xs text-slate-500 sm:grid-cols-2">
                    <div>From: {m.from_email}</div>
                    <div>Type: {humanize(m.email_type)}</div>
                    <div>Provider: {m.provider ?? '–'}</div>
                    <div>
                      Lead:{' '}
                      {m.lead_id ? (
                        <Link href={`/admin/leads/${m.lead_id}`} className={linkCls}>
                          {m.leads?.full_name ?? 'Open lead'}
                        </Link>
                      ) : (
                        '–'
                      )}
                    </div>
                  </dl>
                  <p className="mt-4 whitespace-pre-wrap leading-relaxed text-slate-700">{m.body}</p>
                  {m.error && (
                    <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700 ring-1 ring-red-200">
                      Delivery error: {m.error}
                    </p>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}