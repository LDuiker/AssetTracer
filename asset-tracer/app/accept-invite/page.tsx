'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, AlertCircle, CheckCircle, Building2, User, Shield, Eye, Crown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type InvitationStatus = 'loading' | 'error' | 'invalid' | 'expired' | 'ready' | 'checking-auth' | 'accepted';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  organization: {
    id: string;
    name: string;
  };
  inviter: {
    email: string;
    name: string;
  };
}

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<InvitationStatus>('loading');
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const token = searchParams.get('token');
  const supabase = createClient();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, [supabase]);

  // Fetch invitation details
  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/team/accept-invite?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            setStatus('invalid');
          } else {
            setStatus('error');
          }
          return;
        }

        if (data.invitation.status === 'expired') {
          setStatus('expired');
          return;
        }

        setInvitation(data.invitation);
        setStatus('ready');
      } catch (error) {
        console.error('Error fetching invitation:', error);
        setStatus('error');
      }
    };

    fetchInvitation();
  }, [token]);

  const handleAccept = async () => {
    if (!token || !invitation) return;

    setIsAccepting(true);
    try {
      const response = await fetch('/api/team/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated - redirect to login
          const returnUrl = encodeURIComponent(window.location.href);
          router.push(`/login?returnUrl=${returnUrl}`);
          return;
        }
        throw new Error(data.error || 'Failed to accept invitation');
      }

      toast.success('Successfully joined the team!');
      setStatus('accepted');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-green-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Administrator';
      case 'viewer':
        return 'Viewer';
      default:
        return 'Team Member';
    }
  };

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
              This invitation link is invalid or has already been used.
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

  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-orange-600" />
              <CardTitle>Invitation Expired</CardTitle>
            </div>
            <CardDescription>
              This invitation has expired. Please ask for a new invitation.
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

  if (status === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <CardTitle>Invitation Accepted!</CardTitle>
            </div>
            <CardDescription>
              You've successfully joined the team. Redirecting to dashboard...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
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
          ) : invitation ? (
            <>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Organization</p>
                    <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">{invitation.organization.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {getRoleIcon(invitation.role)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Your Role</p>
                    <p className="text-base font-semibold text-gray-700 dark:text-gray-300">{getRoleLabel(invitation.role)}</p>
                  </div>
                </div>

                {invitation.inviter && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <User className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Invited by</p>
                      <p className="text-base text-gray-700 dark:text-gray-300">
                        {invitation.inviter.name || invitation.inviter.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {isAuthenticated === false && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need to sign in to accept this invitation. Click the button below to sign in.
                  </AlertDescription>
                </Alert>
              )}

              {isAuthenticated === true && invitation.email && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This invitation was sent to <strong>{invitation.email}</strong>. 
                    Make sure you're signed in with this email address.
                  </AlertDescription>
                </Alert>
              )}

              <div className="pt-4 space-y-2">
                <Button 
                  onClick={handleAccept} 
                  className="w-full"
                  disabled={isAccepting || status !== 'ready'}
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Accepting...
                    </>
                  ) : isAuthenticated === false ? (
                    'Sign In to Accept'
                  ) : (
                    'Accept Invitation'
                  )}
                </Button>
                <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                  Back to Home
                </Button>
              </div>
            </>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load invitation details. Please try again later.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accept Invitation</CardTitle>
            <CardDescription>Loading invitation details...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    }>
      <AcceptInviteForm />
    </Suspense>
  );
}
