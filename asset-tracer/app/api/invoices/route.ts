import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getInvoices, createInvoice } from '@/lib/db';
import { z } from 'zod';
import { sanitizeObject } from '@/lib/utils/sanitize';
import { handleCorsPreflight, withCors } from '@/lib/utils/cors';

/**
 * Zod schema for line item validation
 */
const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.coerce.number().min(0, 'Unit price must be at least 0'),
  tax_rate: z.coerce.number().min(0).max(100, 'Tax rate must be between 0 and 100'),
  asset_id: z.string().optional().nullable(),
});

/**
 * Zod schema for creating an invoice
 */
const createInvoiceSchema = z.object({
  client_id: z.string().min(1, 'Client ID is required'),
  subject: z.string().optional(),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  currency: z.string().min(1, 'Currency is required'),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  payment_date: z.string().optional().nullable(),
  items: z.array(lineItemSchema).min(1, 'At least one line item is required'),
});

/**
 * Helper function to get organization ID from user session
 */
async function getOrganizationId(userId: string) {
  const supabase = await createSupabaseClient();
  
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.organization_id || null;
  }

  return userProfile?.organization_id || null;
}

/**
 * OPTIONS /api/invoices
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request);
}

/**
 * GET /api/invoices
 * Fetch all invoices for the authenticated user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      const response = NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
      return withCors(request, response);
    }

    const organizationId = await getOrganizationId(user.id);
    if (!organizationId) {
      const response = NextResponse.json(
        { error: 'User is not associated with an organization.' },
        { status: 403 }
      );
      return withCors(request, response);
    }

    const invoices = await getInvoices(organizationId);
    const response = NextResponse.json({ invoices }, { status: 200 });
    return withCors(request, response);
  } catch (error) {
    console.error('Error in GET /api/invoices:', error);
    const response = NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
    return withCors(request, response);
  }
}

/**
 * POST /api/invoices
 * Create a new invoice with line items
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      const response = NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
      return withCors(request, response);
    }

    const body = await request.json();
    const validationResult = createInvoiceSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      const response = NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
      return withCors(request, response);
    }

    const validated = validationResult.data;

    // Sanitize user-generated text fields to prevent XSS
    const invoiceData = sanitizeObject(validated, [
      'subject',
      'notes',
      'terms',
      'items', // Will sanitize description in items
    ]);

    const organizationId = await getOrganizationId(user.id);
    if (!organizationId) {
      const response = NextResponse.json(
        { error: 'User is not associated with an organization.' },
        { status: 403 }
      );
      return withCors(request, response);
    }

    // Check subscription limits - free plan: 5 invoices per month
    const { data: organization } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', organizationId)
      .single();

    const subscriptionTier = organization?.subscription_tier || 'free';
    
    // Count invoices created this month for free tier
    if (subscriptionTier === 'free') {
      // Create first day of current month in UTC to avoid timezone issues
      const now = new Date();
      const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      // Format as ISO string without milliseconds for better compatibility with Supabase
      const firstDayISO = firstDayOfMonth.toISOString().split('.')[0] + 'Z';
      
      // Use a more reliable method: fetch actual invoices and count them
      // This ensures we get the exact count regardless of count query issues
      const { data: monthlyInvoices, error: fetchError } = await supabase
        .from('invoices')
        .select('id, created_at')
        .eq('organization_id', organizationId)
        .gte('created_at', firstDayISO);
      
      // Also try the count query for comparison
      const { count, error: countError } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', firstDayISO);

      if (countError) {
        console.warn('Count query for monthly invoices returned an error:', countError);
      }

      if (fetchError) {
        console.error('Error fetching monthly invoices:', fetchError);
        // If fetch fails, be safe and block creation
        const response = NextResponse.json(
          { 
            error: 'Unable to verify subscription limits',
            message: 'Please try again or contact support if the issue persists.'
          },
          { status: 500 }
        );
        return withCors(request, response);
      }

      // Use the actual fetched count as the source of truth
      // This is more reliable than the count query which can have issues
      const verifiedCount = monthlyInvoices?.length || 0;
      const maxAllowed = 5;

      // Log detailed verification
      console.log(`[Invoice Count Verification] Count from query: ${count}, Count from fetch: ${verifiedCount}`, {
        invoiceIds: monthlyInvoices?.map(i => i.id),
        invoiceDates: monthlyInvoices?.map(i => i.created_at),
        discrepancy: count !== verifiedCount ? `⚠️ MISMATCH: Query says ${count}, Fetch says ${verifiedCount}` : '✅ Counts match',
      });

      console.log(`[Invoice Limit Check] User: ${user.email}, Organization: ${organizationId}, Subscription tier: ${subscriptionTier}, Current count (verified): ${verifiedCount}, Max allowed: ${maxAllowed}, First day of month (UTC): ${firstDayISO}, Current time (UTC): ${new Date().toISOString()}`);

      // Block if current count is already at or above the limit
      // If verifiedCount is 5, we already have 5 invoices, so block the 6th
      // Use >= to ensure we block at exactly the limit
      if (verifiedCount >= maxAllowed) {
        console.log(`[Invoice Limit Check] BLOCKED - Count ${verifiedCount} >= Limit ${maxAllowed}`);
        const response = NextResponse.json(
          { 
            error: 'Monthly invoice limit reached',
            message: `Free plan allows ${maxAllowed} invoices per month. You've created ${verifiedCount} this month. Upgrade to Pro for unlimited invoices.`
          },
          { status: 403 }
        );
        return withCors(request, response);
      }

      console.log(`[Invoice Limit Check] ALLOWED - Count ${verifiedCount} < Limit ${maxAllowed} (will allow creation of ${verifiedCount + 1}th invoice)`);
    }

    const newInvoice = await createInvoice(
      invoiceData,
      organizationId,
      user.id
    );

    const response = NextResponse.json({ invoice: newInvoice }, { status: 201 });
    return withCors(request, response);
  } catch (error) {
    console.error('Error in POST /api/invoices:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Client not found')) {
        const response = NextResponse.json(
          { error: 'Client not found or access denied' },
          { status: 404 }
        );
        return withCors(request, response);
      }
      if (error.message.includes('Failed to create invoice')) {
        const response = NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
        return withCors(request, response);
      }
    }

    const response = NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
    return withCors(request, response);
  }
}

