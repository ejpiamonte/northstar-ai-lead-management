import Link from 'next/link';
import { getLeads } from '@/lib/data';
import { Badge, PageHeader, fmtDateTime } from '@/components/admin/ui';

export const metadata = { title: 'Email log' };

const PAGE_SIZE = 30;

export default async function EmailsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const leads = await getLeads();
  const emails = leads.flatMap((l) => l.emails.map((e) => ({ ...e, leadId: l.id })));
  const pages = Math.max(1, Math.ceil(emails.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(pageParam) || 1));
  const visible = emails.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Email log"
        description="Every lead gets a tailored acknowledgement, and its owner gets an internal alert with the score, signals, and next step. In this demo they are drafted and logged, never sent."
      />
      <ul className="flex flex-col gap-3">
        {visible.map((m) => (
          <li key={m.id} className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <details>
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#F2B544]">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{m.subject}</span>
                  <span className="block text-xs text-slate-500">
                    To {m.to_email} · {fmtDateTime(m.created_at)}
                  </span>
                </span>
                <span className="flex gap-2">
                  <Badge tone={m.direction === 'internal' ? 'navy' : 'gold'}>
                    {m.direction === 'internal' ? 'Rep alert' : 'Reply to lead'}
                  </Badge>
                  <Badge tone="amber">Mock</Badge>
                </span>
              </summary>
              <div className="border-t border-slate-100 px-4 py-3 text-sm">
                <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{m.body}</p>
                <Link
                  href={`/admin/leads/${m.leadId}`}
                  className="mt-3 inline-block text-xs font-semibold underline underline-offset-2"
                >
                  Open lead
                </Link>
              </div>
            </details>
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>
            Page {page} of {pages} · {emails.length} emails
          </span>
          <span className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/emails?page=${page - 1}`}
                className="rounded-lg bg-white px-3 py-1.5 font-semibold ring-1 ring-slate-300"
              >
                Previous
              </Link>
            )}
            {page < pages && (
              <Link
                href={`/admin/emails?page=${page + 1}`}
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
