/**
 * Asset Kit types for managing bundles of assets
 */

import type { Asset } from './asset';

/**
 * Asset Kit - A bundle of multiple assets that can be reserved together
 */
export interface AssetKit {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  items?: AssetKitItem[];
}

/**
 * Asset Kit Item - Links an asset to a kit with a quantity
 */
export interface AssetKitItem {
  kit_id: string;
  asset_id: string;
  quantity: number;
  asset?: Asset; // Populated when fetching kit with assets
}

/**
 * Input for creating a new asset kit
 */
export interface CreateAssetKitInput {
  name: string;
  description?: string | null;
  category?: string | null;
  asset_ids: Array<{ asset_id: string; quantity: number }>;
}

/**
 * Input for updating an existing asset kit
 */
export interface UpdateAssetKitInput {
  name?: string;
  description?: string | null;
  category?: string | null;
  asset_ids?: Array<{ asset_id: string; quantity: number }>;
}

