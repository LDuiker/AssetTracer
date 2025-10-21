import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { polar } from '@/lib/polar';
import { z } from 'zod';

const upgradeSchema = z.object({
  tier: z.enum(['pro', 'business']),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: userData, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userData?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validationResult = upgradeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { tier } = validationResult.data;

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', userData.organization_id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Map tier to Polar Price IDs (NOT Product IDs!)
    const productMapping: Record<string, string> = {
      pro: '15716604-b369-47b2-bc73-90d452a3c9b7',      // Pro Plan - $19/month
      business: 'ef965b20-266e-4bad-96d3-387a19f2c7c8', // Business Plan - $39/month
    };

    const productId = productMapping[tier];
    if (!productId) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    // Declare customerId outside try-catch for error logging
    let customerId: string | undefined;

    try {
      // Create or get Polar customer
      customerId = organization.polar_customer_id;
      
      if (!customerId) {
        try {
          // Try to create a new customer
          const customer = await polar.createCustomer(
            user.email!,
            user.user_metadata?.full_name || user.email!,
            {
              organization_id: organization.id,
              organization_name: organization.name,
            }
          );
          customerId = customer.id;
        } catch (customerError: any) {
          // If customer already exists, try to get existing customer by email
          if (customerError.message.includes('already exists')) {
            console.log('Customer already exists, fetching existing customer...');
            const existingCustomer = await polar.getCustomerByEmail(user.email!);
            customerId = existingCustomer.id;
          } else {
            throw customerError;
          }
        }
      }

      // Create checkout session for subscription
      const checkoutSession = await polar.createCheckoutSession(
        customerId,
        productId,
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing&success=true`,
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing&canceled=true`,
        {
          organization_id: organization.id,
          tier,
          customer_email: user.email,
        }
      );

      // Update organization with Polar customer ID
      await supabase
        .from('organizations')
        .update({
          polar_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organization.id);

      return NextResponse.json({
        success: true,
        checkout_url: checkoutSession.url,
        session_id: checkoutSession.session_id,
        message: `Redirecting to checkout for ${tier} plan`,
      });
    } catch (polarError: any) {
      console.error('Polar API error:', polarError);
      console.error('Error details:', {
        message: polarError.message,
        stack: polarError.stack,
        productId,
        customerId
      });
      return NextResponse.json(
        { error: 'Failed to create checkout session', details: polarError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Upgrade error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

