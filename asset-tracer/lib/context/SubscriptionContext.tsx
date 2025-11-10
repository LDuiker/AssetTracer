'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useOrganization } from './OrganizationContext';
import {
  type SubscriptionTier,
  type SubscriptionLimits,
  getSubscriptionLimits,
} from '@/lib/subscription/limits';

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

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { organization, isLoading: orgLoading } = useOrganization();
  
  // Get tier from organization or default to free
  const tier: SubscriptionTier = (organization?.subscription_tier as SubscriptionTier) || 'free';
  const limits = getSubscriptionLimits(tier);
  
  // Debug logging to compare users
  useEffect(() => {
    console.log('[SubscriptionContext] Tier determination:', {
      organizationId: organization?.id,
      organizationName: organization?.name,
      subscription_tier: organization?.subscription_tier,
      tier_determined: tier,
      maxInvoicesPerMonth: limits.maxInvoicesPerMonth,
      maxQuotationsPerMonth: limits.maxQuotationsPerMonth,
      isLoading: orgLoading,
    });
  }, [organization, tier, limits, orgLoading]);

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

