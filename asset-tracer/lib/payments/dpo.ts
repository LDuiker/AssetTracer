/**
 * DPO Group Payment Gateway Integration
 * 
 * Direct Pay Online (DPO) is a payment gateway supporting multiple African countries.
 * This module implements the DPO API for creating payment tokens, verifying payments,
 * and handling webhooks.
 * 
 * @see https://docs.dpogroup.com/
 */

import crypto from 'crypto';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface DPOConfig {
  companyToken: string;
  serviceType: string; // e.g., '3854' for standard payments
  apiUrl: string;
  testMode: boolean;
}

export interface CreatePaymentTokenParams {
  amount: number;
  currency: string;
  reference: string;
  customerEmail: string;
  customerPhone?: string;
  customerName?: string;
  redirectUrl: string;
  backUrl?: string;
  description?: string;
  metaData?: Record<string, string>;
}

export interface CreatePaymentTokenResponse {
  success: boolean;
  token?: string;
  paymentUrl?: string;
  reference?: string;
  error?: string;
  errorCode?: string;
  rawResponse?: string;
}

export interface VerifyPaymentTokenParams {
  token: string;
}

export interface VerifyPaymentTokenResponse {
  success: boolean;
  transactionToken?: string;
  reference?: string;
  amount?: number;
  currency?: string;
  status?: 'PAID' | 'PENDING' | 'FAILED' | 'CANCELLED';
  statusDescription?: string;
  transactionId?: string;
  customerName?: string;
  customerEmail?: string;
  paymentMethod?: string;
  paymentDate?: string;
  error?: string;
  errorCode?: string;
  rawResponse?: string;
}

export interface WebhookPayload {
  TransactionToken: string;
  Reference: string;
  Amount: string;
  Currency: string;
  CompanyRef: string;
  TransactionApproval: string;
  TransactionCurrency: string;
  TransactionAmount: string;
  CustomerName?: string;
  CustomerEmail?: string;
  CustomerPhone?: string;
  [key: string]: string | undefined;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Get DPO configuration from environment variables
 */
export function getDPOConfig(): DPOConfig {
  const companyToken = process.env.DPO_COMPANY_TOKEN;
  const serviceType = process.env.DPO_SERVICE_TYPE || '3854';
  const testMode = process.env.DPO_TEST_MODE === 'true';
  
  const apiUrl = testMode
    ? 'https://secure.3gdirectpay.com'
    : 'https://secure.3gdirectpay.com';

  if (!companyToken) {
    throw new Error('DPO_COMPANY_TOKEN is not configured in environment variables');
  }

  return {
    companyToken,
    serviceType,
    apiUrl,
    testMode,
  };
}

// ============================================================================
// XML Utilities
// ============================================================================

/**
 * Build XML string from object (simple implementation)
 */
function buildXML(obj: Record<string, unknown>, rootTag?: string): string {
  let xml = '';
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      xml += `<${key}>${buildXML(value as Record<string, unknown>)}</${key}>`;
    } else {
      // Escape XML special characters
      const escapedValue = String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      xml += `<${key}>${escapedValue}</${key}>`;
    }
  }
  
  return rootTag ? `<${rootTag}>${xml}</${rootTag}>` : xml;
}

/**
 * Parse XML to object (simple implementation using regex)
 */
