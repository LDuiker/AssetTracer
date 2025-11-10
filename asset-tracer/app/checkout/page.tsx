'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

function CheckoutForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncOption, setShowSyncOption] = useState(false);
  const plan = searchParams.get('plan');

  useEffect(() => {
    const initiateCheckout = async () => {
      if (!plan || (plan !== 'pro' && plan !== 'business')) {
        setError('Invalid plan selected');
        setIsProcessing(false);
        return;
      }

      try {
        setIsProcessing(true);
        
        // Call the upgrade API to get the checkout URL
        const response = await fetch('/api/subscription/upgrade', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tier: plan }), // API expects 'tier' not 'plan'
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 400) {
            // Bad request - could be invalid input or already subscribed
            const errorMessage = data.error || data.details || 'Invalid request';
            
            if (errorMessage.toLowerCase().includes('already') || 
                errorMessage.toLowerCase().includes('exist')) {
              // Subscription exists in Polar but may not be synced
              setError('We detected an existing subscription in our payment system. If your features aren\'t unlocked, please sync your subscription below.');
              setShowSyncOption(true);
            } else {
              setError(errorMessage);
            }
          } else if (response.status === 401) {
            setError('You must be logged in to upgrade. Please sign in again.');
          } else {
            setError(data.error || 'Failed to create checkout session');
          }
          setIsProcessing(false);
          return;
        }

        if (data.checkout_url) {
          // Redirect to Polar checkout
          window.location.href = data.checkout_url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } catch (err) {
        console.error('Checkout error:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        setIsProcessing(false);
      }
    };

    initiateCheckout();
  }, [plan]);

  const handleSyncSubscription = async () => {
    try {
      setIsSyncing(true);
      setError(null);

      const response = await fetch('/api/subscription/sync', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync subscription');
      }

      if (data.success && data.subscription?.tier && data.subscription.tier !== 'free') {
        // Subscription synced successfully!
        const tierName = data.subscription.tier.charAt(0).toUpperCase() + data.subscription.tier.slice(1);
        alert(`Success! Your ${tierName} subscription has been activated. Redirecting to dashboard...`);
        
        // Redirect to billing page to see updated subscription
        router.push('/settings?tab=billing&synced=true');
      } else {
        // No active subscription found
        setError('No active subscription found in our payment system. If you just completed payment, please wait a few moments and try syncing again.');
        setIsSyncing(false);
      }
    } catch (err) {
      console.error('Sync error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync subscription');
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          {/* Back Button */}
          <div className="flex items-center justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/settings?tab=billing')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Billing
            </Button>
          </div>

          {/* Icon and Title - Centered */}
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-primary-blue rounded-lg flex items-center justify-center">
              <Package className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold">
              {error ? 'Checkout Error' : 'Preparing Your Checkout'}
            </CardTitle>
            <CardDescription>
              {error 
                ? 'Something went wrong while setting up your checkout'
                : `Redirecting you to checkout for the ${plan === 'pro' ? 'Pro' : 'Business'} plan...`
              }
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 text-primary-blue animate-spin" />
              <p className="text-sm text-gray-600 text-center">
                Creating your secure checkout session...
              </p>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
              
              {showSyncOption ? (
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium mb-2">
                      💡 Quick Fix: Sync Your Subscription
                    </p>
                    <p className="text-xs text-blue-700">
                      This will check Polar&apos;s payment system and activate your subscription if payment was successful.
                    </p>
                  </div>
                  
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleSyncSubscription}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing Subscription...
                      </>
                    ) : (
                      'Sync Subscription Now'
                    )}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push('/settings?tab=billing')}
                      disabled={isSyncing}
                    >
                      Go to Billing Settings
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/dashboard')}
                      disabled={isSyncing}
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/settings?tab=billing')}
                  >
                    Go to Billing Settings
                  </Button>
                  <Button 
                    className="w-full bg-primary-blue hover:bg-blue-700"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-light-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-primary-blue rounded-lg flex items-center justify-center">
                <Package className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Checkout</CardTitle>
            <CardDescription>Processing your subscription...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
          </CardContent>
        </Card>
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  );
}

