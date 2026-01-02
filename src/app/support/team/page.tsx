'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Plus, Trash2, Check, X } from 'lucide-react';
import Link from 'next/link';

interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  status: 'available' | 'busy' | 'offline';
  avatar_url?: string;
  created_at: string;
}

export default function SupportTeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'agent' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/';
        return;
      }

      setCurrentUser(session.user);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('support_team')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching team members:', error);
          return;
        }

        setTeamMembers(data || []);
      } catch (err) {
        console.error('Error in fetchTeamMembers:', err);
      }
    };

    if (currentUser) {
      fetchTeamMembers();

      // Subscribe to real-time changes
      const subscription = supabase
        .channel('support_team')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'support_team' },
          (payload) => {
            fetchTeamMembers();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [currentUser]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) return;

    setIsSubmitting(true);

    try {
      // Call API route to create user (server-side)
      const response = await fetch('/api/support/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error adding team member:', result.error);
        setIsSubmitting(false);
        return;
      }

      setNewMember({ name: '', email: '', role: 'agent' });
      setShowForm(false);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (memberId: string, userId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    // Delete from support_team
    const { error: deleteError } = await supabase
      .from('support_team')
      .delete()
      .eq('id', memberId);

    if (deleteError) {
      console.error('Error deleting team member:', deleteError);
      return;
    }
  };

  const handleUpdateStatus = async (memberId: string, newStatus: string) => {
    const { error } = await supabase
      .from('support_team')
      .update({ status: newStatus })
      .eq('id', memberId);

    if (error) {
      console.error('Error updating status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Support Team Management
            </h1>
            <p className="text-gray-400 mt-2">Manage your support team members</p>
          </div>
          <Link href="/support/dashboard" className="text-purple-400 hover:text-purple-300 transition">
            View Tickets →
          </Link>
        </div>

        {/* Add Member Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Team Member
          </button>
        </div>

        {/* Add Member Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-purple-500/20 rounded-lg p-6 mb-8"
          >
            <h2 className="text-xl font-bold mb-4">Add New Team Member</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="bg-slate-800 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="bg-slate-800 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  className="bg-slate-800 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="agent">Support Agent</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="manager">Manager</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold transition"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Member'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-900 border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/60 transition"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{member.name}</h3>
                  <p className="text-sm text-gray-400">{member.email}</p>
                  <p className="text-xs text-gray-500 mt-1 capitalize">Role: {member.role}</p>
                </div>
                <button
                  onClick={() => handleDeleteMember(member.id, member.user_id)}
                  className="text-red-400 hover:text-red-300 transition"
                  title="Delete member"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-500">Status</p>
                <select
                  value={member.status}
                  onChange={(e) => handleUpdateStatus(member.id, e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-white text-sm focus:outline-none ${
                    member.status === 'available'
                      ? 'bg-green-500/20 text-green-300 border-green-500/50'
                      : member.status === 'busy'
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                      : 'bg-gray-500/20 text-gray-300 border-gray-500/50'
                  }`}
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
              </div>

              <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-purple-500/10">
                Added {new Date(member.created_at).toLocaleDateString()}
              </p>
            </motion.div>
          ))}
        </div>

        {teamMembers.length === 0 && !showForm && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No team members yet</p>
            <p className="text-gray-500 text-sm mt-2">Add your first support team member to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
