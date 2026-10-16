'use client';

import Link from 'next/link';
import type { AutomationStep } from '@/lib/automation-types';

export interface WebhookResponse {
  ok: boolean;
  mode?: 'demo' | 'live';
  error?: string;
  details?: string;
  persisted?: boolean;
  persisted_reason?: string;
  team?: string;
  tier?: 'high' | 'mid' | 'low';
  score?: number;
  assigned_to?: string;
  assigned_role?: string;
  territory?: string | null;
  tier_rule?: string;
  routing_rule?: string;
  duration_ms?: number;
  breakdown?: { fit: number; budget: number; urgency: number; completeness: number } | null;
  analysis?: {
    summary: string;
    key_signals: string[];
    risks: string[];
    recommended_next_step: string;
    urgency: string;
  };
  reply?: { subject: string; body: string };
  appointment_at?: string | null;
  steps?: AutomationStep[];
}

const TIER_STYLE = {
  high: 'bg-[#FDF3DC] text-[#6B4A06] ring-[#F2B544]/60',
  mid: 'bg-[#E6ECF5] text-[#0B1F3A] ring-[#0B1F3A]/15',
  low: 'bg-slate-100 text-slate-700 ring-slate-200',
};

const PARTS = [
  ['fit', 'Service fit', 45],
  ['budget', 'Budget', 30],
  ['urgency', 'Urgency', 15],
  ['completeness', 'Completeness', 12],
] as const;

const STEP_DOT = { success: 'bg-emerald-500', warning: 'bg-amber-500', skipped: 'bg-slate-300', failed: 'bg-red-500' };

export default function LeadResult({ result, onReset }: { result: WebhookResponse; onReset: () => void }) {
  const first = result.assigned_to?.split(' ')[0];
  const tier = result.tier ?? 'low';
  const seconds = (result.duration_ms ?? 0) / 1000;

  return (
    <div role="status" className="rounded-2xl bg-white p-6 text-[#0B1F3A] shadow-sm ring-1 ring-slate-200 sm:p-7">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
          <svg
            viewBox="0 0 20 20"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 10.5l3.2 3.2L15 6.8" />
          </svg>
        </span>
        <div>
          <h3 className="text-lg font-semibold [font-family:var(--font-display)]">
            Routed to {result.assigned_to ?? 'a specialist'} in{' '}
            {seconds < 1 ? `${Math.round(seconds * 1000)} ms` : `${seconds.toFixed(1)} s`}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {result.assigned_role}
            {result.territory ? ` · ${result.territory}` : ''} at {result.team ?? 'Northstar'}. Demo Mode: no AI
            provider or email was contacted.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</p>
          <p className="mt-1 flex items-center gap-2">
            <span className="text-3xl font-semibold tabular-nums">{result.score}</span>
            <span className="text-sm text-slate-500">/ 100</span>
            <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${TIER_STYLE[tier]}`}>
              {tier} tier
            </span>
          </p>
          {result.breakdown && (
            <ul className="mt-3 space-y-1.5">
              {PARTS.map(([k, label, max]) => (
                <li key={k} className="text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{label}</span>
                    <span className="tabular-nums">
                      {result.breakdown![k]}/{max}
                    </span>
                  </div>
                  <div className="mt-0.5 h-1.5 overflow-hidden rounded bg-slate-200">
                    <div
                      className="h-full rounded-r bg-[#2a78d6]"
                      style={{ width: `${(result.breakdown![k] / max) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-3 text-sm">
          <p>
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Tier rule</span>
            {result.tier_rule}
          </p>
          <p>
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Routing</span>
            {result.routing_rule}
          </p>
          <p>
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Next step</span>
            {result.appointment_at
              ? `45-minute discovery call proposed with ${first} for ${new Date(result.appointment_at).toUTCString().replace(':00 GMT', ' UTC')}.`
              : (result.analysis?.recommended_next_step ?? 'The owner follows up by email.')}
          </p>
        </div>
      </div>

      {result.reply && (
        <details className="mt-4 rounded-xl ring-1 ring-slate-200">
          <summary className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-medium outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#F2B544]">
            Reply drafted for you: “{result.reply.subject}”
          </summary>
          <p className="whitespace-pre-wrap border-t border-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-700">
            {result.reply.body}
          </p>
        </details>
      )}

      {result.steps && result.steps.length > 0 && (
        <details className="mt-3 rounded-xl ring-1 ring-slate-200">
          <summary className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-medium outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#F2B544]">
            Automation trace ({result.steps.length} steps)
          </summary>
          <ol className="space-y-2 border-t border-slate-100 px-4 py-3 text-sm">
            {result.steps.map((s) => (
              <li key={s.key} className="flex gap-2.5">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STEP_DOT[s.status]}`} aria-hidden="true" />
                <span>
                  <b className="font-medium">{s.label}</b>
                  <span className="block text-xs text-slate-500">{s.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </details>
      )}

      <p className="mt-4 text-xs text-slate-500">
        {result.persisted
          ? 'Saved to the demo database.'
          : `Not stored: ${result.persisted_reason ?? 'demo run in memory.'}`}
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-4 py-2 text-sm font-semibold outline-none ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#F2B544]"
        >
          Try another enquiry
        </button>
        <Link
          href="/admin"
          className="rounded-lg bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-[#13305a] focus-visible:ring-2 focus-visible:ring-[#F2B544] focus-visible:ring-offset-2"
        >
          See the team dashboard
        </Link>
      </div>
    </div>
  );
}
