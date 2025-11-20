import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getReservations } from '@/lib/db/reservations';
import { renderToStream } from '@react-pdf/renderer';
import { createElement } from 'react';
import { ReservationPDFTemplate } from '@/lib/pdf';

/**
 * GET /api/reservations/export/pdf
 * Export all reservations to PDF format
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
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

    // Fetch all reservations with assets
    const reservations = await getReservations(userProfile.organization_id);

    // Generate PDF
    const stream = await renderToStream(
      createElement(ReservationPDFTemplate, {
        reservations,
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
        'Content-Disposition': `attachment; filename="reservations-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error exporting reservations to PDF:', error);
    return NextResponse.json(
      { error: 'Failed to export reservations' },
      { status: 500 }
    );
  }
}

