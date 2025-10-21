import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getQuotations, createQuotation } from '@/lib/db/quotations';
import { z } from 'zod';

// Validation schema for quotation items
const QuotationItemSchema = z.object({
  asset_id: z.string().uuid().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit_price: z.number().min(0, 'Unit price must be non-negative'),
  tax_rate: z.number().min(0).max(100, 'Tax rate must be between 0 and 100'),
});

// Validation schema for creating a quotation
const CreateQuotationSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  subject: z.string().optional(),
  issue_date: z.string().min(1, 'Issue date is required'),
  valid_until: z.string().min(1, 'Valid until date is required'),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired', 'invoiced']).optional(),
  currency: z.string().min(1, 'Currency is required'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(QuotationItemSchema).min(1, 'At least one item is required'),
});

/**
 * GET /api/quotations
 * Get all quotations for the organization
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/quotations - Starting');
    const supabase = await createClient();

    // Get user session
    console.log('🔍 Fetching user session...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ User error:', userError);
      return NextResponse.json({ error: 'Unauthorized', details: userError.message }, { status: 401 });
    }
    
    if (!user) {
      console.error('❌ No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('✅ User found:', user.id, user.email);

    // Get user's organization
    console.log('🔍 Fetching user organization...');
    const { data: userData, error: orgError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (orgError) {
      console.error('❌ Organization lookup error:', {
        message: orgError.message,
        details: orgError.details,
        hint: orgError.hint,
        code: orgError.code
      });
      return NextResponse.json({ 
        error: 'Failed to fetch user organization', 
        details: orgError.message 
      }, { status: 500 });
    }
    
    if (!userData?.organization_id) {
      console.error('❌ No organization_id found for user');
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    
    console.log('✅ Organization found:', userData.organization_id);

    // Fetch quotations
    console.log('🔍 Fetching quotations for organization:', userData.organization_id);
    const quotations = await getQuotations(userData.organization_id);
    
    console.log('✅ Quotations fetched:', quotations.length);

    return NextResponse.json({ quotations }, { status: 200 });
  } catch (error) {
    console.error('❌ Error in GET /api/quotations:', error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch quotations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quotations
 * Create a new quotation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = CreateQuotationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Check subscription limits - free plan: 5 quotations per month
    const { data: organization } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', userData.organization_id)
      .single();

    const subscriptionTier = organization?.subscription_tier || 'free';
    
    // Count quotations created this month for free tier
    if (subscriptionTier === 'free') {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data: monthlyQuotations, error: countError } = await supabase
        .from('quotations')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', userData.organization_id)
        .gte('created_at', firstDayOfMonth.toISOString());

      if (countError) {
        console.error('Error counting monthly quotations:', countError);
      }

      const currentMonthCount = monthlyQuotations?.length || 0;
      const maxAllowed = 5;

      if (currentMonthCount >= maxAllowed) {
        return NextResponse.json(
          { 
            error: 'Monthly quotation limit reached',
            message: `Free plan allows ${maxAllowed} quotations per month. You've created ${currentMonthCount} this month. Upgrade to Pro for unlimited quotations.`
          },
          { status: 403 }
        );
      }
    }

    // Create quotation
    const quotation = await createQuotation(
      validationResult.data,
      userData.organization_id,
      user.id
    );

    return NextResponse.json({ quotation }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/quotations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create quotation' },
      { status: 500 }
    );
  }
}

