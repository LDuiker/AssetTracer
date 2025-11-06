import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/quotations/[id]/convert-to-invoice
 * Convert an accepted quotation to an invoice
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: quotationId } = await params;

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userData, error: orgError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (orgError || !userData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch the quotation with items
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select(`
        *,
        client:clients(id, name, email, company),
        items:quotation_items(*)
      `)
      .eq('id', quotationId)
      .eq('organization_id', userData.organization_id)
      .single();

    if (quotationError) {
      console.error('Error fetching quotation:', quotationError);
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // Verify quotation is accepted
    if (quotation.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Only accepted quotations can be converted to invoices' },
        { status: 400 }
      );
    }

    // Check if already converted
    if (quotation.converted_to_invoice_id) {
      return NextResponse.json(
        { error: 'This quotation has already been converted to an invoice', invoiceId: quotation.converted_to_invoice_id },
        { status: 400 }
      );
    }

    // Check subscription limits - free plan: 5 invoices per month
    const { data: organization } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', userData.organization_id)
      .single();

    const subscriptionTier = organization?.subscription_tier || 'free';
    
    // Count invoices created this month for free tier
    if (subscriptionTier === 'free') {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data: monthlyInvoices, error: countError } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', userData.organization_id)
        .gte('created_at', firstDayOfMonth.toISOString());

      if (countError) {
        console.error('Error counting monthly invoices:', countError);
      }

      const currentMonthCount = monthlyInvoices?.length || 0;
      const maxAllowed = 5;

      if (currentMonthCount >= maxAllowed) {
        return NextResponse.json(
          { 
            error: 'Monthly invoice limit reached',
            message: `Free plan allows ${maxAllowed} invoices per month. You've created ${currentMonthCount} this month. Cannot convert quotation. Upgrade to Pro for unlimited invoices.`
          },
          { status: 403 }
        );
      }
    }

    // Generate invoice number
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('organization_id', userData.organization_id)
      .like('invoice_number', `${prefix}%`)
      .order('invoice_number', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (lastInvoice && lastInvoice.length > 0) {
      const match = lastInvoice[0].invoice_number.match(/INV-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const invoiceNumber = `${prefix}${nextNumber.toString().padStart(4, '0')}`;

    // Calculate due date (30 days from now by default)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        organization_id: userData.organization_id,
        client_id: quotation.client_id,
        invoice_number: invoiceNumber,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        status: 'draft',
        currency: quotation.currency,
        subtotal: quotation.subtotal,
        tax_total: quotation.tax_total,
        total: quotation.total,
        paid_amount: 0,
        balance: quotation.total,
        notes: quotation.notes ? `Converted from quotation ${quotation.quotation_number}\n\n${quotation.notes}` : `Converted from quotation ${quotation.quotation_number}`,
        terms: quotation.terms,
        created_by: user.id,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    // Create invoice items from quotation items
    if (quotation.items && quotation.items.length > 0) {
      // Build invoice items - conditionally include asset_id if column exists
      const baseInvoiceItems = quotation.items.map((item: any) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        amount: item.amount,
        tax_amount: item.tax_amount,
        total: item.total,
      }));

      // Try to insert with asset_id first, fallback to without if column doesn't exist
      let invoiceItems = baseInvoiceItems;
      if (quotation.items.some((item: any) => item.asset_id)) {
        // Only include asset_id if at least one quotation item has it
        invoiceItems = quotation.items.map((item: any) => ({
          ...baseInvoiceItems.find((bi: any) => bi.description === item.description),
          asset_id: item.asset_id || null,
        }));
      }

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) {
        console.error('Error creating invoice items:', itemsError);
        
        // If error is about missing column, try without asset_id
        if (itemsError.message?.includes('column') && itemsError.message?.includes('asset_id')) {
          console.log('Retrying without asset_id column...');
          const { error: retryError } = await supabase
            .from('invoice_items')
            .insert(baseInvoiceItems);
          
          if (retryError) {
            console.error('Error creating invoice items (retry):', retryError);
            // Rollback invoice creation
            await supabase.from('invoices').delete().eq('id', invoice.id);
            return NextResponse.json({ 
              error: 'Failed to create invoice items',
              details: retryError.message 
            }, { status: 500 });
          }
        } else {
          // Rollback invoice creation
          await supabase.from('invoices').delete().eq('id', invoice.id);
          return NextResponse.json({ 
            error: 'Failed to create invoice items',
            details: itemsError.message 
          }, { status: 500 });
        }
      }
    }

    // Update quotation to mark it as converted and change status to invoiced
    await supabase
      .from('quotations')
      .update({
        converted_to_invoice_id: invoice.id,
        status: 'invoiced',
        updated_at: new Date().toISOString(),
      })
      .eq('id', quotationId);

    return NextResponse.json({
      message: 'Quotation converted to invoice successfully',
      invoice,
      invoiceId: invoice.id,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/quotations/[id]/convert-to-invoice:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to convert quotation' },
      { status: 500 }
    );
  }
}

