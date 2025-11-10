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
          console.error('❌ Could not fetch organization details:', orgError);
          setError(`Failed to fetch organization: ${orgError.message}`);
          // Don't set organization if we can't fetch it - this will cause contexts to fail properly
          return;
        } else if (orgData) {
          console.log('✅ OrganizationContext - Fetched org data:', {
            id: orgData.id,
            name: orgData.name,
            subscription_tier: orgData.subscription_tier || 'free',
            polar_customer_id: orgData.polar_customer_id,
          });
          
          // Ensure subscription_tier is set (default to 'free' if missing)
          const organizationWithDefaults = {
            ...orgData,
            subscription_tier: orgData.subscription_tier || 'free',
          };
          
          setOrganization(organizationWithDefaults);
        } else {
          console.error('❌ Organization data is null or undefined');
          setError('Organization data not found');
          return;
        }
      } else {
        // Fallback to user metadata - but this should rarely happen
        // If user doesn't have organization_id, there's a data integrity issue
        console.error('⚠️ User profile missing organization_id - this should not happen!');
        setError('User is not associated with an organization.');
      }
    } catch (err: unknown) {
      console.error('Error fetching organization:', err);

      const message = err instanceof Error ? err.message : '';
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? (err as { status?: number }).status
          : undefined;

      // Check if it's an auth error (user deleted but JWT exists)
      if (
        message.includes('User from sub claim in JWT does not exist') ||
        message.includes('JWT') ||
        status === 401 ||
        status === 403
      ) {
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
        message || 'Failed to fetch organization'
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

