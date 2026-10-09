// components/LeadForm.tsx
'use client';

import Link from 'next/link';
import { useId, useState, type FormEvent } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface WebhookResponse {
  ok: boolean;
  assigned_to?: string;
  mode?: 'demo' | 'live';
  error?: string;
  details?: string;
}

const SERVICES = [
  'AI workflow automation',
  'Custom web application',
  'Website design and build',
  'Support and maintenance',
  'Consulting',
  'Something else',
];
const BUDGETS = ['Not sure yet', 'Under $2,000', '$2,000 - $10,000', '$10,000 - $25,000', '$25,000 - $50,000', '$50,000+'];
const TIMELINES = ['As soon as possible', 'Within a month', 'This quarter', 'Just exploring'];

const input =
  'w-full rounded-lg bg-white px-3 py-2.5 text-sm text-[#0B1F3A] ring-1 ring-slate-300 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#F2B544]';
const label = 'mb-1.5 block text-sm font-medium text-[#0B1F3A]';

export default function LeadForm() {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WebhookResponse | null>(null);

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
    for (const key of ['full_name', 'email', 'company', 'phone', 'service_interest', 'budget_range', 'timeline', 'message']) {
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

  if (status === 'success') {
    const first = result?.assigned_to?.split(' ')[0];
    return (
      <div role="status" className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 10.5l3.2 3.2L15 6.8" />
          </svg>
        </span>
        <h3 className="mt-4 text-xl font-semibold text-[#0B1F3A] [font-family:var(--font-display)]">
          Thanks, we have your enquiry
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {result?.mode === 'demo'
            ? `${first ? `${first} was selected in the simulated routing flow.` : 'A specialist was selected in the simulated routing flow.'} No email was sent.`
            : first
              ? `${first} has been assigned and will reply by email.`
              : 'The right person on our team will reply by email.'}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setStatus('idle');
              setResult(null);
            }}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-[#0B1F3A] outline-none ring-1 ring-slate-300 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#F2B544]"
          >
            Send another enquiry
          </button>
          <Link
            href="/admin"
            className="rounded-lg bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-[#13305a] focus-visible:ring-2 focus-visible:ring-[#F2B544] focus-visible:ring-offset-2"
          >
            View the demo dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7"
      aria-describedby={error ? id('error') : undefined}
    >
      <h2 className="text-xl font-semibold text-[#0B1F3A] [font-family:var(--font-display)]">Tell us what you need</h2>
      <p className="mt-1 text-sm text-slate-600">Fields marked with an asterisk are required.</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">Portfolio demo: submissions are processed in Demo Mode and stored to demonstrate the workflow. No AI service or email is contacted.</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={id('full_name')} className={label}>Full name *</label>
          <input id={id('full_name')} name="full_name" required minLength={2} maxLength={120} autoComplete="name" className={input} />
        </div>
        <div>
          <label htmlFor={id('email')} className={label}>Work email *</label>
          <input id={id('email')} name="email" type="email" required maxLength={200} autoComplete="email" className={input} />
        </div>
        <div>
          <label htmlFor={id('company')} className={label}>Company</label>
          <input id={id('company')} name="company" maxLength={160} autoComplete="organization" className={input} />
        </div>
        <div>
          <label htmlFor={id('phone')} className={label}>Phone</label>
          <input id={id('phone')} name="phone" type="tel" maxLength={40} autoComplete="tel" className={input} />
        </div>
        <div>
          <label htmlFor={id('service_interest')} className={label}>What do you need?</label>
          <select id={id('service_interest')} name="service_interest" defaultValue="" className={input}>
            <option value="">Choose one</option>
            {SERVICES.map((s) => (<option key={s}>{s}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor={id('budget_range')} className={label}>Budget</label>
          <select id={id('budget_range')} name="budget_range" defaultValue="" className={input}>
            <option value="">Choose one</option>
            {BUDGETS.map((b) => (<option key={b}>{b}</option>))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={id('timeline')} className={label}>Timeline</label>
          <select id={id('timeline')} name="timeline" defaultValue="" className={input}>
            <option value="">Choose one</option>
            {TIMELINES.map((t) => (<option key={t}>{t}</option>))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={id('message')} className={label}>Tell us about your project *</label>
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
        <p id={id('error')} role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-6 w-full rounded-lg bg-[#0B1F3A] px-5 py-3 text-sm font-semibold text-white outline-none transition-colors hover:bg-[#13305a] focus-visible:ring-2 focus-visible:ring-[#F2B544] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === 'submitting' ? 'Sending…' : 'Send enquiry'}
      </button>
    </form>
  );
}
