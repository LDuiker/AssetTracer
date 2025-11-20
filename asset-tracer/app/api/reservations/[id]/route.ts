import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getReservationById, updateReservation, deleteReservation } from '@/lib/db/reservations';
import { z } from 'zod';
import type { UpdateReservationInput } from '@/types/reservation';

/**
 * Zod schema for validating reservation update input
 */
const updateReservationSchema = z.object({
  title: z.string().min(1).optional(),
  project_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  start_time: z
    .any()
    .optional()
    .nullable()
    .transform((val) => {
      if (val === '' || val === undefined || val === null) return null;
      if (typeof val === 'string' && /^\d{2}:\d{2}$/.test(val)) return val;
      return null; // Invalid format, convert to null
    })
    .refine((val) => val === null || /^\d{2}:\d{2}$/.test(val), {
      message: 'Invalid time format. Use HH:mm format or leave empty',
    }),
  end_time: z
    .any()
    .optional()
    .nullable()
    .transform((val) => {
      if (val === '' || val === undefined || val === null) return null;
      if (typeof val === 'string' && /^\d{2}:\d{2}$/.test(val)) return val;
      return null; // Invalid format, convert to null
    })
    .refine((val) => val === null || /^\d{2}:\d{2}$/.test(val), {
      message: 'Invalid time format. Use HH:mm format or leave empty',
    }),
  location: z.string().nullable().optional(),
  status: z.enum(['pending', 'confirmed', 'active', 'completed', 'cancelled']).optional(),
  team_members: z.array(z.string().uuid()).nullable().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  notes: z.string().nullable().optional(),
  asset_ids: z.array(z.string().uuid()).optional(),
  quantities: z.record(z.string().uuid(), z.number().int().min(1)).optional(),
}).refine(
  (data) => {
    if (data.start_date && data.end_date) {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      return end >= start;
    }
    return true;
  },
  {
    message: 'End date must be on or after start date',
    path: ['end_date'],
  }
);

/**
 * GET /api/reservations/[id]
 * Fetch a single reservation by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get user's organization_id
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.organization_id) {
      const organizationId = user.user_metadata?.organization_id;
      if (!organizationId) {
        return NextResponse.json(
          { error: 'User is not associated with an organization.' },
          { status: 403 }
        );
      }

      const reservation = await getReservationById(id, organizationId);
      if (!reservation) {
        return NextResponse.json(
          { error: 'Reservation not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ reservation }, { status: 200 });
    }

    const reservation = await getReservationById(id, userProfile.organization_id);
    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ reservation }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/reservations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/reservations/[id]
 * Update an existing reservation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Validate request body with Zod
    const validationResult = updateReservationSchema.safeParse(body);

    if (!validationResult.success) {
      // Zod errors are in `issues`, not `errors`
      const issues = validationResult.error?.issues || [];
      
      console.error('Validation failed:', {
        issues: issues,
        body: JSON.stringify(body, null, 2),
        errorFormat: validationResult.error.format(),
      });
      
      const errors = issues.map((issue) => ({
        field: (issue.path || []).join('.') || 'root',
        message: issue.message || 'Validation error',
        code: issue.code,
      }));

      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const validated = validationResult.data;

    // Get user's organization_id
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.organization_id) {
      const organizationId = user.user_metadata?.organization_id;
      if (!organizationId) {
        return NextResponse.json(
          { error: 'User is not associated with an organization.' },
          { status: 403 }
        );
      }

      const updateData: UpdateReservationInput = {
        ...validated,
      };

      const reservation = await updateReservation(id, updateData, organizationId);
      return NextResponse.json({ reservation }, { status: 200 });
    }

    const updateData: UpdateReservationInput = {
      ...validated,
    };

    const reservation = await updateReservation(id, updateData, userProfile.organization_id);
    return NextResponse.json({ reservation }, { status: 200 });
  } catch (error) {
    console.error('Error in PATCH /api/reservations/[id]:', error);
    const message = error instanceof Error ? error.message : 'Failed to update reservation';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reservations/[id]
 * Delete a reservation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Get user's organization_id
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.organization_id) {
      const organizationId = user.user_metadata?.organization_id;
      if (!organizationId) {
        return NextResponse.json(
          { error: 'User is not associated with an organization.' },
          { status: 403 }
        );
      }

      await deleteReservation(id, organizationId);
      return NextResponse.json({ message: 'Reservation deleted successfully' }, { status: 200 });
    }

    await deleteReservation(id, userProfile.organization_id);
    return NextResponse.json({ message: 'Reservation deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/reservations/[id]:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete reservation';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

