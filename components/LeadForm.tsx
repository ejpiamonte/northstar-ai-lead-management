// components/LeadForm.tsx
'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import LeadResult, { type WebhookResponse } from './LeadResult';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const SERVICES = [
  'AI workflow automation',
  'Custom web application',
  'Website design and build',
  'Support and maintenance',
  'Consulting',
  'Something else',
];
const BUDGETS = [
  'Not sure yet',
  'Under $2,000',
  '$2,000 - $10,000',
  '$10,000 - $25,000',
  '$25,000 - $50,000',
  '$50,000+',
];
const TIMELINES = ['As soon as possible', 'Within a month', 'This quarter', 'Just exploring'];
const REGIONS = ['North America', 'EMEA', 'APAC'];

/** One-click examples so visitors can see each tier without writing an enquiry. */
const SAMPLES: { label: string; hint: string; values: Record<string, string> }[] = [
  {
    label: 'Logistics automation',
    hint: 'likely high tier',
    values: {
      full_name: 'Jordan Avery',
      email: 'jordan.avery@meridianfreight.example',
      company: 'Meridian Freight',
      phone: '+1 555 0142',
      service_interest: 'AI workflow automation',
      budget_range: '$25,000 - $50,000',
      timeline: 'As soon as possible',
      region: 'North America',
      message:
        'Our 20-person dispatch team retypes rate quotes from carrier emails and PDFs into HubSpot. We want an AI workflow that extracts the details, updates the deal, and flags anything unusual in Slack for a person to approve. Budget is approved and we would like to start this month.',
    },
  },
  {
    label: 'Clinic portal',
    hint: 'likely mid tier',
    values: {
      full_name: 'Sam Rivera',
      email: 'sam.rivera@harborclinics.example',
      company: 'Harbor Family Clinics',
      phone: '',
      service_interest: 'Custom web application',
      budget_range: '$2,000 - $10,000',
      timeline: 'This quarter',
      region: 'EMEA',
      message:
        'We run four clinics and want a simple patient portal for appointment changes and intake forms instead of phone calls.',
    },
  },
  {
    label: 'Website fix',
    hint: 'likely low tier',
    values: {
      full_name: 'Robin Clarke',
      email: 'robin@corner-bakery.example',
      company: 'Corner Bakery',
      phone: '',
      service_interest: 'Support and maintenance',
      budget_range: 'Under $2,000',
      timeline: 'Within a month',
      region: 'APAC',
      message: 'The order form on our website stopped working after a plugin update. Can you fix it?',
    },
  },
];

const input =
  'w-full rounded-lg bg-white px-3 py-2.5 text-sm text-[#0B1F3A] ring-1 ring-slate-300 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#F2B544]';
const label = 'mb-1.5 block text-sm font-medium text-[#0B1F3A]';

