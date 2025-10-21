import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: memberId } = await params;

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

    // Only owners and admins can update roles
    if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can update roles' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validationResult = updateRoleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { role } = validationResult.data;

    // Get the member to update
    const { data: memberToUpdate, error: memberError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', memberId)
      .single();

    if (memberError || !memberToUpdate) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check if member is in the same organization
    if (memberToUpdate.organization_id !== currentUser.organization_id) {
      return NextResponse.json(
        { error: 'Member not in your organization' },
        { status: 403 }
      );
    }

    // Cannot change owner role
    if (memberToUpdate.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot change owner role' },
        { status: 403 }
      );
    }

    // Update the member's role
    const { data: updatedMember, error: updateError } = await supabase
      .from('users')
      .update({ role })
      .eq('id', memberId)
      .select('id, email, name, role, created_at')
      .single();

    if (updateError) {
      console.error('Error updating member role:', updateError);
      return NextResponse.json(
        { error: 'Failed to update member role' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      member: updatedMember,
    });
  } catch (error) {
    console.error('Update member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: memberId } = await params;

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

    // Only owners and admins can remove members
    if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can remove members' },
        { status: 403 }
      );
    }

    // Get the member to remove
    const { data: memberToRemove, error: memberError } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', memberId)
      .single();

    if (memberError || !memberToRemove) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check if member is in the same organization
    if (memberToRemove.organization_id !== currentUser.organization_id) {
      return NextResponse.json(
        { error: 'Member not in your organization' },
        { status: 403 }
      );
    }

    // Cannot remove owner
    if (memberToRemove.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove organization owner' },
        { status: 403 }
      );
    }

    // Cannot remove yourself
    if (memberId === user.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself' },
        { status: 403 }
      );
    }

    // Delete the member
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', memberId);

    if (deleteError) {
      console.error('Error removing member:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

