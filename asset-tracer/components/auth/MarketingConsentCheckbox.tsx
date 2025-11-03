'use client';

import { Checkbox } from '@/components/ui/checkbox';

interface MarketingConsentCheckboxProps {
  marketingConsent: boolean;
  onMarketingChange: (consent: boolean) => void;
  className?: string;
}

export function MarketingConsentCheckbox({
  marketingConsent,
  onMarketingChange,
  className = '',
}: MarketingConsentCheckboxProps) {
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <Checkbox
        id="marketing-consent"
        checked={marketingConsent}
        onCheckedChange={(checked) => onMarketingChange(checked === true)}
        className="mt-0.5"
      />
      <label
        htmlFor="marketing-consent"
        className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer leading-relaxed"
      >
        I would like to receive product updates, tips, and special offers from Asset Tracer{' '}
        <span className="text-gray-400 dark:text-gray-500">(optional)</span>
      </label>
    </div>
  );
}

