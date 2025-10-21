import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getExpenses, createExpense } from '@/lib/db/expenses';

// Validation schema for creating an expense
const createExpenseSchema = z.object({
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
  currency: z.string().default('USD'),
  expense_date: z.string(),
  vendor: z.string().min(1),
  description: z.string().min(1),
  reference_number: z.string().nullable().optional(),
  payment_method: z
    .enum(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'other'])
    .nullable()
    .optional(),
  asset_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  is_tax_deductible: z.boolean().default(false),
  is_recurring: z.boolean().default(false),
  recurring_frequency: z.enum(['monthly', 'quarterly', 'yearly']).nullable().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'paid']).default('pending'),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  receipt_url: z.string().url().nullable().optional(),
});

/**
 * GET /api/expenses
 * Fetch all expenses for the current user's organization
 * Query params: asset_id (optional) - filter by asset
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const assetId = searchParams.get('asset_id');

    // If filtering by asset_id, use direct query instead of helper
    if (assetId) {
      const { data: expenses, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .eq('organization_id', userData.organization_id)
        .eq('asset_id', assetId)
        .order('expense_date', { ascending: false });

      if (fetchError) {
        console.error('Error fetching expenses:', fetchError);
        return NextResponse.json(
          { error: 'Failed to fetch expenses' },
          { status: 500 }
        );
      }

      return NextResponse.json(expenses, { status: 200 });
    }

    // Otherwise fetch all expenses
    const expenses = await getExpenses(userData.organization_id);

    return NextResponse.json(expenses, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/expenses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/expenses
 * Create a new expense
 */
export async function POST(request: Request) {
  try {
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

    // Get organization's default currency
    const { data: orgData } = await supabase
      .from('organizations')
      .select('default_currency')
      .eq('id', userData.organization_id)
      .single();

    const defaultCurrency = orgData?.default_currency || 'USD';

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createExpenseSchema.parse(body);

    // Use organization's currency if not provided in request
    if (!validatedData.currency) {
      validatedData.currency = defaultCurrency;
    }

    // Create expense
    const expense = await createExpense(
      validatedData,
      userData.organization_id,
      user.id
    );

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/expenses:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

