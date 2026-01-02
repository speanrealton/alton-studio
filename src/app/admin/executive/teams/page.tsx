'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Plus,
  Trash2,
  Edit2,
  Users,
  Search,
  Filter,
  User,
  Mail,
  Clock,
} from 'lucide-react';
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Team {
  id: string;
  name: string;
  description: string;
  team_lead_id: string;
  team_lead_name?: string;
  member_count: number;
  created_at: string;
  is_active: boolean;
}

interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'agent' | 'team_lead';
  joined_at: string;
  is_active: boolean;
  approvals_count: number;
}

const TeamManagement = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamData, setNewTeamData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchTeams();
    const unsubscribe = subscribeToUpdates();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    filterTeams();
  }, [teams, searchQuery]);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam.id);
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*, team_members(count)')
        .eq('is_active', true);

      if (error) throw error;

      const teamsWithMemberCount = (data || []).map((team: any) => ({
        ...team,
        member_count: team.team_members ? team.team_members[0].count : 0,
      }));

      setTeams(teamsWithMemberCount);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_active', true)
        .order('approvals_count', { ascending: false });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const subscribeToUpdates = () => {
    const teamsChannel = supabase
      .channel('executive-teams-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchTeams();
      })
      .subscribe();

    const membersChannel = supabase
      .channel('executive-team-members-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
        fetchTeams();
        if (selectedTeam) {
          fetchTeamMembers(selectedTeam.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(teamsChannel);
      supabase.removeChannel(membersChannel);
    };
  };

  const filterTeams = () => {
    let filtered = teams;

    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTeams(filtered);
  };

  const handleCreateTeam = async () => {
    if (!newTeamData.name.trim()) {
      alert('Team name is required');
      return;
    }

    try {
      const { error } = await supabase.from('teams').insert({
        name: newTeamData.name,
        description: newTeamData.description,
      });

      if (error) throw error;

      // Log activity
      await supabase.from('admin_activity_logs').insert({
        action: 'team_created',
        details: { team_name: newTeamData.name },
        timestamp: new Date(),
      });

      setNewTeamData({ name: '', description: '' });
      setShowCreateTeam(false);
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to deactivate this team?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('teams')
        .update({ is_active: false })
        .eq('id', teamId);

      if (error) throw error;

      // Log activity
      await supabase.from('admin_activity_logs').insert({
        action: 'team_deactivated',
        details: { team_id: teamId },
        timestamp: new Date(),
      });

      fetchTeams();
      setSelectedTeam(null);
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Failed to deactivate team');
    }
  };

  return (
    <AdminDashboardLayout userRole="executive">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Team Management</h2>
            <p className="mt-1 text-gray-400">Create and manage work teams</p>
          </div>
          <button
            onClick={() => setShowCreateTeam(!showCreateTeam)}
            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 font-semibold text-white hover:bg-cyan-700 transition-colors"
          >
            <Plus size={20} />
            New Team
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="h-12 w-12 mx-auto mb-4 rounded-full border-4 border-slate-700 border-t-cyan-500 animate-spin" />
              <p className="text-gray-400">Loading teams...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Create Team Form */}
            {showCreateTeam && (
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-900/10 p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">Create New Team</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Team Name
                    </label>
                    <input
                      type="text"
                      value={newTeamData.name}
                      onChange={(e) =>
                        setNewTeamData({ ...newTeamData, name: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      placeholder="Enter team name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newTeamData.description}
                      onChange={(e) =>
                        setNewTeamData({ ...newTeamData, description: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      placeholder="Enter team description"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCreateTeam}
                      className="flex-1 rounded-lg bg-cyan-600 px-4 py-2.5 font-semibold text-white hover:bg-cyan-700 transition-colors"
                    >
                      Create Team
                    </button>
                    <button
                      onClick={() => setShowCreateTeam(false)}
                      className="flex-1 rounded-lg border border-slate-600 px-4 py-2.5 font-semibold text-gray-300 hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-700/50 pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Teams List */}
              <div className="lg:col-span-2 space-y-3">
                {filteredTeams.length === 0 ? (
                  <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-12 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400">No teams found</p>
                  </div>
                ) : (
                  filteredTeams.map((team) => (
                    <div
                      key={team.id}
                      onClick={() => setSelectedTeam(team)}
                      className={`cursor-pointer rounded-lg border p-4 transition-all ${
                        selectedTeam?.id === team.id
                          ? 'border-cyan-500 bg-cyan-900/20'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{team.name}</h3>
                          <p className="text-sm text-gray-400">{team.description}</p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {team.member_count} members
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              Created {new Date(team.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Team Details Panel */}
              {selectedTeam && (
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
                  <h3 className="mb-4 text-lg font-bold text-white">{selectedTeam.name}</h3>

                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Description</p>
                      <p className="mt-1 text-sm text-gray-400">{selectedTeam.description}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-300">Members</p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {selectedTeam.member_count}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-300">Created</p>
                      <p className="mt-1 text-sm text-gray-400">
                        {new Date(selectedTeam.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Team Members List */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-300 mb-3">Team Members</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {teamMembers.length === 0 ? (
                        <p className="text-xs text-gray-500">No members yet</p>
                      ) : (
                        teamMembers.map((member) => (
                          <div
                            key={member.id}
                            className="rounded-lg bg-slate-700/20 p-3 text-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-white">{member.name}</p>
                                <p className="text-xs text-gray-400">{member.email}</p>
                              </div>
                              <span className="text-xs font-semibold text-cyan-300">
                                {member.approvals_count} approvals
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteTeam(selectedTeam.id)}
                      className="flex-1 rounded-lg bg-red-600/20 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-600/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Deactivate
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default TeamManagement;
