import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAssetKits, createAssetKit } from '@/lib/db';
import { z } from 'zod';

/**
 * Zod schema for validating asset kit creation input
 */
const createAssetKitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  asset_ids: z
    .array(
      z.object({
        asset_id: z.string().uuid('Asset ID must be a valid UUID'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
      })
    )
    .min(1, 'At least one asset is required'),
});

/**
 * GET /api/asset-kits
 * Fetch all asset kits for the authenticated user's organization
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found. Please complete your profile.' },
        { status: 403 }
      );
    }

    const kits = await getAssetKits(userProfile.organization_id);

    return NextResponse.json({ kits }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/asset-kits:', error);
    
    // Check if it's a table not found error
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch asset kits';
    if (errorMessage.includes('schema cache') || errorMessage.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'Asset kits tables not found',
          message: 'Please run the database migration script to create the asset_kits and asset_kit_items tables.',
          details: errorMessage
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch asset kits',
        message: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/asset-kits
 * Create a new asset kit
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found. Please complete your profile.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createAssetKitSchema.parse(body);

    // Verify all assets belong to the organization
    const assetIds = validatedData.asset_ids.map((item) => item.asset_id);
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('id')
      .in('id', assetIds)
      .eq('organization_id', userProfile.organization_id);

    if (assetsError) {
      return NextResponse.json(
        { error: 'Failed to verify assets' },
        { status: 500 }
      );
    }

    if (!assets || assets.length !== assetIds.length) {
      return NextResponse.json(
        { error: 'One or more assets not found or access denied' },
        { status: 400 }
      );
    }

    const kit = await createAssetKit(
      validatedData,
      userProfile.organization_id,
      user.id
    );

    return NextResponse.json({ kit }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/asset-kits:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create asset kit' },
      { status: 500 }
    );
  }
}

