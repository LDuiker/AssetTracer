import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getInvoiceById } from '@/lib/db';
import { renderToStream } from '@react-pdf/renderer';
import { InvoiceTemplate } from '@/lib/pdf';

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
 * GET /api/invoices/[id]/pdf
 * Generate and download invoice PDF
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

    // Fetch invoice with client and items
    const invoice = await getInvoiceById(id, organizationId);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found or access denied.' },
        { status: 404 }
      );
    }

    // Generate PDF
    const stream = await renderToStream(<InvoiceTemplate invoice={invoice} />);

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
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/invoices/[id]/pdf:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Invoice not found or access denied.' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate PDF. Please try again later.' },
      { status: 500 }
    );
  }
}

