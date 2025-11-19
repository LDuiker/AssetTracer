import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getReservationById } from '@/lib/db/reservations';
import { renderToStream } from '@react-pdf/renderer';
import { createElement } from 'react';
import { ReservationPackingListTemplate } from '@/lib/pdf/reservation-packing-list';

/**
 * GET /api/reservations/[id]/packing-list
 * Generate packing list/equipment list PDF for a single reservation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (!userProfile?.organization_id) {
      return NextResponse.json(
        { error: 'User is not associated with an organization' },
        { status: 403 }
      );
    }

    // Get organization details
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', userProfile.organization_id)
      .single();

    // Fetch reservation with assets
    const reservation = await getReservationById(id, userProfile.organization_id);

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found or access denied' },
        { status: 404 }
      );
    }

    // Generate PDF
    const stream = await renderToStream(
      createElement(ReservationPackingListTemplate, {
        reservation,
        organizationName: organization?.name || 'Asset Tracer',
      })
    );

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return PDF as response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="packing-list-${reservation.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating packing list:', error);
    return NextResponse.json(
      { error: 'Failed to generate packing list' },
      { status: 500 }
    );
  }
}

