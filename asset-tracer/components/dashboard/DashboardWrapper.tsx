'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';

interface DashboardWrapperProps {
  children: React.ReactNode;
  onMobileMenuToggle?: () => void;
}

// Map routes to page titles
const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/assets': 'Assets',
  '/inventory': 'Inventory',
  '/clients': 'Clients',
  '/quotations': 'Quotations',
  '/invoices': 'Invoices',
  '/settings': 'Settings',
};

export function DashboardWrapper({ children, onMobileMenuToggle }: DashboardWrapperProps) {
  const pathname = usePathname();
  const title = routeTitles[pathname || '/dashboard'] || 'Dashboard';

  return (
    <div className="flex flex-col h-full">
      <Header title={title} onMobileMenuToggle={onMobileMenuToggle} />
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-light-bg">
        {children}
      </div>
    </div>
  );
}

