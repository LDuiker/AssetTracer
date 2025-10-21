/**
 * Auth Error Handler
 * Handles edge cases where user JWT exists but user account was deleted
 */

import { createClient } from './client';

/**
 * Checks if the current session is valid
 * If user was deleted but JWT still exists, sign them out
 */
export async function validateSession() {
  const supabase = createClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // Check for specific error: user deleted but JWT exists
    if (error?.message?.includes('JWT') || 
        error?.message?.includes('does not exist') ||
        error?.status === 401) {
      
      console.warn('Invalid session detected, signing out...');
      await supabase.auth.signOut();
      
      // Clear any cached data
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Wraps an async function with auth error handling
 * Automatically signs out if user was deleted
 */
export function withAuthErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      // Check if it's an auth error
      if (error?.message?.includes('User from sub claim in JWT does not exist') ||
          error?.message?.includes('JWT') ||
          error?.status === 401) {
        
        console.warn('Auth error detected, clearing session...');
        const supabase = createClient();
        await supabase.auth.signOut();
        
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/login';
        }
      }
      
      throw error;
    }
  }) as T;
}

