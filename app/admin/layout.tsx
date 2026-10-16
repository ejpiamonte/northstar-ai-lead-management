import type { ReactNode } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/admin/AdminNav';
import ScenarioSwitch from '@/components/admin/ScenarioSwitch';
import { getScenario } from '@/lib/data';

export const metadata = {
  title: { default: 'Workflow demo', template: '%s · Northstar workflow demo' },
  description: 'An illustrative demo of automated lead qualification and sales routing, with fictional data.',
  robots: { index: false, follow: false },
};

function Star() {
  return (
    <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
      <path d="M16 2l3.2 10.8L30 16l-10.8 3.2L16 30l-3.2-10.8L2 16l10.8-3.2z" fill="#F2B544" />
    </svg>
  );
}

export default async function DemoLayout({ children }: { children: ReactNode }) {
  const scenario = await getScenario();
  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#0B1F3A]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-[#0B1F3A] px-4 py-6 text-white lg:flex">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2.5 rounded-md px-3 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#F2B544]"
        >
          <Star />
          <span>
            Northstar <span className="font-normal text-slate-400">Digital</span>
          </span>
        </Link>
        <AdminNav />
        <div className="mt-auto space-y-3 rounded-xl bg-white/5 p-4 text-xs leading-relaxed text-slate-300">
          <p className="font-semibold text-white">Try it yourself</p>
          <p>Send a sample enquiry and watch it get scored and routed.</p>
          <Link
            href="/#contact"
            className="inline-block rounded-lg bg-[#F2B544] px-3 py-1.5 font-semibold text-[#0B1F3A] outline-none hover:bg-[#f5c46a] focus-visible:ring-2 focus-visible:ring-white"
          >
            Open the form
          </Link>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-64">
        <header className="bg-[#0B1F3A] px-4 pb-3 pt-4 text-white lg:hidden">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Star /> Northstar
            </Link>
            <Link href="/#contact" className="text-sm text-slate-300 underline underline-offset-4">
              Try the form
            </Link>
          </div>
          <AdminNav variant="bar" />
        </header>

        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
            <div className="min-w-0">
              <p className="truncate font-semibold">{scenario.company}</p>
              <p className="truncate text-xs text-slate-500">{scenario.tagline}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ScenarioSwitch current={scenario.id} />
              <span className="hidden rounded-md bg-[#FFF4D8] px-2 py-1 text-[11px] font-semibold text-[#79520A] ring-1 ring-[#F2B544]/60 sm:inline">
                ILLUSTRATIVE DATA
              </span>
            </div>
          </div>
        </div>

        <main id="main" className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-8 sm:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
