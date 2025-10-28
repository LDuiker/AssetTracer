import { Metadata } from 'next';
import DashboardClientLayout from './DashboardClientLayout';

/**
 * Dashboard Layout - Server Component
 * Prevents search engine indexing of ALL dashboard routes
 * 
 * This layout wraps all routes under (dashboard):
 * - /dashboard, /assets, /clients, /invoices, /quotations,
 * - /expenses, /inventory, /reports, /settings
 */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  title: {
    template: '%s | AssetTracer Dashboard',
    default: 'Dashboard | AssetTracer',
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
