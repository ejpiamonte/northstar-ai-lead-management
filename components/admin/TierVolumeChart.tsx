'use client';

import { useState } from 'react';
import type { DailyTierPoint } from '@/lib/insights';

/** Ordinal blue ramp: darker = higher priority. */
export const TIER_COLOR = { high: '#184f95', mid: '#3987e5', low: '#86b6ef' } as const;
const TIERS = ['low', 'mid', 'high'] as const; // stacked bottom to top
const LABEL = { high: 'High tier', mid: 'Mid tier', low: 'Low tier' };

const W = 720;
const H = 210;
const PAD = { top: 12, right: 8, bottom: 26, left: 30 };
const GAP = 2;

function topRounded(x: number, y: number, w: number, h: number, r = 4) {
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

export default function TierVolumeChart({ data }: { data: DailyTierPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const totals = data.map((d) => d.high + d.mid + d.low);
  const max = Math.max(1, ...totals);
  const step = max <= 4 ? 1 : max <= 10 ? 2 : max <= 25 ? 5 : 10;
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, k) => k * step);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const band = plotW / data.length;
  const barW = Math.min(18, band * 0.62);
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const active = hover === null ? null : data[hover];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full overflow-visible"
        role="img"
        aria-label="Leads received per day over the last 30 days, by tier"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke={t === 0 ? '#c3c2b7' : '#e1e0d9'}
              strokeWidth={1}
            />
            <text x={PAD.left - 8} y={y(t) + 3} textAnchor="end" fontSize={10} fill="#898781">
              {t}
            </text>
          </g>
        ))}
        {data.map((d, k) => {
          const x = PAD.left + k * band + (band - barW) / 2;
          const present = TIERS.filter((t) => d[t] > 0);
          let base = 0;
          return (
            <g key={d.date}>
              {hover === k && (
                <rect x={PAD.left + k * band} y={PAD.top} width={band} height={plotH} fill="rgba(11,31,58,0.05)" />
              )}
              {present.map((t, i) => {
                const y0 = y(base);
                base += d[t];
                const y1 = y(base);
                const isTop = i === present.length - 1;
                const h = Math.max(0, y0 - y1 - (i > 0 ? GAP : 0));
                return isTop ? (
                  <path key={t} d={topRounded(x, y1, barW, h)} fill={TIER_COLOR[t]} />
                ) : (
                  <rect key={t} x={x} y={y1} width={barW} height={h} fill={TIER_COLOR[t]} />
                );
              })}
              {(k % 5 === 4 || k === 0) && (
                <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize={10} fill="#898781">
                  {d.label}
                </text>
              )}
              <rect
                x={PAD.left + k * band}
                y={PAD.top}
                width={band}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(k)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          );
        })}
      </svg>
      {active && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 min-w-[150px] -translate-x-1/2 -translate-y-full rounded-lg bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-slate-200"
          style={{
            left: `${((PAD.left + hover * band + band / 2) / W) * 100}%`,
            top: `calc(${(y(totals[hover]!) / H) * 100}% - 8px)`,
          }}
        >
          <p className="mb-1 font-semibold">{active.label}</p>
          {(['high', 'mid', 'low'] as const).map((t) => (
            <p key={t} className="flex justify-between gap-4 text-slate-700">
              <span>
                <i
                  className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-[-1px]"
                  style={{ background: TIER_COLOR[t] }}
                />
                {LABEL[t]}
              </span>
              <b>{active[t]}</b>
            </p>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
        {(['high', 'mid', 'low'] as const).map((t) => (
          <span key={t}>
            <i
              className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-[-1px]"
              style={{ background: TIER_COLOR[t] }}
            />
            {LABEL[t]}
          </span>
        ))}
      </div>
      <details className="mt-2 text-xs text-slate-500">
        <summary className="cursor-pointer">View as table</summary>
        <div className="mt-2 max-h-56 overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500">
                <th className="py-1 font-medium">Date</th>
                <th className="py-1 text-right font-medium">High</th>
                <th className="py-1 text-right font-medium">Mid</th>
                <th className="py-1 text-right font-medium">Low</th>
              </tr>
            </thead>
            <tbody className="tabular-nums text-slate-700">
              {data.map((d) => (
                <tr key={d.date}>
                  <td className="py-0.5">{d.label}</td>
                  <td className="py-0.5 text-right">{d.high}</td>
                  <td className="py-0.5 text-right">{d.mid}</td>
                  <td className="py-0.5 text-right">{d.low}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
