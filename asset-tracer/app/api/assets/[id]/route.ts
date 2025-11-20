import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAssetById, updateAsset, deleteAsset } from '@/lib/db';
import { z } from 'zod';
import type { UpdateAssetInput } from '@/types';
import { sanitizeText } from '@/lib/utils/sanitize';

/**
 * Zod schema for validating asset update input
 */
const updateAssetSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    description: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    purchase_date: z.string().optional().nullable(),
    purchase_cost: z.coerce.number().min(0, 'Purchase cost must be at least 0').optional(),
    current_value: z.coerce.number().min(0, 'Current value must be at least 0').optional(),
    status: z.enum(['active', 'maintenance', 'retired', 'sold']).optional(),
    location: z.string().optional().nullable(),
    serial_number: z.string().optional().nullable(),
    asset_type: z.enum(['individual', 'group']).optional(),
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').optional(),
    parent_group_id: z
      .string()
      .uuid('Parent group must be a valid UUID')
      .nullable()
      .optional(),
    image_url: z.string().url().nullable().optional(),
  })
  .refine(
    (data) =>
      data.asset_type !== 'group' ||
      data.quantity === undefined ||
      data.quantity >= 1,
    {
      path: ['quantity'],
      message: 'Group assets must have a quantity of at least 1',
    }
  );

/**
 * Helper function to get organization ID from user session
 */
async function getOrganizationId(userId: string) {
  const supabase = await createClient();
  
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    // Fallback to user metadata
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.organization_id || null;
  }

  return userProfile?.organization_id || null;
}

/**
 * GET /api/assets/[id]
 * Fetch a single asset by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Get organization ID
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with an organization.' },
        { status: 403 }
      );
    }

    // Fetch the asset
    const asset = await getAssetById(id, organizationId);

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found or access denied.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ asset }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/assets/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/assets/[id]
 * Update an existing asset (partial update)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate request body with Zod
    const validationResult = updateAssetSchema.safeParse(body);

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

    // Sanitize user-generated text fields to prevent XSS
    const updateData: UpdateAssetInput = {};

    if (validated.name !== undefined) {
      updateData.name = validated.name ? sanitizeText(validated.name) : validated.name;
    }
    if (validated.description !== undefined) {
      updateData.description = validated.description ? sanitizeText(validated.description) : validated.description;
    }
    if (validated.category !== undefined) {
      updateData.category = validated.category ? sanitizeText(validated.category) : validated.category;
    }
    if (validated.purchase_date !== undefined) {
      updateData.purchase_date = validated.purchase_date === '' ? null : validated.purchase_date;
    }
    if (validated.purchase_cost !== undefined) updateData.purchase_cost = validated.purchase_cost;
    if (validated.current_value !== undefined) updateData.current_value = validated.current_value;
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.location !== undefined) {
      updateData.location = validated.location ? sanitizeText(validated.location) : validated.location;
    }
    if (validated.serial_number !== undefined) {
      updateData.serial_number = validated.serial_number ? sanitizeText(validated.serial_number) : validated.serial_number;
    }
    if (validated.asset_type !== undefined) updateData.asset_type = validated.asset_type;

    if (validated.quantity !== undefined || validated.asset_type !== undefined) {
      const assetType = validated.asset_type;
      if (assetType === 'group') {
        updateData.quantity = validated.quantity ?? 1;
      } else if (assetType === 'individual') {
        updateData.quantity = 1;
      } else if (validated.quantity !== undefined) {
        updateData.quantity = validated.quantity;
      }
    }

    if (validated.parent_group_id !== undefined || validated.asset_type !== undefined) {
      const assetType = validated.asset_type;
      if (assetType === 'group') {
        updateData.parent_group_id = validated.parent_group_id ?? null;
      } else if (assetType === 'individual') {
        updateData.parent_group_id = null;
      } else if (validated.parent_group_id !== undefined) {
        updateData.parent_group_id = validated.parent_group_id;
      }
    }

    if (validated.image_url !== undefined) {
      updateData.image_url = validated.image_url ?? null;
    }

    // Get organization ID
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with an organization.' },
        { status: 403 }
      );
    }

    // Update the asset
    const updatedAsset = await updateAsset(id, updateData, organizationId);

    return NextResponse.json({ asset: updatedAsset }, { status: 200 });
  } catch (error) {
    console.error('Error in PATCH /api/assets/[id]:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Asset not found or access denied.' },
          { status: 404 }
        );
      }
      if (error.message.includes('access denied')) {
        return NextResponse.json(
          { error: 'You do not have permission to update this asset.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/assets/[id]
 * Delete an asset
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // Get organization ID
    const organizationId = await getOrganizationId(user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with an organization.' },
        { status: 403 }
      );
    }

    // Delete the asset
    await deleteAsset(id, organizationId);

    return NextResponse.json(
      { message: 'Asset deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/assets/[id]:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Asset not found or access denied.' },
          { status: 404 }
        );
      }
      if (error.message.includes('access denied')) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this asset.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

