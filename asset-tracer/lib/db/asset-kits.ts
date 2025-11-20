import { createClient } from '@/lib/supabase/server';
import type { AssetKit, CreateAssetKitInput, UpdateAssetKitInput, AssetKitItem } from '@/types';

/**
 * Fetch all asset kits for an organization
 * @param organizationId - The organization ID
 * @returns Array of asset kits with their items
 */
export async function getAssetKits(organizationId: string): Promise<AssetKit[]> {
  try {
    const supabase = await createClient();

    // Fetch kits
    const { data: kits, error: kitsError } = await supabase
      .from('asset_kits')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (kitsError) {
      console.error('Error fetching asset kits:', kitsError);
      // Check if it's a table not found error
      if (kitsError.code === 'PGRST205' || kitsError.message?.includes('schema cache') || kitsError.message?.includes('not found')) {
        throw new Error('Asset kits tables not found. Please run the database migration script: ADD-RESERVATIONS-AND-KITS-TO-PRODUCTION.sql');
      }
      throw new Error(`Failed to fetch asset kits: ${kitsError.message}`);
    }

    if (!kits || kits.length === 0) {
      return [];
    }

    // Fetch kit items for all kits
    const kitIds = kits.map((kit) => kit.id);
    const { data: kitItems, error: itemsError } = await supabase
      .from('asset_kit_items')
      .select('kit_id, asset_id, quantity')
      .in('kit_id', kitIds);

    if (itemsError) {
      console.error('Error fetching kit items:', itemsError);
      // Check if it's a table not found error
      if (itemsError.code === 'PGRST205' || itemsError.message?.includes('schema cache')) {
        throw new Error('Asset kits tables not found. Please run the database migration script.');
      }
      // Return kits without items rather than failing completely
      return kits.map((kit) => ({ ...kit, items: [] }));
    }

    // Fetch asset details for all unique asset IDs
    const assetIds = kitItems ? [...new Set(kitItems.map((item: any) => item.asset_id))] : [];
    let assetsMap: Record<string, any> = {};
    
    if (assetIds.length > 0) {
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('id, name, category, location, status')
        .in('id', assetIds);

      if (!assetsError && assets) {
        assetsMap = assets.reduce((acc: Record<string, any>, asset: any) => {
          acc[asset.id] = asset;
          return acc;
        }, {});
      }
    }

    // Group items by kit_id
    const itemsByKit: Record<string, AssetKitItem[]> = {};
    if (kitItems) {
      kitItems.forEach((item: any) => {
        if (!itemsByKit[item.kit_id]) {
          itemsByKit[item.kit_id] = [];
        }
        itemsByKit[item.kit_id].push({
          kit_id: item.kit_id,
          asset_id: item.asset_id,
          quantity: item.quantity,
          asset: assetsMap[item.asset_id] || undefined,
        });
      });
    }

    // Attach items to their kits
    return kits.map((kit) => ({
      ...kit,
      items: itemsByKit[kit.id] || [],
    }));
  } catch (error) {
    console.error('Unexpected error in getAssetKits:', error);
    throw error;
  }
}

/**
 * Fetch a single asset kit by ID with organization validation
 * @param id - The kit ID
 * @param organizationId - The organization ID for validation
 * @returns Asset kit object or null if not found
 */
