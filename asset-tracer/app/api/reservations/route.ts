import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getReservations, createReservation } from '@/lib/db/reservations';
import { z } from 'zod';
import type { CreateReservationInput } from '@/types/reservation';

/**
 * Zod schema for validating reservation creation input
 */
const createReservationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  project_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
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
  asset_ids: z.array(z.string().uuid()).min(1, 'At least one asset is required'),
  quantities: z.record(z.string().uuid(), z.number().int().min(1)).optional(),
}).refine(
  (data) => {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    return end >= start;
  },
  {
    message: 'End date must be on or after start date',
    path: ['end_date'],
  }
);

/**
 * GET /api/reservations
 * Fetch all reservations for the authenticated user's organization
 */
export async function GET() {
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

    // Get user's organization_id
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.organization_id) {
      console.error('Error fetching user profile:', profileError);
      const organizationId = user.user_metadata?.organization_id;

      if (!organizationId) {
        return NextResponse.json(
          { error: 'User is not associated with an organization.' },
          { status: 403 }
        );
      }

      const reservations = await getReservations(organizationId);
      return NextResponse.json({ reservations }, { status: 200 });
    }

    // Fetch reservations for the user's organization
    const reservations = await getReservations(userProfile.organization_id);

    return NextResponse.json({ reservations }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/reservations:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reservations
 * Create a new reservation for the authenticated user's organization
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();

    // Validate request body with Zod
    const validationResult = createReservationSchema.safeParse(body);

    if (!validationResult.success) {
      // Zod errors are in `issues`, not `errors`
      const issues = validationResult.error?.issues || [];
      
      console.error('Validation failed:', {
        issues: issues,
        body: JSON.stringify(validated, null, 2),
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
      console.error('Error fetching user profile:', profileError);
      const organizationId = session.user.user_metadata?.organization_id;

      if (!organizationId) {
        return NextResponse.json(
          { error: 'User is not associated with an organization.' },
          { status: 403 }
        );
      }

      // Check subscription limits
      const { data: organization } = await supabase
        .from('organizations')
        .select('subscription_tier')
        .eq('id', organizationId)
        .single();

      const subscriptionTier = organization?.subscription_tier || 'free';

      // Check monthly reservation limit
      if (subscriptionTier !== 'business') {
        const now = new Date();
        const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const firstDayISO = firstDayOfMonth.toISOString().split('.')[0] + 'Z';
        
        const { data: monthlyReservations, error: fetchError } = await supabase
          .from('reservations')
          .select('id, created_at')
          .eq('organization_id', organizationId)
          .gte('created_at', firstDayISO);

        if (fetchError) {
          console.error('Error fetching monthly reservations:', fetchError);
        }

        const currentMonthCount = monthlyReservations?.length || 0;
        const maxAllowed = subscriptionTier === 'free' ? 10 : 200;

        if (currentMonthCount >= maxAllowed) {
          return NextResponse.json(
            {
              error: 'Monthly reservation limit reached',
              message: `Your ${subscriptionTier === 'free' ? 'Free' : 'Pro'} plan allows ${maxAllowed} reservations per month. You've created ${currentMonthCount} this month. ${subscriptionTier === 'free' ? 'Upgrade to Pro for 200 reservations/month, or Business for unlimited.' : 'Upgrade to Business for unlimited reservations.'}`,
            },
            { status: 403 }
          );
        }
      }

      const reservationData: CreateReservationInput = {
        title: validated.title,
        project_name: validated.project_name ?? null,
        description: validated.description ?? null,
        start_date: validated.start_date,
        end_date: validated.end_date,
        start_time: validated.start_time ?? null,
        end_time: validated.end_time ?? null,
        location: validated.location ?? null,
        status: validated.status,
        team_members: validated.team_members ?? null,
        priority: validated.priority,
        notes: validated.notes ?? null,
        asset_ids: validated.asset_ids,
        quantities: validated.quantities,
      };

      const reservation = await createReservation(
        reservationData,
        organizationId,
        user.id
      );

      return NextResponse.json({ reservation }, { status: 201 });
    }

    // Get organization subscription tier
    const { data: organization } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', userProfile.organization_id)
      .single();

    const subscriptionTier = organization?.subscription_tier || 'free';

    // Check monthly reservation limit
    if (subscriptionTier !== 'business') {
      const now = new Date();
      const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const firstDayISO = firstDayOfMonth.toISOString().split('.')[0] + 'Z';
      
      const { data: monthlyReservations, error: fetchError } = await supabase
        .from('reservations')
        .select('id, created_at')
        .eq('organization_id', userProfile.organization_id)
        .gte('created_at', firstDayISO);

      if (fetchError) {
        console.error('Error fetching monthly reservations:', fetchError);
      }

      const currentMonthCount = monthlyReservations?.length || 0;
      const maxAllowed = subscriptionTier === 'free' ? 10 : 200;

      if (currentMonthCount >= maxAllowed) {
        return NextResponse.json(
          {
            error: 'Monthly reservation limit reached',
            message: `Your ${subscriptionTier === 'free' ? 'Free' : 'Pro'} plan allows ${maxAllowed} reservations per month. You've created ${currentMonthCount} this month. ${subscriptionTier === 'free' ? 'Upgrade to Pro for 200 reservations/month, or Business for unlimited.' : 'Upgrade to Business for unlimited reservations.'}`,
          },
          { status: 403 }
        );
      }
    }

    // Create reservation
    const reservationData: CreateReservationInput = {
      title: validated.title,
      project_name: validated.project_name ?? null,
      description: validated.description ?? null,
      start_date: validated.start_date,
      end_date: validated.end_date,
      start_time: validated.start_time ?? null,
      end_time: validated.end_time ?? null,
      location: validated.location ?? null,
      status: validated.status,
      team_members: validated.team_members ?? null,
      priority: validated.priority,
      notes: validated.notes ?? null,
      asset_ids: validated.asset_ids,
      quantities: validated.quantities,
    };

    const reservation = await createReservation(
      reservationData,
      userProfile.organization_id,
      session.user.id
    );

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/reservations:', error);
    const message = error instanceof Error ? error.message : 'Failed to create reservation';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

