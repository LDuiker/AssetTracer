import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getInvoices, createInvoice } from '@/lib/db';
import { z } from 'zod';

/**
 * Zod schema for line item validation
 */
const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unit_price: z.coerce.number().min(0, 'Unit price must be at least 0'),
  tax_rate: z.coerce.number().min(0).max(100, 'Tax rate must be between 0 and 100'),
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
 * GET /api/invoices
 * Fetch all invoices for the authenticated user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const organizationId = await getOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with an organization.' },
        { status: 403 }
      );
    }

    const invoices = await getInvoices(organizationId);
    return NextResponse.json({ invoices }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
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
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = createInvoiceSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const invoiceData = validationResult.data;

    const organizationId = await getOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with an organization.' },
        { status: 403 }
      );
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
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { count, error: countError } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', firstDayOfMonth.toISOString());

      if (countError) {
        console.error('Error counting monthly invoices:', countError);
      }

      const currentMonthCount = count || 0;
      const maxAllowed = 5;

      // Block if already at or above limit (should block before creating the 6th one)
      if (currentMonthCount >= maxAllowed) {
        return NextResponse.json(
          { 
            error: 'Monthly invoice limit reached',
            message: `Free plan allows ${maxAllowed} invoices per month. You've created ${currentMonthCount} this month. Upgrade to Pro for unlimited invoices.`
          },
          { status: 403 }
        );
      }
    }

    const newInvoice = await createInvoice(
      invoiceData,
      organizationId,
      session.user.id
    );

    return NextResponse.json({ invoice: newInvoice }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/invoices:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Client not found')) {
        return NextResponse.json(
          { error: 'Client not found or access denied' },
          { status: 404 }
        );
      }
      if (error.message.includes('Failed to create invoice')) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

