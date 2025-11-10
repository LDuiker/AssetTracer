export type SubscriptionTier = 'free' | 'pro' | 'business';

export interface SubscriptionLimits {
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
  hasROITracking: boolean;
  hasMonthlyCharts: boolean;
  hasTopPerformersChart: boolean;
  hasGrowthMetrics: boolean;
  hasDateRangeFilter: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
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
    hasROITracking: true,
    hasMonthlyCharts: true,
    hasTopPerformersChart: true,
    hasGrowthMetrics: true,
    hasDateRangeFilter: true,
  },
};

export function getSubscriptionLimits(tier: SubscriptionTier): SubscriptionLimits {
  return SUBSCRIPTION_LIMITS[tier] ?? SUBSCRIPTION_LIMITS.free;
}


