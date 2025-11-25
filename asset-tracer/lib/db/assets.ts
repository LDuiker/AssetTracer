import { createClient } from '@/lib/supabase/server';
import type { Asset, CreateAssetInput, UpdateAssetInput } from '@/types';
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

/**
 * Fetch all assets for an organization
 * @param organizationId - The organization ID
 * @returns Array of assets ordered by creation date (newest first)
 */
export async function getAssets(organizationId: string): Promise<Asset[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assets:', error);
      throw new Error(`Failed to fetch assets: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getAssets:', error);
    throw error;
  }
}

/**
 * Fetch a single asset by ID with organization validation
 * @param id - The asset ID
 * @param organizationId - The organization ID for validation
 * @returns Asset object or null if not found
 */
export async function getAssetById(
  id: string,
  organizationId: string
): Promise<Asset | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching asset:', error);
      throw new Error(`Failed to fetch asset: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getAssetById:', error);
    throw error;
  }
}

/**
 * Create a new asset
 * @param data - Asset data (without id, timestamps, organization_id)
 * @param organizationId - The organization ID
 * @param userId - The user ID creating the asset
 * @returns The created asset
 */
export async function createAsset(
  data: CreateAssetInput,
  organizationId: string,
  userId: string
): Promise<Asset> {
  try {
    const supabase = await createClient();

    const assetData = {
      ...data,
      organization_id: organizationId,
      created_by: userId,
      // Ensure quantity defaults to 1 for individual assets
      quantity: data.asset_type === 'group' ? (data.quantity || 1) : 1,
      // Ensure asset_type defaults to 'individual'
      asset_type: data.asset_type || 'individual',
    };

    const { data: newAsset, error } = await supabase
      .from('assets')
      .insert([assetData])
      .select()
      .single();

    if (error) {
      console.error('Error creating asset:', error);
      throw new Error(`Failed to create asset: ${error.message}`);
    }

    if (!newAsset) {
      throw new Error('Asset was not created');
    }

    return newAsset;
  } catch (error) {
    console.error('Unexpected error in createAsset:', error);
    throw error;
  }
}

/**
 * Update an existing asset
 * @param id - The asset ID
 * @param data - Partial asset data to update
 * @param organizationId - The organization ID for validation
 * @returns The updated asset
 */
export async function updateAsset(
  id: string,
  data: UpdateAssetInput,
  organizationId: string
): Promise<Asset> {
  try {
    const supabase = await createClient();

    // First, verify the asset exists and belongs to the organization
    const existingAsset = await getAssetById(id, organizationId);
    if (!existingAsset) {
      throw new Error('Asset not found or access denied');
    }

    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedAsset, error } = await supabase
      .from('assets')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating asset:', error);
      throw new Error(`Failed to update asset: ${error.message}`);
    }

    if (!updatedAsset) {
      throw new Error('Asset was not updated');
    }

    return updatedAsset;
  } catch (error) {
    console.error('Unexpected error in updateAsset:', error);
    throw error;
  }
}

/**
 * Delete an asset
 * @param id - The asset ID
 * @param organizationId - The organization ID for validation
 */
export async function deleteAsset(
  id: string,
  organizationId: string
): Promise<void> {
  try {
    const supabase = await createClient();

    // First, verify the asset exists and belongs to the organization
    const existingAsset = await getAssetById(id, organizationId);
    if (!existingAsset) {
      throw new Error('Asset not found or access denied');
    }

    // Clean up any references before deleting the asset itself
    await cleanupAssetReferences(supabase, id, organizationId);

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error deleting asset:', error);
      throw new Error(`Failed to delete asset: ${error.message}`);
    }
  } catch (error) {
    console.error('Unexpected error in deleteAsset:', error);
    throw error;
  }
}

type CleanupAction = {
  description: string;
  action: () => Promise<PostgrestError | null>;
};

/**
 * Remove or nullify references to an asset across related tables before deletion.
 * This avoids foreign key errors when invoices, quotations, reservations, or kits
 * still point to the asset being removed.
 */
async function cleanupAssetReferences(
  supabase: SupabaseClient,
  assetId: string,
  organizationId: string
) {
  const cleanupSteps: CleanupAction[] = [
    {
      description: 'reservation assets',
      action: async () => {
        const { error } = await supabase
          .from('reservation_assets')
          .delete()
          .eq('asset_id', assetId);

        return error;
      },
    },
    {
      description: 'asset kit items',
      action: async () => {
        const { error } = await supabase
          .from('asset_kit_items')
          .delete()
          .eq('asset_id', assetId);

        return error;
      },
    },
    {
      description: 'quotation items',
      action: async () => {
        const { error } = await supabase
          .from('quotation_items')
          .update({ asset_id: null })
          .eq('asset_id', assetId);

        return error;
      },
    },
    {
      description: 'invoice items',
      action: async () => {
        const { error } = await supabase
          .from('invoice_items')
          .update({ asset_id: null })
          .eq('asset_id', assetId);

        return error;
      },
    },
    {
      description: 'transactions',
      action: async () => {
        const { error } = await supabase
          .from('transactions')
          .update({ asset_id: null })
          .eq('asset_id', assetId)
          .eq('organization_id', organizationId);

        return error;
      },
    },
    {
      description: 'expenses',
      action: async () => {
        const { error } = await supabase
          .from('expenses')
          .update({ asset_id: null })
          .eq('asset_id', assetId)
          .eq('organization_id', organizationId);

        return error;
      },
    },
  ];

  for (const step of cleanupSteps) {
    const error = await step.action();
    if (error) {
      if (isIgnorableCleanupError(error)) {
        console.warn(
          `[deleteAsset] Skipping optional cleanup for ${step.description}: ${error.message}`
        );
        continue;
      }

      console.error(
        `[deleteAsset] Failed to clean up ${step.description}:`,
        error
      );
      throw new Error(
        `Failed to clean up ${step.description}: ${error.message}`
      );
    }
  }
}

/**
 * Ignore cleanup errors caused by optional tables/columns not being present yet.
 */
function isIgnorableCleanupError(error: PostgrestError | null) {
  if (!error) return false;

  // 42P01: undefined table, 42703: undefined column
  return error.code === '42P01' || error.code === '42703';
}

