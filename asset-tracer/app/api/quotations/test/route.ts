import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type DiagnosticCheck = {
  name: string;
  status: string;
  error?: string | null;
  hint?: string | null;
  code?: string | null;
  details?: string | null;
  data?: Record<string, unknown>;
};

type DiagnosticResult = {
  timestamp: string;
  checks: DiagnosticCheck[];
  summary?: string;
  error?: string;
};

/**
 * GET /api/quotations/test
 * Test endpoint to diagnose quotations issues
 */
export async function GET() {
  const results: DiagnosticResult = {
    timestamp: new Date().toISOString(),
    checks: [],
  };

  try {
    const supabase = await createClient();

    // Check 1: User session
    results.checks.push({ name: '1. User Session', status: 'checking...' });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      results.checks[0].status = '❌ FAILED';
      results.checks[0].error = userError?.message || 'No user found';
      return NextResponse.json(results, { status: 200 });
    }
    
    results.checks[0].status = '✅ PASSED';
    results.checks[0].data = { userId: user.id, email: user.email };

    // Check 2: User in users table
    results.checks.push({ name: '2. User in users table', status: 'checking...' });
    const { data: userData, error: userTableError } = await supabase
      .from('users')
      .select('id, organization_id, email')
      .eq('id', user.id)
      .single();

    if (userTableError || !userData) {
      results.checks[1].status = '❌ FAILED';
      results.checks[1].error = userTableError?.message || 'User not found in users table';
      return NextResponse.json(results, { status: 200 });
    }

    results.checks[1].status = '✅ PASSED';
    results.checks[1].data = userData;

    // Check 3: Organization exists
    results.checks.push({ name: '3. Organization exists', status: 'checking...' });
    if (!userData.organization_id) {
      results.checks[2].status = '❌ FAILED';
      results.checks[2].error = 'No organization_id for user';
      return NextResponse.json(results, { status: 200 });
    }

    results.checks[2].status = '✅ PASSED';
    results.checks[2].data = { organizationId: userData.organization_id };

    // Check 4: Quotations table exists
    results.checks.push({ name: '4. Quotations table exists', status: 'checking...' });
    const { error: quotationsError } = await supabase
      .from('quotations')
      .select('count')
      .eq('organization_id', userData.organization_id)
      .limit(0);

    if (quotationsError) {
      results.checks[3].status = '❌ FAILED';
      results.checks[3].error = quotationsError.message;
      results.checks[3].hint = quotationsError.hint;
      results.checks[3].code = quotationsError.code;
      return NextResponse.json(results, { status: 200 });
    }

    results.checks[3].status = '✅ PASSED';

    // Check 5: Can fetch quotations
    results.checks.push({ name: '5. Fetch quotations', status: 'checking...' });
    const { data: quotations, error: fetchError } = await supabase
      .from('quotations')
      .select('*')
      .eq('organization_id', userData.organization_id);

    if (fetchError) {
      results.checks[4].status = '❌ FAILED';
      results.checks[4].error = fetchError.message;
      results.checks[4].details = fetchError.details;
      results.checks[4].hint = fetchError.hint;
      return NextResponse.json(results, { status: 200 });
    }

    results.checks[4].status = '✅ PASSED';
    results.checks[4].data = { count: quotations?.length || 0 };

    // Check 6: Clients table exists
    results.checks.push({ name: '6. Clients table exists', status: 'checking...' });
    const { error: clientsError } = await supabase
      .from('clients')
      .select('count')
      .eq('organization_id', userData.organization_id)
      .limit(0);

    if (clientsError) {
      results.checks[5].status = '❌ FAILED';
      results.checks[5].error = clientsError.message;
      return NextResponse.json(results, { status: 200 });
    }

    results.checks[5].status = '✅ PASSED';

    results.summary = '✅ ALL CHECKS PASSED - Quotations should work!';
    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    results.error = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(results, { status: 200 });
  }
}

