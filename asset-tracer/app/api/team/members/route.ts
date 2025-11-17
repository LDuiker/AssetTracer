import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
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

    // Get all team members for the organization
    console.log('🔍 Fetching team members for organization:', userData.organization_id);
    let { data: members, error: membersError } = await supabase
      .from('users')
      .select('id, email, name, role, created_at, organization_id')
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: true });

    // If RLS is blocking, try with admin client as fallback
    if (membersError || !members || members.length === 0) {
      console.warn('⚠️ RLS may be blocking query, trying with admin client...', membersError);
      const adminClient = createAdminClient();
      const { data: adminMembers, error: adminError } = await adminClient
        .from('users')
        .select('id, email, name, role, created_at, organization_id')
        .eq('organization_id', userData.organization_id)
        .order('created_at', { ascending: true });
      
      if (adminError) {
        console.error('❌ Error fetching team members (admin):', adminError);
        return NextResponse.json(
          { error: 'Failed to fetch team members', details: adminError.message },
          { status: 500 }
        );
      }
      
      members = adminMembers;
      console.log('✅ Found team members using admin client:', {
        count: members?.length || 0,
        members: members?.map(m => ({ email: m.email, role: m.role, org_id: m.organization_id }))
      });
    } else {
      console.log('✅ Found team members:', {
        count: members?.length || 0,
        members: members?.map(m => ({ email: m.email, role: m.role, org_id: m.organization_id }))
      });
    }

    // Map members with proper role display and status
    const formattedMembers = members?.map(member => ({
      id: member.id,
      name: member.name || member.email?.split('@')[0] || 'Unknown',
      email: member.email,
      role: member.role || 'member', // owner, admin, member, viewer
      status: 'active',
      joined_at: member.created_at,
    })) || [];

    return NextResponse.json({
      members: formattedMembers,
      count: formattedMembers.length,
    });
  } catch (error) {
    console.error('Team members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