export async function getAssetKitById(
  id: string,
  organizationId: string
): Promise<AssetKit | null> {
  try {
    const supabase = await createClient();

    // Fetch the kit
    const { data: kit, error: kitError } = await supabase
      .from('asset_kits')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (kitError) {
      if (kitError.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching asset kit:', kitError);
      throw new Error(`Failed to fetch asset kit: ${kitError.message}`);
    }

    if (!kit) {
      return null;
    }

    // Fetch kit items
    const { data: kitItems, error: itemsError } = await supabase
      .from('asset_kit_items')
      .select('kit_id, asset_id, quantity')
      .eq('kit_id', id);

    if (itemsError) {
      console.error('Error fetching kit items:', itemsError);
      // Check if it's a table not found error
      if (itemsError.code === 'PGRST205' || itemsError.message?.includes('schema cache')) {
        throw new Error('Asset kits tables not found. Please run the database migration script.');
      }
      // Return kit without items rather than failing
      return { ...kit, items: [] };
    }

    // Fetch asset details
    const assetIds = kitItems ? kitItems.map((item: any) => item.asset_id) : [];
    let assetsMap: Record<string, any> = {};
    
    if (assetIds.length > 0) {
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select('id, name, category, location, status')
        .in('id', assetIds);

      if (!assetsError && assets) {
        assetsMap = assets.reduce((acc: Record<string, any>, asset: any) => {
          acc[asset.id] = asset;
          return acc;
        }, {});
      }
    }

    const items: AssetKitItem[] =
      kitItems?.map((item: any) => ({
        kit_id: item.kit_id,
        asset_id: item.asset_id,
        quantity: item.quantity,
        asset: assetsMap[item.asset_id] || undefined,
      })) || [];

    return {
      ...kit,
      items,
    };
  } catch (error) {
    console.error('Unexpected error in getAssetKitById:', error);
    throw error;
  }
}

/**
 * Create a new asset kit
 * @param data - Kit data including asset_ids
 * @param organizationId - The organization ID
 * @param userId - The user ID creating the kit
 * @returns The created kit with items
 */
export async function createAssetKit(
  data: CreateAssetKitInput,
  organizationId: string,
  userId: string
): Promise<AssetKit> {
  try {
    const supabase = await createClient();

    // Create the kit
    const kitData = {
      name: data.name,
      description: data.description || null,
      category: data.category || null,
      organization_id: organizationId,
      created_by: userId,
    };

    const { data: newKit, error: kitError } = await supabase
      .from('asset_kits')
      .insert([kitData])
      .select()
      .single();

    if (kitError) {
      console.error('Error creating asset kit:', kitError);
      throw new Error(`Failed to create asset kit: ${kitError.message}`);
    }

    if (!newKit) {
      throw new Error('Asset kit was not created');
    }

    // Create kit items
    if (data.asset_ids && data.asset_ids.length > 0) {
      const kitItems = data.asset_ids.map((item) => ({
        kit_id: newKit.id,
        asset_id: item.asset_id,
        quantity: item.quantity || 1,
      }));

      const { error: itemsError } = await supabase
        .from('asset_kit_items')
        .insert(kitItems);

      if (itemsError) {
        console.error('Error creating kit items:', itemsError);
        // Try to clean up the kit if items failed
        await supabase.from('asset_kits').delete().eq('id', newKit.id);
        throw new Error(`Failed to create kit items: ${itemsError.message}`);
      }
    }

    // Fetch the complete kit with items
    const completeKit = await getAssetKitById(newKit.id, organizationId);
    if (!completeKit) {
      throw new Error('Failed to fetch created kit');
    }

    return completeKit;
  } catch (error) {
    console.error('Unexpected error in createAssetKit:', error);
    throw error;
  }
}

/**
 * Update an existing asset kit
 * @param id - The kit ID
 * @param data - Partial kit data to update
 * @param organizationId - The organization ID for validation
 * @returns The updated kit with items
 */
export async function updateAssetKit(
  id: string,
  data: UpdateAssetKitInput,
  organizationId: string
): Promise<AssetKit> {
  try {
    const supabase = await createClient();

    // First, verify the kit exists and belongs to the organization
    const existingKit = await getAssetKitById(id, organizationId);
    if (!existingKit) {
      throw new Error('Asset kit not found or access denied');
    }

    // Update kit metadata if provided
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;

    if (Object.keys(updateData).length > 1) {
      // Only update if there are actual changes
      const { error: updateError } = await supabase
        .from('asset_kits')
        .update(updateData)
        .eq('id', id)
        .eq('organization_id', organizationId);

      if (updateError) {
        console.error('Error updating asset kit:', updateError);
        throw new Error(`Failed to update asset kit: ${updateError.message}`);
      }
    }

    // Update kit items if provided
    if (data.asset_ids !== undefined) {
      // Delete existing items
      const { error: deleteError } = await supabase
        .from('asset_kit_items')
        .delete()
        .eq('kit_id', id);

      if (deleteError) {
        console.error('Error deleting kit items:', deleteError);
        throw new Error(`Failed to update kit items: ${deleteError.message}`);
      }

      // Insert new items
      if (data.asset_ids.length > 0) {
        const kitItems = data.asset_ids.map((item) => ({
          kit_id: id,
          asset_id: item.asset_id,
          quantity: item.quantity || 1,
        }));

        const { error: insertError } = await supabase
          .from('asset_kit_items')
          .insert(kitItems);

        if (insertError) {
          console.error('Error inserting kit items:', insertError);
          throw new Error(`Failed to update kit items: ${insertError.message}`);
        }
      }
    }

    // Fetch the updated kit
    const updatedKit = await getAssetKitById(id, organizationId);
    if (!updatedKit) {
      throw new Error('Failed to fetch updated kit');
    }

    return updatedKit;
  } catch (error) {
    console.error('Unexpected error in updateAssetKit:', error);
    throw error;
  }
}

/**
 * Delete an asset kit
 * @param id - The kit ID
 * @param organizationId - The organization ID for validation
 */
export async function deleteAssetKit(id: string, organizationId: string): Promise<void> {
  try {
    const supabase = await createClient();

    // Verify the kit exists and belongs to the organization
    const existingKit = await getAssetKitById(id, organizationId);
    if (!existingKit) {
      throw new Error('Asset kit not found or access denied');
    }

    // Delete the kit (items will be deleted via CASCADE)
    const { error } = await supabase
      .from('asset_kits')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error deleting asset kit:', error);
      throw new Error(`Failed to delete asset kit: ${error.message}`);
    }
  } catch (error) {
    console.error('Unexpected error in deleteAssetKit:', error);
    throw error;
  }
}

