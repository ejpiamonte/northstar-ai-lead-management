'use client';

import { useState } from 'react';

type Assumptions = { monthlyLeads: number; triageMinutes: number; hourlyCost: number; manualResponseHours: number };

const FTE_HOURS = 140;

/** Illustrative estimate. Every input is visible and editable; nothing here is a measured result. */
export default function ImpactPanel({
  defaults,
  autoReplySeconds,
}: {
  defaults: Assumptions;
  autoReplySeconds: number;
}) {
  const [a, setA] = useState(defaults);
  const set = (k: keyof Assumptions) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setA((p) => ({ ...p, [k]: Math.max(0, Number(e.target.value) || 0) }));
  const hours = (a.monthlyLeads * a.triageMinutes) / 60;
  const yearly = hours * a.hourlyCost * 12;
  const usd = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const fields: [keyof Assumptions, string][] = [
    ['monthlyLeads', 'Leads per month'],
    ['triageMinutes', 'Manual triage minutes per lead'],
    ['hourlyCost', 'Loaded hourly cost (USD)'],
    ['manualResponseHours', 'Typical manual first reply (hours)'],
  ];

  return (
    <section aria-labelledby="impact" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 id="impact" className="font-semibold">
        Estimated impact
      </h2>
      <p className="mt-1 text-xs text-slate-500">Edit the assumptions to match your team.</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-2xl font-semibold tabular-nums">{Math.round(hours)} h</p>
          <p className="text-xs text-slate-500">triage time saved per month</p>
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums">{usd(yearly)}</p>
          <p className="text-xs text-slate-500">labor cost avoided per year</p>
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums">
            {autoReplySeconds < 60 ? `${autoReplySeconds.toFixed(1)} s` : `${Math.round(autoReplySeconds / 60)} min`}
          </p>
          <p className="text-xs text-slate-500">to first reply, vs ~{a.manualResponseHours} h by hand</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2">
        {fields.map(([k, label]) => (
          <label key={k} className="grid min-w-0 gap-1 text-xs text-slate-600">
            {label}
            <input
              type="number"
              min={0}
              value={a[k]}
              onChange={set(k)}
              inputMode="numeric"
              className="w-full min-w-0 rounded-lg px-2.5 py-1.5 text-sm text-[#0B1F3A] ring-1 ring-slate-300 outline-none focus-visible:ring-2 focus-visible:ring-[#F2B544]"
            />
          </label>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Illustrative estimate based on the assumptions shown, not a measured result. Triage time = reading, scoring,
        routing, and drafting the first reply for every lead. {(hours / FTE_HOURS).toFixed(2)} FTE at {FTE_HOURS}{' '}
        productive hours per month.
      </p>
    </section>
  );
}
