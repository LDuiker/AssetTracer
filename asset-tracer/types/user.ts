/**
 * User types and interfaces
 */

export interface User {
  id: string;
  organization_id: string;
  email: string;
  name: string | null;
  phone: string | null;
  terms_accepted_at: string | null;
  terms_accepted_ip: string | null;
  marketing_consent: boolean;
  marketing_consent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserConsent {
  termsAccepted: boolean;
  marketingConsent: boolean;
  termsAcceptedAt: string;
  termsAcceptedIp?: string;
  marketingConsentAt?: string;
}

export interface UserConsentData {
  termsAccepted: boolean;
  marketingConsent: boolean;
  timestamp: string;
}

