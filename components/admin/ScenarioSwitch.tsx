'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { SCENARIO_COOKIE, SCENARIO_IDS, SCENARIOS, type ScenarioId } from '@/lib/scenarios';

export default function ScenarioSwitch({ current, tone = 'light' }: { current: ScenarioId; tone?: 'light' | 'dark' }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const choose = (id: ScenarioId) => {
    if (id === current) return;
    document.cookie = `${SCENARIO_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    start(() => router.refresh());
  };
  const base = tone === 'dark' ? 'bg-white/10' : 'bg-slate-100';
  return (
    <div
      role="group"
      aria-label="Demo company size"
      aria-busy={pending}
      className={`inline-flex rounded-lg p-1 ${base}`}
    >
      {SCENARIO_IDS.map((id) => {
        const active = id === current;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => choose(id)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#F2B544] ${
              active
                ? 'bg-white text-[#0B1F3A] shadow-sm'
                : tone === 'dark'
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-600 hover:text-[#0B1F3A]'
            }`}
          >
            {SCENARIOS[id].label}
          </button>
        );
      })}
    </div>
  );
}
