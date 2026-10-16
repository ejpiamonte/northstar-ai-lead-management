import Link from 'next/link';
import { SCENARIOS } from '@/lib/scenarios';
import { minutesLabel } from '@/lib/format';
import { PageHeader } from '@/components/admin/ui';

export const metadata = { title: 'How it works' };

const STEPS = [
  {
    title: 'Capture',
    body: 'The website form (or any webhook) sends the enquiry. Fields are validated and a spam honeypot filters bots.',
    who: 'System',
  },
  {
    title: 'Analyze',
    body: 'AI reads the message for service fit, budget, urgency, and intent, and drafts a tailored reply. The demo uses a deterministic analyzer.',
    who: 'AI · advisory',
  },
  {
    title: 'Tier',
    body: 'Clear rules turn the score into high, mid, or low tier, for example AI automation with a $10k+ budget is always high.',
    who: 'Rules',
  },
  {
    title: 'Route',
    body: 'The tier owner with the lightest load gets the lead. Full reps overflow to a backup. Enterprise routes within the territory first.',
    who: 'Rules',
  },
  {
    title: 'Respond',
    body: 'The lead gets an instant acknowledgement, the rep gets an alert with the summary, and high-tier leads get a call proposed.',
    who: 'System → rep',
  },
];

const RULES = [
  ['High tier', 'Score 75 or more, or AI automation with a stated budget of $10,000 or more'],
  ['Mid tier', 'Score 40 to 74'],
  ['Low tier', 'Score under 40, or a support request under $2,500'],
  ['Score', 'Service fit (up to 45) + budget (30) + urgency (15) + completeness (12), capped at 100'],
  ['Capacity', 'Each rep has a maximum number of open leads; at capacity the next tier’s least-loaded rep takes over'],
];

export default function HowItWorks() {
  const smb = SCENARIOS.smb;
  const ent = SCENARIOS.enterprise;
  const compare: [string, string, string][] = [
    [
      'Team',
      `${smb.reps.length} specialists, one per tier`,
      `${ent.reps.length} reps across ${new Set(ent.reps.map((r) => r.territory)).size} territories`,
    ],
    ['Volume', `~${smb.monthlyLeads} leads a month`, `~${ent.monthlyLeads} leads a month`],
    ['Routing', 'Tier owner, then backup by workload', 'Territory first, then tier owner, then backup'],
    [
      'High-tier follow-up target',
      minutesLabel(smb.responseTargetMinutes.high),
      minutesLabel(ent.responseTargetMinutes.high),
    ],
    ['Mid-tier target', minutesLabel(smb.responseTargetMinutes.mid), minutesLabel(ent.responseTargetMinutes.mid)],
    [
      'Typical tools',
      'Website form, Gmail or Outlook, a simple CRM',
      'Web + paid + partner channels, Salesforce or HubSpot, Slack, SSO',
    ],
  ];

  return (
    <>
      <PageHeader
        title="How the workflow works"
        description="AI reads and drafts. Deterministic rules decide the tier and the owner. People have the conversations."
        actions={
          <Link
            href="/#contact"
            className="rounded-lg bg-[#0B1F3A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#13305a]"
          >
            Try it with the form
          </Link>
        }
      />

      <ol className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {STEPS.map((s, i) => (
          <li key={s.title} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <span className="text-xs font-bold text-[#9A6A08]">0{i + 1}</span>
            <h2 className="mt-1 font-semibold">{s.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.body}</p>
            <span className="mt-3 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {s.who}
            </span>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 font-semibold">The rules</h2>
          <dl className="divide-y divide-slate-100 text-sm">
            {RULES.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 py-2.5">
                <dt className="font-medium">{k}</dt>
                <dd className="text-slate-600">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <h2 className="px-5 pb-1 pt-5 font-semibold">Same engine, two team sizes</h2>
          <p className="px-5 text-xs text-slate-500">Switch company size at the top of the page to explore each.</p>
          <div className="overflow-x-auto">
            <table className="mt-3 w-full min-w-[520px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-2 font-medium" />
                  <th className="px-5 py-2 font-medium">Small business</th>
                  <th className="px-5 py-2 font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 align-top">
                {compare.map(([k, a, b]) => (
                  <tr key={k}>
                    <td className="px-5 py-2.5 font-medium text-slate-600">{k}</td>
                    <td className="px-5 py-2.5">{a}</td>
                    <td className="px-5 py-2.5">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 font-semibold">What is real in this demo</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
            <li>
              The scoring, tier, and routing rules. Dashboard data and form results come from the same code, which has
              automated tests.
            </li>
            <li>Form validation, spam honeypot, and the step-by-step run trace.</li>
            <li>
              <b>Simulated:</b> the people, companies, and history are fictional; the analyzer is deterministic instead
              of a live model; emails and meetings are logged, not sent.
            </li>
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 font-semibold">Taking it to production</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
            <li>Sign-in and roles for the dashboard, so real leads are only visible to your team.</li>
            <li>Live model analysis with an accuracy check on a sample of your past enquiries.</li>
            <li>CRM sync (HubSpot, Salesforce, Pipedrive), Slack alerts, and calendar booking links.</li>
            <li>Email sending through your domain, with reply tracking.</li>
            <li>Rate limiting, monitoring, and data-retention settings.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
