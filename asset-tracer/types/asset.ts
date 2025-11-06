/**
 * Asset status types
 */
export type AssetStatus = 'active' | 'maintenance' | 'retired' | 'sold';

/**
 * Asset type - individual item or a group
 */
export type AssetType = 'individual' | 'group';

/**
 * Main Asset interface representing an asset in the database
 */
export interface Asset {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category: string | null;
  purchase_date: string | null;
  purchase_cost: number;
  current_value: number;
  status: AssetStatus;
  location: string | null;
  serial_number: string | null;
  image_url: string | null;
  asset_type?: AssetType; // 'individual' or 'group'
  parent_group_id?: string | null; // Reference to parent group if this is a group item
  quantity?: number; // For groups: total items, for individuals: 1
  created_at: string;
  updated_at: string;
}

/**
 * Input type for creating a new asset
 * Omits id, timestamps, and organization_id as they are auto-generated
 */
export type CreateAssetInput = Omit<
  Asset,
  'id' | 'organization_id' | 'created_at' | 'updated_at'
>;

/**
 * Input type for updating an existing asset
 * All fields are optional
 */
export type UpdateAssetInput = Partial<CreateAssetInput>;

