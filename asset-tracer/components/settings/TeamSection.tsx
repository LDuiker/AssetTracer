'use client';

import React, { useState } from 'react';
import { useSubscription } from '@/lib/context/SubscriptionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, Mail, Shield, MoreHorizontal, Trash2, UserMinus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending';
  joined_at: string;
}

interface TeamInvitation {
  id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'pending';
  created_at: string;
  expires_at: string;
}

export function TeamSection() {
  const { limits } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'admin' | 'member' | 'viewer'>('member');

  const canInvite = teamMembers.length + invitations.length < limits.maxUsers;

  const handleInviteMember = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!canInvite) {
      toast.error(`You've reached the maximum number of team members for your plan`);
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }

      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('member');
      
      // Refresh invitations list
      await fetchInvitations();
    } catch (error) {
      console.error('Invite error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    // Prevent double-clicks by checking if already processing
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/team/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // If 404, invitation already deleted - just refresh the list
        if (response.status === 404) {
          toast.info('Invitation already removed');
          await fetchInvitations();
          return;
        }
        throw new Error(errorData.error || 'Failed to cancel invitation');
      }

      toast.success('Invitation canceled');
      await fetchInvitations();
    } catch (error) {
      console.error('Cancel invitation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberRole: string) => {
    // Prevent removing the owner
    if (memberRole === 'owner') {
      toast.error('Cannot remove the organization owner');
      return;
    }

    // Prevent removing yourself
    if (memberId === currentUserId) {
      toast.error('Cannot remove yourself from the team');
      return;
    }

    if (!confirm('Are you sure you want to remove this team member?')) {
      return;
    }

    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove team member');
      }

      toast.success('Team member removed');
      await fetchTeamMembers();
    } catch (error) {
      console.error('Remove member error:', error);
      toast.error('Failed to remove team member');
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team/members');
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.members || []);
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/team/invitations');
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        // API returns { user: { id, name, email, role, ... } }
        const userId = data.user?.id || '';
        const userRole = data.user?.role || 'member';
        setCurrentUserId(userId);
        // Set role directly from profile if available
        if (userRole && userId) {
          console.log('🔍 Setting role from profile:', userRole, 'for user:', userId);
          setCurrentUserRole(userRole as 'owner' | 'admin' | 'member' | 'viewer');
        }
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  // Load data on component mount
  React.useEffect(() => {
    fetchCurrentUser();
    fetchTeamMembers();
    fetchInvitations();
  }, []);

  // Update current user's role when both userId and teamMembers are available
  React.useEffect(() => {
    if (currentUserId && teamMembers.length > 0) {
      const currentMember = teamMembers.find((m) => m.id === currentUserId);
      if (currentMember) {
        console.log('🔍 Setting current user role:', currentMember.role, 'for user:', currentUserId);
        setCurrentUserRole(currentMember.role || 'member');
      } else {
        console.warn('⚠️ Current user not found in team members list:', currentUserId);
      }
    }
  }, [currentUserId, teamMembers]);

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            Manage your team members and their access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {teamMembers.length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Active Members</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {invitations.length}
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400">Pending Invitations</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-950 rounded-lg">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {limits.maxUsers === Infinity ? '∞' : limits.maxUsers}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Plan Limit</div>
            </div>
          </div>

          {!canInvite && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You&apos;ve reached the maximum number of team members for your plan.
                Upgrade to add more team members.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Invite New Member */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </CardTitle>
          <CardDescription>
            Send an invitation to add a new team member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={inviteRole} onValueChange={(value: 'admin' | 'member' | 'viewer') => setInviteRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="member">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Member
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Viewer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleInviteMember} 
                disabled={isLoading || !canInvite}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <UserPlus className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Members</CardTitle>
          <CardDescription>
            Current team members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No team members yet. Invite someone to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {member.name}
                        {member.id === currentUserId && (
                          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">(You)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={member.role === 'owner' || member.role === 'admin' ? 'default' : 'secondary'}>
                      {member.role === 'owner' ? (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          Owner
                        </>
                      ) : member.role === 'admin' ? (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </>
                      ) : member.role === 'viewer' ? (
                        <>
                          <Users className="h-3 w-3 mr-1" />
                          Viewer
                        </>
                      ) : (
                        <>
                          <Users className="h-3 w-3 mr-1" />
                          Member
                        </>
                      )}
                    </Badge>
                    {(() => {
                      const canRemove = member.role !== 'owner' && 
                                       member.id !== currentUserId && 
                                       (currentUserRole === 'owner' || currentUserRole === 'admin');
                      if (!canRemove) {
                        console.log('🔍 Remove button hidden for member:', {
                          memberId: member.id,
                          memberRole: member.role,
                          currentUserId,
                          currentUserRole,
                          isOwner: member.role === 'owner',
                          isSelf: member.id === currentUserId,
                          hasPermission: currentUserRole === 'owner' || currentUserRole === 'admin'
                        });
                      }
                      return canRemove && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRemoveMember(member.id, member.role)} className="text-red-600">
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Invitations waiting for acceptance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <div className="font-medium">{invitation.email}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Invited {new Date(invitation.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      <Mail className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}