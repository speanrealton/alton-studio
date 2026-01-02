'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Mail,
  MoreVertical,
  CheckCircle,
  XCircle,
  Filter,
  Download,
  AlertCircle,
} from 'lucide-react';
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface User {
  id: string;
  team_member_id?: string; // The team_members table ID
  email: string;
  name: string;
  role: 'admin' | 'executive' | 'agent' | 'team_lead' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  last_login?: string;
  approvals_count: number;
  department: string;
}

const UsersManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'agent', department: '', team_id: '' });

  useEffect(() => {
    fetchUsers();
    fetchTeams();
    
    const unsubscribe = subscribeToChanges();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const fetchTeams = async () => {
    try {
      const { data: teamsData, error } = await supabase
        .from('teams')
        .select('id, name');

      if (error) {
        console.error('Error fetching teams:', error);
      } else {
        setTeams(teamsData || []);
        // Set first team as default
        if (teamsData && teamsData.length > 0) {
          setNewUser(prev => ({ ...prev, team_id: teamsData[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, filterRole, filterStatus]);

  const fetchUsers = async () => {
    try {
      // Fetch team members (agents and team leads)
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .order('joined_at', { ascending: false });

      if (membersError) {
        console.error('Error fetching team members:', membersError);
      }

      // Fetch all auth users from API route (with service role privileges)
      let authUsers: any[] = [];
      try {
        const authResponse = await fetch('/api/admin/users');
        if (authResponse.ok) {
          const authData = await authResponse.json();
          authUsers = authData.users || [];
        } else {
          const errorData = await authResponse.json();
          console.error('Error fetching auth users:', errorData.error);
        }
      } catch (error) {
        console.error('Error calling auth users API:', error);
      }

      // Create a map of team member IDs to avoid duplicates
      const memberMap = new Map((membersData || []).map((m: any) => [m.user_id || m.id, m]));

      // Transform team members
      const membersUsers = (membersData || []).map((member: any) => {
        const status: 'active' | 'inactive' | 'suspended' = member.is_active ? 'active' : (member.status === 'suspended' ? 'suspended' : 'inactive');
        return {
          id: member.user_id || member.id,
          team_member_id: member.id, // Store the actual team_members table ID
          email: member.email || member.email_address || `user-${member.id}@team`,
          name: member.name || 'Unknown',
          role: member.role || 'agent',
          status,
          created_at: member.joined_at || member.created_at,
          last_login: member.last_login_at,
          approvals_count: member.approvals_count || 0,
          department: member.team || 'General',
        };
      });

      // Add auth users that aren't in team_members
      const authUsersList = (authUsers || [])
        .filter((u: any) => !memberMap.has(u.id))
        .map((authUser: any) => {
          const userStatus = authUser.user_metadata?.status;
          const status: 'active' | 'inactive' | 'suspended' = 
            userStatus === 'suspended' ? 'suspended' : 
            userStatus === 'inactive' ? 'inactive' : 
            'active';
          return {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Unknown',
            role: authUser.user_metadata?.role || 'user',
            status,
            created_at: authUser.created_at,
            last_login: authUser.last_sign_in_at,
            approvals_count: 0,
            department: authUser.user_metadata?.department || 'General',
          };
        });

      setUsers([...membersUsers, ...authUsersList]);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const membersChannel = supabase
      .channel('executive-members-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
        fetchUsers();
      })
      .subscribe((status) => {
        if (status === 'CLOSED') {
          console.log('Team members subscription closed');
        }
      });

    return () => {
      supabase.removeChannel(membersChannel);
    };
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter((u) => u.role === filterRole);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((u) => u.status === filterStatus);
    }

    setFilteredUsers(filtered);
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleAllUsers = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    // Find the user to get their team_member_id
    const user = users.find(u => u.id === userId);
    const teamMemberId = user?.team_member_id || userId; // Fall back to userId if no team_member_id
    
    console.log('Updating role for:', { userId, teamMemberId, newRole });

    // Optimistic update - update UI immediately
    setUsers(prevUsers => 
      prevUsers.map(u => u.id === userId ? { ...u, role: newRole as any } : u)
    );
    setFilteredUsers(prevUsers => 
      prevUsers.map(u => u.id === userId ? { ...u, role: newRole as any } : u)
    );

    try {
      const response = await fetch('/api/admin/update-user-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: teamMemberId, newRole }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API Error:', result.error);
        alert(`❌ Error updating role: ${result.error}`);
        // Revert the optimistic update
        fetchUsers();
        return;
      }

      console.log('✅ Role updated successfully:', result);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
      // Revert the optimistic update
      fetchUsers();
    }
  };

  const updateUserStatus = async (userId: string, newStatus: string) => {
    // Find the user to get their team_member_id
    const user = users.find(u => u.id === userId);
    const teamMemberId = user?.team_member_id || userId;

    const isActive = newStatus === 'active';
    
    // Optimistic update - update UI immediately
    setUsers(prevUsers => 
      prevUsers.map(u => u.id === userId ? { ...u, status: newStatus as any } : u)
    );
    setFilteredUsers(prevUsers => 
      prevUsers.map(u => u.id === userId ? { ...u, status: newStatus as any } : u)
    );

    try {
      const response = await fetch('/api/admin/update-user-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: teamMemberId, 
          isActive
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API Error:', result.error);
        alert(`❌ Error updating status: ${result.error}`);
        // Revert the optimistic update
        fetchUsers();
        return;
      }

      console.log('✅ Status updated successfully:', result);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
      // Revert the optimistic update
      fetchUsers();
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    // Find the user to get their team_member_id
    const user = users.find(u => u.id === userId);
    const teamMemberId = user?.team_member_id || userId;

    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: teamMemberId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`❌ Error deleting user: ${errorData.error}`);
        return;
      }

      const result = await response.json();
      alert(`✅ ${result.message}`);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const bulkStatusUpdate = async (status: string) => {
    try {
      const userIds = Array.from(selectedUsers);
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: status === 'active' })
        .in('id', userIds);

      if (error) throw error;
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error) {
      console.error('Error bulk updating users:', error);
    }
  };

  const addNewUser = async () => {
    if (!newUser.email || !newUser.name || !newUser.team_id) {
      alert('Please fill in all fields including team selection');
      return;
    }

    const selectedRole = newUser.role;
    const selectedTeamId = newUser.team_id;
    console.log('Creating user with role:', selectedRole, 'in team:', selectedTeamId);

    try {
      // Call API route to create user or add existing user to team
      const response = await fetch('/api/admin/add-team-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          name: newUser.name,
          role: selectedRole,
          team_id: selectedTeamId,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorType = responseData.type;
        let message = '';

        if (errorType === 'already_registered') {
          message = `📧 User Already Registered\n\nThe email address "${newUser.email}" is already registered in the system.\n\nYou can add this user to your team by clicking "Add Existing User" instead.`;
        } else if (errorType === 'already_member') {
          message = `👤 Already a Team Member\n\n${newUser.name} is already a member of this team.`;
        } else if (errorType === 'validation') {
          message = '⚠️ Please provide all required fields.';
        } else if (errorType === 'no_teams') {
          message = '🏢 No teams found. Please create a team first.';
        } else {
          message = `❌ Error: ${responseData.error || 'Failed to add user'}`;
        }

        alert(message);
        return;
      }

      const createdRole = responseData.teamMember?.role || selectedRole;
      const teamName = teams.find(t => t.id === selectedTeamId)?.name || 'Team';
      setNewUser({ email: '', name: '', role: 'agent', department: '', team_id: teams[0]?.id || '' });
      setShowModal(false);
      
      alert(`✅ User Added Successfully!\n\nName: ${newUser.name}\nEmail: ${newUser.email}\nRole: ${createdRole}\nTeam: ${teamName}\n\nThe user has been added to the team.`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      alert(`❌ An unexpected error occurred:\n\n${error?.message || 'Please try again'}`);
    }
  };

  return (
    <AdminDashboardLayout userRole="executive">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Users Management</h2>
            <p className="text-sm text-gray-400 mt-1">
              Manage {filteredUsers.length} users across the platform
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
          >
            <Plus size={18} />
            Add User
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 bg-slate-800/30 border border-slate-700 rounded-lg p-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-gray-500 text-sm"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="executive">Executive</option>
            <option value="team_lead">Team Lead</option>
            <option value="agent">Agent</option>
            <option value="user">User</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white hover:bg-slate-700 transition-colors text-sm">
            <Download size={16} />
            Export
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="flex items-center gap-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
            <AlertCircle size={18} className="text-cyan-400" />
            <span className="text-sm text-cyan-300">{selectedUsers.size} users selected</span>
            <div className="flex-1" />
            <button
              onClick={() => bulkStatusUpdate('active')}
              className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm transition-colors"
            >
              Activate
            </button>
            <button
              onClick={() => bulkStatusUpdate('inactive')}
              className="px-3 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 text-sm transition-colors"
            >
              Deactivate
            </button>
          </div>
        )}

        {/* Users Table */}
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="h-12 w-12 mx-auto mb-4 rounded-full border-4 border-slate-700 border-t-cyan-500 animate-spin" />
              <p className="text-gray-400">Loading users...</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onChange={toggleAllUsers}
                        className="rounded border-slate-600 text-cyan-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Approvals</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded border-slate-600 text-cyan-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-white">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{user.email}</td>
                      <td className="px-4 py-3">
                        {user.team_member_id ? (
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                            className="px-2 py-1 rounded text-xs bg-slate-700/50 border border-slate-600 text-white cursor-pointer hover:bg-slate-700 transition-colors"
                          >
                            <option value="user">User</option>
                            <option value="agent">Agent</option>
                            <option value="team_lead">Lead</option>
                            <option value="executive">Executive</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className="px-2 py-1 text-xs text-gray-400 bg-slate-800/50 rounded block w-fit">
                            {user.role}
                            <span className="ml-2 text-xs text-gray-600">(Add to team to edit)</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{user.department || '-'}</td>
                      <td className="px-4 py-3">
                        {user.team_member_id ? (
                          <button
                            onClick={() =>
                              updateUserStatus(user.id, user.status === 'active' ? 'inactive' : 'active')
                            }
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${
                              user.status === 'active'
                                ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50'
                                : user.status === 'suspended'
                                ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50'
                                : 'bg-gray-900/30 text-gray-300 hover:bg-gray-900/50'
                            }`}
                          >
                            {user.status === 'active' ? (
                              <CheckCircle size={12} />
                            ) : (
                              <XCircle size={12} />
                            )}
                            {user.status}
                          </button>
                        ) : (
                          <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                            user.status === 'active'
                              ? 'bg-green-900/30 text-green-300'
                              : 'bg-gray-900/30 text-gray-300'
                          }`}>
                            {user.status === 'active' ? (
                              <CheckCircle size={12} />
                            ) : (
                              <XCircle size={12} />
                            )}
                            {user.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-cyan-400 font-semibold">{user.approvals_count}</td>
                      <td className="px-4 py-3 text-center">
                        {user.team_member_id ? (
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="p-2 rounded hover:bg-red-900/20 text-red-400 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <span className="p-2 rounded text-gray-600 cursor-not-allowed" title="Add to team first">
                            <Trash2 size={16} />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Add New User</h3>

              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-gray-500 text-sm"
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-gray-500 text-sm"
                />

                <select
                  value={newUser.team_id}
                  onChange={(e) => setNewUser({ ...newUser, team_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
                >
                  <option value="">Select Team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>

                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
                >
                  <option value="user">User</option>
                  <option value="agent">Agent</option>
                  <option value="team_lead">Team Lead</option>
                </select>

                <input
                  type="text"
                  placeholder="Department"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-gray-500 text-sm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700/50 text-white hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addNewUser}
                  className="flex-1 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default UsersManagementPage;
