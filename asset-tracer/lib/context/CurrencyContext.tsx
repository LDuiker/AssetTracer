'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CurrencyContextType {
  currency: string;
  taxRate: number;
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
  getCurrencySymbol: () => string;
  refetch: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrency] = useState<string>('USD');
  const [taxRate, setTaxRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchOrganizationSettings = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's organization
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!userData?.organization_id) return;

      // Fetch organization settings
      const { data: orgData } = await supabase
        .from('organizations')
        .select('default_currency, default_tax_rate')
        .eq('id', userData.organization_id)
        .single();

      if (orgData) {
        setCurrency(orgData.default_currency || 'USD');
        setTaxRate(orgData.default_tax_rate || 0);
      }
    } catch (error) {
      console.error('Error fetching currency settings:', error);
      // Fallback to defaults
      setCurrency('USD');
      setTaxRate(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizationSettings();
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCurrencySymbol = (): string => {
    const currencySymbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'BWP': 'BWP',
      'ZAR': 'R',
    };
    return currencySymbols[currency] || currency;
  };

  const refetch = async () => {
    await fetchOrganizationSettings();
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        taxRate,
        isLoading,
        formatCurrency,
        getCurrencySymbol,
        refetch,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

