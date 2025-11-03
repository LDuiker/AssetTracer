/**
 * Basic tests for LegalAgreementCheckboxes component
 * Run with: npm test or your preferred test runner
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { LegalAgreementCheckboxes } from '../LegalAgreementCheckboxes';

describe('LegalAgreementCheckboxes', () => {
  const mockOnTermsChange = jest.fn();
  const mockOnMarketingChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders terms and privacy checkbox', () => {
    render(
      <LegalAgreementCheckboxes
        termsAccepted={false}
        marketingConsent={false}
        onTermsChange={mockOnTermsChange}
        onMarketingChange={mockOnMarketingChange}
      />
    );

    expect(screen.getByLabelText(/I agree to Asset Tracer's/i)).toBeInTheDocument();
    expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
    expect(screen.getByText(/Privacy Policy/i)).toBeInTheDocument();
  });

  it('renders marketing consent checkbox', () => {
    render(
      <LegalAgreementCheckboxes
        termsAccepted={false}
        marketingConsent={false}
        onTermsChange={mockOnTermsChange}
        onMarketingChange={mockOnMarketingChange}
      />
    );

    expect(screen.getByLabelText(/I would like to receive product updates/i)).toBeInTheDocument();
  });

  it('calls onTermsChange when terms checkbox is clicked', () => {
    render(
      <LegalAgreementCheckboxes
        termsAccepted={false}
        marketingConsent={false}
        onTermsChange={mockOnTermsChange}
        onMarketingChange={mockOnMarketingChange}
      />
    );

    const termsCheckbox = screen.getByLabelText(/I agree to Asset Tracer's/i);
    fireEvent.click(termsCheckbox);

    expect(mockOnTermsChange).toHaveBeenCalledWith(true);
  });

  it('calls onMarketingChange when marketing checkbox is clicked', () => {
    render(
      <LegalAgreementCheckboxes
        termsAccepted={false}
        marketingConsent={false}
        onTermsChange={mockOnTermsChange}
        onMarketingChange={mockOnMarketingChange}
      />
    );

    const marketingCheckbox = screen.getByLabelText(/I would like to receive product updates/i);
    fireEvent.click(marketingCheckbox);

    expect(mockOnMarketingChange).toHaveBeenCalledWith(true);
  });

  it('displays error message when provided', () => {
    const errorMessage = 'You must accept the terms to continue';
    
    render(
      <LegalAgreementCheckboxes
        termsAccepted={false}
        marketingConsent={false}
        onTermsChange={mockOnTermsChange}
        onMarketingChange={mockOnMarketingChange}
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows required asterisk on terms checkbox', () => {
    render(
      <LegalAgreementCheckboxes
        termsAccepted={false}
        marketingConsent={false}
        onTermsChange={mockOnTermsChange}
        onMarketingChange={mockOnMarketingChange}
      />
    );

    const asterisk = screen.getByText('*');
    expect(asterisk).toBeInTheDocument();
    expect(asterisk).toHaveClass('text-red-500');
  });

  it('links open in new tab with security attributes', () => {
    render(
      <LegalAgreementCheckboxes
        termsAccepted={false}
        marketingConsent={false}
        onTermsChange={mockOnTermsChange}
        onMarketingChange={mockOnMarketingChange}
      />
    );

    const termsLink = screen.getByText(/Terms of Service/i).closest('a');
    const privacyLink = screen.getByText(/Privacy Policy/i).closest('a');

    expect(termsLink).toHaveAttribute('target', '_blank');
    expect(termsLink).toHaveAttribute('rel', 'noopener noreferrer');
    
    expect(privacyLink).toHaveAttribute('target', '_blank');
    expect(privacyLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(
      <LegalAgreementCheckboxes
        termsAccepted={false}
        marketingConsent={false}
        onTermsChange={mockOnTermsChange}
        onMarketingChange={mockOnMarketingChange}
        error="Test error"
      />
    );

    const termsCheckbox = screen.getByLabelText(/I agree to Asset Tracer's/i).closest('input');
    expect(termsCheckbox).toHaveAttribute('aria-required', 'true');
    expect(termsCheckbox).toHaveAttribute('aria-invalid', 'true');
  });
});

