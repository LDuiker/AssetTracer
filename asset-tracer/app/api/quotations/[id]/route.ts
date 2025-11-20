import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getQuotationById, updateQuotation, deleteQuotation } from '@/lib/db/quotations';
import { z } from 'zod';
import { sanitizeObject, sanitizeText } from '@/lib/utils/sanitize';

// Validation schema for quotation items
const QuotationItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit_price: z.number().min(0, 'Unit price must be non-negative'),
  tax_rate: z.number().min(0).max(100, 'Tax rate must be between 0 and 100'),
});

// Validation schema for updating a quotation
const UpdateQuotationSchema = z.object({
  client_id: z.string().uuid().optional(),
  subject: z.string().optional(),
  issue_date: z.string().optional(),
  valid_until: z.string().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(QuotationItemSchema).optional(),
});

/**
 * GET /api/quotations/[id]
 * Get a single quotation by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData, error: orgError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (orgError || !userData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch quotation
    const quotation = await getQuotationById(id, userData.organization_id);

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    return NextResponse.json({ quotation }, { status: 200 });
  } catch (error) {
    console.error(`Error in GET /api/quotations/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch quotation' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/quotations/[id]
 * Update a quotation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData, error: orgError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (orgError || !userData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // First, check if the quotation exists and if it's been converted to an invoice
    const existingQuotation = await getQuotationById(id, userData.organization_id);
    
    if (!existingQuotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Prevent updates to invoiced quotations
    if (existingQuotation.status === 'invoiced' || existingQuotation.converted_to_invoice_id) {
      return NextResponse.json(
        { error: 'Cannot update a quotation that has been converted to an invoice' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = UpdateQuotationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Prevent manual setting of 'invoiced' status
    if (validationResult.data.status === 'invoiced') {
      return NextResponse.json(
        { error: 'Cannot manually set status to invoiced. Use the Convert to Invoice feature.' },
        { status: 400 }
      );
    }

    // Sanitize user-generated text fields to prevent XSS
    const sanitizedData = sanitizeObject(validationResult.data, [
      'subject',
      'notes',
      'terms',
      'items',
    ]);
    
    // Explicitly sanitize item descriptions to ensure XSS prevention
    if (sanitizedData.items && Array.isArray(sanitizedData.items)) {
      sanitizedData.items = sanitizedData.items.map((item: any) => ({
        ...item,
        description: item.description ? sanitizeText(item.description) : item.description,
      }));
    }
    
    // Ensure subject is preserved (sanitizeObject already sanitized it, but ensure it's in the update)
    // This handles the case where subject might be explicitly set to empty string or null
    if ('subject' in validationResult.data) {
      sanitizedData.subject = validationResult.data.subject !== undefined 
        ? (validationResult.data.subject ? sanitizeText(validationResult.data.subject) : null)
        : undefined;
    }

    // Update quotation
    const quotation = await updateQuotation(
      id,
      sanitizedData,
      userData.organization_id
    );

    return NextResponse.json({ quotation }, { status: 200 });
  } catch (error) {
    console.error(`Error in PATCH /api/quotations/${params.id}:`, error);
    
    if (error instanceof Error && error.message === 'Quotation not found') {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update quotation' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quotations/[id]
 * Delete a quotation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData, error: orgError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (orgError || !userData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if the quotation exists and if it's been converted to an invoice
    const existingQuotation = await getQuotationById(id, userData.organization_id);
    
    if (!existingQuotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Allow deletion of all quotations, including invoiced ones
    // (Removed restriction on invoiced quotations)

    // Delete quotation
    await deleteQuotation(id, userData.organization_id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`Error in DELETE /api/quotations/${params.id}:`, error);
    
    if (error instanceof Error && error.message === 'Quotation not found') {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete quotation' },
      { status: 500 }
    );
  }
}

