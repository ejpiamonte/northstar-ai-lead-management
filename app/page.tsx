// app/page.tsx
import Link from 'next/link';
import LeadForm from '@/components/LeadForm';
import ScenarioSwitch from '@/components/admin/ScenarioSwitch';
import { getScenario } from '@/lib/data';
import { SCENARIOS } from '@/lib/scenarios';

const SERVICES = [
  {
    title: 'AI workflow automation',
    body: 'Agents and pipelines that read email, documents, and forms, update your systems, and hand people only the exceptions.',
  },
  {
    title: 'Custom web applications',
    body: 'Portals, dashboards, and internal tools built around how your team works, with the integrations you already rely on.',
  },
  {
    title: 'Websites and support',
    body: 'Fast, maintainable websites and a support team that fixes problems quickly when something breaks.',
  },
];

const STEPS = [
  {
    title: 'We read your message',
    body: 'The form hands your enquiry to an automation that checks it for completeness.',
  },
  { title: 'We score the fit', body: 'AI weighs service fit, budget, and urgency, and explains its reasoning.' },
  { title: 'We route it to a person', body: 'Clear rules send you to the specialist who handles work like yours.' },
  { title: 'You get a reply', body: 'A tailored acknowledgment goes out, and bigger projects get a call proposed.' },
];

function Star({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 2l3.2 10.8L30 16l-10.8 3.2L16 30l-3.2-10.8L2 16l10.8-3.2z" fill="#F2B544" />
    </svg>
  );
}

export default async function HomePage() {
  const scenario = await getScenario();
  return (
    <>
      <header className="bg-[#0B1F3A]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-white outline-none focus-visible:ring-2 focus-visible:ring-[#F2B544] rounded-md"
          >
            <Star className="h-7 w-7" />
            <span className="text-lg font-semibold tracking-tight [font-family:var(--font-display)]">
              Northstar <span className="font-normal text-slate-400">Digital</span>
            </span>
          </Link>
          <Link
            href="/admin"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[#F2B544]"
          >
            Workflow demo
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#0B1F3A] pb-20 pt-10 text-white sm:pb-28 sm:pt-16">
        <svg
          aria-hidden="true"
          viewBox="0 0 800 400"
          className="pointer-events-none absolute -right-24 top-0 h-full w-[60rem] max-w-none opacity-40"
          fill="none"
        >
          <g stroke="#F2B544" strokeOpacity="0.35" strokeWidth="1">
            <path d="M80 300L220 210L340 250L470 120L610 160L720 60" />
            <path d="M220 210L260 90L470 120" />
            <path d="M340 250L400 340L610 160" />
          </g>
          <g fill="#F2B544">
            {[
              [80, 300],
              [220, 210],
              [340, 250],
              [470, 120],
              [610, 160],
              [720, 60],
              [260, 90],
              [400, 340],
            ].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="4" />
            ))}
          </g>
        </svg>

        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:items-start">
          <div className="pt-4 lg:pt-10">
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.1] tracking-tight [font-family:var(--font-display)] sm:text-5xl">
              Every enquiry finds the right person in seconds
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-300">
              Northstar Digital builds AI automation, web applications, and websites. Tell us what you need and our
              system reads, scores, and routes your message before you close the tab.
            </p>
            <ul className="mt-8 flex flex-col gap-3 text-sm text-slate-300">
              {[
                'A named specialist, not a shared inbox',
                'A reply shaped by what you wrote',
                'A call proposed for larger projects',
              ].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <Star className="h-3.5 w-3.5 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div id="contact" className="scroll-mt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
              <span>Demo routing team: {scenario.company}</span>
              <ScenarioSwitch current={scenario.id} tone="dark" />
            </div>
            <LeadForm />
          </div>
        </div>
      </section>

      <main>
        <section aria-labelledby="services" className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-20">
          <h2
            id="services"
            className="text-2xl font-semibold tracking-tight text-[#0B1F3A] [font-family:var(--font-display)]"
          >
            What we build
          </h2>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {SERVICES.map((s) => (
              <li key={s.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-base font-semibold text-[#0B1F3A] [font-family:var(--font-display)]">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="explore" className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 sm:pb-20">
          <h2
            id="explore"
            className="text-2xl font-semibold tracking-tight text-[#0B1F3A] [font-family:var(--font-display)]"
          >
            Explore the workflow demo
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            The same rules power a three-person team and a 12-rep sales organisation. Pick a starting point.
          </p>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                href: '/admin',
                title: 'Team dashboard',
                body: 'Lead volume, response times, pipeline, and workload across the last 30 days.',
              },
              {
                href: '/admin/leads',
                title: 'Lead inbox',
                body: 'Filter by tier, owner, or territory and open any lead to see why it was routed.',
              },
              {
                href: '/admin/how-it-works',
                title: 'How it works',
                body: 'The scoring and routing rules, and what changes between small and large teams.',
              },
            ].map((c) => (
              <li key={c.href}>
                <Link
                  href={c.href}
                  className="block h-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 outline-none transition hover:ring-[#F2B544] focus-visible:ring-2 focus-visible:ring-[#F2B544]"
                >
                  <h3 className="text-base font-semibold text-[#0B1F3A] [font-family:var(--font-display)]">
                    {c.title} →
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.body}</p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(['smb', 'enterprise'] as const).map((id) => {
              const sc = SCENARIOS[id];
              return (
                <div key={id} className="rounded-2xl bg-[#0B1F3A] p-6 text-white">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#F2B544]">{sc.label}</p>
                  <h3 className="mt-1 text-lg font-semibold">{sc.company}</h3>
                  <p className="mt-1 text-sm text-slate-300">{sc.tagline}</p>
                  <ul className="mt-4 space-y-1.5 text-sm text-slate-300">
                    {id === 'smb' ? (
                      <>
                        <li>One owner per tier, with automatic backup when someone is full</li>
                        <li>Instant replies so no enquiry waits overnight</li>
                        <li>Works with a shared inbox and a simple CRM</li>
                      </>
                    ) : (
                      <>
                        <li>Territory routing across North America, EMEA, and APAC</li>
                        <li>15-minute follow-up target for high-value leads</li>
                        <li>Built to sync with Salesforce or HubSpot and Slack</li>
                      </>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="how" className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-20">
            <h2
              id="how"
              className="text-2xl font-semibold tracking-tight text-[#0B1F3A] [font-family:var(--font-display)]"
            >
              What happens after you hit send
            </h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0B1F3A] text-sm font-semibold text-[#F2B544]">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-[#0B1F3A]">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="bg-[#0B1F3A] py-8 text-sm text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 sm:px-8">
          <p>Northstar Digital is a fictional agency built for a portfolio project.</p>
          <Link href="/admin" className="text-slate-300 underline underline-offset-2 hover:text-white">
            Open the workflow demo
          </Link>
        </div>
      </footer>
    </>
  );
}
