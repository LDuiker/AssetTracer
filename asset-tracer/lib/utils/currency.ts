/**
 * Currency formatting utilities
 */

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currencySymbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'BWP': 'BWP',
    'ZAR': 'R',
  };
  return currencySymbols[currencyCode] || currencyCode;
}

/**
 * Format an amount with a specific currency
 * @param amount - The amount to format
 * @param currencyCode - The currency code (USD, EUR, GBP, BWP, ZAR, etc.)
 * @returns Formatted currency string
 */
export function formatCurrencyAmount(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  
  // Format the number with 0 decimal places
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  return `${symbol}${formattedNumber}`;
}

