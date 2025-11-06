import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('[Transactions API] Auth error:', authError);
      return NextResponse.json(
        { error: `Authentication error: ${authError.message}` },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.error('[Transactions API] No user found');
      return NextResponse.json(
        { error: 'Unauthorized - No user session' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('[Transactions API] User fetch error:', userError);
      return NextResponse.json(
        { error: `Failed to fetch user: ${userError.message}` },
        { status: 500 }
      );
    }
    
    if (!userData?.organization_id) {
      console.error('[Transactions API] No organization_id for user:', user.id);
      return NextResponse.json(
        { error: 'Organization not found for user' },
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
      // Also verify the asset belongs to this organization
      const { data: assetCheck } = await supabase
        .from('assets')
        .select('id, organization_id')
        .eq('id', assetId)
        .eq('organization_id', organizationId)
        .single();
      
      if (!assetCheck) {
        console.warn('[Transactions API] ⚠️ Asset not found or belongs to different organization');
        return NextResponse.json([]);
      }
      
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
      
      // Also check if transactions exist but asset_id is NULL
      const { data: nullAssetTransactions } = await supabase
        .from('transactions')
        .select('id, invoice_id, organization_id, amount')
        .eq('organization_id', organizationId)
        .eq('type', 'income')
        .is('asset_id', null)
        .limit(5);
      
      console.log('[Transactions API] Transactions without asset_id (same org):', nullAssetTransactions);
    }

    return NextResponse.json(transactions || []);
  } catch (error) {
    console.error('[Transactions API] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[Transactions API] Error stack:', errorStack);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

