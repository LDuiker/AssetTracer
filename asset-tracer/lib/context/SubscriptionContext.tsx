'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useOrganization } from './OrganizationContext';

export type SubscriptionTier = 'free' | 'pro' | 'business';

interface SubscriptionLimits {
  maxAssets: number;
  maxInventoryItems: number;
  maxInvoicesPerMonth: number;
  maxQuotationsPerMonth: number;
  maxUsers: number;
  hasAdvancedReporting: boolean;
  hasPDFExport: boolean;
  hasCSVExport: boolean;
  hasPaymentIntegration: boolean;
  hasCustomBranding: boolean;
  // Analytics features
  hasROITracking: boolean;
  hasMonthlyCharts: boolean;
  hasTopPerformersChart: boolean;
  hasGrowthMetrics: boolean;
  hasDateRangeFilter: boolean;
}

interface SubscriptionContextType {
  tier: SubscriptionTier;
  limits: SubscriptionLimits;
  isLoading: boolean;
  canCreateAsset: (currentCount: number) => boolean;
  canCreateInvoice: (currentMonthCount: number) => boolean;
  canCreateQuotation: (currentMonthCount: number) => boolean;
  getUpgradeMessage: (feature: string) => string;
  redirectToUpgrade: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxAssets: 20,
    maxInventoryItems: 50,
    maxInvoicesPerMonth: 5,
    maxQuotationsPerMonth: 5,
    maxUsers: 1,
    hasAdvancedReporting: false,
    hasPDFExport: true,
    hasCSVExport: true,
    hasPaymentIntegration: false,
    hasCustomBranding: false,
    // Free tier analytics: Basic only
    hasROITracking: false,
    hasMonthlyCharts: false,
    hasTopPerformersChart: false,
    hasGrowthMetrics: false,
    hasDateRangeFilter: false,
  },
  pro: {
    maxAssets: 500,
    maxInventoryItems: 1000,
    maxInvoicesPerMonth: Infinity,
    maxQuotationsPerMonth: Infinity,
    maxUsers: 5,
    hasAdvancedReporting: true,
    hasPDFExport: true,
    hasCSVExport: true,
    hasPaymentIntegration: true,
    hasCustomBranding: true,
    // Pro tier analytics: ROI tracking & charts
    hasROITracking: true,
    hasMonthlyCharts: true,
    hasTopPerformersChart: true,
    hasGrowthMetrics: true,
    hasDateRangeFilter: true,
  },
  business: {
    maxAssets: Infinity,
    maxInventoryItems: Infinity,
    maxInvoicesPerMonth: Infinity,
    maxQuotationsPerMonth: Infinity,
    maxUsers: 20,
    hasAdvancedReporting: true,
    hasPDFExport: true,
    hasCSVExport: true,
    hasPaymentIntegration: true,
    hasCustomBranding: true,
    // Business tier analytics: All features
    hasROITracking: true,
    hasMonthlyCharts: true,
    hasTopPerformersChart: true,
    hasGrowthMetrics: true,
    hasDateRangeFilter: true,
  },
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { organization, isLoading: orgLoading } = useOrganization();
  
  // Get tier from organization or default to free
  const tier: SubscriptionTier = (organization?.subscription_tier as SubscriptionTier) || 'free';
  const limits = TIER_LIMITS[tier];

  const canCreateAsset = (currentCount: number): boolean => {
    return currentCount < limits.maxAssets;
  };

  const canCreateInvoice = (currentMonthCount: number): boolean => {
    return currentMonthCount < limits.maxInvoicesPerMonth;
  };

  const canCreateQuotation = (currentMonthCount: number): boolean => {
    return currentMonthCount < limits.maxQuotationsPerMonth;
  };

  const getUpgradeMessage = (feature: string): string => {
    return `You've reached the limit for ${feature} on the Free plan. Upgrade to Pro for unlimited access.`;
  };

  const redirectToUpgrade = (): void => {
    if (typeof window !== 'undefined') {
      window.location.href = '/settings?tab=billing';
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        limits,
        isLoading: orgLoading,
        canCreateAsset,
        canCreateInvoice,
        canCreateQuotation,
        getUpgradeMessage,
        redirectToUpgrade,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

