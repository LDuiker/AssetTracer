import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAssets, createAsset } from '@/lib/db';
import { z } from 'zod';
import type { CreateAssetInput } from '@/types';

/**
 * Zod schema for validating asset creation input
 */
const createAssetSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  purchase_date: z.string().optional().nullable(),
  purchase_cost: z.coerce.number().min(0, 'Purchase cost must be at least 0'),
  current_value: z.coerce.number().min(0, 'Current value must be at least 0'),
  status: z.enum(['active', 'maintenance', 'retired', 'sold']),
  location: z.string().optional().nullable(),
  serial_number: z.string().optional().nullable(),
  asset_type: z
    .enum(['individual', 'group'])
    .optional()
    .default('individual'),
  quantity: z.coerce.number().int().min(1).optional().default(1),
  parent_group_id: z.string().uuid().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
});

/**
 * GET /api/assets
 * Fetch all assets for the authenticated user's organization
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user session
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Get user's organization_id from user metadata or profile
    // For now, we'll use a placeholder - you'll need to implement this based on your user schema
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (profileError || !userProfile?.organization_id) {
      console.error('Error fetching user profile:', profileError);
      const organizationId = session.user.user_metadata?.organization_id;
      
      if (!organizationId) {
        return NextResponse.json(
          { error: 'User is not associated with an organization.' },
          { status: 403 }
        );
      }
      
      const assets = await getAssets(organizationId);
      return NextResponse.json({ assets }, { status: 200 });
    }

    // Fetch assets for the user's organization
    const assets = await getAssets(userProfile.organization_id);

    return NextResponse.json({ assets }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/assets:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/assets
 * Create a new asset for the authenticated user's organization
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user session
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request body with Zod
    const validationResult = createAssetSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const validated = validationResult.data;

    const assetData: CreateAssetInput = {
      ...validated,
      purchase_date: validated.purchase_date ? validated.purchase_date : null,
      quantity:
        validated.asset_type === 'group'
          ? validated.quantity ?? 1
          : 1,
      parent_group_id:
        validated.asset_type === 'group'
          ? validated.parent_group_id ?? null
          : null,
      image_url: validated.image_url ?? null,
    };

    // Get user's organization_id from user metadata or profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (profileError || !userProfile?.organization_id) {
      console.error('Error fetching user profile:', profileError);
      const organizationId = session.user.user_metadata?.organization_id;
      
      if (!organizationId) {
        return NextResponse.json(
          { error: 'User is not associated with an organization.' },
          { status: 403 }
        );
      }
      
      const newAsset = await createAsset(
        assetData,
        organizationId,
        session.user.id
      );

      return NextResponse.json({ asset: newAsset }, { status: 201 });
    }

    // Create the asset
    const newAsset = await createAsset(
      assetData,
      userProfile.organization_id,
      session.user.id
    );

    return NextResponse.json({ asset: newAsset }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/assets:', error);
    
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('Failed to create asset')) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

