'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      // Preserve plan parameter for direct checkout after login
      const plan = searchParams.get('plan');
      
      let callbackUrl = `${window.location.origin}/auth/callback`;
      
      if (plan) {
        callbackUrl += `?plan=${plan}`;
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            prompt: 'select_account', // Force account selection every time
          },
        },
      });

      if (error) {
        console.error('Error signing in with Google:', error.message);
        alert('Failed to sign in. Please try again.');
        setIsLoading(false);
      }
      // If successful, user will be redirected to Google
    } catch (error) {
      console.error('Unexpected error during sign-in:', error);
      alert('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-primary-blue rounded-lg flex items-center justify-center">
              <Package className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Asset Tracer</CardTitle>
          <CardDescription>
            Sign in or create a new account with Google
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full bg-primary-blue hover:bg-blue-700" 
            size="lg"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-500">
              First time here? Your account will be created automatically when you sign in with Google.
            </p>
            <p className="text-sm text-gray-600">
              <Link href="/" className="text-primary-blue hover:underline font-medium">
                ← Back to Home
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-light-bg flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-primary-blue rounded-lg flex items-center justify-center">
                <Package className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to Asset Tracer</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

