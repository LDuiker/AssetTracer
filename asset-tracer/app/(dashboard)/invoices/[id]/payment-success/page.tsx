'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Receipt, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrency } from '@/lib/context/CurrencyContext';

interface PaymentVerification {
  success: boolean;
  invoiceNumber?: string;
  amount?: number;
  currency?: string;
  transactionId?: string;
  paymentMethod?: string;
  paymentDate?: string;
  customerName?: string;
  error?: string;
  status?: string;
}

function PaymentSuccessContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatCurrency: formatCurrencyGlobal } = useCurrency();
  
  const invoiceId = params?.id as string;
  const token = searchParams?.get('TransID') || searchParams?.get('token') || searchParams?.get('TransactionToken');
  
  const [verification, setVerification] = useState<PaymentVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyPayment() {
      if (!token) {
        setError('No payment token provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Call verification API
        const response = await fetch(`/api/invoices/${invoiceId}/verify-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || 'Payment verification failed');
        }

        const data = await response.json();
        setVerification(data);

        // If payment was successful, show success for a moment then could redirect
        // For now, we'll just show the success page
        
      } catch (err) {
        console.error('Payment verification error:', err);
        setError(err instanceof Error ? err.message : 'Failed to verify payment');
        setVerification({
          success: false,
          error: err instanceof Error ? err.message : 'Failed to verify payment',
        });
      } finally {
        setIsLoading(false);
      }
    }

    verifyPayment();
  }, [token, invoiceId]);

  // Use global currency formatter (ignore currency param from DPO response)
  const formatCurrency = (amount: number, currency?: string) => {
    return formatCurrencyGlobal(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-center text-2xl">
              Verifying Payment...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (verification?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-blue-50">
        <Card className="w-full max-w-2xl shadow-2xl border-2 border-green-200">
          <CardHeader>
            <div className="flex items-center justify-center mb-6">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="h-20 w-20 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-center text-3xl font-bold text-gray-900">
              Payment Successful!
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Your payment has been processed successfully
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Payment Details Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Details
              </h3>
              
              <div className="space-y-3">
                {verification.invoiceNumber && (
                  <div className="flex justify-between items-center py-2 border-b border-blue-200">
                    <span className="text-gray-600 font-medium">Invoice Number</span>
                    <span className="text-gray-900 font-bold">{verification.invoiceNumber}</span>
                  </div>
                )}

                {verification.amount !== undefined && (
                  <div className="flex justify-between items-center py-2 border-b border-blue-200">
                    <span className="text-gray-600 font-medium">Amount Paid</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(verification.amount, verification.currency)}
                    </span>
                  </div>
                )}

                {verification.transactionId && (
                  <div className="flex justify-between items-center py-2 border-b border-blue-200">
                    <span className="text-gray-600 font-medium">Transaction ID</span>
                    <span className="text-gray-900 font-mono text-sm">
                      {verification.transactionId}
                    </span>
                  </div>
                )}

                {verification.paymentMethod && (
                  <div className="flex justify-between items-center py-2 border-b border-blue-200">
                    <span className="text-gray-600 font-medium">Payment Method</span>
                    <Badge variant="outline" className="bg-white">
                      {verification.paymentMethod}
                    </Badge>
                  </div>
                )}

                {verification.paymentDate && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Date & Time</span>
                    <span className="text-gray-900 text-sm">
                      {formatDate(verification.paymentDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-center">
                ✓ Your invoice has been marked as paid. A confirmation email will be sent to you shortly.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => router.push(`/invoices/${invoiceId}`)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <Receipt className="mr-2 h-5 w-5" />
                View Invoice
              </Button>
              
              <Button
                onClick={() => router.push('/invoices')}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Invoices
              </Button>
            </div>

            {/* Reference Info */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-gray-500">
                Please save this confirmation for your records.
              </p>
              {verification.transactionId && (
                <p className="text-xs text-gray-400 mt-1">
                  Reference: {verification.transactionId}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error/Failed state
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
      <Card className="w-full max-w-2xl shadow-2xl border-2 border-red-200">
        <CardHeader>
          <div className="flex items-center justify-center mb-6">
            <div className="rounded-full bg-red-100 p-4">
              <XCircle className="h-20 w-20 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-center text-3xl font-bold text-gray-900">
            Payment Verification Failed
          </CardTitle>
          <p className="text-center text-gray-600 mt-2">
            We couldn't verify your payment
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Details */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              What happened?
            </h3>
            <p className="text-red-700">
              {error || verification?.error || 'The payment could not be verified. This could be due to:'}
            </p>
            
            {!error && !verification?.error && (
              <ul className="mt-3 space-y-2 text-sm text-red-600">
                <li>• Payment was cancelled or declined</li>
                <li>• Payment is still processing</li>
                <li>• Technical issue with payment gateway</li>
              </ul>
            )}
          </div>

          {/* Status Information */}
          {verification?.status && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Payment Status</span>
                <Badge variant="outline" className="bg-white text-red-600 border-red-300">
                  {verification.status}
                </Badge>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>1. Check your bank/card statement to see if payment was deducted</li>
              <li>2. If payment was deducted, contact support with your transaction reference</li>
              <li>3. If payment was not deducted, you can try again</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => router.push(`/invoices/${invoiceId}`)}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Receipt className="mr-2 h-5 w-5" />
              View Invoice
            </Button>
            
            <Button
              onClick={() => router.push('/invoices')}
              className="flex-1 bg-gray-900 hover:bg-gray-800"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Invoices
            </Button>
          </div>

          {/* Support Info */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              Need help? Contact our support team
            </p>
            <p className="text-xs text-gray-400 mt-1">
              support@assettracer.com
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              Processing Payment...
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

