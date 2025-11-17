import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const acceptInviteSchema = z.object({
  token: z.string().min(1),
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
        { error: 'You must be signed in to accept an invitation' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validationResult = acceptInviteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { token } = validationResult.data;

    // Find the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('*, organizations(name), users!team_invitations_invited_by_fkey(email, name)')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or already used' },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      // Mark as expired
      await supabase
        .from('team_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    // Note: We allow accepting invitations with any email address
    // The invitation email is just for reference - users can accept with their preferred email

    // Check if user is already in the organization
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('id', user.id)
      .single();

    if (existingUser?.organization_id === invitation.organization_id) {
      // User is already in this organization, just mark invitation as accepted
      await supabase
        .from('team_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      return NextResponse.json({
        success: true,
        message: 'You are already a member of this organization',
        alreadyMember: true,
      });
    }

    // Log the user's email to ensure we're using the correct one
    console.log('🔵 Accepting invitation - START:', {
      userId: user.id,
      userEmail: user.email,
      userMetadata: user.user_metadata,
      invitationEmail: invitation.email,
      organizationId: invitation.organization_id,
      existingUser: existingUser ? { id: existingUser.id, organizationId: existingUser.organization_id } : null,
    });

    // If user has a different organization, they need to leave it first
    // For now, we'll allow them to join (they can have multiple orgs in the future)
    // But for simplicity, let's update their organization_id
    if (existingUser) {
      // Update user's organization and role
      // IMPORTANT: Only update organization_id and role, preserve email and other fields
      const { error: updateError } = await supabase
        .from('users')
        .update({
          organization_id: invitation.organization_id,
          role: invitation.role,
          // Explicitly preserve email - don't update it
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user organization:', updateError);
        return NextResponse.json(
          { error: 'Failed to join organization' },
          { status: 500 }
        );
      }

      // Verify the email wasn't changed and log the final state
      const { data: updatedUser, error: verifyError } = await supabase
        .from('users')
        .select('id, email, name, organization_id, role')
        .eq('id', user.id)
        .single();

      console.log('🔵 After updating user organization:', {
        updatedUser,
        verifyError,
        expectedEmail: user.email,
      });

      if (updatedUser && updatedUser.email !== user.email) {
        console.error('⚠️ Email mismatch after update!', {
          expected: user.email,
          actual: updatedUser.email,
        });
        // Fix it by updating the email back
        const { error: fixError } = await supabase
          .from('users')
          .update({ email: user.email! })
          .eq('id', user.id);
        
        if (fixError) {
          console.error('❌ Failed to fix email:', fixError);
        } else {
          console.log('✅ Email fixed back to:', user.email);
        }
      }
    } else {
      // Create user record if it doesn't exist
      // Use the signed-in user's email, NOT the invitation email
      const { error: createError } = await supabase
        .from('users')
        .insert([
          {
            id: user.id,
            email: user.email!, // Use signed-in user's email
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
            organization_id: invitation.organization_id,
            role: invitation.role,
          },
        ]);

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to join organization' },
          { status: 500 }
        );
      }

      // Verify the user was created correctly
      const { data: createdUser, error: verifyError } = await supabase
        .from('users')
        .select('id, email, name, organization_id, role')
        .eq('id', user.id)
        .single();

      console.log('🔵 After creating user:', {
        createdUser,
        verifyError,
        expectedEmail: user.email,
      });

      if (createdUser && createdUser.email !== user.email) {
        console.error('⚠️ Email mismatch after create!', {
          expected: user.email,
          actual: createdUser.email,
        });
        // Fix it by updating the email
        const { error: fixError } = await supabase
          .from('users')
          .update({ email: user.email! })
          .eq('id', user.id);
        
        if (fixError) {
          console.error('❌ Failed to fix email:', fixError);
        } else {
          console.log('✅ Email fixed to:', user.email);
        }
      }
    }

    // Mark invitation as accepted using admin client (bypasses RLS)
    // This is needed because the user might not be in the organization yet
    const adminClient = createAdminClient();
    const { error: acceptError } = await adminClient
      .from('team_invitations')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    if (acceptError) {
      console.error('Error accepting invitation:', acceptError);
      console.error('Accept error details:', JSON.stringify(acceptError, null, 2));
      // Don't fail the request - user is already added, but log the error
    } else {
      console.log(`✅ Invitation ${invitation.id} marked as accepted`);
    }

    // Final verification - get the user record one more time
    const { data: finalUser } = await supabase
      .from('users')
      .select('id, email, name, organization_id, role')
      .eq('id', user.id)
      .single();

    console.log('🔵 Final user state after acceptance:', {
      finalUser,
      authUserEmail: user.email,
      invitationEmail: invitation.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the team!',
      organization: {
        id: invitation.organization_id,
        name: invitation.organizations?.name,
      },
      role: invitation.role,
      userEmail: finalUser?.email || user.email,
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch invitation details (for display)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('*, organizations(name), users!team_invitations_invited_by_fkey(email, name)')
      .eq('token', token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if expired
    const expiresAt = new Date(invitation.expires_at);
    const isExpired = expiresAt < new Date();

    if (isExpired && invitation.status === 'pending') {
      // Mark as expired
      await supabase
        .from('team_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: isExpired ? 'expired' : invitation.status,
        expiresAt: invitation.expires_at,
        organization: {
          id: invitation.organization_id,
          name: invitation.organizations?.name,
        },
        inviter: {
          email: invitation.users?.email,
          name: invitation.users?.name,
        },
      },
    });
  } catch (error) {
    console.error('Get invitation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

