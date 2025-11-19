import { createClient } from '@/lib/supabase/server';
import type { Reservation, ReservationAsset, CreateReservationInput, UpdateReservationInput } from '@/types/reservation';

/**
 * Fetch all reservations for an organization
 */
export async function getReservations(organizationId: string): Promise<Reservation[]> {
  try {
    const supabase = await createClient();

    const { data: reservations, error } = await supabase
      .from('reservations')
      .select(`
        *,
        reserved_by_user:users!reservations_reserved_by_fkey(id, name, email)
      `)
      .eq('organization_id', organizationId)
      .order('start_date', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reservations:', error);
      throw new Error(`Failed to fetch reservations: ${error.message}`);
    }

    if (!reservations || reservations.length === 0) {
      return [];
    }

    // Fetch assets for all reservations
    const reservationIds = reservations.map((r) => r.id);
    const { data: reservationAssets, error: assetsError } = await supabase
      .from('reservation_assets')
      .select(`
        *,
        asset:assets(id, name, category, status, location)
      `)
      .in('reservation_id', reservationIds)
      .order('created_at', { ascending: true });

    if (assetsError) {
      console.error('Error fetching reservation assets:', assetsError);
      // Don't throw, just return reservations without assets
    }

    // Group assets by reservation_id
    const assetsByReservation = new Map<string, any[]>();
    if (reservationAssets && Array.isArray(reservationAssets)) {
      reservationAssets.forEach((ra) => {
        if (ra.reservation_id) {
          if (!assetsByReservation.has(ra.reservation_id)) {
            assetsByReservation.set(ra.reservation_id, []);
          }
          assetsByReservation.get(ra.reservation_id)!.push(ra);
        }
      });
    }

    // Attach assets to each reservation
    return reservations.map((reservation) => ({
      ...reservation,
      assets: assetsByReservation.get(reservation.id) || [],
    }));
  } catch (error) {
    console.error('Unexpected error in getReservations:', error);
    throw error;
  }
}

/**
 * Fetch a single reservation by ID with assets
 */
export async function getReservationById(
  id: string,
  organizationId: string
): Promise<Reservation | null> {
  try {
    const supabase = await createClient();

    // Fetch reservation
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        *,
        reserved_by_user:users!reservations_reserved_by_fkey(id, name, email)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (reservationError) {
      if (reservationError.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching reservation:', reservationError);
      throw new Error(`Failed to fetch reservation: ${reservationError.message}`);
    }

    if (!reservation) {
      return null;
    }

    // Fetch reservation assets
    const { data: assets, error: assetsError } = await supabase
      .from('reservation_assets')
      .select(`
        *,
        asset:assets(id, name, category, status, location)
      `)
      .eq('reservation_id', id)
      .order('created_at', { ascending: true });

    if (assetsError) {
      console.error('Error fetching reservation assets:', assetsError);
      // Return reservation with empty assets array
      return {
        ...reservation,
        assets: [],
      };
    }

    // Ensure assets is always an array and filter out any invalid entries
    const reservationAssets = Array.isArray(assets) 
      ? assets.filter((ra: any) => ra && (ra.asset_id || ra.id))
      : [];

    return {
      ...reservation,
      assets: reservationAssets,
    };
  } catch (error) {
    console.error('Unexpected error in getReservationById:', error);
    throw error;
  }
}

/**
 * Create a new reservation with assets
 */
export async function createReservation(
  data: CreateReservationInput,
  organizationId: string,
  userId: string
): Promise<Reservation> {
  try {
    const supabase = await createClient();

    // Create reservation
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert([
        {
          organization_id: organizationId,
          title: data.title,
          project_name: data.project_name || null,
          description: data.description || null,
          start_date: data.start_date,
          end_date: data.end_date,
          start_time: data.start_time || null,
          end_time: data.end_time || null,
          location: data.location || null,
          status: data.status || 'pending',
          reserved_by: userId,
          team_members: data.team_members || null,
          priority: data.priority || 'normal',
          notes: data.notes || null,
        },
      ])
      .select()
      .single();

    if (reservationError) {
      console.error('Error creating reservation:', reservationError);
      throw new Error(`Failed to create reservation: ${reservationError.message}`);
    }

    if (!reservation) {
      throw new Error('Reservation was not created');
    }

    // Add assets to reservation
    if (data.asset_ids && Array.isArray(data.asset_ids) && data.asset_ids.length > 0) {
      const reservationAssets = data.asset_ids
        .filter((assetId) => assetId && typeof assetId === 'string') // Filter out invalid IDs
        .map((assetId) => ({
          reservation_id: reservation.id,
          asset_id: assetId,
          quantity: data.quantities?.[assetId] || 1,
        }));

      const { error: assetsError } = await supabase
        .from('reservation_assets')
        .insert(reservationAssets);

      if (assetsError) {
        console.error('Error adding assets to reservation:', assetsError);
        // Rollback: delete the reservation
        await supabase.from('reservations').delete().eq('id', reservation.id);
        throw new Error(`Failed to add assets to reservation: ${assetsError.message}`);
      }
    }

    // Fetch the complete reservation with assets
    const completeReservation = await getReservationById(reservation.id, organizationId);
    if (!completeReservation) {
      throw new Error('Failed to fetch created reservation');
    }

    return completeReservation;
  } catch (error) {
    console.error('Unexpected error in createReservation:', error);
    throw error;
  }
}

/**
 * Update an existing reservation
 */
export async function updateReservation(
  id: string,
  data: UpdateReservationInput,
  organizationId: string
): Promise<Reservation> {
  try {
    const supabase = await createClient();

    // Verify reservation exists and belongs to organization
    const existingReservation = await getReservationById(id, organizationId);
    if (!existingReservation) {
      throw new Error('Reservation not found or access denied');
    }

    // Update reservation fields
    const updateData: Partial<Reservation> = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.project_name !== undefined) updateData.project_name = data.project_name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.start_date !== undefined) updateData.start_date = data.start_date;
    if (data.end_date !== undefined) updateData.end_date = data.end_date;
    if (data.start_time !== undefined) updateData.start_time = data.start_time;
    if (data.end_time !== undefined) updateData.end_time = data.end_time;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.team_members !== undefined) updateData.team_members = data.team_members;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Only update if there's actual data to update
    if (Object.keys(updateData).length === 0) {
      // No fields to update, just fetch and return the existing reservation
      const existingReservation = await getReservationById(id, organizationId);
      if (!existingReservation) {
        throw new Error('Reservation not found');
      }
      return existingReservation;
    }

    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating reservation:', updateError);
      throw new Error(`Failed to update reservation: ${updateError.message}`);
    }

    if (!updatedReservation) {
      throw new Error('Reservation update returned no data');
    }

    // Update assets if provided
    if (data.asset_ids !== undefined && data.asset_ids !== null) {
      // Delete existing reservation assets
      await supabase
        .from('reservation_assets')
        .delete()
        .eq('reservation_id', id);

      // Insert new reservation assets (only if asset_ids is a non-empty array)
      if (Array.isArray(data.asset_ids) && data.asset_ids.length > 0) {
        const reservationAssets = data.asset_ids
          .filter((assetId) => assetId && typeof assetId === 'string') // Filter out invalid IDs
          .map((assetId) => ({
            reservation_id: id,
            asset_id: assetId,
            quantity: data.quantities?.[assetId] || 1,
          }));

        if (reservationAssets.length > 0) {
          const { error: assetsError } = await supabase
            .from('reservation_assets')
            .insert(reservationAssets);

          if (assetsError) {
            console.error('Error updating reservation assets:', assetsError);
            throw new Error(`Failed to update reservation assets: ${assetsError.message}`);
          }
        }
      }
    }

    // Fetch the complete updated reservation
    const completeReservation = await getReservationById(id, organizationId);
    if (!completeReservation) {
      throw new Error('Failed to fetch updated reservation');
    }

    return completeReservation;
  } catch (error) {
    console.error('Unexpected error in updateReservation:', error);
    throw error;
  }
}

