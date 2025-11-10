import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import type { Expense, CreateExpenseInput, UpdateExpenseInput } from '@/types';

type TransactionUpdateData = {
  amount?: number;
  transaction_date?: string;
  description?: string;
  category?: string;
  reference_number?: string | null;
  payment_method?: string | null;
  asset_id?: string | null;
  notes?: string | null;
};

/**
 * Fetch all expenses for an organization
 * @param organizationId - The organization ID
 * @returns Array of expenses with asset details
 */
export async function getExpenses(organizationId: string): Promise<Expense[]> {
  try {
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        asset:assets(id, name, category)
      `)
      .eq('organization_id', organizationId)
      .order('expense_date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      throw new Error(`Failed to fetch expenses: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getExpenses:', error);
    throw error;
  }
}

/**
 * Fetch a single expense by ID
 * @param id - The expense ID
 * @param organizationId - The organization ID for validation
 * @returns Expense object or null if not found
 */
export async function getExpenseById(
  id: string,
  organizationId: string
): Promise<Expense | null> {
  try {
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        asset:assets(id, name, category)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching expense:', error);
      throw new Error(`Failed to fetch expense: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getExpenseById:', error);
    throw error;
  }
}

/**
 * Create a new expense
 * @param data - Expense data
 * @param organizationId - The organization ID
 * @param userId - The user ID creating the expense
 * @returns The created expense
 */
export async function createExpense(
  data: CreateExpenseInput,
  organizationId: string,
  userId: string
): Promise<Expense> {
  try {
    const supabase = await createSupabaseClient();

    // If asset_id is provided, verify it exists and belongs to organization
    if (data.asset_id) {
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('id')
        .eq('id', data.asset_id)
        .eq('organization_id', organizationId)
        .single();

      if (assetError || !asset) {
        throw new Error('Asset not found or access denied');
      }
    }

    const expenseData = {
      ...data,
      organization_id: organizationId,
      created_by: userId,
    };

    const { data: newExpense, error } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select(`
        *,
        asset:assets(id, name, category)
      `)
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      throw new Error(`Failed to create expense: ${error.message}`);
    }

    if (!newExpense) {
      throw new Error('Expense was not created');
    }

    // Also create a corresponding transaction record for financial reports
    const transactionData = {
      organization_id: organizationId,
      type: 'expense' as const,
      category: data.category,
      amount: data.amount,
      currency: data.currency || 'USD',
      transaction_date: data.expense_date,
      description: data.description,
      reference_number: data.reference_number,
      payment_method: data.payment_method,
      asset_id: data.asset_id,
      notes: data.notes,
      created_by: userId,
    };

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert([transactionData]);

    if (transactionError) {
      console.error('Warning: Failed to create transaction record:', transactionError);
      // Don't throw error here - expense was created successfully
      // Transaction record is optional for reporting
    }

    return newExpense;
  } catch (error) {
    console.error('Unexpected error in createExpense:', error);
    throw error;
  }
}

/**
 * Update an existing expense
 * @param id - The expense ID
 * @param data - Partial expense data
 * @param organizationId - The organization ID for validation
 * @returns The updated expense
 */
export async function updateExpense(
  id: string,
  data: UpdateExpenseInput,
  organizationId: string
): Promise<Expense> {
  try {
    const supabase = await createSupabaseClient();

    // Verify expense exists and belongs to organization
    const existingExpense = await getExpenseById(id, organizationId);
    if (!existingExpense) {
      throw new Error('Expense not found or access denied');
    }

    // If asset_id is being updated, verify it exists
    if (data.asset_id) {
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('id')
        .eq('id', data.asset_id)
        .eq('organization_id', organizationId)
        .single();

      if (assetError || !asset) {
        throw new Error('Asset not found or access denied');
      }
    }

    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedExpense, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select(`
        *,
        asset:assets(id, name, category)
      `)
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      throw new Error(`Failed to update expense: ${error.message}`);
    }

    if (!updatedExpense) {
      throw new Error('Expense was not updated');
    }

    // Also update the corresponding transaction record if it exists
    if (data.amount || data.expense_date || data.description || data.category) {
      const transactionUpdateData: TransactionUpdateData = {};
      
      if (data.amount !== undefined) transactionUpdateData.amount = data.amount;
      if (data.expense_date) transactionUpdateData.transaction_date = data.expense_date;
      if (data.description) transactionUpdateData.description = data.description;
      if (data.category) transactionUpdateData.category = data.category;
      if (data.reference_number !== undefined) transactionUpdateData.reference_number = data.reference_number;
      if (data.payment_method !== undefined) transactionUpdateData.payment_method = data.payment_method;
      if (data.asset_id !== undefined) transactionUpdateData.asset_id = data.asset_id;
      if (data.notes !== undefined) transactionUpdateData.notes = data.notes;

      // Find and update transaction by matching expense details
      const { error: transactionError } = await supabase
        .from('transactions')
        .update(transactionUpdateData)
        .eq('organization_id', organizationId)
        .eq('type', 'expense')
        .eq('description', existingExpense.description)
        .eq('amount', existingExpense.amount)
        .eq('transaction_date', existingExpense.expense_date);

      if (transactionError) {
        console.error('Warning: Failed to update transaction record:', transactionError);
        // Don't throw error - expense update was successful
      }
    }

    return updatedExpense;
  } catch (error) {
    console.error('Unexpected error in updateExpense:', error);
    throw error;
  }
}

/**
 * Delete an expense
 * @param id - The expense ID
 * @param organizationId - The organization ID for validation
 */
export async function deleteExpense(
  id: string,
  organizationId: string
): Promise<void> {
  try {
    const supabase = await createSupabaseClient();

    // Verify expense exists and belongs to organization
    const existingExpense = await getExpenseById(id, organizationId);
    if (!existingExpense) {
      throw new Error('Expense not found or access denied');
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error deleting expense:', error);
      throw new Error(`Failed to delete expense: ${error.message}`);
    }

    // Also delete the corresponding transaction record if it exists
    const { error: transactionError } = await supabase
      .from('transactions')
      .delete()
      .eq('organization_id', organizationId)
      .eq('type', 'expense')
      .eq('description', existingExpense.description)
      .eq('amount', existingExpense.amount)
      .eq('transaction_date', existingExpense.expense_date);

    if (transactionError) {
      console.error('Warning: Failed to delete transaction record:', transactionError);
      // Don't throw error - expense deletion was successful
    }
  } catch (error) {
    console.error('Unexpected error in deleteExpense:', error);
    throw error;
  }
}

