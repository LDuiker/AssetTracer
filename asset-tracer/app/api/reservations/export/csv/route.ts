import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getReservations } from '@/lib/db/reservations';

/**
 * GET /api/reservations/export/csv
 * Export all reservations to CSV format
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

    // Fetch all reservations with assets
    const reservations = await getReservations(userProfile.organization_id);

    // Build CSV content
    const csvRows: string[] = [];

    // Header
    csvRows.push('Reservations Export');
    csvRows.push(`Generated: ${new Date().toISOString()}`);
    csvRows.push('');

    // Column headers
    csvRows.push(
      'ID,Title,Project,Description,Start Date,End Date,Start Time,End Time,Location,Status,Priority,Reserved By,Team Members,Notes,Assets,Quantities,Created At'
    );

    // Data rows
    reservations.forEach((reservation) => {
      const assets = reservation.assets || [];
      const assetNames = assets
        .map((a) => {
          const assetName = a.asset?.name || 'Unknown Asset';
          const quantity = a.quantity > 1 ? ` (×${a.quantity})` : '';
          return `${assetName}${quantity}`;
        })
        .join('; ');

      const quantities = assets
        .map((a) => `${a.asset?.name || 'Unknown'}: ${a.quantity}`)
        .join('; ');

      const row = [
        reservation.id,
        `"${(reservation.title || '').replace(/"/g, '""')}"`,
        `"${(reservation.project_name || '').replace(/"/g, '""')}"`,
        `"${(reservation.description || '').replace(/"/g, '""')}"`,
        reservation.start_date,
        reservation.end_date,
        reservation.start_time || '',
        reservation.end_time || '',
        `"${(reservation.location || '').replace(/"/g, '""')}"`,
        reservation.status,
        reservation.priority,
        `"${(reservation.reserved_by_user?.name || reservation.reserved_by || '').replace(/"/g, '""')}"`,
        `"${((reservation.team_members || []).join(', ')).replace(/"/g, '""')}"`,
        `"${(reservation.notes || '').replace(/"/g, '""')}"`,
        `"${assetNames.replace(/"/g, '""')}"`,
        `"${quantities.replace(/"/g, '""')}"`,
        reservation.created_at,
      ].join(',');

      csvRows.push(row);
    });

    // Convert to CSV string
    const csvContent = csvRows.join('\n');

    // Return as CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="reservations-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting reservations to CSV:', error);
    return NextResponse.json(
      { error: 'Failed to export reservations' },
      { status: 500 }
    );
  }
}

