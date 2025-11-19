import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAssetKitById, updateAssetKit, deleteAssetKit } from '@/lib/db';
import { z } from 'zod';

/**
 * Zod schema for validating asset kit update input
 */
const updateAssetKitSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  asset_ids: z
    .array(
      z.object({
        asset_id: z.string().uuid('Asset ID must be a valid UUID'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
      })
    )
    .optional(),
});

/**
 * GET /api/asset-kits/[id]
 * Fetch a single asset kit by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (profileError || !userProfile?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found. Please complete your profile.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const kit = await getAssetKitById(id, userProfile.organization_id);

    if (!kit) {
      return NextResponse.json({ error: 'Asset kit not found' }, { status: 404 });
    }

    return NextResponse.json({ kit }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/asset-kits/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch asset kit' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/asset-kits/[id]
 * Update an existing asset kit
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (profileError || !userProfile?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found. Please complete your profile.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateAssetKitSchema.parse(body);

    // If asset_ids are being updated, verify they belong to the organization
    if (validatedData.asset_ids !== undefined) {
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
    }

    const kit = await updateAssetKit(id, validatedData, userProfile.organization_id);

    return NextResponse.json({ kit }, { status: 200 });
  } catch (error) {
    console.error('Error in PATCH /api/asset-kits/[id]:', error);

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
      { error: error instanceof Error ? error.message : 'Failed to update asset kit' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/asset-kits/[id]
 * Delete an asset kit
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (profileError || !userProfile?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found. Please complete your profile.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    await deleteAssetKit(id, userProfile.organization_id);

    return NextResponse.json({ message: 'Asset kit deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/asset-kits/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete asset kit' },
      { status: 500 }
    );
  }
}

