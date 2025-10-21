import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
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

    // Get user's organization and role
    const { data: userData, error: profileError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !userData?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Only owners and admins can invite
    if (userData.role !== 'owner' && userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can invite team members' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validationResult = inviteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email, role } = validationResult.data;

    // Get organization details for subscription check
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', userData.organization_id)
      .single();

    if (orgError) {
      return NextResponse.json(
        { error: 'Failed to fetch organization' },
        { status: 500 }
      );
    }

    // Count current team members
    const { count: memberCount } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', userData.organization_id);

    // Check subscription limits
    const tier = orgData.subscription_tier || 'free';
    const limits: Record<string, number> = {
      free: 1,
      pro: 5,
      business: 20,
    };

    const maxUsers = limits[tier] || 1;

    if (memberCount !== null && memberCount >= maxUsers) {
      return NextResponse.json(
        { 
          error: 'Team member limit reached',
          message: `Your ${tier} plan allows up to ${maxUsers} team member${maxUsers > 1 ? 's' : ''}. Upgrade to add more members.`,
          limit: maxUsers,
          current: memberCount,
        },
        { status: 403 }
      );
    }

    // Check if user already exists in the organization
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .eq('organization_id', userData.organization_id)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation
    const { data: existingInvite } = await supabase
      .from('team_invitations')
      .select('id, status')
      .eq('organization_id', userData.organization_id)
      .eq('email', email)
      .maybeSingle();

    if (existingInvite && existingInvite.status === 'pending') {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      );
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex');
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .insert([
        {
          organization_id: userData.organization_id,
          email,
          role,
          invited_by: user.id,
          token,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // TODO: Send invitation email
    // For now, we'll return the invitation link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invite?token=${token}`;

    return NextResponse.json({
      success: true,
      invitation,
      inviteLink, // In production, this would be sent via email
      message: 'Invitation sent successfully',
    });
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

