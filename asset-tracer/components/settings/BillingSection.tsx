'use client';

import { useState } from 'react';
import { useOrganization } from '@/lib/context/OrganizationContext';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, Zap, Crown, Loader2, AlertCircle, Calendar, CreditCard, Mail, RefreshCw, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const TIER_DETAILS = {
  free: {
    name: 'Free Plan',
    price: '$0',
    icon: Zap,
    color: 'text-gray-600',
    badgeVariant: 'secondary' as const,
    features: [
      '20 assets',
      '50 inventory items',
      '5 quotations/invoices per month',
      '1 user',
      'Basic reporting',
    ],
  },
  pro: {
    name: 'Pro Plan',
    price: '$19/month',
    icon: Crown,
    color: 'text-blue-600',
    badgeVariant: 'default' as const,
    features: [
      'Up to 500 assets',
      'Up to 1,000 inventory items',
      'Unlimited quotations/invoices',
      'Up to 5 team members',
      'ROI tracking (spent vs earned)',
      'Branded PDF quotations & invoices',
      'Priority email support',
    ],
  },
  business: {
    name: 'Business Plan',
    price: '$39/month',
    icon: Crown,
    color: 'text-purple-600',
    badgeVariant: 'default' as const,
    features: [
      'Unlimited assets and inventory items',
      'Unlimited quotations/invoices',
      'Up to 20 team members',
      'Advanced reporting & analytics',
      'Scheduled reminders & maintenance alerts',
      'Role-based permissions (Admin/Staff)',
      'Premium support (chat & email)',
    ],
  },
};

