import type { ReactNode } from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Workflow demo · Northstar Digital',
  description: 'An illustrative, read-only demo of automated lead qualification and sales routing.',
  robots: { index: false, follow: false },
};

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#0B1F3A]">
      <header className="bg-[#0B1F3A] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-8">
          <Link href="/" className="font-semibold tracking-tight">Northstar Digital <span className="font-normal text-slate-400">/ Workflow demo</span></Link>
          <Link href="/" className="text-sm text-slate-300 underline underline-offset-4 hover:text-white">Back to site</Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
