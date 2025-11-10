/**
 * Polar.sh API Client
 * Handles subscription management and payment processing
 */

export interface PolarProduct {
  id: string;
  name: string;
  description?: string;
  price: {
    amount: number;
    currency: string;
  };
  type: 'recurring' | 'one_time';
  recurring?: {
    interval: 'month' | 'year';
  };
}

export interface PolarSubscription {
  id: string;
  customer_id: string;
  product_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  metadata?: Record<string, unknown>;
}

export interface PolarCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface PolarWebhookEvent {
  type: string;
  data: {
    id: string;
    type: string;
    attributes: Record<string, unknown>;
  };
}

type PolarCheckoutResponse = {
  url?: string;
  checkout_url?: string;
  id?: string;
  checkout_id?: string;
};

type PolarCustomerPortalResponse = {
  url?: string;
  portal_url?: string;
};

class PolarClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.POLAR_API_KEY || '';
    this.baseUrl = process.env.POLAR_BASE_URL || 'https://api.polar.sh';
    console.log('Polar Client initialized:', {
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey.substring(0, 15),
      baseUrl: this.baseUrl
    });
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Polar API Error:', {
        status: response.status,
        statusText: response.statusText,
        url,
        error,
        body: options.body
      });
      throw new Error(`Polar API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  // Product Management
  async getProducts(): Promise<PolarProduct[]> {
    return this.request<PolarProduct[]>('/v1/products');
  }

  async getProduct(productId: string): Promise<PolarProduct> {
    return this.request<PolarProduct>(`/v1/products/${productId}`);
  }

  // Customer Management
  async createCustomer(email: string, name?: string, metadata?: Record<string, unknown>): Promise<PolarCustomer> {
    return this.request<PolarCustomer>('/v1/customers', {
      method: 'POST',
      body: JSON.stringify({
        email,
        name,
        metadata,
      }),
    });
  }

  async getCustomer(customerId: string): Promise<PolarCustomer> {
    return this.request<PolarCustomer>(`/v1/customers/${customerId}`);
  }

  async getCustomerByEmail(email: string): Promise<PolarCustomer> {
    // List customers filtered by email
    const response = await this.request<{ items: PolarCustomer[] }>(`/v1/customers?email=${encodeURIComponent(email)}`);
    if (response.items && response.items.length > 0) {
      return response.items[0];
    }
    throw new Error(`Customer not found with email: ${email}`);
  }

  async updateCustomer(customerId: string, updates: Partial<PolarCustomer>): Promise<PolarCustomer> {
    return this.request<PolarCustomer>(`/v1/customers/${customerId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Subscription Management
  async createSubscription(
    customerId: string,
    productId: string,
    metadata?: Record<string, unknown>
  ): Promise<PolarSubscription> {
    return this.request<PolarSubscription>('/v1/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: customerId,
        product_id: productId,
        metadata,
      }),
    });
  }

  async getSubscription(subscriptionId: string): Promise<PolarSubscription> {
    return this.request<PolarSubscription>(`/v1/subscriptions/${subscriptionId}`);
  }

  async updateSubscription(
    subscriptionId: string,
    updates: Partial<PolarSubscription>
  ): Promise<PolarSubscription> {
    return this.request<PolarSubscription>(`/v1/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async cancelSubscription(subscriptionId: string): Promise<PolarSubscription> {
    return this.request<PolarSubscription>(`/v1/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
    });
  }

  // Checkout Sessions
  async createCheckoutSession(
    customerId: string,
    productId: string,
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, unknown>
  ): Promise<{ url: string; session_id: string }> {
    // Try /v1/checkouts endpoint (standard checkout creation)
    const response = await this.request<PolarCheckoutResponse>('/v1/checkouts', {
      method: 'POST',
      body: JSON.stringify({
        product_price_id: productId,
        success_url: successUrl,
        customer_id: customerId,
        metadata,
      }),
    });
    
    // Return normalized response
    return {
      url: response.url ?? response.checkout_url ?? '',
      session_id: response.id ?? response.checkout_id ?? ''
    };
  }

  // Customer Portal Session
  async createCustomerPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<{ url: string }> {
    try {
      // Try Polar's customer portal endpoint
      // Note: Polar may not have a customer portal API like Stripe
      // This endpoint may need adjustment based on Polar's actual API
      const response = await this.request<PolarCustomerPortalResponse>('/v1/customer-portal', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: customerId,
          return_url: returnUrl,
        }),
      });
      
      return {
        url: response.url ?? response.portal_url ?? ''
      };
    } catch (error: unknown) {
      console.error('Failed to create customer portal session:', error);
      // Fallback: construct a direct link to Polar dashboard
      // Users will need to log in to Polar directly
      return {
        url: `https://polar.sh/dashboard/settings`
      };
    }
  }

  // Webhook Verification
  verifyWebhookSignature(payload: string, signature: string): boolean {
    void payload;
    void signature;
    // Implementation depends on Polar.sh's webhook signature verification method
    // This is a placeholder - replace with actual verification logic
    return true;
  }
}

export const polar = new PolarClient();
