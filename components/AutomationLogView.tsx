import type { ReactNode } from 'react';
import type { AutomationRun, AutomationStep, LeadActivity, RunStatus, StepStatus } from '@/lib/automation-types';

interface Props {
  run: AutomationRun;
  activities?: LeadActivity[];
  className?: string;
}

const STEP_STYLE: Record<StepStatus, { label: string; badge: string; bar: string; node: string }> = {
  success: {
    label: 'Completed',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    bar: 'bg-emerald-500',
    node: 'bg-emerald-500 text-white',
  },
  warning: {
    label: 'Completed with a warning',
    badge: 'bg-amber-50 text-amber-800 ring-amber-200',
    bar: 'bg-amber-500',
    node: 'bg-amber-500 text-white',
  },
  skipped: {
    label: 'Skipped',
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    bar: 'bg-slate-300',
    node: 'bg-slate-300 text-white',
  },
  failed: {
    label: 'Failed',
    badge: 'bg-red-50 text-red-700 ring-red-200',
    bar: 'bg-red-500',
    node: 'bg-red-500 text-white',
  },
};

const RUN_STYLE: Record<RunStatus, { label: string; badge: string }> = {
  running: { label: 'Running', badge: 'bg-sky-50 text-sky-700 ring-sky-200' },
  success: { label: 'Succeeded', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  partial: { label: 'Finished with warnings', badge: 'bg-amber-50 text-amber-800 ring-amber-200' },
  failed: { label: 'Failed', badge: 'bg-red-50 text-red-700 ring-red-200' },
};

const GLYPH: Record<StepStatus, string> = {
  success: 'M5 10.5l3.2 3.2L15 6.8',
  warning: 'M10 5.5v5.5M10 14.2v.01',
  skipped: 'M6 10h8',
  failed: 'M6.5 6.5l7 7M13.5 6.5l-7 7',
};

function formatMs(ms: number): string {
  if (!Number.isFinite(ms)) return '';
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`;
}

function formatClock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })} UTC`;
}

function StepNode({ status }: { status: StepStatus }) {
  return (
    <span
      className={`relative z-10 grid h-8 w-8 place-items-center rounded-full ring-4 ring-white ${STEP_STYLE[status].node}`}
    >
      <svg
        viewBox="0 0 20 20"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={GLYPH[status]} />
      </svg>
    </span>
  );
}

function Chip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${className}`}>
      {children}
    </span>
  );
}

function StepRow({
  step,
  index,
  total,
  originMs,
  isLast,
}: {
  step: AutomationStep;
  index: number;
  total: number;
  originMs: number;
  isLast: boolean;
}) {
  const style = STEP_STYLE[step.status];
  const offset = new Date(step.started_at).getTime() - originMs;
  const width = Math.max(2, Math.min(100, Math.round((step.duration_ms / total) * 100)));
  const hasOutput = step.output && Object.keys(step.output).length > 0;

  return (
    <li className="relative flex gap-4 pb-7 last:pb-0">
      {!isLast && (
        <span aria-hidden="true" className="absolute left-4 top-8 -ml-px h-[calc(100%-2rem)] w-0.5 bg-slate-200" />
      )}
      <StepNode status={step.status} />

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-sm font-semibold text-[#0B1F3A]">
            <span className="sr-only">Step {index + 1}: </span>
            {step.label}
          </h3>
          <p className="text-xs tabular-nums text-slate-500">
            {Number.isFinite(offset) && <span>+{formatMs(Math.max(0, offset))} · </span>}
            {formatMs(step.duration_ms)}
          </p>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Chip className={style.badge}>{style.label}</Chip>
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{step.key}</code>
        </div>

        {step.detail && <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.detail}</p>}

        <div
          className="mt-3 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-slate-100"
          role="img"
          aria-label={`${formatMs(step.duration_ms)}, ${width}% of total run time`}
        >
          <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${width}%` }} />
        </div>

        {hasOutput && (
          <details className="mt-3 rounded-lg ring-1 ring-slate-200 open:bg-slate-50">
            <summary className="cursor-pointer select-none rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#F2B544]">
              View step output
            </summary>
            <pre className="overflow-x-auto border-t border-slate-200 bg-[#0B1F3A] p-3 text-xs leading-relaxed text-slate-100">
              {JSON.stringify(step.output, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </li>
  );
}

export default function AutomationLogView({ run, activities = [], className = '' }: Props) {
  const steps = run.steps ?? [];
  const titleId = `run-${run.id}-title`;
  const stepTotal = steps.reduce((sum, s) => sum + s.duration_ms, 0);
  const total = Math.max(run.duration_ms ?? stepTotal, 1);
  const originMs = steps.length ? new Date(steps[0].started_at).getTime() : new Date(run.started_at).getTime();

  const counts = steps.reduce(
    (acc, s) => ({ ...acc, [s.status]: (acc[s.status] ?? 0) + 1 }),
    {} as Partial<Record<StepStatus, number>>,
  );
  const runStyle = RUN_STYLE[run.status];

  return (
    <section
      aria-labelledby={titleId}
      className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7 ${className}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            id={titleId}
            className="text-lg font-semibold tracking-tight text-[#0B1F3A] [font-family:var(--font-display)]"
          >
            Automation audit trail
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Run <code className="text-slate-700">{run.id.slice(0, 8)}</code> started at {formatClock(run.started_at)}{' '}
            from the {run.trigger}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip className={runStyle.badge}>{runStyle.label}</Chip>
          <Chip
            className={
              run.mode === 'demo'
                ? 'bg-[#FDF3DC] text-[#6B4A06] ring-[#F2B544]/50'
                : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
            }
          >
            {run.mode === 'demo' ? 'Demo Mode' : 'Live mode'}
          </Chip>
          {run.ai_provider && (
            <Chip className="bg-slate-50 text-slate-700 ring-slate-200">
              {run.ai_provider}
              {run.model ? ` · ${run.model}` : ''}
            </Chip>
          )}
          {run.duration_ms !== null && (
            <Chip className="bg-slate-50 text-slate-700 ring-slate-200">{formatMs(run.duration_ms)}</Chip>
          )}
        </div>
      </header>

      {steps.length > 0 && (
        <p className="mt-4 text-sm text-slate-600">
          {steps.length} steps:{' '}
          {(['success', 'warning', 'skipped', 'failed'] as const)
            .filter((k) => counts[k])
            .map((k) => `${counts[k]} ${STEP_STYLE[k].label.toLowerCase()}`)
            .join(', ')}
          .
        </p>
      )}

      {run.error && (
        <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
          <p className="font-semibold">The run stopped with an error</p>
          <p className="mt-1 leading-relaxed">{run.error}</p>
        </div>
      )}

      {steps.length === 0 ? (
        <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-600 ring-1 ring-slate-200">
          No steps were recorded for this run yet. Submit a lead through the contact form to see each automation step
          appear here.
        </p>
      ) : (
        <ol className="mt-7">
          {steps.map((step, i) => (
            <StepRow
              key={`${step.key}-${i}`}
              step={step}
              index={i}
              total={total}
              originMs={originMs}
              isLast={i === steps.length - 1}
            />
          ))}
        </ol>
      )}

      {activities.length > 0 && (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="text-sm font-semibold text-[#0B1F3A]">Lead timeline</h3>
          <ul className="mt-4 flex flex-col gap-4">
            {activities.map((a) => (
              <li key={a.id} className="flex gap-3">
                <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#F2B544]" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#0B1F3A]">{a.title}</p>
                  {a.description && <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{a.description}</p>}
                  <p className="mt-0.5 text-xs text-slate-500">{formatClock(a.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
