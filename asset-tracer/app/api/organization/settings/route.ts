import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

/**
 * Zod schema for organization settings validation
 */
const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').optional(),
  default_currency: z.string().optional(),
  default_tax_rate: z.coerce.number().min(0).max(100).optional(),
  timezone: z.string().optional(),
  date_format: z.string().optional(),
  company_email: z.string().email().optional().or(z.literal('')),
  company_phone: z.string().optional(),
  company_address: z.string().optional(),
  company_city: z.string().optional(),
  company_state: z.string().optional(),
  company_postal_code: z.string().optional(),
  company_country: z.string().optional(),
  company_website: z.string().url().optional().or(z.literal('')),
  company_logo_url: z.string().url().optional().or(z.literal('')),
  default_notes: z.string().optional(),
  invoice_terms: z.string().optional(),
  quotation_terms: z.string().optional(),
  invoice_template: z.enum(['classic', 'compact']).optional(),
  quotation_template: z.enum(['classic', 'compact']).optional(),
});

type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

/**
 * Helper function to get user's organization ID
 */
async function getUserOrganizationId(userId: string) {
  const supabase = await createClient();
  
  const { data: userProfile, error } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (error || !userProfile?.organization_id) {
    throw new Error('Organization not found');
  }

  return userProfile.organization_id;
}

/**
 * GET /api/organization/settings
 * Fetch organization settings
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization ID
    const organizationId = await getUserOrganizationId(user.id);

    // Fetch organization settings
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      return NextResponse.json(
        { error: 'Failed to fetch organization settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        default_currency: organization.default_currency || 'USD',
        default_tax_rate: organization.default_tax_rate || 0,
        timezone: organization.timezone || 'America/New_York',
        date_format: organization.date_format || 'MM/DD/YYYY',
        company_email: organization.company_email || '',
        company_phone: organization.company_phone || '',
        company_address: organization.company_address || '',
        company_city: organization.company_city || '',
        company_state: organization.company_state || '',
        company_postal_code: organization.company_postal_code || '',
        company_country: organization.company_country || '',
        company_website: organization.company_website || '',
        company_logo_url: organization.company_logo_url || '',
        default_notes: organization.default_notes || '',
        invoice_terms: organization.invoice_terms || 'Payment due within 30 days. Late payments may incur additional charges.',
        quotation_terms: organization.quotation_terms || 'This quotation is valid for 30 days from the date of issue. Prices are subject to change after this period.',
        invoice_template: organization.invoice_template || 'classic',
        quotation_template: organization.quotation_template || 'classic',
        created_at: organization.created_at,
        updated_at: organization.updated_at,
        // Subscription fields
        subscription_tier: organization.subscription_tier || 'free',
        subscription_status: organization.subscription_status || 'active',
        subscription_start_date: organization.subscription_start_date,
        subscription_end_date: organization.subscription_end_date,
        polar_customer_id: organization.polar_customer_id,
        polar_subscription_id: organization.polar_subscription_id,
        polar_product_id: organization.polar_product_id,
        polar_subscription_status: organization.polar_subscription_status || 'inactive',
        polar_current_period_start: organization.polar_current_period_start,
        polar_current_period_end: organization.polar_current_period_end,
        polar_metadata: organization.polar_metadata,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/organization/settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organization/settings
 * Update organization settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization ID
    const organizationId = await getUserOrganizationId(user.id);

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateOrganizationSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Build update object
    const updatePayload: Partial<UpdateOrganizationInput> & { updated_at: string } = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.name !== undefined) {
      updatePayload.name = updateData.name;
    }
    if (updateData.default_currency !== undefined) {
      updatePayload.default_currency = updateData.default_currency;
    }
    if (updateData.default_tax_rate !== undefined) {
      updatePayload.default_tax_rate = updateData.default_tax_rate;
    }
    if (updateData.timezone !== undefined) {
      updatePayload.timezone = updateData.timezone;
    }
    if (updateData.date_format !== undefined) {
      updatePayload.date_format = updateData.date_format;
    }
    if (updateData.company_email !== undefined) {
      updatePayload.company_email = updateData.company_email;
    }
    if (updateData.company_phone !== undefined) {
      updatePayload.company_phone = updateData.company_phone;
    }
    if (updateData.company_address !== undefined) {
      updatePayload.company_address = updateData.company_address;
    }
    if (updateData.company_city !== undefined) {
      updatePayload.company_city = updateData.company_city;
    }
    if (updateData.company_state !== undefined) {
      updatePayload.company_state = updateData.company_state;
    }
    if (updateData.company_postal_code !== undefined) {
      updatePayload.company_postal_code = updateData.company_postal_code;
    }
    if (updateData.company_country !== undefined) {
      updatePayload.company_country = updateData.company_country;
    }
    if (updateData.company_website !== undefined) {
      updatePayload.company_website = updateData.company_website;
    }
    if (updateData.company_logo_url !== undefined) {
      updatePayload.company_logo_url = updateData.company_logo_url;
    }
    if (updateData.default_notes !== undefined) {
      updatePayload.default_notes = updateData.default_notes;
    }
    if (updateData.invoice_terms !== undefined) {
      updatePayload.invoice_terms = updateData.invoice_terms;
    }
    if (updateData.quotation_terms !== undefined) {
      updatePayload.quotation_terms = updateData.quotation_terms;
    }
    if (updateData.invoice_template !== undefined) {
      updatePayload.invoice_template = updateData.invoice_template;
    }
    if (updateData.quotation_template !== undefined) {
      updatePayload.quotation_template = updateData.quotation_template;
    }

    console.log('Updating organization:', organizationId, 'with:', updatePayload);

    // Update organization
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updatePayload)
      .eq('id', organizationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating organization:', updateError);
      return NextResponse.json(
        { error: 'Failed to update organization settings', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      organization: updatedOrg,
      message: 'Organization settings updated successfully',
    });
  } catch (error) {
    console.error('Error in PATCH /api/organization/settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

