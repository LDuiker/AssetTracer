'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// This component will check for consent data and save it after OAuth redirect
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAndSaveConsent = async () => {
      try {
        // Check if consent data exists in localStorage (from before OAuth redirect)
        const consentDataStr = localStorage.getItem('signup_consent');
        
        if (consentDataStr) {
          const consentData = JSON.parse(consentDataStr);
          
          // Check if user has already saved consent
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            const { data: userData } = await supabase
              .from('users')
              .select('terms_accepted_at')
              .eq('id', session.user.id)
              .single();

            // If user doesn't have terms_accepted_at, save the consent
            if (!userData?.terms_accepted_at) {
              const response = await fetch('/api/auth/consent', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  termsAccepted: consentData.termsAccepted,
                  marketingConsent: consentData.marketingConsent,
                  termsAcceptedAt: consentData.timestamp,
                }),
              });

              if (response.ok) {
                // Clear consent data from localStorage
                localStorage.removeItem('signup_consent');
              }
            } else {
              // User already has consent saved, clear localStorage
              localStorage.removeItem('signup_consent');
            }
          }
        }
      } catch (error) {
        console.error('Error checking/saving consent:', error);
        // Don't block the user if consent saving fails
      }
    };

    checkAndSaveConsent();
  }, [router]);

  // Rest of your dashboard component...
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      {/* Your dashboard content */}
    </div>
  );
}
