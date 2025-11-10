'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ClientTable, ClientDialog } from '@/components/clients';
import { toast } from 'sonner';
import type { Client, CreateClientInput } from '@/types';

export default function ClientsPage() {
  // Fetch clients with SWR (uses global config from layout)
  const { data, error, isLoading, mutate } = useSWR<{ clients: Client[] }>(
    '/api/clients'
  );

  const clientsData = data?.clients;
  const clients = useMemo<Client[]>(() => clientsData ?? [], [clientsData]);

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  /**
   * Filter clients based on search query
   * Searches in name, email, company, and city (case-insensitive)
   */
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        searchQuery === '' ||
        client.name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        (client.company?.toLowerCase().includes(searchLower) ?? false) ||
        (client.city?.toLowerCase().includes(searchLower) ?? false);

      return matchesSearch;
    });
  }, [clients, searchQuery]);

  /**
   * Check if search filter is active
   */
  const hasActiveFilter = searchQuery !== '';

  /**
   * Clear search filter
   */
  const clearSearch = () => {
    setSearchQuery('');
  };

  /**
   * Handle create client action
   */
  const handleCreate = () => {
    setSelectedClient(null);
    setIsDialogOpen(true);
  };

  /**
   * Handle edit client action
   */
  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  };

  /**
   * Handle delete client action
   */
  const handleDelete = async (client: Client) => {
    if (!window.confirm(`Are you sure you want to delete "${client.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete client');
      }

      // Optimistically update the cache
      mutate(
        { clients: clients.filter((c) => c.id !== client.id) },
        { revalidate: true }
      );

      toast.success('Client deleted successfully');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete client'
      );
    }
  };

  /**
   * Handle save client action
   */
  const handleSave = async (data: CreateClientInput) => {
    try {
      if (selectedClient) {
        // Update existing client
        const response = await fetch(`/api/clients/${selectedClient.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update client');
        }

        const { client: updatedClient } = await response.json();

        // Optimistically update the cache
        mutate(
          {
            clients: clients.map((c) =>
              c.id === selectedClient.id ? updatedClient : c
            ),
          },
          { revalidate: true }
        );

        toast.success('Client updated successfully');
      } else {
        // Create new client
        const response = await fetch('/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create client');
        }

        const { client: newClient } = await response.json();

        // Optimistically update the cache
        mutate({ clients: [newClient, ...clients] }, { revalidate: true });

        toast.success('Client created successfully');
      }
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save client'
      );
      throw error;
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Clients
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your customers and client information
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 p-6 text-center">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
            Failed to load clients
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400 mb-4">
            {error.message || 'An error occurred while fetching clients'}
          </p>
          <Button onClick={() => mutate()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Clients
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your customers and client information
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-primary-blue hover:bg-blue-700 w-full md:w-auto"
          size="lg"
          disabled={isLoading}
        >
          <Plus className="mr-2 h-5 w-5" />
          Create Client
        </Button>
      </div>

      {/* Search Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search clients by name, email, company, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Results Count and Active Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Results Count */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing{' '}
          <span className="font-semibold text-gray-900 dark:text-white">
            {filteredClients.length}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-gray-900 dark:text-white">
            {clients.length}
          </span>{' '}
          clients
        </div>

        {/* Active Filters */}
        {hasActiveFilter && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Active filters:
            </span>

            {/* Search Query Badge */}
            {searchQuery && (
              <Badge
                variant="secondary"
                className="gap-1 pr-1 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300"
              >
                Search: {searchQuery}
                <button
                  onClick={clearSearch}
                  className="ml-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 p-0.5"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Clients Table */}
      <ClientTable
        clients={filteredClients}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* Client Dialog (Create/Edit) */}
      <ClientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        client={selectedClient}
        onSave={handleSave}
      />
    </div>
  );
}
