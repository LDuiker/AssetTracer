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
    } else if (assetId) {
      // If assetId provided but no transactions found, log a warning
      console.warn('[Transactions API] ⚠️ No transactions found for asset_id:', assetId);
      console.warn('[Transactions API] ⚠️ Organization ID:', organizationId);
      
      // Check if asset exists and belongs to organization
      const { data: assetCheck } = await supabase
        .from('assets')
        .select('id, name, organization_id')
        .eq('id', assetId)
        .eq('organization_id', organizationId)
        .single();
      
      console.log('[Transactions API] Asset check:', assetCheck);
      
      // Check if transactions exist for this asset but wrong organization
      const { data: wrongOrgTransactions } = await supabase
        .from('transactions')
        .select('id, asset_id, organization_id, amount')
        .eq('asset_id', assetId)
        .eq('type', 'income')
        .limit(5);
      
      console.log('[Transactions API] Transactions with this asset_id (any org):', wrongOrgTransactions);
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

