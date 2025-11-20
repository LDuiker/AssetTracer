import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAssets, createAsset } from '@/lib/db';
import { z } from 'zod';
import type { CreateAssetInput } from '@/types';
import { handleCorsPreflight, withCors } from '@/lib/utils/cors';

/**
 * Zod schema for validating asset creation input
 */
const createAssetSchema = z
  .object({
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
  quantity: z
    .coerce
    .number()
    .int()
    .min(1, 'Quantity must be at least 1')
    .optional()
    .default(1),
  parent_group_id: z
    .string()
    .uuid('Parent group must be a valid UUID')
    .optional()
    .nullable(),
  image_url: z.string().url().nullable().optional(),
})
  .refine(
    (data) =>
      data.asset_type === 'group' ? data.quantity !== undefined && data.quantity >= 1 : true,
    {
      path: ['quantity'],
      message: 'Group assets must have a quantity of at least 1',
    }
  );

/**
 * OPTIONS /api/assets
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request);
}

/**
 * GET /api/assets
 * Fetch all assets for the authenticated user's organization
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      const response = NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
      return withCors(request, response);
    }

    // Get user's organization_id from user metadata or profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.organization_id) {
      console.error('Error fetching user profile:', profileError);
      const organizationId = user.user_metadata?.organization_id;
      
      if (!organizationId) {
        const response = NextResponse.json(
          { error: 'User is not associated with an organization.' },
          { status: 403 }
        );
        return withCors(request, response);
      }
      
      const assets = await getAssets(organizationId);
      const response = NextResponse.json({ assets }, { status: 200 });
      return withCors(request, response);
    }

    // Fetch assets for the user's organization
    const assets = await getAssets(userProfile.organization_id);

    const response = NextResponse.json({ assets }, { status: 200 });
    return withCors(request, response);
  } catch (error) {
    console.error('Error in GET /api/assets:', error);
    const response = NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
    return withCors(request, response);
  }
}

/**
 * POST /api/assets
 * Create a new asset for the authenticated user's organization
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      const response = NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
      return withCors(request, response);
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

      const response = NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
      return withCors(request, response);
    }

    const validated = validationResult.data;

    // Sanitize user-generated text fields to prevent XSS
    const sanitized = sanitizeObject(validated, [
      'name',
      'description',
      'category',
      'location',
      'serial_number',
    ]);

    const assetData: CreateAssetInput = {
      ...sanitized,
      purchase_date: sanitized.purchase_date ? sanitized.purchase_date : null,
      quantity:
        sanitized.asset_type === 'group'
          ? sanitized.quantity ?? 1
          : 1,
      parent_group_id:
        sanitized.asset_type === 'group'
          ? sanitized.parent_group_id ?? null
          : null,
      image_url: sanitized.image_url ?? null,
    };

    // Get user's organization_id from user metadata or profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.organization_id) {
      console.error('Error fetching user profile:', profileError);
      const organizationId = user.user_metadata?.organization_id;
      
      if (!organizationId) {
        const response = NextResponse.json(
          { error: 'User is not associated with an organization.' },
          { status: 403 }
        );
        return withCors(request, response);
      }
      
      const newAsset = await createAsset(
        assetData,
        organizationId,
        user.id
      );

      const response = NextResponse.json({ asset: newAsset }, { status: 201 });
      return withCors(request, response);
    }

    // Create the asset
    const newAsset = await createAsset(
      assetData,
      userProfile.organization_id,
      user.id
    );

    const response = NextResponse.json({ asset: newAsset }, { status: 201 });
    return withCors(request, response);
  } catch (error) {
    console.error('Error in POST /api/assets:', error);
    
    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('Failed to create asset')) {
        const response = NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
        return withCors(request, response);
      }
    }

    const response = NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
    return withCors(request, response);
  }
}