/**
 * Delete a reservation
 */
export async function deleteReservation(
  id: string,
  organizationId: string
): Promise<void> {
  try {
    const supabase = await createClient();

    // Verify reservation exists and belongs to organization
    const existingReservation = await getReservationById(id, organizationId);
    if (!existingReservation) {
      throw new Error('Reservation not found or access denied');
    }

    // Delete reservation (cascade will delete reservation_assets)
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error deleting reservation:', error);
      throw new Error(`Failed to delete reservation: ${error.message}`);
    }
  } catch (error) {
    console.error('Unexpected error in deleteReservation:', error);
    throw error;
  }
}

/**
 * Check asset availability for a date range
 */
export async function checkAssetAvailability(
  assetIds: string[],
  startDate: string,
  endDate: string,
  organizationId: string,
  excludeReservationId?: string | null
): Promise<Array<{ asset_id: string; is_available: boolean; conflicts: any[] }>> {
  try {
    const supabase = await createClient();

    // Use the database function to check availability
    const results = await Promise.all(
      assetIds.map(async (assetId) => {
        try {
          const { data, error } = await supabase.rpc('check_asset_availability', {
            p_asset_id: assetId,
            p_start_date: startDate,
            p_end_date: endDate,
            p_exclude_reservation_id: excludeReservationId || null,
          });

          if (error) {
            console.error(`Error checking availability for asset ${assetId}:`, error);
            return {
              asset_id: assetId,
              is_available: false,
              conflicts: [],
            };
          }

          // The function returns a JSONB object directly (not an array)
          // Supabase RPC returns the result directly
          const result = data as any;
          
          // Handle case where data might be null or undefined
          if (!result || typeof result !== 'object') {
            return {
              asset_id: assetId,
              is_available: false,
              conflicts: [],
            };
          }

          return {
            asset_id: assetId,
            is_available: result.is_available === true,
            conflicts: Array.isArray(result.conflicts) ? result.conflicts : [],
          };
        } catch (err) {
          console.error(`Exception checking availability for asset ${assetId}:`, err);
          return {
            asset_id: assetId,
            is_available: false,
            conflicts: [],
          };
        }
      })
    );

    return results;
  } catch (error) {
    console.error('Unexpected error in checkAssetAvailability:', error);
    throw error;
  }
}

