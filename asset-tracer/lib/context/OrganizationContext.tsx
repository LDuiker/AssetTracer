'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Organization data structure
 */
export interface Organization {
  id: string;
  name: string;
  subscription_tier?: string;
  subscription_status?: string;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  polar_customer_id?: string | null;
  polar_subscription_id?: string | null;
  polar_current_period_end?: string | null;
  polar_current_period_start?: string | null;
  polar_subscription_status?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Organization context value
 */
interface OrganizationContextValue {
  organization: Organization | null;
  organizationId: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Create the organization context
 */
const OrganizationContext = createContext<OrganizationContextValue | undefined>(
  undefined
);

/**
 * Organization Provider Props
 */
interface OrganizationProviderProps {
  children: ReactNode;
}

/**
 * Organization Provider Component
 * Fetches and provides organization data to all child components
 */
export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch the current user's organization
   */
  const fetchOrganization = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();

      // Get current user session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      // Check for auth errors (deleted user with valid JWT)
      if (sessionError) {
        if (sessionError.message?.includes('JWT') || 
            sessionError.message?.includes('does not exist') ||
            sessionError.status === 401 ||
            sessionError.status === 403) {
          console.warn('Invalid session detected (user deleted), clearing local session...');
          // Use local scope to avoid API call with invalid JWT
          await supabase.auth.signOut({ scope: 'local' });
          if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/login';
          }
          return;
        }
      }

      if (sessionError || !session) {
        console.warn('No active session, user needs to log in');
        setIsLoading(false);
        // Redirect to login if on client
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return;
      }

      // Try to fetch user profile with organization_id
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      // If user profile exists with organization_id
      if (userProfile?.organization_id && !profileError) {
        setOrganizationId(userProfile.organization_id);

        // Fetch full organization details
        const response = await supabase
          .from('organizations')
          .select('*')
          .eq('id', userProfile.organization_id)
          .single();
        
        console.log('🔍 Raw Supabase response:', response);
        const { data: orgData, error: orgError } = response;

        if (orgError) {
          console.warn('Could not fetch organization details:', orgError);
          // Still set organizationId even if we can't fetch full details
        } else if (orgData) {
          console.log('🔍 OrganizationContext - Fetched org data:', {
            id: orgData.id,
            name: orgData.name,
            subscription_tier: orgData.subscription_tier,
            polar_customer_id: orgData.polar_customer_id,
          });
          setOrganization(orgData);
        }
      } else {
        // Fallback to user metadata
        const fallbackOrgId = session.user.user_metadata?.organization_id;
        if (fallbackOrgId) {
          setOrganizationId(fallbackOrgId);
          
          // Set a basic organization object
          setOrganization({
            id: fallbackOrgId,
            name: 'Your Organization',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          setError('User is not associated with an organization.');
        }
      }
    } catch (err: any) {
      console.error('Error fetching organization:', err);
      
      // Check if it's an auth error (user deleted but JWT exists)
      if (err?.message?.includes('User from sub claim in JWT does not exist') ||
          err?.message?.includes('JWT') ||
          err?.status === 401 ||
          err?.status === 403) {
        console.warn('Auth error in fetch, clearing local session...');
        const supabase = createClient();
        // Use local scope to avoid API call with invalid JWT
        await supabase.auth.signOut({ scope: 'local' });
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/login';
        }
        return;
      }
      
      setError(
        err instanceof Error ? err.message : 'Failed to fetch organization'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch organization on mount
   */
  useEffect(() => {
    fetchOrganization();
  }, []);

  const value: OrganizationContextValue = {
    organization,
    organizationId,
    isLoading,
    error,
    refetch: fetchOrganization,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

/**
 * Custom hook to use organization context
 * @throws Error if used outside of OrganizationProvider
 * @returns Organization context value
 */
export function useOrganization(): OrganizationContextValue {
  const context = useContext(OrganizationContext);

  if (context === undefined) {
    throw new Error(
      'useOrganization must be used within an OrganizationProvider'
    );
  }

  return context;
}

