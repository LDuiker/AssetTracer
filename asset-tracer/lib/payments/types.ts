/**
 * Shared payment types across all payment gateways
 */

export interface PaymentStatus {
  status: 'pending' | 'processing' | 'success' | 'failed' | 'cancelled' | 'refunded';
  message?: string;
  transactionId?: string;
}

export interface PaymentMetadata {
  gateway: 'dpo' | 'stripe' | 'paypal' | 'flutterwave' | 'other';
  token?: string;
  reference: string;
  amount: number;
  currency: string;
  customerEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefundRequest {
  transactionId: string;
  amount: number;
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  amount?: number;
  error?: string;
}

