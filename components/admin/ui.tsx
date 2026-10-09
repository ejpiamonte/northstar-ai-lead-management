// components/admin/ui.tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import type { LeadTier } from '@/lib/automation-types';

/* ---------- formatters (UTC so server and client output match) ---------- */

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '–';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '–';
  return `${d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })} UTC`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '–';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '–';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function fmtUsd(n: number | null | undefined): string {
  if (n === null || n === undefined || n <= 0) return '–';
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

export function fmtMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '–';
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`;
}

export const humanize = (s: string | null | undefined): string =>
  s ? s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : '–';

/* ---------- badges ---------- */

const TONES = {
  gold: 'bg-[#FDF3DC] text-[#6B4A06] ring-[#F2B544]/50',
  navy: 'bg-[#E6ECF5] text-[#0B1F3A] ring-[#0B1F3A]/15',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
} as const;
type Tone = keyof typeof TONES;

export function Badge({ tone = 'slate', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function TierBadge({ tier }: { tier: LeadTier | null }) {
  if (!tier) return <Badge>Unscored</Badge>;
  const tone: Tone = tier === 'high' ? 'gold' : tier === 'mid' ? 'navy' : 'slate';
  return <Badge tone={tone}>{humanize(tier)} tier</Badge>;
}

const STATUS_TONE: Record<string, Tone> = {
  new: 'sky',
  analyzing: 'sky',
  assigned: 'navy',
  contacted: 'navy',
  qualified: 'green',
  appointment_set: 'green',
  won: 'green',
  lost: 'slate',
  proposed: 'amber',
  confirmed: 'green',
  completed: 'green',
  cancelled: 'slate',
  no_show: 'red',
  running: 'sky',
  success: 'green',
  partial: 'amber',
  failed: 'red',
  queued: 'sky',
  mocked: 'amber',
  sent: 'green',
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? 'slate'}>{humanize(status)}</Badge>;
}

/* ---------- layout pieces ---------- */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0B1F3A] [font-family:var(--font-display)]">
          {title}
        </h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({
  title,
  children,
  className = '',
  action,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-[#0B1F3A] [font-family:var(--font-display)]">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[#0B1F3A] [font-family:var(--font-display)]">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
      <p className="text-base font-semibold text-[#0B1F3A]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">{body}</p>
      {href && cta && (
        <Link
          href={href}
          className="mt-4 inline-block rounded-lg bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-[#13305a] focus-visible:ring-2 focus-visible:ring-[#F2B544] focus-visible:ring-offset-2"
        >
          {cta}
        </Link>
      )}
    </div>
  );
}

/** Scrolls inside itself so the page never scrolls sideways. */
export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full min-w-[40rem] text-left text-sm">{children}</table>
    </div>
  );
}

export const th = 'px-4 py-3 text-xs font-medium text-slate-500 border-b border-slate-100';
export const td = 'px-4 py-3 align-top border-b border-slate-100 last:border-b-0';
export const linkCls =
  'font-medium text-[#0B1F3A] underline decoration-slate-300 underline-offset-2 outline-none hover:decoration-[#F2B544] focus-visible:ring-2 focus-visible:ring-[#F2B544] rounded-sm';