function parseXML(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  
  // Remove XML declaration and whitespace
  xml = xml.replace(/<\?xml[^?]*\?>/g, '').trim();
  
  // Extract tag-value pairs
  const tagRegex = /<([^>\/]+)>([^<]*)<\/\1>/g;
  let match;
  
  while ((match = tagRegex.exec(xml)) !== null) {
    const [, tag, value] = match;
    result[tag] = value;
  }
  
  return result;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Create a payment token with DPO
 * 
 * @param params Payment parameters
 * @returns Payment token and URL
 * 
 * @example
 * ```typescript
 * const result = await createPaymentToken({
 *   amount: 100.00,
 *   currency: 'USD',
 *   reference: 'INV-001',
 *   customerEmail: 'customer@example.com',
 *   redirectUrl: 'https://mysite.com/payment/success',
 *   description: 'Invoice payment'
 * });
 * 
 * if (result.success) {
 *   // Redirect user to result.paymentUrl
 * }
 * ```
 */
export async function createPaymentToken(
  params: CreatePaymentTokenParams
): Promise<CreatePaymentTokenResponse> {
  try {
    const config = getDPOConfig();

    // Validate parameters
    if (!params.amount || params.amount <= 0) {
      return {
        success: false,
        error: 'Invalid amount',
        errorCode: 'INVALID_AMOUNT',
      };
    }

    if (!params.currency || params.currency.length !== 3) {
      return {
        success: false,
        error: 'Invalid currency code (must be 3 characters)',
        errorCode: 'INVALID_CURRENCY',
      };
    }

    if (!params.reference || params.reference.trim().length === 0) {
      return {
        success: false,
        error: 'Reference is required',
        errorCode: 'INVALID_REFERENCE',
      };
    }

    if (!params.customerEmail || !isValidEmail(params.customerEmail)) {
      return {
        success: false,
        error: 'Valid customer email is required',
        errorCode: 'INVALID_EMAIL',
      };
    }

    if (!params.redirectUrl || !isValidUrl(params.redirectUrl)) {
      return {
        success: false,
        error: 'Valid redirect URL is required',
        errorCode: 'INVALID_URL',
      };
    }

    // Build XML request
    const xmlData = {
      CompanyToken: config.companyToken,
      Request: 'createToken',
      Transaction: {
        PaymentAmount: params.amount.toFixed(2),
        PaymentCurrency: params.currency.toUpperCase(),
        CompanyRef: params.reference,
        RedirectURL: params.redirectUrl,
        BackURL: params.backUrl || params.redirectUrl,
        CompanyRefUnique: '0', // Set to 1 to enforce unique references
        PTL: '5', // Payment Time Limit (hours)
      },
      Services: {
        Service: {
          ServiceType: config.serviceType,
          ServiceDescription: params.description || 'Payment',
          ServiceDate: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
        },
      },
    };

    // Add customer details if provided
    if (params.customerName || params.customerEmail || params.customerPhone) {
      Object.assign(xmlData, {
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        customerPhone: params.customerPhone,
      });
    }

    const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>${buildXML(xmlData, 'API3G')}`;

    console.log('[DPO] Creating payment token:', {
      reference: params.reference,
      amount: params.amount,
      currency: params.currency,
    });

    // Make API request
    const response = await fetch(`${config.apiUrl}/payv2.php?ID=createToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: xmlRequest,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlResponse = await response.text();
    const parsedResponse = parseXML(xmlResponse);

    console.log('[DPO] Token creation response:', parsedResponse);

    // Check for errors
    if (parsedResponse.Result === '000') {
      // Success
      const token = parsedResponse.TransToken;
      const paymentUrl = `${config.apiUrl}/payv2.php?ID=${token}`;

      return {
        success: true,
        token,
        paymentUrl,
        reference: params.reference,
        rawResponse: xmlResponse,
      };
    } else {
      // Error from DPO
      return {
        success: false,
        error: parsedResponse.ResultExplanation || 'Payment token creation failed',
        errorCode: parsedResponse.Result,
        rawResponse: xmlResponse,
      };
    }
  } catch (error) {
    console.error('[DPO] Error creating payment token:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode: 'CREATE_TOKEN_ERROR',
    };
  }
}

/**
 * Verify a payment token status with DPO
 * 
 * @param params Verification parameters
 * @returns Payment status and transaction details
 * 
 * @example
 * ```typescript
 * const result = await verifyPaymentToken({
 *   token: 'ABC123XYZ'
 * });
 * 
 * if (result.success && result.status === 'PAID') {
 *   // Payment successful, update order status
 * }
 * ```
 */
export async function verifyPaymentToken(
  params: VerifyPaymentTokenParams
): Promise<VerifyPaymentTokenResponse> {
  try {
    const config = getDPOConfig();

    if (!params.token || params.token.trim().length === 0) {
      return {
        success: false,
        error: 'Token is required',
        errorCode: 'INVALID_TOKEN',
      };
    }

    // Build XML request
    const xmlData = {
      CompanyToken: config.companyToken,
      Request: 'verifyToken',
      TransactionToken: params.token,
    };

    const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>${buildXML(xmlData, 'API3G')}`;

    console.log('[DPO] Verifying payment token:', params.token);

    // Make API request
    const response = await fetch(`${config.apiUrl}/API/v6/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: xmlRequest,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlResponse = await response.text();
    const parsedResponse = parseXML(xmlResponse);

    console.log('[DPO] Verification response:', parsedResponse);

    // Check for errors
    if (parsedResponse.Result === '000') {
      // Success - parse transaction details
      let status: 'PAID' | 'PENDING' | 'FAILED' | 'CANCELLED' = 'PENDING';
      
      // Map DPO status codes to our status
      const transactionApproval = parsedResponse.TransactionApproval;
      if (transactionApproval === 'Y' || transactionApproval === 'A') {
        status = 'PAID';
      } else if (transactionApproval === 'N' || transactionApproval === 'D') {
        status = 'FAILED';
      } else if (transactionApproval === 'C') {
        status = 'CANCELLED';
      }

      return {
        success: true,
        transactionToken: parsedResponse.TransactionToken,
        reference: parsedResponse.CompanyRef,
        amount: parseFloat(parsedResponse.TransactionAmount || '0'),
        currency: parsedResponse.TransactionCurrency,
        status,
        statusDescription: parsedResponse.ResultExplanation,
        transactionId: parsedResponse.TransactionRef,
        customerName: parsedResponse.CustomerName,
        customerEmail: parsedResponse.CustomerEmail,
        paymentMethod: parsedResponse.PaymentMethod,
        paymentDate: parsedResponse.TransactionSettlementDate,
        rawResponse: xmlResponse,
      };
    } else {
      // Error from DPO
      return {
        success: false,
        error: parsedResponse.ResultExplanation || 'Payment verification failed',
        errorCode: parsedResponse.Result,
        rawResponse: xmlResponse,
      };
    }
  } catch (error) {
    console.error('[DPO] Error verifying payment token:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorCode: 'VERIFY_TOKEN_ERROR',
    };
  }
}

/**
 * Verify webhook signature from DPO
 * 
 * DPO sends webhooks to notify about payment status changes.
 * This function verifies the authenticity of the webhook.
 * 
 * @param payload The webhook payload data
 * @param signature The signature sent by DPO (usually in headers or payload)
 * @returns True if signature is valid, false otherwise
 * 
 * @example
 * ```typescript
 * // In your webhook handler
 * const payload = await request.json();
 * const signature = request.headers.get('x-dpo-signature');
 * 
 * if (!verifyWebhookSignature(payload, signature)) {
 *   return new Response('Invalid signature', { status: 401 });
 * }
 * 
 * // Process webhook...
 * ```
 */
export function verifyWebhookSignature(
  payload: WebhookPayload | string,
  signature: string | null
): boolean {
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.DPO_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('[DPO] Webhook secret not configured, skipping signature verification');
      return true; // In production, you may want to return false here
    }

    if (!signature) {
      console.error('[DPO] No signature provided');
      return false;
    }

    // Convert payload to string if it's an object
    const payloadString = typeof payload === 'string' 
      ? payload 
      : JSON.stringify(payload);

    // Create HMAC signature
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(payloadString);
    const calculatedSignature = hmac.digest('hex');

    // Compare signatures (timing-safe comparison)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );

    if (!isValid) {
      console.error('[DPO] Invalid webhook signature');
      return false;
    }

    console.log('[DPO] Webhook signature verified successfully');
    return true;
  } catch (error) {
    console.error('[DPO] Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Alternative webhook verification using query string method
 * 
 * Some DPO implementations pass verification data in the query string.
 * This function verifies by checking the transaction token against DPO.
 * 
 * @param token Transaction token from webhook
 * @returns True if token is valid and payment is successful
 */
export async function verifyWebhookToken(token: string): Promise<boolean> {
  try {
    const result = await verifyPaymentToken({ token });
    
    if (!result.success) {
      console.error('[DPO] Webhook token verification failed:', result.error);
      return false;
    }

    if (result.status !== 'PAID') {
      console.warn('[DPO] Webhook token status is not PAID:', result.status);
      return false;
    }

    console.log('[DPO] Webhook token verified successfully');
    return true;
  } catch (error) {
    console.error('[DPO] Error verifying webhook token:', error);
    return false;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Validate email address
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format amount to 2 decimal places
 */
export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Parse amount from string
 */
export function parseAmount(amount: string): number {
  return parseFloat(amount) || 0;
}

/**
 * Get supported currencies
 * 
 * Note: This is a subset. DPO supports many currencies depending on your configuration.
 */
export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'ZAR', 'KES', 'TZS', 'UGX',
  'ZMW', 'MWK', 'NGN', 'GHS', 'BWP', 'MUR', 'RWF',
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

/**
 * Check if currency is supported
 */
export function isSupportedCurrency(currency: string): currency is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency);
}

