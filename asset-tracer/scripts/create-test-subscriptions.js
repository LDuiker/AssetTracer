#!/usr/bin/env node

/**
 * Create Test Subscriptions Script
 *
 * This script creates test customers and subscriptions in Polar.sh
 * for testing the AssetTracer billing integration.
 *
 * Usage:
 *   node scripts/create-test-subscriptions.js
 *
 * Or with specific plan:
 *   node scripts/create-test-subscriptions.js pro
 *   node scripts/create-test-subscriptions.js business
 */

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const POLAR_API_KEY = process.env.POLAR_API_KEY;
const POLAR_BASE_URL = process.env.POLAR_BASE_URL || 'https://api.polar.sh';

// Product IDs from your configuration
const PRODUCTS = {
  pro: '4bd7788b-d3dd-4f17-837a-3a5a56341b05',
  business: 'bbb245ef-6915-4c75-b59f-f14d61abb414',
};

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

async function makeRequest(endpoint, options = {}) {
  const url = `${POLAR_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${POLAR_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`API Error (${response.status}): ${responseText}`);
  }

  return JSON.parse(responseText);
}

async function checkApiConnection() {
  logSection('🔌 Checking Polar API Connection');
  
  if (!POLAR_API_KEY) {
    log('❌ POLAR_API_KEY not found in environment variables!', 'red');
    log('\nPlease set POLAR_API_KEY in your .env.local file', 'yellow');
    process.exit(1);
  }

  log(`API Key: ${POLAR_API_KEY.substring(0, 20)}...`, 'cyan');
  log(`Base URL: ${POLAR_BASE_URL}`, 'cyan');

  try {
    // Test API connection with userinfo endpoint
    const userInfo = await makeRequest('/v1/oauth2/userinfo');
    log('✅ API connection successful!', 'green');
    log(`Connected as: ${userInfo.email || userInfo.id}`, 'cyan');
    return true;
  } catch (error) {
    log('❌ API connection failed!', 'red');
    log(`Error: ${error.message}`, 'red');
    log('\nTroubleshooting:', 'yellow');
    log('1. Verify your POLAR_API_KEY in .env.local', 'yellow');
    log('2. Ensure you\'re using a test key: polar_sk_test_...', 'yellow');
    log('3. Check that your Polar.sh account is active', 'yellow');
    return false;
  }
}

async function listProducts() {
  logSection('📦 Checking Products');
  
  try {
    const products = await makeRequest('/v1/products');
    
    if (products.length === 0) {
      log('⚠️  No products found!', 'yellow');
      log('\nYou need to create products in your Polar dashboard:', 'yellow');
      log('Pro Plan: ' + PRODUCTS.pro, 'cyan');
      log('Business Plan: ' + PRODUCTS.business, 'cyan');
      return false;
    }

    log(`Found ${products.length} product(s):`, 'green');
    
    let hasProPlan = false;
    let hasBusinessPlan = false;
    
    products.forEach(product => {
      const isPro = product.id === PRODUCTS.pro;
      const isBusiness = product.id === PRODUCTS.business;
      
      if (isPro) hasProPlan = true;
      if (isBusiness) hasBusinessPlan = true;
      
      const marker = (isPro || isBusiness) ? '✅' : '  ';
      log(`${marker} ${product.name} (${product.id})`, 'cyan');
      
      if (product.prices && product.prices.length > 0) {
        const price = product.prices[0];
        log(`   Price: $${price.amount / 100} ${price.currency}`, 'cyan');
      }
    });

    if (!hasProPlan) {
      log('\n⚠️  Pro Plan product not found!', 'yellow');
      log('Expected ID: ' + PRODUCTS.pro, 'yellow');
    }
    
    if (!hasBusinessPlan) {
      log('⚠️  Business Plan product not found!', 'yellow');
      log('Expected ID: ' + PRODUCTS.business, 'yellow');
    }

    return hasProPlan && hasBusinessPlan;
  } catch (error) {
    log('❌ Failed to fetch products', 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

async function createTestCustomer(emailSuffix = '') {
  const timestamp = Date.now();
  const email = emailSuffix 
    ? `test-${emailSuffix}-${timestamp}@example.com`
    : `test-${timestamp}@example.com`;

  log(`Creating customer: ${email}`, 'cyan');

  try {
    const customer = await makeRequest('/v1/customers', {
      method: 'POST',
      body: JSON.stringify({
        email: email,
        name: `Test User ${timestamp}`,
        metadata: {
          organization_id: `test-org-${timestamp}`,
          organization_name: 'Test Organization',
          created_by_script: true,
          created_at: new Date().toISOString()
        }
      })
    });

    log('✅ Customer created successfully!', 'green');
    log(`Customer ID: ${customer.id}`, 'cyan');
    log(`Email: ${customer.email}`, 'cyan');
    
    return customer;
  } catch (error) {
    log('❌ Failed to create customer', 'red');
    log(`Error: ${error.message}`, 'red');
    throw error;
  }
}

async function createTestSubscription(customerId, productId, planName) {
  log(`\nCreating ${planName} subscription...`, 'cyan');

  try {
    const subscription = await makeRequest('/v1/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: customerId,
        product_id: productId,
        metadata: {
          test: true,
          plan: planName,
          created_by_script: true,
          created_at: new Date().toISOString()
        }
      })
    });

    log(`✅ ${planName} subscription created successfully!`, 'green');
    log(`Subscription ID: ${subscription.id}`, 'cyan');
    log(`Status: ${subscription.status}`, 'cyan');
    log(`Product ID: ${subscription.product_id}`, 'cyan');
    
    if (subscription.current_period_start && subscription.current_period_end) {
      log(`Period: ${subscription.current_period_start} to ${subscription.current_period_end}`, 'cyan');
    }

    return subscription;
  } catch (error) {
    log(`❌ Failed to create ${planName} subscription`, 'red');
    log(`Error: ${error.message}`, 'red');
    throw error;
  }
}

async function listSubscriptions() {
  logSection('📋 Listing Existing Subscriptions');
  
  try {
    const subscriptions = await makeRequest('/v1/subscriptions');
    
    if (subscriptions.length === 0) {
      log('No subscriptions found', 'yellow');
      return;
    }

    log(`Found ${subscriptions.length} subscription(s):`, 'green');
    
    subscriptions.forEach(sub => {
      const status = sub.status === 'active' ? '✅' : '⚠️ ';
      log(`${status} ${sub.id}`, 'cyan');
      log(`   Customer: ${sub.customer_id}`, 'cyan');
      log(`   Product: ${sub.product_id}`, 'cyan');
      log(`   Status: ${sub.status}`, 'cyan');
    });
  } catch (error) {
    log('❌ Failed to list subscriptions', 'red');
    log(`Error: ${error.message}`, 'red');
  }
}

async function main() {
  logSection('🚀 Polar Test Subscriptions Creator');
  
  log('This script will create test customers and subscriptions', 'cyan');
  log('in your Polar.sh sandbox environment.\n', 'cyan');

  // Get plan from command line argument
  const args = process.argv.slice(2);
  const planArg = args[0]?.toLowerCase();
  
  let plansToCreate = [];
  
  if (planArg === 'pro') {
    plansToCreate = [{ name: 'Pro', id: PRODUCTS.pro }];
  } else if (planArg === 'business') {
    plansToCreate = [{ name: 'Business', id: PRODUCTS.business }];
  } else {
    // Create both by default
    plansToCreate = [
      { name: 'Pro', id: PRODUCTS.pro },
      { name: 'Business', id: PRODUCTS.business }
    ];
  }

  try {
    // Step 1: Check API connection
    const connected = await checkApiConnection();
    if (!connected) {
      process.exit(1);
    }

    // Step 2: List existing subscriptions
    await listSubscriptions();

    // Step 3: Check products
    const productsExist = await listProducts();
    if (!productsExist) {
      log('\n⚠️  Required products not found in Polar dashboard!', 'yellow');
      log('\nPlease create the products first:', 'yellow');
      log('1. Go to https://polar.sh', 'cyan');
      log('2. Navigate to Products', 'cyan');
      log('3. Create products with these exact IDs:', 'cyan');
      log(`   - Pro Plan: ${PRODUCTS.pro}`, 'cyan');
      log(`   - Business Plan: ${PRODUCTS.business}`, 'cyan');
      process.exit(1);
    }

    // Step 4: Create subscriptions
    logSection('📝 Creating Test Subscriptions');

    const results = [];

    for (const plan of plansToCreate) {
      try {
        log(`\n--- Creating ${plan.name} Plan Subscription ---\n`, 'bright');
        
        // Create customer
        const customer = await createTestCustomer(plan.name.toLowerCase());
        
        // Create subscription
        const subscription = await createTestSubscription(
          customer.id,
          plan.id,
          plan.name
        );

        results.push({
          plan: plan.name,
          customer,
          subscription,
          success: true
        });

        log(`\n✅ ${plan.name} subscription created successfully!\n`, 'green');
      } catch (error) {
        results.push({
          plan: plan.name,
          success: false,
          error: error.message
        });
        log(`\n❌ Failed to create ${plan.name} subscription\n`, 'red');
      }
    }

    // Summary
    logSection('📊 Summary');

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    log(`Total: ${results.length}`, 'cyan');
    log(`Successful: ${successful}`, 'green');
    log(`Failed: ${failed}`, failed > 0 ? 'red' : 'cyan');

    if (successful > 0) {
      log('\n✨ Test subscriptions created successfully!\n', 'green');
      log('Next steps:', 'bright');
      log('1. Check your Polar dashboard: https://polar.sh', 'cyan');
      log('2. Verify subscriptions appear in your dashboard', 'cyan');
      log('3. Test webhooks if configured', 'cyan');
      log('4. Verify database updates in Supabase', 'cyan');

      log('\nCreated subscriptions:', 'bright');
      results.filter(r => r.success).forEach(result => {
        log(`\n${result.plan} Plan:`, 'yellow');
        log(`  Customer ID: ${result.customer.id}`, 'cyan');
        log(`  Email: ${result.customer.email}`, 'cyan');
        log(`  Subscription ID: ${result.subscription.id}`, 'cyan');
        log(`  Status: ${result.subscription.status}`, 'cyan');
      });
    }

    if (failed > 0) {
      log('\n❌ Some subscriptions failed to create:', 'red');
      results.filter(r => !r.success).forEach(result => {
        log(`${result.plan}: ${result.error}`, 'red');
      });
    }

  } catch (error) {
    log('\n❌ Script failed with error:', 'red');
    log(error.message, 'red');
    
    if (error.stack) {
      log('\nStack trace:', 'yellow');
      log(error.stack, 'yellow');
    }
    
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

