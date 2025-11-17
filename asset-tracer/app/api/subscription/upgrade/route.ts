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
    const body = (await request.json()) as unknown;
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

    // Map tier to Polar Price IDs from environment variables
    // These should be set in your .env file (POLAR_PRO_PRICE_ID, POLAR_BUSINESS_PRICE_ID)
    const proPriceId = process.env.POLAR_PRO_PRICE_ID || process.env.NEXT_PUBLIC_POLAR_PRO_PRICE_ID || '';
    const businessPriceId = process.env.POLAR_BUSINESS_PRICE_ID || process.env.NEXT_PUBLIC_POLAR_BUSINESS_PRICE_ID || '';
    
    // CRITICAL DEBUG: Log environment variable status
    console.error('🔍 PRICE ID DEBUG - Environment Variables:', {
      'POLAR_PRO_PRICE_ID': process.env.POLAR_PRO_PRICE_ID || 'NOT SET',
      'NEXT_PUBLIC_POLAR_PRO_PRICE_ID': process.env.NEXT_PUBLIC_POLAR_PRO_PRICE_ID || 'NOT SET',
      'POLAR_BUSINESS_PRICE_ID': process.env.POLAR_BUSINESS_PRICE_ID || 'NOT SET',
      'NEXT_PUBLIC_POLAR_BUSINESS_PRICE_ID': process.env.NEXT_PUBLIC_POLAR_BUSINESS_PRICE_ID || 'NOT SET',
      'Selected proPriceId': proPriceId || 'EMPTY',
      'Selected businessPriceId': businessPriceId || 'EMPTY',
      'Requested tier': tier,
    });
    
    const priceIdMapping: Record<string, string> = {
      pro: proPriceId,
      business: businessPriceId,
    };

    // Log what we found for debugging
    console.error('🔍 PRICE ID DEBUG - Final Mapping:', {
      tier,
      proPriceId: proPriceId || 'NOT SET',
      businessPriceId: businessPriceId || 'NOT SET',
      selectedPriceId: priceIdMapping[tier] || 'NOT SET',
      allPolarEnvKeys: Object.keys(process.env).filter(k => k.includes('POLAR')),
    });

    const priceId = priceIdMapping[tier];
    if (!priceId) {
      console.error('Missing Price ID for tier:', tier, {
        envKeys: Object.keys(process.env).filter(k => k.includes('POLAR') && k.includes('PRICE')),
        proPriceId,
        businessPriceId,
      });
      return NextResponse.json(
        { 
          error: 'Subscription configuration error',
          details: `Price ID not configured for ${tier} plan. Please contact support.`
        },
        { status: 500 }
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
        } catch (customerError: unknown) {
          const customerErrorMessage =
            customerError instanceof Error ? customerError.message : 'Unknown Polar customer error';
          // If customer already exists, try to get existing customer by email
          if (customerError instanceof Error && customerError.message.includes('already exists')) {
            console.log('Customer already exists, fetching existing customer...');
            const existingCustomer = await polar.getCustomerByEmail(user.email!);
            customerId = existingCustomer.id;
          } else {
            throw new Error(customerErrorMessage);
          }
        }
      }

      // Create checkout session for subscription
      // Clean the app URL to remove any leading/trailing = or whitespace
      let appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim();
      
      // Remove any = characters from start or end
      appUrl = appUrl.replace(/^=+/, '').replace(/=+$/, '').trim();
      
      if (!appUrl) {
        console.error('NEXT_PUBLIC_APP_URL is missing or empty:', {
          raw: process.env.NEXT_PUBLIC_APP_URL,
          cleaned: appUrl,
        });
        throw new Error('NEXT_PUBLIC_APP_URL is not configured');
      }
      
      // Ensure URL doesn't end with /
      appUrl = appUrl.replace(/\/+$/, '');
      
      const successUrl = `${appUrl}/settings?tab=billing&success=true`;
      const cancelUrl = `${appUrl}/settings?tab=billing&canceled=true`;
      
      console.log('Preparing checkout with URLs:', {
        appUrl,
        successUrl,
        cancelUrl,
        priceId,
        tier,
      });
      
      const checkoutSession = await polar.createCheckoutSession(
        customerId,
        priceId,
        successUrl,
        cancelUrl,
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
    } catch (polarError: unknown) {
      console.error('Polar API error:', polarError);
      const polarErrorMessage =
        polarError instanceof Error ? polarError.message : 'Unknown Polar API error';
      const polarErrorStack = polarError instanceof Error ? polarError.stack : undefined;
      console.error('Error details:', {
        message: polarErrorMessage,
        stack: polarErrorStack,
        priceId,
        customerId,
        tier,
        organizationId: organization.id,
        userEmail: user.email,
      });
      
      // Provide more helpful error messages
      let userFriendlyError = 'Failed to create checkout session';
      if (polarErrorMessage.includes('Price') || polarErrorMessage.includes('price')) {
        userFriendlyError = 'Invalid subscription plan configuration. Please contact support.';
      } else if (polarErrorMessage.includes('Customer') || polarErrorMessage.includes('customer')) {
        userFriendlyError = 'Unable to process payment. Please try again or contact support.';
      } else if (polarErrorMessage.includes('401') || polarErrorMessage.includes('Unauthorized')) {
        userFriendlyError = 'Payment service authentication failed. Please contact support.';
      }
      
      return NextResponse.json(
        { 
          error: userFriendlyError, 
          details: process.env.NODE_ENV === 'development' ? polarErrorMessage : undefined
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Upgrade error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Unexpected error in upgrade route:', {
      message: errorMessage,
      stack: errorStack,
    });
    
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

