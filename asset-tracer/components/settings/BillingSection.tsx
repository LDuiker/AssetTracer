'use client';

import { useState } from 'react';
import { useOrganization } from '@/lib/context/OrganizationContext';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, Zap, Crown, Loader2, AlertCircle, Calendar, CreditCard, Mail } from 'lucide-react';
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
  const { tier, limits } = useSubscription();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentTier = tier || 'free';
  const tierInfo = TIER_DETAILS[currentTier];
  const TierIcon = tierInfo.icon;

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
  
  const nextPaymentAmount = currentTier === 'pro' 
    ? '$19.00' 
    : currentTier === 'business' 
    ? '$39.00' 
    : null;

  const subscriptionStartDate = organization?.subscription_start_date
    ? formatDate(organization.subscription_start_date)
    : null;

  const handleUpgrade = async (targetTier: 'pro' | 'business') => {
    const isReactivation = organization?.subscription_status === 'cancelled' && targetTier === currentTier;
    
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
          billing_cycle: 'monthly',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Special handling for "already have subscription" errors
        if (response.status === 400 && 
            (errorData.error?.toLowerCase().includes('already') || 
             errorData.details?.toLowerCase().includes('already'))) {
          
          // User is trying to upgrade/change an existing subscription
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
      setError(err instanceof Error ? err.message : 'Failed to upgrade subscription');
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

      // Refetch organization to get updated tier
      await refetch();

      // Show success message
      alert(`Successfully downgraded to ${tierName} plan.`);
    } catch (err) {
      console.error('Downgrade error:', err);
      setError(err instanceof Error ? err.message : 'Failed to downgrade subscription');
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }

      const data = await response.json();

      // Refetch organization to get updated status
      await refetch();

      // Show success message with date
      alert(data.message || 'Your subscription has been cancelled. You will retain access until the end of your billing period.');
    } catch (err) {
      console.error('Cancel subscription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TierIcon className={`h-5 w-5 ${tierInfo.color}`} />
                Current Plan
              </CardTitle>
              <CardDescription>
                Your current subscription tier and usage
              </CardDescription>
            </div>
            <Badge variant={tierInfo.badgeVariant} className="text-base px-4 py-1">
              {tierInfo.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Cancelled Subscription Notice */}
          {organization?.subscription_status === 'cancelled' && currentTier !== 'free' && nextPaymentDate && (
            <Alert className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>Subscription Cancelled</strong> — Access until {nextPaymentDate}
                <p className="text-sm mt-1.5">
                  To resume: Check your email for the Polar subscription link and click "Resume Subscription".
                </p>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{tierInfo.price}</span>
            {currentTier !== 'free' && (
              <span className="text-gray-500">per month</span>
            )}
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-3 text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">Plan Includes</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {tierInfo.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {currentTier === 'free' && (
            <>
              <Separator />
              <div className="flex justify-end gap-2">
                <Button onClick={() => handleUpgrade('pro')} disabled={isUpgrading} className="gap-2">
                  {isUpgrading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Upgrading...
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4" />
                      Upgrade to Pro ($19/mo)
                    </>
                  )}
                </Button>
                <Button onClick={() => handleUpgrade('business')} disabled={isUpgrading} variant="outline" className="gap-2">
                  {isUpgrading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Upgrading...
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4" />
                      Upgrade to Business ($39/mo)
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {currentTier === 'pro' && (
            <>
              <Separator />
              <div className="flex justify-between items-center">
                <Button onClick={() => handleUpgrade('business')} disabled={isUpgrading} className="gap-2">
                  {isUpgrading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Upgrading...
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4" />
                      Upgrade to Business ($39/mo)
                    </>
                  )}
                </Button>
                <Button onClick={() => handleDowngrade('free')} disabled={isUpgrading} variant="outline">
                  {isUpgrading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Downgrade to Free'
                  )}
                </Button>
              </div>
            </>
          )}

          {currentTier === 'business' && (
            <>
              <Separator />
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Need to change your plan?
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => handleDowngrade('pro')} disabled={isUpgrading} variant="outline">
                    {isUpgrading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Downgrade to Pro'
                    )}
                  </Button>
                  <Button onClick={() => handleDowngrade('free')} disabled={isUpgrading} variant="outline">
                    {isUpgrading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Downgrade to Free'
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment & Billing Details */}
      {currentTier !== 'free' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-600" />
              Payment & Billing
            </CardTitle>
            <CardDescription>
              Manage your payment method and view billing history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Next Payment */}
            {nextPaymentDate && nextPaymentAmount && (
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Next Payment</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{nextPaymentDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{nextPaymentAmount}</p>
                </div>
              </div>
            )}

            <Separator />

            {/* Subscription Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Plan</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{tierInfo.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Billing</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">Monthly</p>
              </div>
              {subscriptionStartDate && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Member Since</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{subscriptionStartDate}</p>
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

            {/* Payment Method Management */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    Payment Method
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Securely managed by Polar.sh. Check your email for the "Manage Subscription" link to update payment details.
                  </p>
                </div>
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Sync Subscription - Manual sync option */}
            <Separator />
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">Subscription Not Showing?</h4>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                  Click here to sync your subscription from our payment system
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    setIsUpgrading(true);
                    const response = await fetch('/api/subscription/sync', {
                      method: 'POST',
                    });
                    const data = await response.json();
                    
                    if (data.success && data.subscription?.tier) {
                      toast.success('Subscription synced successfully!');
                      await refetch();
                    } else {
                      toast.info('No active subscription found in payment system');
                    }
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to sync subscription');
                  } finally {
                    setIsUpgrading(false);
                  }
                }}
                disabled={isUpgrading}
                className="text-blue-700 hover:text-blue-800 bg-white hover:bg-blue-50 border-blue-300"
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

            {/* Cancel Subscription - Only show if not already cancelled */}
            {organization?.subscription_status !== 'cancelled' && (
              <>
                <Separator />
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">Cancel Subscription</h4>
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

      {/* Plan Comparison */}
      {currentTier === 'free' && (
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/50 dark:to-indigo-950/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="h-5 w-5 text-blue-600" />
              Upgrade Your Plan
            </CardTitle>
            <CardDescription>
              Unlock advanced features and higher limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Free Plan (Current)</h4>
                <ul className="space-y-1.5 text-xs">
                  {TIER_DETAILS.free.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-start gap-1.5 text-gray-600 dark:text-gray-400">
                      <Check className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2 border-l border-blue-200 dark:border-blue-800 pl-4">
                <h4 className="text-sm font-semibold text-blue-600">Pro - $19/mo</h4>
                <ul className="space-y-1.5 text-xs">
                  {TIER_DETAILS.pro.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2 border-l border-purple-200 dark:border-purple-800 pl-4">
                <h4 className="text-sm font-semibold text-purple-600">Business - $39/mo</h4>
                <ul className="space-y-1.5 text-xs">
                  {TIER_DETAILS.business.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Button onClick={() => handleUpgrade('pro')} disabled={isUpgrading} className="gap-2">
                {isUpgrading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4" />
                    Upgrade to Pro
                  </>
                )}
              </Button>
              <Button onClick={() => handleUpgrade('business')} disabled={isUpgrading} variant="outline" className="gap-2">
                {isUpgrading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4" />
                    Upgrade to Business
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pro Plan Upgrade to Business */}
      {currentTier === 'pro' && (
        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/50 dark:to-indigo-950/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="h-5 w-5 text-purple-600" />
              Scale to Business
            </CardTitle>
            <CardDescription>
              Unlimited resources and up to 20 team members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-blue-600">Pro - $19/mo (Current)</h4>
                <ul className="space-y-1.5 text-xs">
                  {TIER_DETAILS.pro.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-start gap-1.5 text-gray-600 dark:text-gray-400">
                      <Check className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2 border-l border-purple-200 dark:border-purple-800 pl-4">
                <h4 className="text-sm font-semibold text-purple-600">Business - $39/mo</h4>
                <ul className="space-y-1.5 text-xs">
                  {TIER_DETAILS.business.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {organization?.subscription_status !== 'cancelled' && (
              <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-300">
                  <strong>Plan Change Process:</strong> To switch from Pro to Business, you'll need to cancel your current Pro plan first. After cancellation, you'll retain Pro access until the end of your billing period, then you can subscribe to Business.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-center pt-2">
              <Button onClick={() => handleUpgrade('business')} disabled={isUpgrading} className="gap-2">
                {isUpgrading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4" />
                    Switch to Business
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Plan Downgrade Options */}
      {currentTier === 'business' && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Other Plans</CardTitle>
            <CardDescription>
              Compare what's included in each plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Free - $0/mo</h4>
                <ul className="space-y-1.5 text-xs">
                  {TIER_DETAILS.free.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-start gap-1.5 text-gray-600 dark:text-gray-400">
                      <Check className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-blue-600">Pro - $19/mo</h4>
                <ul className="space-y-1.5 text-xs">
                  {TIER_DETAILS.pro.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-purple-600">Business - $39/mo (Current)</h4>
                <ul className="space-y-1.5 text-xs">
                  {TIER_DETAILS.business.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-start gap-1.5 text-gray-600 dark:text-gray-400">
                      <Check className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

