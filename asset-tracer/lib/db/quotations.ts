import { createClient } from '@/lib/supabase/server';
import type { Quotation, CreateQuotationInput, UpdateQuotationInput } from '@/types';

/**
 * Generate a unique quotation number per organization
 * Format: QUO-YYYY-XXXX
 * 
 * Each organization has independent numbering starting from 0001 each year.
 * This follows SaaS standards where each organization's data is isolated.
 */
export async function generateQuotationNumber(organizationId: string): Promise<string> {
  const supabase = await createClient();
  const year = new Date().getFullYear();
  const prefix = `QUO-${year}-`;

  try {
    // Get the last quotation number for THIS organization for this year
    const { data, error } = await supabase
      .from('quotations')
      .select('quotation_number')
      .eq('organization_id', organizationId)
      .like('quotation_number', `${prefix}%`)
      .order('quotation_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[generateQuotationNumber] Error fetching last quotation number:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        organizationId,
      });
      // If query fails, start from 1 (safe default)
    }

    // Determine next number based on this org's last quotation
    let nextNumber = 1;
    if (data && data.length > 0 && data[0]?.quotation_number) {
      const lastNumber = data[0].quotation_number;
      const match = lastNumber.match(/QUO-\d{4}-(\d+)/);
      if (match && match[1]) {
        const lastNum = parseInt(match[1], 10);
        if (!isNaN(lastNum)) {
          nextNumber = lastNum + 1;
        }
      }
    }

    const quotationNumber = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
    console.log(`[generateQuotationNumber] Generated: ${quotationNumber} for org: ${organizationId}`);
    return quotationNumber;
  } catch (error) {
    console.error('[generateQuotationNumber] Unexpected error:', error);
    // Fallback: use timestamp-based number to ensure uniqueness
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}${timestamp}`;
  }
}

/**
 * Calculate quotation totals from items
 */
export function calculateQuotationTotals(items: { quantity: number; unit_price: number; tax_rate: number }[]) {
  let subtotal = 0;
  let tax_total = 0;

  items.forEach((item) => {
    const itemAmount = item.quantity * item.unit_price;
    const itemTax = (itemAmount * item.tax_rate) / 100;
    subtotal += itemAmount;
    tax_total += itemTax;
  });

  const total = subtotal + tax_total;

  return {
    subtotal,
    tax_total,
    total,
  };
}

/**
 * Get all quotations for an organization
 */
export async function getQuotations(organizationId: string): Promise<Quotation[]> {
  const supabase = await createClient();

  console.log('🔍 getQuotations called for org:', organizationId);

  // First, try to get quotations without the client join
  const { data, error } = await supabase
    .from('quotations')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching quotations:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(`Failed to fetch quotations: ${error.message}`);
  }

  console.log('✅ Raw quotations fetched:', data?.length || 0);

  // Now fetch clients and items separately to avoid join issues
  if (data && data.length > 0) {
    const clientIds = [...new Set(data.map(q => q.client_id))];
    const quotationIds = data.map(q => q.id);
    
    console.log('🔍 Fetching clients:', clientIds);
    
    // Fetch clients
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name, email, company')
      .in('id', clientIds);

    if (clientError) {
      console.error('⚠️ Error fetching clients (will return quotations without client data):', clientError);
    }

    console.log('✅ Clients fetched:', clients?.length || 0);

    // Fetch quotation items
    console.log('🔍 Fetching quotation items');
    const { data: items, error: itemsError } = await supabase
      .from('quotation_items')
      .select('*')
      .in('quotation_id', quotationIds)
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.error('⚠️ Error fetching quotation items:', itemsError);
    }

    console.log('✅ Quotation items fetched:', items?.length || 0);

    // Map clients and items to quotations
    const quotationsWithClientsAndItems = data.map(quotation => {
      const client = clients?.find(c => c.id === quotation.client_id);
      const quotationItems = items?.filter(item => item.quotation_id === quotation.id) || [];
      return {
        ...quotation,
        client: client || null,
        items: quotationItems,
      };
    });

    return quotationsWithClientsAndItems as Quotation[];
  }

  return data as Quotation[];
}

/**
 * Get a single quotation by ID
 */
export async function getQuotationById(id: string, organizationId: string): Promise<Quotation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('quotations')
    .select(`
      *,
      client:clients(id, name, email, company),
      items:quotation_items(*)
    `)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching quotation:', error);
    throw new Error('Failed to fetch quotation');
  }

  return data as Quotation;
}

/**
 * Create a new quotation with items
 */
export async function createQuotation(
  data: CreateQuotationInput,
  organizationId: string,
  userId: string
): Promise<Quotation> {
  const supabase = await createClient();

  // Calculate totals
  const totals = calculateQuotationTotals(data.items);

  // Retry logic for quotation number generation (to handle race conditions)
  // With per-organization numbering, duplicates are rare (only in race conditions)
  let quotation = null;
  let attempts = 0;
  const maxAttempts = 5; // Reasonable retry limit for race conditions

  while (!quotation && attempts < maxAttempts) {
    attempts++;
    
    try {
      // Generate quotation number (per organization)
      const quotationNumber = await generateQuotationNumber(organizationId);
      console.log(`[createQuotation] Attempt ${attempts}/${maxAttempts}: Trying quotation number: ${quotationNumber}`);

      // Create quotation
      // Handle subject: preserve empty strings, use null only if undefined
      const subjectValue = data.subject !== undefined ? (data.subject || null) : null;
      
      const { data: newQuotation, error: quotationError } = await supabase
        .from('quotations')
        .insert({
          organization_id: organizationId,
          client_id: data.client_id,
          quotation_number: quotationNumber,
          subject: subjectValue,
          issue_date: data.issue_date,
          valid_until: data.valid_until,
          status: data.status || 'draft',
          currency: data.currency,
          subtotal: totals.subtotal,
          tax_total: totals.tax_total,
          total: totals.total,
          notes: data.notes || null,
          terms: data.terms || null,
          created_by: userId,
        })
        .select()
        .single();

            if (quotationError) {
        console.error(`[createQuotation] Attempt ${attempts}/${maxAttempts} failed:`, {        
          error: quotationError.message,
          code: quotationError.code,
          details: quotationError.details,
          hint: quotationError.hint,
          quotationNumber,
          organizationId,
          userId,
        });

        // Check for duplicate key error (unique constraint violation)
        // Only retry if it's specifically a duplicate key error (code 23505)
        // Don't retry on other errors like RLS violations, permission errors, etc.
        const isDuplicateError = quotationError.code === '23505' || 
          (quotationError.message?.toLowerCase().includes('duplicate key') && 
           quotationError.message?.toLowerCase().includes('quotation_number'));
        
        if (isDuplicateError) {
          console.warn(`[createQuotation] Duplicate quotation number ${quotationNumber} (race condition), retrying... (attempt ${attempts}/${maxAttempts})`);
          // Add a small delay to avoid tight retry loop
          // On next attempt, generateQuotationNumber will fetch the latest number and increment
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        // For other errors (RLS, permissions, etc.), throw immediately (don't retry)
        console.error(`[createQuotation] Non-retryable error on attempt ${attempts}:`, quotationError);
        throw new Error(`Failed to create quotation: ${quotationError.message} (code: ${quotationError.code || 'unknown'})`);
      }

      quotation = newQuotation;
      console.log(`[createQuotation] Successfully created quotation ${quotationNumber} on attempt ${attempts}`);
      break; // Success, exit loop
        } catch (error) {
      console.error(`[createQuotation] Exception caught on attempt ${attempts}:`, error);
      
      // Check if this is a duplicate key error
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const isDuplicateError = errorMessage.includes('duplicate key') && errorMessage.includes('quotation_number');
      
      // If it's not a duplicate key error, don't retry - throw immediately
      if (!isDuplicateError) {
        console.error(`[createQuotation] Non-retryable exception:`, error);
        throw error;
      }
      
      // If we've exhausted all retries, throw with detailed error message
      if (attempts >= maxAttempts) {
        const lastError = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[createQuotation] Exhausted all ${maxAttempts} retry attempts. Last error:`, lastError);
        throw new Error(`Failed to generate unique quotation number after ${maxAttempts} attempts. Last error: ${lastError}`);                                                                   
      }
      
      // Otherwise, continue retrying (it's a duplicate error and we haven't hit max attempts)
      console.warn(`[createQuotation] Duplicate error detected in catch block, will retry... (attempt ${attempts}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  if (!quotation) {
    throw new Error(`Failed to generate unique quotation number after ${maxAttempts} attempts`);
  }

  // Create quotation items
  if (data.items && data.items.length > 0) {
    const itemsToInsert = data.items.map((item) => {
      const amount = item.quantity * item.unit_price;
      const tax_amount = (amount * item.tax_rate) / 100;
      return {
        quotation_id: quotation.id,
        asset_id: item.asset_id || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        amount,
        tax_amount,
        total: amount + tax_amount,
      };
    });

    const { error: itemsError } = await supabase
      .from('quotation_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Error creating quotation items:', itemsError);
      // Rollback quotation creation
      await supabase.from('quotations').delete().eq('id', quotation.id);
      throw new Error('Failed to create quotation items');
    }
  }

  return quotation as Quotation;
}

/**
 * Update a quotation
 */
export async function updateQuotation(
  id: string,
  data: UpdateQuotationInput,
  organizationId: string
): Promise<Quotation> {
  const supabase = await createClient();

  // Verify quotation belongs to organization
  const existing = await getQuotationById(id, organizationId);
  if (!existing) {
    throw new Error('Quotation not found');
  }

  // If items are provided, recalculate totals
  const updateData: Partial<UpdateQuotationInput> = { ...data };
  
  if (data.items) {
    const totals = calculateQuotationTotals(data.items);
    updateData.subtotal = totals.subtotal;
    updateData.tax_total = totals.tax_total;
    updateData.total = totals.total;

    // Delete existing items
    await supabase
      .from('quotation_items')
      .delete()
      .eq('quotation_id', id);

    // Insert new items
    const itemsToInsert = data.items.map((item) => {
      const amount = item.quantity * item.unit_price;
      const tax_amount = (amount * item.tax_rate) / 100;
      return {
        quotation_id: id,
        asset_id: item.asset_id || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        amount,
        tax_amount,
        total: amount + tax_amount,
      };
    });

    const { error: itemsError } = await supabase
      .from('quotation_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Error updating quotation items:', itemsError);
      throw new Error('Failed to update quotation items');
    }

    // Remove items from update data (already handled separately)
    delete updateData.items;
  }

  // Update quotation
  const { data: quotation, error } = await supabase
    .from('quotations')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    console.error('Error updating quotation:', error);
    throw new Error('Failed to update quotation');
  }

  return quotation as Quotation;
}

/**
 * Delete a quotation and its items
 */
export async function deleteQuotation(id: string, organizationId: string): Promise<void> {
  const supabase = await createClient();

  // Verify quotation belongs to organization
  const existing = await getQuotationById(id, organizationId);
  if (!existing) {
    throw new Error('Quotation not found');
  }

  // Delete quotation items first (cascade should handle this, but being explicit)
  await supabase
    .from('quotation_items')
    .delete()
    .eq('quotation_id', id);

  // Delete quotation
  const { error } = await supabase
    .from('quotations')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error deleting quotation:', error);
    throw new Error('Failed to delete quotation');
  }
}

/**
 * Convert quotation to invoice
 * Creates a new invoice with the same items and client
 */
export async function convertQuotationToInvoice(
  quotationId: string,
  organizationId: string
): Promise<string> {
  // Get quotation with items
  const quotation = await getQuotationById(quotationId, organizationId);
  if (!quotation) {
    throw new Error('Quotation not found');
  }

  if (quotation.status !== 'accepted') {
    throw new Error('Only accepted quotations can be converted to invoices');
  }

  // TODO: Create invoice from quotation
  // This would use the invoice creation functions
  // For now, just return a placeholder

  throw new Error('Quotation to invoice conversion not yet implemented');
}

