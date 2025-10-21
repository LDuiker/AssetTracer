/**
 * Asset status types
 */
export type AssetStatus = 'active' | 'maintenance' | 'retired' | 'sold';

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

