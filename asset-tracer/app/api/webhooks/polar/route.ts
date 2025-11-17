import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { polar, PolarWebhookEvent } from '@/lib/polar';

type PolarSubscriptionPayload = {
  id: string;
  customer_id: string;
  product_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  metadata?: ({ tier?: string } & Record<string, unknown>) | null;
};

type PolarCustomerPayload = {
  id: string;
  email?: string | null;
  name?: string | null;
  metadata?: Record<string, unknown> | null;
};

type SubscriptionEventAttributes = {
  subscription: PolarSubscriptionPayload;
};

type CustomerEventAttributes = {
  customer: PolarCustomerPayload;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('polar-signature') || '';
    
    // Verify webhook signature
    if (!polar.verifyWebhookSignature(body, signature)) {
      console.error('Invalid Polar webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event: PolarWebhookEvent = JSON.parse(body);
    console.log('Received Polar webhook:', event.type);

    const supabase = await createClient();

    switch (event.type) {
      case 'subscription.created':
        await handleSubscriptionCreated(event, supabase);
        break;
      
      case 'subscription.updated':
        await handleSubscriptionUpdated(event, supabase);
        break;
      
      case 'subscription.canceled':
        await handleSubscriptionCanceled(event, supabase);
        break;
      
      case 'subscription.payment_succeeded':
        await handlePaymentSucceeded(event, supabase);
        break;
      
      case 'subscription.payment_failed':
        await handlePaymentFailed(event, supabase);
        break;
      
      case 'customer.created':
        await handleCustomerCreated(event);
        break;
      
      case 'customer.updated':
        await handleCustomerUpdated(event, supabase);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleSubscriptionCreated(event: PolarWebhookEvent, supabase: SupabaseClient) {
  const { subscription } = event.data.attributes as SubscriptionEventAttributes;
  
  console.log('Processing subscription.created webhook:', {
    subscription_id: subscription.id,
    customer_id: subscription.customer_id,
    metadata: subscription.metadata
  });
  
  // Find organization by Polar customer ID
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('polar_customer_id', subscription.customer_id)
    .single();

  if (!org) {
    console.error('Organization not found for customer:', subscription.customer_id);
    return;
  }

  // Get tier from metadata, or fallback to product ID mapping
  const metadataTier = subscription.metadata?.tier;
  
  // Product ID to tier mapping (fallback if metadata is missing)
  const productIdToTier: Record<string, string> = {
    'd0ef8f7a-657b-4115-8fb2-7bdfd4af3b18': 'pro', // Pro Monthly product
    // Add other product IDs here as needed
  };
  
  const subscriptionTier = typeof metadataTier === 'string' 
    ? metadataTier 
    : (subscription.product_id && productIdToTier[subscription.product_id]) || 'free';
  
  console.log(`Updating organization ${org.id} to tier: ${subscriptionTier}`, {
    product_id: subscription.product_id,
    metadata_tier: metadataTier,
    determined_tier: subscriptionTier,
  });

  // Update organization with subscription details
  await supabase
    .from('organizations')
    .update({
      polar_subscription_id: subscription.id,
      polar_product_id: subscription.product_id,
      polar_subscription_status: subscription.status,
      subscription_tier: subscriptionTier,
      subscription_status: 'active',
      subscription_start_date: subscription.current_period_start,
      subscription_end_date: subscription.current_period_end,
      polar_current_period_start: subscription.current_period_start,
      polar_current_period_end: subscription.current_period_end,
      polar_metadata: subscription.metadata ?? {},
      updated_at: new Date().toISOString(),
    })
    .eq('id', org.id);

  console.log(`✅ Subscription created for organization ${org.id}, tier: ${subscriptionTier}`);
}

async function handleSubscriptionUpdated(event: PolarWebhookEvent, supabase: SupabaseClient) {
  const { subscription } = event.data.attributes as SubscriptionEventAttributes;
  
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('polar_subscription_id', subscription.id)
    .single();

  if (!org) {
    console.error('Organization not found for subscription:', subscription.id);
    return;
  }

  // Get tier from metadata, or fallback to product ID mapping
  const metadataTier = subscription.metadata?.tier;
  
  // Product ID to tier mapping (fallback if metadata is missing)
  const productIdToTier: Record<string, string> = {
    'd0ef8f7a-657b-4115-8fb2-7bdfd4af3b18': 'pro', // Pro Monthly product
    // Add other product IDs here as needed
  };
  
  const subscriptionTier = typeof metadataTier === 'string' 
    ? metadataTier 
    : (subscription.product_id && productIdToTier[subscription.product_id]) || org.subscription_tier || 'free';
  
  console.log(`Updating subscription for organization ${org.id}`, {
    product_id: subscription.product_id,
    metadata_tier: metadataTier,
    determined_tier: subscriptionTier,
  });

  // Update organization with new subscription details
  await supabase
    .from('organizations')
    .update({
      polar_product_id: subscription.product_id,
      polar_subscription_status: subscription.status,
      subscription_tier: subscriptionTier,
      subscription_status: subscription.status === 'active' ? 'active' : 'inactive',
      subscription_start_date: subscription.current_period_start,
      subscription_end_date: subscription.current_period_end,
      polar_current_period_start: subscription.current_period_start,
      polar_current_period_end: subscription.current_period_end,
      polar_metadata: subscription.metadata ?? {},
      updated_at: new Date().toISOString(),
    })
    .eq('id', org.id);

  console.log(`✅ Subscription updated for organization ${org.id}, tier: ${subscriptionTier}`);
}

async function handleSubscriptionCanceled(event: PolarWebhookEvent, supabase: SupabaseClient) {
  const { subscription } = event.data.attributes as SubscriptionEventAttributes;
  
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('polar_subscription_id', subscription.id)
    .single();

  if (!org) {
    console.error('Organization not found for subscription:', subscription.id);
    return;
  }

  // Downgrade to free tier
  await supabase
    .from('organizations')
    .update({
      polar_subscription_status: 'canceled',
      subscription_tier: 'free',
      subscription_status: 'inactive',
      subscription_end_date: subscription.current_period_end,
      polar_current_period_end: subscription.current_period_end,
    })
    .eq('id', org.id);

  console.log(`Subscription canceled for organization ${org.id}, downgraded to free`);
}

async function handlePaymentSucceeded(event: PolarWebhookEvent, supabase: SupabaseClient) {
  const { subscription } = event.data.attributes as SubscriptionEventAttributes;
  
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('polar_subscription_id', subscription.id)
    .single();

  if (!org) {
    console.error('Organization not found for subscription:', subscription.id);
    return;
  }

  // Update subscription status to active
  await supabase
    .from('organizations')
    .update({
      polar_subscription_status: 'active',
      subscription_status: 'active',
      polar_current_period_start: subscription.current_period_start,
      polar_current_period_end: subscription.current_period_end,
    })
    .eq('id', org.id);

  console.log(`Payment succeeded for organization ${org.id}`);
}

async function handlePaymentFailed(event: PolarWebhookEvent, supabase: SupabaseClient) {
  const { subscription } = event.data.attributes as SubscriptionEventAttributes;
  
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('polar_subscription_id', subscription.id)
    .single();

  if (!org) {
    console.error('Organization not found for subscription:', subscription.id);
    return;
  }

  // Update subscription status to past_due
  await supabase
    .from('organizations')
    .update({
      polar_subscription_status: 'past_due',
      subscription_status: 'past_due',
    })
    .eq('id', org.id);

  console.log(`Payment failed for organization ${org.id}`);
}

async function handleCustomerCreated(event: PolarWebhookEvent) {
  const { customer } = event.data.attributes as CustomerEventAttributes;
  
  // This is typically handled when creating a subscription
  // but we can log it for reference
  console.log(`Customer created: ${customer.id}`);
}

async function handleCustomerUpdated(event: PolarWebhookEvent, supabase: SupabaseClient) {
  const { customer } = event.data.attributes as CustomerEventAttributes;
  
  // Update customer information if needed
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('polar_customer_id', customer.id)
    .single();

  if (org) {
    await supabase
      .from('organizations')
      .update({
        polar_metadata: {
          ...(org.polar_metadata ?? {}),
          customer_email: customer.email,
          customer_name: customer.name,
        },
      })
      .eq('id', org.id);

    console.log(`Customer updated for organization ${org.id}`);
  }
}
