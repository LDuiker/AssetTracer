import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getQuotations, createQuotation } from '@/lib/db/quotations';
import { z } from 'zod';
import { handleApiError } from '@/lib/utils/error-handler';
import { sanitizeObject, sanitizeText } from '@/lib/utils/sanitize';

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
export async function GET() {
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
    return handleApiError(error, 'fetch quotations');
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

    // Log user email for debugging
    console.log(`[Quotation Creation] User: ${user.email}, User ID: ${user.id}`);

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

    const validated = validationResult.data;

    // Sanitize subject separately first to avoid double-processing issues
    const originalSubject = validated.subject;
    const sanitizedSubject = originalSubject !== undefined && originalSubject !== null && originalSubject !== ''
      ? sanitizeText(originalSubject)
      : (originalSubject === null ? null : (originalSubject === '' ? '' : undefined));
    
    // Create sanitized data, but exclude subject from sanitizeObject to avoid double processing
    const dataWithoutSubject = { ...validated };
    delete dataWithoutSubject.subject;
    
    const quotationData = sanitizeObject(dataWithoutSubject, [
      'notes',
      'terms',
      'items', // Will sanitize description in items
    ]);
    
    // Add the separately sanitized subject back
    if ('subject' in validated) {
      quotationData.subject = sanitizedSubject;
    }
    
    // Explicitly sanitize item descriptions to ensure XSS prevention
    if (quotationData.items && Array.isArray(quotationData.items)) {
      quotationData.items = quotationData.items.map((item: any) => ({
        ...item,
        description: item.description ? sanitizeText(item.description) : item.description,
      }));
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
      // Create first day of current month in UTC to avoid timezone issues
      const now = new Date();
      const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      // Format as ISO string without milliseconds for better compatibility with Supabase
      const firstDayISO = firstDayOfMonth.toISOString().split('.')[0] + 'Z';
      
      // Use a more reliable method: fetch actual quotations and count them
      // This ensures we get the exact count regardless of count query issues
      const { data: monthlyQuotations, error: fetchError } = await supabase
        .from('quotations')
        .select('id, created_at')
        .eq('organization_id', userData.organization_id)
        .gte('created_at', firstDayISO);
      
      // Also try the count query for comparison
      const { count, error: countError } = await supabase
        .from('quotations')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', userData.organization_id)
        .gte('created_at', firstDayISO);

      // Log the raw response for debugging
      console.log(`[Quotation Count Query] Raw response:`, {
        countFromQuery: count,
        countFromFetch: monthlyQuotations?.length || 0,
        error: countError || fetchError,
        firstDayOfMonth: firstDayISO,
        firstDayOfMonthFull: firstDayOfMonth.toISOString(),
        currentTimeUTC: new Date().toISOString(),
      });

      if (fetchError) {
        console.error('Error fetching monthly quotations:', fetchError);
        // If fetch fails, be safe and block creation
        return NextResponse.json(
          { 
            error: 'Unable to verify subscription limits',
            message: 'Please try again or contact support if the issue persists.'
          },
          { status: 500 }
        );
      }

      // Use the actual fetched count as the source of truth
      // This is more reliable than the count query which can have issues
      const verifiedCount = monthlyQuotations?.length || 0;
      
      // Log detailed verification
      console.log(`[Quotation Count Verification] Count from query: ${count}, Count from fetch: ${verifiedCount}`, {
        quotationIds: monthlyQuotations?.map(q => q.id),
        quotationDates: monthlyQuotations?.map(q => q.created_at),
        discrepancy: count !== verifiedCount ? `⚠️ MISMATCH: Query says ${count}, Fetch says ${verifiedCount}` : '✅ Counts match',
      });
      const maxAllowed = 5;

      console.log(`[Quotation Limit Check] User: ${user.email}, Organization: ${userData.organization_id}, Subscription tier: ${subscriptionTier}, Current count (verified): ${verifiedCount}, Max allowed: ${maxAllowed}, First day of month (UTC): ${firstDayISO}, Current time (UTC): ${new Date().toISOString()}`);

      // Block if current count is already at or above the limit
      // If verifiedCount is 5, we already have 5 quotations, so block the 6th
      // Use > instead of >= to ensure we block at exactly the limit
      if (verifiedCount >= maxAllowed) {
        console.log(`[Quotation Limit Check] BLOCKED - Count ${verifiedCount} >= Limit ${maxAllowed}`);
        return NextResponse.json(
          { 
            error: 'Monthly quotation limit reached',
            message: `Free plan allows ${maxAllowed} quotations per month. You've created ${verifiedCount} this month. Upgrade to Pro for unlimited quotations.`
          },
          { status: 403 }
        );
      }

      console.log(`[Quotation Limit Check] ALLOWED - Count ${verifiedCount} < Limit ${maxAllowed} (will allow creation of ${verifiedCount + 1}th quotation)`);
    }

    // Create quotation
    const quotation = await createQuotation(
      quotationData,
      userData.organization_id,
      user.id
    );

        return NextResponse.json({ quotation }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'create quotation');
  }
}

