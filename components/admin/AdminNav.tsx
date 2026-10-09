// components/admin/AdminNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type IconName = 'overview' | 'leads' | 'calendar' | 'runs' | 'mail' | 'team';

const ICONS: Record<IconName, string> = {
  overview: 'M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z',
  leads: 'M7 8a3 3 0 100-6 3 3 0 000 6zM1 17c0-3 2.7-5 6-5s6 2 6 5M14 8a2.5 2.5 0 100-5M15 12c2.5.3 4 2 4 5',
  calendar: 'M3 5h14v12H3zM3 9h14M7 2v4M13 2v4',
  runs: 'M2 10h4l2-6 4 12 2-6h4',
  mail: 'M2 4h16v12H2zM2 5l8 6 8-6',
  team: 'M10 9a3 3 0 100-6 3 3 0 000 6zM4 17c0-3 2.7-5 6-5s6 2 6 5',
};

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Workspace',
    items: [
      { href: '/admin', label: 'Overview', icon: 'overview' },
      { href: '/admin/leads', label: 'Leads', icon: 'leads' },
      { href: '/admin/appointments', label: 'Appointments', icon: 'calendar' },
    ],
  },
  {
    title: 'Automation',
    items: [
      { href: '/admin/runs', label: 'Run history', icon: 'runs' },
      { href: '/admin/emails', label: 'Email log', icon: 'mail' },
    ],
  },
  {
    title: 'Team',
    items: [{ href: '/admin/team', label: 'Salespeople', icon: 'team' }],
  },
];

function Icon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-[18px] w-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

export default function AdminNav({ variant = 'sidebar' }: { variant?: 'sidebar' | 'bar' }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(`${href}/`);

  if (variant === 'bar') {
    const items = GROUPS.flatMap((g) => g.items);
    return (
      <nav aria-label="Admin" className="-mx-4 overflow-x-auto px-4 pb-1">
        <ul className="flex min-w-max gap-1.5">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#F2B544] ${
                    active ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Admin" className="flex flex-col gap-6">
      {GROUPS.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-2 text-xs font-medium text-slate-400">{group.title}</p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#F2B544] ${
                      active ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#F2B544]"
                      />
                    )}
                    <Icon name={item.icon} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}