import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY is not set. Email sending will fail.');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender configuration
export const EMAIL_FROM = process.env.EMAIL_FROM || 'AssetTracer <notifications@assettracer.app>';

// Helper to check if Resend is configured
export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

