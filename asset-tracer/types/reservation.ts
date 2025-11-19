/**
 * Reservation status types
 */
export type ReservationStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';

/**
 * Reservation priority types
 */
export type ReservationPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Reservation interface
 */
export interface Reservation {
  id: string;
  organization_id: string;
  title: string;
  project_name: string | null;
  description: string | null;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  start_time: string | null; // HH:mm format
  end_time: string | null; // HH:mm format
  location: string | null;
  status: ReservationStatus;
  reserved_by: string | null;
  team_members: string[] | null;
  priority: ReservationPriority;
  notes: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined data (optional)
  assets?: ReservationAsset[];
  reserved_by_user?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Reservation Asset (junction table data)
 */
export interface ReservationAsset {
  id: string;
  reservation_id: string;
  asset_id: string;
  quantity: number;
  checked_out_at: string | null;
  checked_in_at: string | null;
  created_at: string;
  
  // Joined data (optional)
  asset?: {
    id: string;
    name: string;
    category: string | null;
    status: string;
    location: string | null;
  };
}

/**
 * Create reservation input
 */
export interface CreateReservationInput {
  title: string;
  project_name?: string | null;
  description?: string | null;
  start_date: string;
  end_date: string;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  status?: ReservationStatus;
  team_members?: string[] | null;
  priority?: ReservationPriority;
  notes?: string | null;
  asset_ids: string[]; // Array of asset IDs to reserve
  quantities?: Record<string, number>; // Optional: quantity per asset (defaults to 1)
}

/**
 * Update reservation input
 */
export interface UpdateReservationInput {
  title?: string;
  project_name?: string | null;
  description?: string | null;
  start_date?: string;
  end_date?: string;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  status?: ReservationStatus;
  team_members?: string[] | null;
  priority?: ReservationPriority;
  notes?: string | null;
  asset_ids?: string[]; // If provided, replaces all assets
  quantities?: Record<string, number>;
}

/**
 * Asset availability check result
 */
export interface AssetAvailability {
  asset_id: string;
  asset_name: string;
  is_available: boolean;
  conflicts: Array<{
    reservation_id: string;
    title: string;
    start_date: string;
    end_date: string;
    status: string;
  }>;
}

/**
 * Availability check input
 */
export interface CheckAvailabilityInput {
  asset_ids: string[];
  start_date: string;
  end_date: string;
  exclude_reservation_id?: string | null;
}

