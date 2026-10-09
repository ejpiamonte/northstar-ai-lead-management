import Link from 'next/link';

const leads = [
  { name: 'Sample lead A', company: 'Sample Logistics', interest: 'AI workflow automation', score: 94, tier: 'High', owner: 'Sarah Whitfield', status: 'Assigned' },
  { name: 'Sample lead B', company: 'Sample Health Group', interest: 'Custom web application', score: 68, tier: 'Mid', owner: 'Alex Moreno', status: 'Assigned' },
  { name: 'Sample lead C', company: 'Sample Retail Co.', interest: 'Support and maintenance', score: 32, tier: 'Low', owner: 'Maria Santos', status: 'Assigned' },
];

const flow = [
  ['01', 'Capture', 'Validate the form and record the enquiry.'],
  ['02', 'Qualify', 'Estimate fit, budget, urgency, and confidence.'],
  ['03', 'Route', 'Apply tier rules and check rep capacity.'],
  ['04', 'Follow up', 'Draft a tailored reply and propose a next step.'],
];

export default function DemoDashboard() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#9A6A08]">Portfolio preview · Demo Mode</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Lead qualification and routing</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
              A read-only walkthrough of how an inbound enquiry can be scored, prioritized, assigned to a sales specialist, and given a clear next step.
            </p>
          </div>
          <span className="rounded-full bg-[#FFF4D8] px-3 py-1.5 text-xs font-semibold text-[#79520A] ring-1 ring-[#F2B544]">Illustrative data only</span>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {flow.map(([n, title, body]) => (
            <div key={n} className="rounded-xl border border-slate-200 p-4">
              <span className="text-xs font-bold text-[#9A6A08]">{n}</span>
              <h2 className="mt-2 font-semibold">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Illustrative pipeline metrics" className="grid gap-4 sm:grid-cols-3">
        {[
          ['Sample enquiries', '3', 'One example in each routing tier'],
          ['Qualification signals', '4', 'Fit · budget · urgency · completeness'],
          ['Routing outcomes', '3', 'Specialist assigned by tier'],
        ].map(([label, value, note]) => (
          <div key={label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{note}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="font-semibold">Example routing outcomes</h2>
          <p className="mt-1 text-sm text-slate-500">Synthetic sample records; no visitor submissions or contact details appear here.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>{['Sample', 'Interest', 'Score', 'Tier', 'Assigned specialist', 'Status'].map((h) => <th key={h} className="px-5 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.name}>
                  <td className="px-5 py-4"><span className="font-medium">{lead.name}</span><span className="block text-xs text-slate-500">{lead.company}</span></td>
                  <td className="px-5 py-4">{lead.interest}</td>
                  <td className="px-5 py-4 tabular-nums">{lead.score}/100</td>
                  <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{lead.tier}</span></td>
                  <td className="px-5 py-4">{lead.owner}</td>
                  <td className="px-5 py-4">{lead.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <h2 className="font-semibold">Deterministic routing rules</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            <li><strong className="text-[#0B1F3A]">High:</strong> score ≥ 75, or AI automation with stated budget ≥ $10,000 → Sarah.</li>
            <li><strong className="text-[#0B1F3A]">Mid:</strong> score 40–74 → Alex.</li>
            <li><strong className="text-[#0B1F3A]">Low:</strong> lower scores and small support requests → Maria.</li>
            <li>When a tier’s owner reaches capacity, the router checks the next tier and balances eligible reps by open workload.</li>
          </ol>
        </div>
        <div className="rounded-2xl bg-[#0B1F3A] p-5 text-white shadow-sm sm:p-6">
          <h2 className="font-semibold">Automation trace</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-300">
            {['Payload validated and duplicate window checked', 'Lead scored with a mock analyzer in Demo Mode', 'Tier rule applied and salesperson capacity checked', 'Email drafts and proposed meeting recorded as mock actions'].map((step, i) => (
              <li key={step} className="flex gap-3"><span className="font-mono text-[#F2B544]">0{i + 1}</span><span>{step}</span></li>
            ))}
          </ol>
          <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-relaxed text-slate-400">No AI provider, email provider, or calendar is contacted by this preview. The public form runs with mock scoring and mock email logging.</p>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm">
        <p className="text-slate-600">Want to try the qualification flow with a sample enquiry?</p>
        <Link href="/#contact" className="rounded-lg bg-[#0B1F3A] px-4 py-2 font-semibold text-white hover:bg-[#13305a]">Open the sample form</Link>
      </div>
    </div>
  );
}