export function BillingSection() {
  const { organization, refetch } = useOrganization();
  const { tier } = useSubscription();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  const currentTier = tier || 'free';
  const tierInfo = TIER_DETAILS[currentTier];
  const TierIcon = tierInfo.icon;
  
  // Determine current billing interval from organization metadata or default to monthly
  const currentBillingInterval = (organization?.metadata as { billing_interval?: 'monthly' | 'yearly' })?.billing_interval || 'monthly';

  // Format date helper
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate next payment date and amount
  const nextPaymentDate = organization?.polar_current_period_end 
    ? formatDate(organization.polar_current_period_end)
    : null;
  
  // Calculate next payment amount based on billing interval
  const nextPaymentAmount = currentTier === 'pro' 
    ? (currentBillingInterval === 'yearly' ? '$182.00' : '$19.00')
    : currentTier === 'business' 
    ? (currentBillingInterval === 'yearly' ? '$374.00' : '$39.00')
    : null;

  const subscriptionStartDate = organization?.subscription_start_date
    ? formatDate(organization.subscription_start_date)
    : null;

  const handleUpgrade = async (targetTier: 'pro' | 'business', interval?: 'monthly' | 'yearly') => {
    const isReactivation = organization?.subscription_status === 'cancelled' && targetTier === currentTier;
    const selectedInterval = interval || billingInterval;
    
    try {
      setIsUpgrading(true);
      setError(null);

      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: targetTier,
          interval: selectedInterval,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string; details?: unknown };
        const errorText = (errorData.error ?? '').toLowerCase();
        const detailText = typeof errorData.details === 'string' ? errorData.details.toLowerCase() : '';

        // Special handling for "already have subscription" errors
        if (
          response.status === 400 &&
          (errorText.includes('already') || detailText.includes('already'))
        ) {
          const currentTierName = currentTier.charAt(0).toUpperCase() + currentTier.slice(1);
          const targetTierName = targetTier.charAt(0).toUpperCase() + targetTier.slice(1);

          toast.error(
            `You're currently on the ${currentTierName} plan. To switch to ${targetTierName}, please cancel your current subscription first, then subscribe to the new plan after it expires.`,
            { duration: 8000 }
          );
          setIsUpgrading(false);
          return;
        }

        throw new Error(errorData.error || 'Failed to upgrade subscription');
      }

      const data = await response.json();
      
      // Redirect to Polar checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        // Fallback for development/testing
        await refetch();
        const planName = targetTier === 'pro' ? 'Pro' : 'Business';
        const message = isReactivation 
          ? `Successfully reactivated your ${planName} subscription! 🎉`
          : `Successfully upgraded to ${planName} plan! 🎉`;
        alert(message);
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      const message = err instanceof Error ? err.message : 'Failed to upgrade subscription';
      setError(message);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleDowngrade = async (targetTier: 'free' | 'pro') => {
    const tierName = targetTier === 'free' ? 'Free' : 'Pro';
    if (!confirm(`Are you sure you want to downgrade to the ${tierName} plan? This will limit your access to certain features.`)) {
      return;
    }

    try {
      setIsUpgrading(true);
      setError(null);

      const response = await fetch('/api/subscription/downgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier: targetTier }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to downgrade subscription');
      }

      await refetch();
      alert(`Successfully downgraded to ${tierName} plan.`);
    } catch (err) {
      console.error('Downgrade error:', err);
      const message = err instanceof Error ? err.message : 'Failed to downgrade subscription';
      setError(message);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    try {
      setIsUpgrading(true);
      setError(null);

      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }

      const data = (await response.json()) as { message?: string };
      await refetch();
      alert(data.message || 'Your subscription has been cancelled. You will retain access until the end of your billing period.');
    } catch (err) {
      console.error('Cancel subscription error:', err);
      const message = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setError(message);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsUpgrading(true);
      setError(null);
      const response = await fetch('/api/subscription/sync', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success && data.subscription?.tier) {
        toast.success(`Subscription synced successfully! You're now on ${data.subscription.tier} plan.`);
        await refetch();
      } else if (data.error) {
        toast.error(data.error);
        setError(data.error);
      } else {
        toast.info('No active subscription found in payment system');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sync subscription';
      toast.error(message);
      setError(message);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Plan Card - Clean and Focused */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TierIcon className={`h-5 w-5 ${tierInfo.color}`} />
                Current Plan
              </CardTitle>
              <CardDescription className="mt-1">
                {currentTier === 'free' 
                  ? 'You\'re on the free plan. Upgrade to unlock more features.'
                  : `Active ${currentBillingInterval === 'yearly' ? 'yearly' : 'monthly'} subscription`}
              </CardDescription>
            </div>
            <Badge variant={tierInfo.badgeVariant} className="text-base px-4 py-1.5">
              {tierInfo.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cancelled Subscription Notice */}
          {organization?.subscription_status === 'cancelled' && currentTier !== 'free' && nextPaymentDate && (
            <Alert className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>Subscription Cancelled</strong> — Access until {nextPaymentDate}
                <p className="text-sm mt-1.5">
                  Check your email for the Polar subscription link to resume.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Plan Price & Billing Info */}
          <div className="flex items-baseline justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{tierInfo.price}</span>
                {currentTier !== 'free' && (
                  <span className="text-sm text-gray-500">
                    /{currentBillingInterval === 'yearly' ? 'year' : 'month'}
                  </span>
                )}
              </div>
              {currentTier !== 'free' && currentBillingInterval === 'yearly' && (
                <p className="text-sm text-gray-500 mt-1">
                  {currentTier === 'pro' ? '$15.17' : '$31.17'}/month billed annually
                </p>
              )}
            </div>
            {currentTier !== 'free' && nextPaymentDate && (
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Next Payment</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{nextPaymentDate}</p>
                {nextPaymentAmount && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{nextPaymentAmount}</p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Plan Features - Compact Grid */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              What's Included
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {tierInfo.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Change Plan Section - Consolidated */}
      {currentTier === 'free' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upgrade Your Plan</CardTitle>
            <CardDescription>
              Choose a plan that fits your needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Billing Interval Toggle */}
            <div className="flex items-center justify-center gap-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <span className={`text-sm font-medium ${billingInterval === 'monthly' ? 'text-[#0B1226] dark:text-gray-100' : 'text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  billingInterval === 'yearly' ? 'bg-[#2563EB]' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={billingInterval === 'yearly'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    billingInterval === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${billingInterval === 'yearly' ? 'text-[#0B1226] dark:text-gray-100' : 'text-gray-500'}`}>
                Yearly
              </span>
              {billingInterval === 'yearly' && (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-100">
                  Save 20%
                </Badge>
              )}
            </div>

            {/* Upgrade Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                onClick={() => handleUpgrade('pro', billingInterval)} 
                disabled={isUpgrading} 
                className="w-full h-auto py-4 flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  <span className="font-semibold">Pro Plan</span>
                </div>
                <span className="text-sm font-normal opacity-90">
                  {billingInterval === 'yearly' ? '$182/year' : '$19/month'}
                </span>
              </Button>
              <Button 
                onClick={() => handleUpgrade('business', billingInterval)} 
                disabled={isUpgrading} 
                variant="outline" 
                className="w-full h-auto py-4 flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  <span className="font-semibold">Business Plan</span>
                </div>
                <span className="text-sm font-normal opacity-90">
                  {billingInterval === 'yearly' ? '$374/year' : '$39/month'}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pro Plan Actions */}
      {currentTier === 'pro' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Change Plan</CardTitle>
            <CardDescription>
              Switch to yearly billing or upgrade to Business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Switch to Yearly Banner */}
            {currentBillingInterval === 'monthly' && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm mb-1">
                      Switch to Yearly and Save 20%
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Pay $182/year instead of $228/year (save $46)
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleUpgrade('pro', 'yearly')} 
                    disabled={isUpgrading} 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Processing...
                      </>
                    ) : (
                      'Switch to Yearly'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Upgrade to Business */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <h4 className="font-medium text-sm mb-1">Upgrade to Business</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Unlimited resources and up to 20 team members
                  </p>
                </div>
                <Button 
                  onClick={() => handleUpgrade('business', billingInterval)} 
                  disabled={isUpgrading} 
                  size="sm"
                  variant="outline"
                >
                  {isUpgrading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Upgrade <ChevronRight className="h-3 w-3 ml-1" />
                    </>
                  )}
                </Button>
              </div>

              {/* Billing Interval Toggle for Business Upgrade */}
              <div className="flex items-center justify-center gap-4 py-2">
                <span className={`text-xs font-medium ${billingInterval === 'monthly' ? 'text-[#0B1226] dark:text-gray-100' : 'text-gray-500'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    billingInterval === 'yearly' ? 'bg-[#2563EB]' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={billingInterval === 'yearly'}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      billingInterval === 'yearly' ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <span className={`text-xs font-medium ${billingInterval === 'yearly' ? 'text-[#0B1226] dark:text-gray-100' : 'text-gray-500'}`}>
                  Yearly
                </span>
                {billingInterval === 'yearly' && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-100 text-xs">
                    Save 20%
                  </Badge>
                )}
              </div>
            </div>

            {/* Downgrade Option */}
            <Separator />
            <Button 
              onClick={() => handleDowngrade('free')} 
              disabled={isUpgrading} 
              variant="ghost" 
              className="w-full text-gray-600 hover:text-gray-900"
            >
              Downgrade to Free Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Business Plan Actions */}
      {currentTier === 'business' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Change Plan</CardTitle>
            <CardDescription>
              Switch to yearly billing or change your plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Switch to Yearly Banner */}
            {currentBillingInterval === 'monthly' && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm mb-1">
                      Switch to Yearly and Save 20%
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Pay $374/year instead of $468/year (save $94)
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleUpgrade('business', 'yearly')} 
                    disabled={isUpgrading} 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Processing...
                      </>
                    ) : (
                      'Switch to Yearly'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Switch to Pro */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <h4 className="font-medium text-sm mb-1">Switch to Pro</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Up to 500 assets and 5 team members
                  </p>
                </div>
                <Button 
                  onClick={() => handleUpgrade('pro', billingInterval)} 
                  disabled={isUpgrading} 
                  size="sm"
                  variant="outline"
                >
                  {isUpgrading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Switch <ChevronRight className="h-3 w-3 ml-1" />
                    </>
                  )}
                </Button>
              </div>

              {/* Billing Interval Toggle for Pro Switch */}
              <div className="flex items-center justify-center gap-4 py-2">
                <span className={`text-xs font-medium ${billingInterval === 'monthly' ? 'text-[#0B1226] dark:text-gray-100' : 'text-gray-500'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    billingInterval === 'yearly' ? 'bg-[#2563EB]' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={billingInterval === 'yearly'}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      billingInterval === 'yearly' ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <span className={`text-xs font-medium ${billingInterval === 'yearly' ? 'text-[#0B1226] dark:text-gray-100' : 'text-gray-500'}`}>
                  Yearly
                </span>
                {billingInterval === 'yearly' && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-100 text-xs">
                    Save 20%
                  </Badge>
                )}
              </div>
            </div>

            {/* Downgrade Option */}
            <Separator />
            <Button 
              onClick={() => handleDowngrade('free')} 
              disabled={isUpgrading} 
              variant="ghost" 
              className="w-full text-gray-600 hover:text-gray-900"
            >
              Downgrade to Free Plan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment & Billing Details - Only for Paid Plans */}
      {currentTier !== 'free' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-600" />
              Billing Details
            </CardTitle>
            <CardDescription>
              Subscription information and payment management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Subscription Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Plan</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{tierInfo.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Billing Cycle</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                  {currentBillingInterval === 'yearly' ? 'Yearly' : 'Monthly'}
                </p>
              </div>
              {subscriptionStartDate && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Member Since</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{subscriptionStartDate}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                {organization?.subscription_status === 'cancelled' ? (
                  <Badge variant="default" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                    Cancelled
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    Active
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Payment Method */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                  Payment Method
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Managed by Polar.sh. Check your email for the &quot;Manage Subscription&quot; link to update payment details.
                </p>
              </div>
            </div>

            {/* Cancel Subscription */}
            {organization?.subscription_status !== 'cancelled' && (
              <>
                <Separator />
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">Cancel Subscription</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Access retained until billing period ends
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleCancelSubscription}
                    disabled={isUpgrading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                        Cancelling...
                      </>
                    ) : (
                      'Cancel'
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sync Subscription - Compact */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              <div>
                <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">Subscription Not Showing?</h4>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Sync your subscription status from our payment system
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSync}
              disabled={isUpgrading}
              className="text-blue-700 hover:text-blue-800 bg-white hover:bg-blue-50 border-blue-300 dark:bg-blue-900 dark:text-blue-100"
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Sync Now'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
