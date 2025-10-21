import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getClients, createClient } from '@/lib/db';
import { z } from 'zod';
import type { CreateClientInput } from '@/types';

/**
 * Zod schema for validating client creation input
 */
const createClientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
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
 * GET /api/clients
 * Fetch all clients for the authenticated user's organization
 */
export async function GET(request: NextRequest) {
  try {
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

    const clients = await getClients(organizationId);
    return NextResponse.json({ clients }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/clients:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients
 * Create a new client for the authenticated user's organization
 */
export async function POST(request: NextRequest) {
  try {
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
    const validationResult = createClientSchema.safeParse(body);

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

    const clientData = validationResult.data as CreateClientInput;

    const organizationId = await getOrganizationId(session.user.id);
    if (!organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with an organization.' },
        { status: 403 }
      );
    }

    const newClient = await createClient(clientData, organizationId);
    return NextResponse.json({ client: newClient }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/clients:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Failed to create client')) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

