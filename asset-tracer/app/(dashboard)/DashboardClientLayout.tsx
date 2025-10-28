'use client';

import { useState, useEffect } from 'react';
import { SWRConfig } from 'swr';
import { Sidebar, DashboardWrapper } from '@/components/dashboard';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrganizationProvider } from '@/lib/context/OrganizationContext';
import { CurrencyProvider } from '@/lib/context/CurrencyContext';
import { SubscriptionProvider } from '@/lib/context/SubscriptionContext';
import { swrConfig } from '@/lib/swr-config';

export default function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <SWRConfig value={swrConfig}>
      <OrganizationProvider>
        <SubscriptionProvider>
          <CurrencyProvider>
            <div className="flex h-screen bg-light-bg overflow-hidden" suppressHydrationWarning>
        {/* Desktop Sidebar - Hidden on mobile */}
        <Sidebar />

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Mobile Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 md:hidden transform transition-transform duration-300 ease-in-out">
              {/* Mobile Sidebar Header */}
              <div className="h-16 bg-primary-blue flex items-center justify-between px-6">
                <div className="flex items-center space-x-2">
                  <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  <span className="text-xl font-bold text-white">Asset Tracer</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Mobile Navigation Items */}
              <nav className="flex-1 px-4 py-6 overflow-y-auto">
                <ul className="space-y-2">
                  <li>
                    <a
                      href="/dashboard"
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </svg>
                      <span>Dashboard</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="/assets"
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      </svg>
                      <span>Assets</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="/inventory"
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 8v13H3V8" />
                        <path d="M1 3h22v5H1z" />
                        <path d="M10 12h4" />
                      </svg>
                      <span>Inventory</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="/clients"
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>Clients</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="/quotations"
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      <span>Quotations</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="/invoices"
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                        <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8" />
                      </svg>
                      <span>Invoices</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="/settings"
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v6m0 6v6" />
                        <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24" />
                        <path d="M1 12h6m6 0h6" />
                        <path d="m4.93 19.07 4.24-4.24m5.66-5.66 4.24-4.24" />
                      </svg>
                      <span>Settings</span>
                    </a>
                  </li>
                </ul>
              </nav>
            </aside>
          </>
        )}

          {/* Main Content Area */}
          <main className="flex-1 md:ml-64 flex flex-col overflow-hidden">
            <DashboardWrapper onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {children}
            </DashboardWrapper>
          </main>
            </div>
          </CurrencyProvider>
        </SubscriptionProvider>
      </OrganizationProvider>
    </SWRConfig>
  );
}

