'use client';

import { MoreVertical, Edit, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import type { Client } from '@/types';

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  isLoading?: boolean;
}

/**
 * Loading skeleton for table rows
 */
function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6 mb-4">
        <Users className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No clients found
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        Get started by adding your first client to track customers and manage billing.
      </p>
    </div>
  );
}

/**
 * ClientTable component displays a list of clients in a table format
 */
export function ClientTable({ clients, onEdit, onDelete, isLoading = false }: ClientTableProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      {/* Responsive wrapper with horizontal scroll on mobile */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Name</TableHead>
              <TableHead className="min-w-[200px]">Email</TableHead>
              <TableHead className="min-w-[120px]">Phone</TableHead>
              <TableHead className="min-w-[120px]">City</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64">
                  <EmptyState />
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-gray-900 dark:text-gray-100">{client.name}</span>
                      {client.company && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {client.company}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-700 dark:text-gray-300">
                      {client.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-700 dark:text-gray-300">
                      {client.phone || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-700 dark:text-gray-300">
                      {client.city || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onEdit(client)}
                          className="cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(client)}
                          className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

