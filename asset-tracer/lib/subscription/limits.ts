export type SubscriptionTier = 'free' | 'pro' | 'business';

export interface SubscriptionLimits {
  maxAssets: number;
  maxInventoryItems: number;
  maxInvoicesPerMonth: number;
  maxQuotationsPerMonth: number;
  maxReservationsPerMonth: number;
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
  hasKitReservations: boolean;
  hasConflictOverride: boolean;
  hasLocationReservations: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxAssets: 20,
    maxInventoryItems: 50,
    maxInvoicesPerMonth: 5,
    maxQuotationsPerMonth: 5,
    maxReservationsPerMonth: 10,
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
    hasKitReservations: false,
    hasConflictOverride: false,
    hasLocationReservations: false,
  },
  pro: {
    maxAssets: 500,
    maxInventoryItems: 1000,
    maxInvoicesPerMonth: Infinity,
    maxQuotationsPerMonth: Infinity,
    maxReservationsPerMonth: 200,
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
    hasKitReservations: true,
    hasConflictOverride: false,
    hasLocationReservations: false,
  },
  business: {
    maxAssets: Infinity,
    maxInventoryItems: Infinity,
    maxInvoicesPerMonth: Infinity,
    maxQuotationsPerMonth: Infinity,
    maxReservationsPerMonth: Infinity,
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
    hasKitReservations: true,
    hasConflictOverride: true,
    hasLocationReservations: true,
  },
};

export function getSubscriptionLimits(tier: SubscriptionTier): SubscriptionLimits {
  return SUBSCRIPTION_LIMITS[tier] ?? SUBSCRIPTION_LIMITS.free;
}


