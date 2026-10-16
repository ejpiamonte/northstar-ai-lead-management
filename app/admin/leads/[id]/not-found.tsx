// app/admin/leads/[id]/not-found.tsx
import Link from 'next/link';

export default function LeadNotFound() {
  return (
    <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
      <h1 className="text-xl font-semibold text-[#0B1F3A] [font-family:var(--font-display)]">Lead not found</h1>
      <p className="mt-2 text-sm text-slate-600">
        This lead does not exist or was deleted. Check the link, or pick a lead from the list.
      </p>
      <Link
        href="/admin/leads"
        className="mt-5 inline-block rounded-lg bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-[#13305a] focus-visible:ring-2 focus-visible:ring-[#F2B544] focus-visible:ring-offset-2"
      >
        Back to leads
      </Link>
    </div>
  );
}
