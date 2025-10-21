import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import type { Invoice, CreateInvoiceInput, UpdateInvoiceInput, InvoiceItem } from '@/types';

/**
 * Generate invoice number in format: INV-YYYYMM-XXXX
 * @param organizationId - The organization ID
 * @returns Generated invoice number
 */
async function generateInvoiceNumber(organizationId: string): Promise<string> {
  const supabase = await createSupabaseClient();
  
  // Get current date for YYYYMM format
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `INV-${year}${month}`;

  // Get all invoices with this prefix to find the highest number
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('organization_id', organizationId)
    .like('invoice_number', `${prefix}-%`)
    .order('invoice_number', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching invoices for numbering:', error);
    // Fallback to timestamp-based number
    return `${prefix}-${Date.now().toString().slice(-4)}`;
  }

  let nextNumber = 1;

  if (invoices && invoices.length > 0) {
    // Extract the number from the last invoice
    const lastInvoiceNumber = invoices[0].invoice_number;
    const lastNumberMatch = lastInvoiceNumber.match(/-(\d+)$/);
    
    if (lastNumberMatch) {
      nextNumber = parseInt(lastNumberMatch[1], 10) + 1;
    }
  }

  // Pad to 4 digits
  return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Calculate invoice totals from line items
 * @param items - Array of invoice items with quantity, unit_price, and tax_rate
 * @returns Calculated totals
 */
function calculateInvoiceTotals(items: Array<{ quantity: number; unit_price: number; tax_rate: number }>) {
  let subtotal = 0;
  let tax_total = 0;

  items.forEach((item) => {
    const amount = item.quantity * item.unit_price;
    const tax_amount = amount * (item.tax_rate / 100);
    
    subtotal += amount;
    tax_total += tax_amount;
  });

  const total = subtotal + tax_total;

  return {
    subtotal,
    tax_total,
    total,
  };
}

/**
 * Fetch all invoices for an organization with client details
 * @param organizationId - The organization ID
 * @returns Array of invoices with client data
 */
export async function getInvoices(organizationId: string): Promise<Invoice[]> {
  try {
    const supabase = await createSupabaseClient();

    // Fetch invoices with clients (explicitly include subject)
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        id,
        organization_id,
        client_id,
        invoice_number,
        subject,
        issue_date,
        due_date,
        status,
        subtotal,
        tax_total,
        total,
        paid_amount,
        balance,
        currency,
        notes,
        terms,
        payment_method,
        payment_date,
        created_by,
        created_at,
        updated_at,
        client:clients(*)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }

    if (!invoices || invoices.length === 0) {
      return [];
    }

    // Fetch items for all invoices
    const invoiceIds = invoices.map(inv => inv.id);
    const { data: allItems, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .in('invoice_id', invoiceIds)
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.error('Error fetching invoice items:', itemsError);
      // Don't throw, just return invoices without items
    }

    // Map items to their respective invoices
    const itemsByInvoiceId = (allItems || []).reduce((acc, item) => {
      if (!acc[item.invoice_id]) {
        acc[item.invoice_id] = [];
      }
      acc[item.invoice_id].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    // Attach items to invoices
    return invoices.map(invoice => ({
      ...invoice,
      items: itemsByInvoiceId[invoice.id] || [],
    }));
  } catch (error) {
    console.error('Unexpected error in getInvoices:', error);
    throw error;
  }
}

/**
 * Fetch a single invoice by ID with client and items
 * @param id - The invoice ID
 * @param organizationId - The organization ID for validation
 * @returns Invoice object with client and items, or null if not found
 */
export async function getInvoiceById(
  id: string,
  organizationId: string
): Promise<Invoice | null> {
  try {
    const supabase = await createSupabaseClient();

    // Fetch invoice with client (explicitly include subject)
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        id,
        organization_id,
        client_id,
        invoice_number,
        subject,
        issue_date,
        due_date,
        status,
        subtotal,
        tax_total,
        total,
        paid_amount,
        balance,
        currency,
        notes,
        terms,
        payment_method,
        payment_date,
        created_by,
        created_at,
        updated_at,
        client:clients(*)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (invoiceError) {
      if (invoiceError.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching invoice:', invoiceError);
      throw new Error(`Failed to fetch invoice: ${invoiceError.message}`);
    }

    // Fetch invoice items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.error('Error fetching invoice items:', itemsError);
      throw new Error(`Failed to fetch invoice items: ${itemsError.message}`);
    }

    return {
      ...invoice,
      items: items || [],
    };
  } catch (error) {
    console.error('Unexpected error in getInvoiceById:', error);
    throw error;
  }
}

/**
 * Create a new invoice with line items in a transaction
 * @param data - Invoice data with items
 * @param organizationId - The organization ID
 * @param userId - The user ID creating the invoice
 * @returns The created invoice with items
 */
export async function createInvoice(
  data: CreateInvoiceInput & { items: Array<{ description: string; quantity: number; unit_price: number; tax_rate: number }> },
  organizationId: string,
  userId: string
): Promise<Invoice> {
  try {
    const supabase = await createSupabaseClient();

    // Verify client exists and belongs to organization
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', data.client_id)
      .eq('organization_id', organizationId)
      .single();

    if (clientError || !client) {
      throw new Error('Client not found or access denied');
    }

    // Calculate totals
    const { subtotal, tax_total, total } = calculateInvoiceTotals(data.items);

    // Retry logic for invoice number generation (to handle race conditions)
    let newInvoice = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (!newInvoice && attempts < maxAttempts) {
      attempts++;
      
      // Generate invoice number
      const invoice_number = await generateInvoiceNumber(organizationId);

      // Prepare invoice data
      const invoiceData = {
        organization_id: organizationId,
        client_id: data.client_id,
        invoice_number,
        issue_date: data.issue_date,
        due_date: data.due_date,
        status: data.status,
        currency: data.currency,
        subtotal,
        tax_total,
        total,
        paid_amount: 0,
        balance: total,
        notes: data.notes,
        terms: data.terms,
        payment_method: data.payment_method || null,
        payment_date: data.payment_date || null,
        created_by: userId,
      };

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (invoiceError) {
        // If duplicate key error, retry with new number
        if (invoiceError.code === '23505') {
          console.warn(`Duplicate invoice number ${invoice_number}, retrying... (attempt ${attempts})`);
          continue;
        }
        
        console.error('Error creating invoice:', invoiceError);
        throw new Error(`Failed to create invoice: ${invoiceError.message}`);
      }

      newInvoice = invoice;
    }

    if (!newInvoice) {
      throw new Error('Failed to generate unique invoice number after multiple attempts');
    }

    // Prepare invoice items with calculated values
    const invoiceItems = data.items.map((item) => {
      const amount = item.quantity * item.unit_price;
      const tax_amount = amount * (item.tax_rate / 100);
      const item_total = amount + tax_amount;

      return {
        invoice_id: newInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        amount,
        tax_amount,
        total: item_total,
      };
    });

    // Create invoice items
    const { data: createdItems, error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems)
      .select();

    if (itemsError) {
      // Rollback: delete the invoice if items creation fails
      await supabase.from('invoices').delete().eq('id', newInvoice.id);
      console.error('Error creating invoice items:', itemsError);
      throw new Error(`Failed to create invoice items: ${itemsError.message}`);
    }

    // Fetch full invoice with client and items
    const fullInvoice = await getInvoiceById(newInvoice.id, organizationId);
    
    if (!fullInvoice) {
      throw new Error('Failed to retrieve created invoice');
    }

    return fullInvoice;
  } catch (error) {
    console.error('Unexpected error in createInvoice:', error);
    throw error;
  }
}

/**
 * Update an existing invoice with items
 * @param id - The invoice ID
 * @param data - Partial invoice data with optional items
 * @param organizationId - The organization ID for validation
 * @returns The updated invoice
 */
export async function updateInvoice(
  id: string,
  data: UpdateInvoiceInput & { items?: Array<{ description: string; quantity: number; unit_price: number; tax_rate: number }> },
  organizationId: string
): Promise<Invoice> {
  try {
    const supabase = await createSupabaseClient();

    // Verify invoice exists and belongs to organization
    const existingInvoice = await getInvoiceById(id, organizationId);
    if (!existingInvoice) {
      throw new Error('Invoice not found or access denied');
    }

    // If items are provided, recalculate totals
    let updateData: any = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    
    console.log('🔧 updateInvoice - Input data:', JSON.stringify(data, null, 2));
    console.log('🔧 updateInvoice - Subject in input:', data.subject);
    console.log('🔧 updateInvoice - Update data before DB:', JSON.stringify(updateData, null, 2));

    if (data.items && data.items.length > 0) {
      const { subtotal, tax_total, total } = calculateInvoiceTotals(data.items);
      
      updateData.subtotal = subtotal;
      updateData.tax_total = tax_total;
      updateData.total = total;
      updateData.balance = total - (existingInvoice.paid_amount || 0);

      // Delete old items
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);

      if (deleteError) {
        console.error('Error deleting old invoice items:', deleteError);
        throw new Error(`Failed to delete old invoice items: ${deleteError.message}`);
      }

      // Create new items
      const invoiceItems = data.items.map((item) => {
        const amount = item.quantity * item.unit_price;
        const tax_amount = amount * (item.tax_rate / 100);
        const item_total = amount + tax_amount;

        return {
          invoice_id: id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          amount,
          tax_amount,
          total: item_total,
        };
      });

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) {
        console.error('Error creating new invoice items:', itemsError);
        throw new Error(`Failed to create new invoice items: ${itemsError.message}`);
      }

      // Remove items from update data
      delete updateData.items;
    }

    // Update invoice
    console.log('💾 About to update invoice in DB with:', JSON.stringify(updateData, null, 2));
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating invoice:', updateError);
      throw new Error(`Failed to update invoice: ${updateError.message}`);
    }
    
    console.log('✅ Invoice updated in DB. Subject in response:', updatedInvoice?.subject);

    if (!updatedInvoice) {
      throw new Error('Invoice was not updated');
    }

    // Fetch full invoice with client and items
    const fullInvoice = await getInvoiceById(id, organizationId);
    
    if (!fullInvoice) {
      throw new Error('Failed to retrieve updated invoice');
    }

    return fullInvoice;
  } catch (error) {
    console.error('Unexpected error in updateInvoice:', error);
    throw error;
  }
}

