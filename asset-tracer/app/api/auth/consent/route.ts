import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface ConsentData {
  termsAccepted: boolean;
  marketingConsent: boolean;
  termsAcceptedAt: string;
  termsAcceptedIp?: string;
  marketingConsentAt?: string;
}

/**
 * API endpoint to save user consent data
 * Called after OAuth callback when a new user is created
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const body = await request.json();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in first.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Validate required fields
    if (!body.termsAccepted) {
      return NextResponse.json(
        { error: 'Terms acceptance is required.' },
        { status: 400 }
      );
    }

    // Get user's IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded 
      ? forwarded.split(',')[0].trim() 
      : realIp 
      ? realIp.trim()
      : request.headers.get('cf-connecting-ip') || 'unknown';

    // Prepare consent data
    const consentData: Partial<ConsentData> = {
      termsAccepted: true,
      termsAcceptedAt: body.termsAcceptedAt || new Date().toISOString(),
      termsAcceptedIp: ip,
    };

    // Add marketing consent if provided
    if (body.marketingConsent) {
      consentData.marketingConsent = true;
      consentData.marketingConsentAt = body.marketingConsentAt || new Date().toISOString();
    } else {
      consentData.marketingConsent = false;
      consentData.marketingConsentAt = null;
    }

    // Update user record with consent data
    const { error: updateError } = await supabase
      .from('users')
      .update({
        terms_accepted_at: consentData.termsAcceptedAt,
        terms_accepted_ip: consentData.termsAcceptedIp,
        marketing_consent: consentData.marketingConsent,
        marketing_consent_at: consentData.marketingConsentAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user consent:', updateError);
      return NextResponse.json(
        { error: 'Failed to save consent data.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Consent data saved successfully.',
    });
  } catch (error) {
    console.error('Error in consent API:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

