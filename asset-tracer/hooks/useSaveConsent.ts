'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook to save user consent data after OAuth redirect
 * Should be called on any page that loads after OAuth callback
 */
export function useSaveConsent() {
  useEffect(() => {
    const checkAndSaveConsent = async () => {
      try {
        // Check if consent data exists in localStorage (from before OAuth redirect)
        const consentDataStr = localStorage.getItem('signup_consent');
        
        if (!consentDataStr) {
          // No consent data to save
          return;
        }

        const consentData = JSON.parse(consentDataStr);
        
        // Check if user has already saved consent
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // User not authenticated, can't save consent
          return;
        }

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
      } catch (error) {
        console.error('Error checking/saving consent:', error);
        // Don't block the user if consent saving fails
      }
    };

    checkAndSaveConsent();
  }, []);
}

