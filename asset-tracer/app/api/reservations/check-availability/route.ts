import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAssetAvailability } from '@/lib/db/reservations';
import { z } from 'zod';
import type { CheckAvailabilityInput } from '@/types/reservation';

/**
 * Zod schema for validating availability check input
 */
const checkAvailabilitySchema = z.object({
  asset_ids: z.array(z.string().uuid()).min(1, 'At least one asset ID is required'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  exclude_reservation_id: z.string().uuid().nullable().optional(),
});

/**
 * POST /api/reservations/check-availability
 * Check if assets are available for a given date range
 */
export async function POST(request: NextRequest) {
  try {
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
    const validationResult = checkAvailabilitySchema.safeParse(body);

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

    // Get user's organization_id
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (profileError || !userProfile?.organization_id) {
      const organizationId = session.user.user_metadata?.organization_id;
      if (!organizationId) {
        return NextResponse.json(
          { error: 'User is not associated with an organization.' },
          { status: 403 }
        );
      }

      const availability = await checkAssetAvailability(
        validated.asset_ids,
        validated.start_date,
        validated.end_date,
        organizationId,
        validated.exclude_reservation_id || null
      );

      // Also fetch asset names for better response
      const { data: assets } = await supabase
        .from('assets')
        .select('id, name')
        .in('id', validated.asset_ids);

      const assetMap = new Map(
        (assets && Array.isArray(assets)) 
          ? assets.map(a => [a.id, a.name]).filter(([id]) => id) 
          : []
      );

      // Ensure availability is an array
      const availabilityArray = Array.isArray(availability) ? availability : [];
      const results = availabilityArray
        .filter((item) => item && item.asset_id) // Filter out any undefined/null items
        .map((item) => ({
          asset_id: item.asset_id,
          asset_name: assetMap.get(item.asset_id) || 'Unknown Asset',
          is_available: item.is_available ?? false,
          conflicts: Array.isArray(item.conflicts) ? item.conflicts : [],
        }));

      return NextResponse.json({ availability: results }, { status: 200 });
    }

    const availability = await checkAssetAvailability(
      validated.asset_ids,
      validated.start_date,
      validated.end_date,
      userProfile.organization_id,
      validated.exclude_reservation_id || null
    );

    // Also fetch asset names for better response
    const { data: assets } = await supabase
      .from('assets')
      .select('id, name')
      .in('id', validated.asset_ids);

    const assetMap = new Map(
      (assets && Array.isArray(assets)) 
        ? assets.map(a => [a.id, a.name]).filter(([id]) => id) 
        : []
    );

    // Ensure availability is an array
    const availabilityArray = Array.isArray(availability) ? availability : [];
    const results = availabilityArray
      .filter((item) => item && item.asset_id) // Filter out any undefined/null items
      .map((item) => ({
        asset_id: item.asset_id,
        asset_name: assetMap.get(item.asset_id) || 'Unknown Asset',
        is_available: item.is_available ?? false,
        conflicts: Array.isArray(item.conflicts) ? item.conflicts : [],
      }));

    return NextResponse.json({ availability: results }, { status: 200 });
  } catch (error) {
    console.error('Error in POST /api/reservations/check-availability:', error);
    const message = error instanceof Error ? error.message : 'Failed to check availability';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

