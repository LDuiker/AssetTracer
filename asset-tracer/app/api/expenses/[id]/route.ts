import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getExpenseById, updateExpense, deleteExpense } from '@/lib/db/expenses';

// Validation schema for updating an expense (partial)
const updateExpenseSchema = z
  .object({
    category: z.enum([
      'maintenance',
      'repair',
      'supplies',
      'utilities',
      'insurance',
      'fuel',
      'other',
    ]),
    amount: z.number().positive(),
    currency: z.string(),
    expense_date: z.string(),
    vendor: z.string().min(1),
    description: z.string().min(1),
    reference_number: z.string().nullable(),
    payment_method: z
      .enum(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other'])
      .nullable(),
    asset_id: z.string().uuid().nullable(),
    project_id: z.string().uuid().nullable(),
    is_tax_deductible: z.boolean(),
    is_recurring: z.boolean(),
    recurring_frequency: z.enum(['monthly', 'quarterly', 'yearly']).nullable(),
    status: z.enum(['pending', 'approved', 'rejected', 'paid']),
    notes: z.string().nullable(),
    tags: z.array(z.string()).nullable(),
    receipt_url: z.string().url().nullable(),
  })
  .partial();

/**
 * GET /api/expenses/[id]
 * Fetch a single expense by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const expense = await getExpenseById(id, userData.organization_id);

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(expense, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/expenses/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/expenses/[id]
 * Update an existing expense
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateExpenseSchema.parse(body);

    // Update expense
    const expense = await updateExpense(id, validatedData, userData.organization_id);

    return NextResponse.json(expense, { status: 200 });
  } catch (error) {
    console.error('Error in PATCH /api/expenses/[id]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/expenses/[id]
 * Delete an expense
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Delete expense
    await deleteExpense(id, userData.organization_id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/expenses/[id]:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

