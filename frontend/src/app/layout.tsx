import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tata Motors CRM – Jaipur Dealership',
  description: 'Complete Digital Dealership Management System for Tata Motors Authorized Dealership, Jaipur',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
