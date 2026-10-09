// app/layout.tsx
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Northstar Digital', template: '%s · Northstar Digital' },
  description:
    'Northstar Digital builds AI workflow automation, custom web applications, and websites, and routes every enquiry to the right person within seconds.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
