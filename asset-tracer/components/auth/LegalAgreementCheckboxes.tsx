'use client';

import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle } from 'lucide-react';

interface LegalAgreementCheckboxesProps {
  termsAccepted: boolean;
  marketingConsent: boolean;
  onTermsChange: (accepted: boolean) => void;
  onMarketingChange: (consent: boolean) => void;
  error?: string;
  className?: string;
}

export function LegalAgreementCheckboxes({
  termsAccepted,
  marketingConsent,
  onTermsChange,
  onMarketingChange,
  error,
  className = '',
}: LegalAgreementCheckboxesProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Terms and Privacy Checkbox - Required */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms-accepted"
            checked={termsAccepted}
            onCheckedChange={(checked) => onTermsChange(checked === true)}
            className="mt-0.5"
            aria-required="true"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'terms-error' : undefined}
          />
          <label
            htmlFor="terms-accepted"
            className="text-sm leading-relaxed cursor-pointer text-gray-700 dark:text-gray-300"
          >
            I agree to Asset Tracer&apos;s{' '}
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Privacy Policy
            </Link>
            <span className="text-red-500 ml-1" aria-label="required">*</span>
          </label>
        </div>
        {error && (
          <div
            id="terms-error"
            role="alert"
            aria-live="polite"
            className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
          >
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Marketing Consent Checkbox - Optional */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="marketing-consent"
          checked={marketingConsent}
          onCheckedChange={(checked) => onMarketingChange(checked === true)}
          className="mt-0.5"
        />
        <label
          htmlFor="marketing-consent"
          className="text-sm leading-relaxed cursor-pointer text-gray-600 dark:text-gray-400"
        >
          I would like to receive product updates, tips, and special offers from Asset Tracer{' '}
          <span className="text-gray-400 dark:text-gray-500 text-xs">(optional)</span>
        </label>
      </div>
    </div>
  );
}