/**
 * Delete an invoice and its items
 * @param id - The invoice ID
 * @param organizationId - The organization ID for validation
 */
export async function deleteInvoice(
  id: string,
  organizationId: string
): Promise<void> {
  try {
    const supabase = await createSupabaseClient();

    // Verify invoice exists and belongs to organization
    const existingInvoice = await getInvoiceById(id, organizationId);
    if (!existingInvoice) {
      throw new Error('Invoice not found or access denied');
    }

    // Delete invoice items first (cascade)
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id);

    if (itemsError) {
      console.error('Error deleting invoice items:', itemsError);
      throw new Error(`Failed to delete invoice items: ${itemsError.message}`);
    }

    // Delete invoice
    const { error: invoiceError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (invoiceError) {
      console.error('Error deleting invoice:', invoiceError);
      throw new Error(`Failed to delete invoice: ${invoiceError.message}`);
    }
  } catch (error) {
    console.error('Unexpected error in deleteInvoice:', error);
    throw error;
  }
}

/**
 * Mark invoice as paid
 * @param id - The invoice ID
 * @param organizationId - The organization ID for validation
 * @returns The updated invoice
 */
export async function markInvoiceAsPaid(
  id: string,
  organizationId: string
): Promise<Invoice> {
  try {
    const supabase = await createSupabaseClient();

    // Fetch invoice
    const existingInvoice = await getInvoiceById(id, organizationId);
    if (!existingInvoice) {
      throw new Error('Invoice not found or access denied');
    }

    // Update invoice status
    const updateData = {
      status: 'paid' as const,
      paid_amount: existingInvoice.total,
      balance: 0,
      payment_date: new Date().toISOString().split('T')[0], // Today's date
      updated_at: new Date().toISOString(),
    };

    const { data: updatedInvoice, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Error marking invoice as paid:', error);
      throw new Error(`Failed to mark invoice as paid: ${error.message}`);
    }

    if (!updatedInvoice) {
      throw new Error('Invoice was not updated');
    }

    // Create income transaction for the invoice
    // First, check if this invoice was converted from a quotation to get asset_id
    const { data: quotation } = await supabase
      .from('quotations')
      .select(`
        id,
        quotation_items:quotation_items(
          asset_id,
          description,
          quantity,
          unit_price,
          total
        )
      `)
      .eq('converted_to_invoice_id', id)
      .single();

    // Create transactions for each item
    if (quotation && quotation.quotation_items && quotation.quotation_items.length > 0) {
      const transactions = quotation.quotation_items.map((item: any) => ({
        organization_id: organizationId,
        type: 'income' as const,
        category: 'invoice_payment',
        amount: item.total,
        currency: existingInvoice.currency,
        transaction_date: updateData.payment_date,
        description: `Payment for invoice ${existingInvoice.invoice_number}: ${item.description}`,
        reference_number: existingInvoice.invoice_number,
        payment_method: existingInvoice.payment_method || 'unspecified',
        asset_id: item.asset_id, // Link to asset if available
        client_id: existingInvoice.client_id,
        invoice_id: id,
        notes: `Auto-created from paid invoice ${existingInvoice.invoice_number}`,
      }));

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(transactions);

      if (transactionError) {
        console.error('Warning: Failed to create transaction records:', transactionError);
        // Don't throw error here - invoice was marked as paid successfully
      }
    } else {
      // If no quotation link, create a single transaction without asset_id
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          organization_id: organizationId,
          type: 'income' as const,
          category: 'invoice_payment',
          amount: existingInvoice.total,
          currency: existingInvoice.currency,
          transaction_date: updateData.payment_date,
          description: `Payment for invoice ${existingInvoice.invoice_number}`,
          reference_number: existingInvoice.invoice_number,
          payment_method: existingInvoice.payment_method || 'unspecified',
          client_id: existingInvoice.client_id,
          invoice_id: id,
          notes: `Auto-created from paid invoice ${existingInvoice.invoice_number}`,
        }]);

      if (transactionError) {
        console.error('Warning: Failed to create transaction record:', transactionError);
      }
    }

    // Fetch full invoice with client and items
    const fullInvoice = await getInvoiceById(id, organizationId);
    
    if (!fullInvoice) {
      throw new Error('Failed to retrieve updated invoice');
    }

    return fullInvoice;
  } catch (error) {
    console.error('Unexpected error in markInvoiceAsPaid:', error);
    throw error;
  }
}

