'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[northstar] admin error:', error);
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto mt-10 max-w-xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200"
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-600">
        <svg
          viewBox="0 0 20 20"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 6v5M10 14.5v.01M8.6 3.6L2.4 14.4A1.6 1.6 0 003.8 17h12.4a1.6 1.6 0 001.4-2.6L11.4 3.6a1.6 1.6 0 00-2.8 0z" />
        </svg>
      </span>

      <h1 className="mt-5 text-xl font-semibold text-[#0B1F3A] [font-family:var(--font-display)]">
        This page could not load
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Something failed while loading this part of the console. Your leads and automation runs are
        not affected. Try again, and if it keeps happening, check that Supabase is reachable and the
        environment variables are set.
      </p>

      {error.message && (
        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
          {error.message}
        </pre>
      )}
      {error.digest && <p className="mt-2 text-xs text-slate-500">Error reference: {error.digest}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white outline-none transition-colors hover:bg-[#13305a] focus-visible:ring-2 focus-visible:ring-[#F2B544] focus-visible:ring-offset-2"
        >
          Try again
        </button>
        <Link
          href="/admin"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-[#0B1F3A] outline-none ring-1 ring-slate-300 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#F2B544]"
        >
          Back to overview
        </Link>
      </div>
    </div>
  );
}
