'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, AlertCircle } from 'lucide-react';

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error' | 'invalid' | 'ready'>('loading');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    // In a full implementation, this would:
    // 1. Validate the token
    // 2. Check if it's expired
    // 3. Get invitation details
    // For now, we'll just show a placeholder
    setTimeout(() => {
      setStatus('ready');
    }, 1000);
  }, [token]);

  if (!token || status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <CardTitle>Invalid Invitation</CardTitle>
            </div>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-blue-600" />
            <CardTitle>Team Invitation</CardTitle>
          </div>
          <CardDescription>
            You&apos;ve been invited to join a team on Asset Tracer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Feature Coming Soon!</strong>
                  <br />
                  The invitation acceptance feature is currently under development. 
                  To join the team, please contact your team administrator to manually add you.
                </AlertDescription>
              </Alert>

              <div className="space-y-2 text-sm">
                <p>
                  <strong>Invitation Token:</strong>
                  <br />
                  <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded block mt-1 break-all">
                    {token}
                  </code>
                </p>
              </div>

              <div className="pt-4 space-y-2">
                <Button onClick={() => router.push('/login')} className="w-full">
                  Sign In to Continue
                </Button>
                <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                  Back to Home
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-light-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accept Invitation</CardTitle>
            <CardDescription>Loading invitation details...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
          </CardContent>
        </Card>
      </div>
    }>
      <AcceptInviteForm />
    </Suspense>
  );
}

