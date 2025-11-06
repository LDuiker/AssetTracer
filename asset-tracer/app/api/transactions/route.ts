import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    const organizationId = userData.organization_id;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const assetId = searchParams.get('asset_id');

    // Build query
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('transaction_date', { ascending: false });

    // Filter by asset if provided
    if (assetId) {
      query = query.eq('asset_id', assetId);
    }

    const { data: transactions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching transactions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    // Debug logging
    console.log('[Transactions API] Asset ID:', assetId);
    console.log('[Transactions API] Organization ID:', organizationId);
    console.log('[Transactions API] Transaction count:', transactions?.length || 0);
    if (transactions && transactions.length > 0) {
      console.log('[Transactions API] Sample transaction:', JSON.stringify(transactions[0], null, 2));
      console.log('[Transactions API] Income transactions:', transactions.filter(t => t.type === 'income').length);
    }

    return NextResponse.json(transactions || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