export default function LeadForm() {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WebhookResponse | null>(null);

  function fillSample(values: Record<string, string>) {
    const form = formRef.current;
    if (!form) return;
    for (const [name, value] of Object.entries(values)) {
      const field = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      if (field) field.value = value;
    }
    setError(null);
    form.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus();
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'submitting') return;
    const fd = new FormData(e.currentTarget);

    // Honeypot: real visitors never see or fill this field.
    if (String(fd.get('website') ?? '').trim() !== '') {
      setResult({ ok: true });
      setStatus('success');
      return;
    }

    const payload: Record<string, string> = { source: 'website_form' };
    for (const key of [
      'full_name',
      'email',
      'company',
      'phone',
      'service_interest',
      'budget_range',
      'timeline',
      'region',
      'message',
    ]) {
      const value = String(fd.get(key) ?? '').trim();
      if (value) payload[key] = value;
    }

    setStatus('submitting');
    setError(null);
    try {
      const res = await fetch('/api/webhook/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as WebhookResponse;
      if (!res.ok || !data.ok) {
        setError(
          res.status === 422
            ? `Please check your details. ${data.details ?? ''}`.trim()
            : 'We could not process your enquiry just now. Please try again in a moment.',
        );
        setStatus('error');
        return;
      }
      setResult(data);
      setStatus('success');
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
      setStatus('error');
    }
  }

  if (status === 'success' && result) {
    return (
      <LeadResult
        result={result}
        onReset={() => {
          setStatus('idle');
          setResult(null);
        }}
      />
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7"
      aria-describedby={error ? id('error') : undefined}
    >
      <h2 className="text-xl font-semibold text-[#0B1F3A] [font-family:var(--font-display)]">Tell us what you need</h2>
      <p className="mt-1 text-sm text-slate-600">Fields marked with an asterisk are required.</p>

      <div className="mt-4 rounded-xl bg-[#FFF8E8] p-3 ring-1 ring-[#F2B544]/40">
        <p className="text-xs font-semibold text-[#6B4A06]">Portfolio demo: try a sample enquiry</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => fillSample(s.values)}
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#0B1F3A] ring-1 ring-[#F2B544]/60 outline-none hover:bg-[#FDF3DC] focus-visible:ring-2 focus-visible:ring-[#0B1F3A]"
            >
              {s.label} <span className="font-normal text-slate-500">· {s.hint}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
          Use fictional details only. Submissions run in Demo Mode: no AI service or email is contacted.
        </p>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={id('full_name')} className={label}>
            Full name *
          </label>
          <input
            id={id('full_name')}
            name="full_name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            className={input}
          />
        </div>
        <div>
          <label htmlFor={id('email')} className={label}>
            Work email *
          </label>
          <input
            id={id('email')}
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            className={input}
          />
        </div>
        <div>
          <label htmlFor={id('company')} className={label}>
            Company
          </label>
          <input id={id('company')} name="company" maxLength={160} autoComplete="organization" className={input} />
        </div>
        <div>
          <label htmlFor={id('phone')} className={label}>
            Phone
          </label>
          <input id={id('phone')} name="phone" type="tel" maxLength={40} autoComplete="tel" className={input} />
        </div>
        <div>
          <label htmlFor={id('service_interest')} className={label}>
            What do you need?
          </label>
          <select id={id('service_interest')} name="service_interest" defaultValue="" className={input}>
            <option value="">Choose one</option>
            {SERVICES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={id('budget_range')} className={label}>
            Budget
          </label>
          <select id={id('budget_range')} name="budget_range" defaultValue="" className={input}>
            <option value="">Choose one</option>
            {BUDGETS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={id('timeline')} className={label}>
            Timeline
          </label>
          <select id={id('timeline')} name="timeline" defaultValue="" className={input}>
            <option value="">Choose one</option>
            {TIMELINES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={id('region')} className={label}>
            Where are you based?
          </label>
          <select id={id('region')} name="region" defaultValue="" className={input}>
            <option value="">Choose one</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r === 'EMEA' ? 'Europe, Middle East, Africa' : r === 'APAC' ? 'Asia-Pacific' : r}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={id('message')} className={label}>
            Tell us about your project *
          </label>
          <textarea
            id={id('message')}
            name="message"
            required
            minLength={10}
            maxLength={4000}
            rows={5}
            placeholder="What are you trying to do, what tools do you use today, and what would a good result look like?"
            className={input}
          />
        </div>

        {/* Honeypot, hidden from people and assistive tech */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor={id('website')}>Website</label>
          <input id={id('website')} name="website" tabIndex={-1} autoComplete="off" />
        </div>
      </div>

      {error && (
        <p
          id={id('error')}
          role="alert"
          className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-6 w-full rounded-lg bg-[#0B1F3A] px-5 py-3 text-sm font-semibold text-white outline-none transition-colors hover:bg-[#13305a] focus-visible:ring-2 focus-visible:ring-[#F2B544] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === 'submitting' ? 'Scoring and routing…' : 'Send enquiry'}
      </button>
    </form>
  );
}
