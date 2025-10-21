import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getClientById, updateClient, deleteClient } from '@/lib/db';
import { z } from 'zod';
import type { UpdateClientInput } from '@/types';

/**
 * Zod schema for validating client update input
 */
const updateClientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  tax_id: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * Helper function to get organization ID from user session
 */
async function getOrganizationId(userId: string) {
  const supabase = await createSupabaseClient();
  
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    const { data: { user } } = await supabase.auth.getUser();
    return user?.user_metadata?.organization_id || null;
  }

  return userProfile?.organization_id || null;
}

/**
 * GET /api/clients/[id]
 * Fetch a single client by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const organizationId = await getOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with an organization.' },
        { status: 403 }
      );
    }

    const client = await getClientById(id, organizationId);

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found or access denied.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ client }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/clients/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/clients/[id]
 * Update an existing client
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = updateClientSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const updateData = validationResult.data as UpdateClientInput;

    const organizationId = await getOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with an organization.' },
        { status: 403 }
      );
    }

    const updatedClient = await updateClient(id, updateData, organizationId);
    return NextResponse.json({ client: updatedClient }, { status: 200 });
  } catch (error) {
    console.error('Error in PATCH /api/clients/[id]:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Client not found or access denied.' },
          { status: 404 }
        );
      }
      if (error.message.includes('access denied')) {
        return NextResponse.json(
          { error: 'You do not have permission to update this client.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/[id]
 * Delete a client
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const organizationId = await getOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with an organization.' },
        { status: 403 }
      );
    }

    await deleteClient(id, organizationId);
    return NextResponse.json(
      { message: 'Client deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/clients/[id]:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Client not found or access denied.' },
          { status: 404 }
        );
      }
      if (error.message.includes('access denied')) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this client.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

