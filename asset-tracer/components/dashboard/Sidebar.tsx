'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Archive, 
  Users, 
  FileText, 
  Receipt,
  DollarSign,
  BarChart3,
  Settings,
  Crown,
  Zap,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogoLight } from '@/components/common/Logo';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Assets',
    href: '/assets',
    icon: Package,
  },
  {
    label: 'Inventory',
    href: '/inventory',
    icon: Archive,
  },
  {
    label: 'Clients',
    href: '/clients',
    icon: Users,
  },
  {
    label: 'Quotations',
    href: '/quotations',
    icon: FileText,
  },
  {
    label: 'Invoices',
    href: '/invoices',
    icon: Receipt,
  },
  {
    label: 'Expenses',
    href: '/expenses',
    icon: DollarSign,
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { tier } = useSubscription();

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const tierConfig = {
    free: {
      label: 'Free Plan',
      icon: Package,
      badgeClass: 'bg-gray-100 text-gray-700',
      showUpgrade: true,
    },
    pro: {
      label: 'Pro Plan',
      icon: Crown,
      badgeClass: 'bg-blue-100 text-blue-700',
      showUpgrade: false,
    },
    business: {
      label: 'Business Plan',
      icon: Zap,
      badgeClass: 'bg-purple-100 text-purple-700',
      showUpgrade: false,
    },
  };

  const currentTier = tierConfig[tier];

  return (
    <aside className="hidden md:flex md:flex-col w-64 h-screen bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 fixed left-0 top-0">
      {/* Logo/Brand Section */}
      <div className="h-16 bg-primary-blue flex items-center justify-center px-6">
        <LogoLight
          variant="text"
          size="md"
          href="/dashboard"
          className="font-bold"
        />
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200',
                    'hover:bg-gray-100 dark:hover:bg-slate-700',
                    active
                      ? 'bg-primary-blue/10 text-primary-blue dark:bg-primary-blue/20 dark:text-primary-blue'
                      : 'text-gray-700 dark:text-gray-300 hover:text-primary-blue dark:hover:text-white'
                  )}
                >
                  <Icon 
                    className={cn(
                      'h-5 w-5 transition-colors',
                      active 
                        ? 'text-primary-blue' 
                        : 'text-gray-500 dark:text-gray-400 group-hover:text-primary-blue'
                    )} 
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Section - Subscription Status & Upgrade CTA */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-700 space-y-3">
        {/* Subscription Tier Status */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <currentTier.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {currentTier.label}
            </span>
          </div>
          <Badge className={currentTier.badgeClass}>
            {tier === 'free' ? 'Free' : tier === 'pro' ? 'Pro' : 'Business'}
          </Badge>
        </div>

        {/* Upgrade CTA (shown for free tier only) */}
        {currentTier.showUpgrade && (
          <Link href="/settings?tab=billing" className="block">
            <Button 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 font-bold uppercase justify-center text-xs py-3 px-4"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Unlock More Features
            </Button>
          </Link>
        )}
      </div>
    </aside>
  );
}

