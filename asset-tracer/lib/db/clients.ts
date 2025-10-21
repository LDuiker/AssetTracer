import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import type { Client, CreateClientInput, UpdateClientInput } from '@/types';

/**
 * Fetch all clients for an organization
 * @param organizationId - The organization ID
 * @returns Array of clients ordered by creation date (newest first)
 */
export async function getClients(organizationId: string): Promise<Client[]> {
  try {
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      throw new Error(`Failed to fetch clients: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getClients:', error);
    throw error;
  }
}

/**
 * Fetch a single client by ID with organization validation
 * @param id - The client ID
 * @param organizationId - The organization ID for validation
 * @returns Client object or null if not found
 */
export async function getClientById(
  id: string,
  organizationId: string
): Promise<Client | null> {
  try {
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      console.error('Error fetching client:', error);
      throw new Error(`Failed to fetch client: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getClientById:', error);
    throw error;
  }
}

/**
 * Create a new client
 * @param data - Client data (without id, timestamps, organization_id)
 * @param organizationId - The organization ID
 * @returns The created client
 */
export async function createClient(
  data: CreateClientInput,
  organizationId: string
): Promise<Client> {
  try {
    const supabase = await createSupabaseClient();

    const clientData = {
      ...data,
      organization_id: organizationId,
    };

    const { data: newClient, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      throw new Error(`Failed to create client: ${error.message}`);
    }

    if (!newClient) {
      throw new Error('Client was not created');
    }

    return newClient;
  } catch (error) {
    console.error('Unexpected error in createClient:', error);
    throw error;
  }
}

/**
 * Update an existing client
 * @param id - The client ID
 * @param data - Partial client data to update
 * @param organizationId - The organization ID for validation
 * @returns The updated client
 */
export async function updateClient(
  id: string,
  data: UpdateClientInput,
  organizationId: string
): Promise<Client> {
  try {
    const supabase = await createSupabaseClient();

    // First, verify the client exists and belongs to the organization
    const existingClient = await getClientById(id, organizationId);
    if (!existingClient) {
      throw new Error('Client not found or access denied');
    }

    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedClient, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      throw new Error(`Failed to update client: ${error.message}`);
    }

    if (!updatedClient) {
      throw new Error('Client was not updated');
    }

    return updatedClient;
  } catch (error) {
    console.error('Unexpected error in updateClient:', error);
    throw error;
  }
}

/**
 * Delete a client
 * @param id - The client ID
 * @param organizationId - The organization ID for validation
 */
export async function deleteClient(
  id: string,
  organizationId: string
): Promise<void> {
  try {
    const supabase = await createSupabaseClient();

    // First, verify the client exists and belongs to the organization
    const existingClient = await getClientById(id, organizationId);
    if (!existingClient) {
      throw new Error('Client not found or access denied');
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error deleting client:', error);
      throw new Error(`Failed to delete client: ${error.message}`);
    }
  } catch (error) {
    console.error('Unexpected error in deleteClient:', error);
    throw error;
  }
}

