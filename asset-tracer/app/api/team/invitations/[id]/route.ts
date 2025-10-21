import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: invitationId } = await params;

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

    // Get current user's role
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only owners and admins can cancel invitations
    if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can cancel invitations' },
        { status: 403 }
      );
    }

    // Get the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('team_invitations')
      .select('organization_id')
      .eq('id', invitationId)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation is from the same organization
    if (invitation.organization_id !== currentUser.organization_id) {
      return NextResponse.json(
        { error: 'Invitation not in your organization' },
        { status: 403 }
      );
    }

    // Delete the invitation
    const { error: deleteError } = await supabase
      .from('team_invitations')
      .delete()
      .eq('id', invitationId);

    if (deleteError) {
      console.error('Error canceling invitation:', deleteError);
      return NextResponse.json(
        { error: 'Failed to cancel invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation canceled successfully',
    });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

