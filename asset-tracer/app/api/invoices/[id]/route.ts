import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getInvoiceById, updateInvoice, deleteInvoice } from '@/lib/db';
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
 * Zod schema for updating an invoice
 */
const updateInvoiceSchema = z.object({
  client_id: z.string().optional(),
  subject: z.string().optional(),
  issue_date: z.string().optional(),
  due_date: z.string().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  currency: z.string().optional(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  payment_date: z.string().optional().nullable(),
  paid_amount: z.coerce.number().optional(),
  items: z.array(lineItemSchema).optional(),
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
 * GET /api/invoices/[id]
 * Fetch a single invoice by ID with client and items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const organizationId = await getOrganizationId(user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with an organization.' },
        { status: 403 }
      );
    }

    const invoice = await getInvoiceById(id, organizationId);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found or access denied.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ invoice }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/invoices/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/invoices/[id]
 * Update an existing invoice
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📝 PATCH /api/invoices/[id] - Request body:', JSON.stringify(body, null, 2));
    console.log('📝 Subject in request:', body.subject);
    
    const validationResult = updateInvoiceSchema.safeParse(body);

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

    const updateData = validationResult.data;
    console.log('✅ Validated update data:', JSON.stringify(updateData, null, 2));
    console.log('✅ Subject in validated data:', updateData.subject);

    const organizationId = await getOrganizationId(user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with an organization.' },
        { status: 403 }
      );
    }

    // Check if invoice exists and is not paid
    const existingInvoice = await getInvoiceById(id, organizationId);
    
    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found or access denied.' },
        { status: 404 }
      );
    }

    // Prevent updates to paid invoices (except updating payment_link)
    if (existingInvoice.status === 'paid' && !updateData.payment_link) {
      return NextResponse.json(
        { error: 'Cannot update a paid invoice' },
        { status: 400 }
      );
    }

    const updatedInvoice = await updateInvoice(id, updateData, organizationId);
    return NextResponse.json({ invoice: updatedInvoice }, { status: 200 });
  } catch (error) {
    console.error('Error in PATCH /api/invoices/[id]:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Invoice not found or access denied.' },
          { status: 404 }
        );
      }
      if (error.message.includes('access denied')) {
        return NextResponse.json(
          { error: 'You do not have permission to update this invoice.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoices/[id]
 * Delete an invoice and its items
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const organizationId = await getOrganizationId(user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with an organization.' },
        { status: 403 }
      );
    }

    // Check if invoice exists and is not paid
    const existingInvoice = await getInvoiceById(id, organizationId);
    
    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found or access denied.' },
        { status: 404 }
      );
    }

    // Prevent deletion of paid invoices
    if (existingInvoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Cannot delete a paid invoice' },
        { status: 400 }
      );
    }

    await deleteInvoice(id, organizationId);
    return NextResponse.json(
      { message: 'Invoice deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/invoices/[id]:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Invoice not found or access denied.' },
          { status: 404 }
        );
      }
      if (error.message.includes('access denied')) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this invoice.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

