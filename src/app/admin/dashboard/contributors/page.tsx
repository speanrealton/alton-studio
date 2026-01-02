'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout';
import { 
  Search, 
  ThumbsUp, 
  ThumbsDown,
  CheckCircle,
  XCircle,
  Clock,
  Loader
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface ContributorApplication {
  id: string;
  full_name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  experience_level: string;
  design_categories: string[];
}

export default function ContributorApprovals() {
  useAdminAuth('admin');

  const [contributors, setContributors] = useState<ContributorApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchContributors = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('contributor_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contributors:', error);
        return;
      }

      setContributors(data || []);
    } catch (error) {
      console.error('Error fetching contributors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContributors();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('contributor-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contributor_applications' },
        () => {
          fetchContributors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filterContributors = () => {
    let filtered = contributors;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.full_name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.design_categories.some(cat => cat.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    return filtered;
  };

  const filteredContributors = filterContributors();

  const handleApprove = async (contributorId: string) => {
    setApprovingId(contributorId);
    try {
      const { error } = await supabase
        .from('contributor_applications')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', contributorId);

      if (!error) {
        // Immediate state update (optimistic)
        setContributors(
          contributors.map((c) =>
            c.id === contributorId ? { ...c, status: 'approved' } : c
          )
        );
      }
    } catch (error) {
      console.error('Error approving contributor:', error);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (contributorId: string) => {
    setApprovingId(contributorId);
    try {
      const { error } = await supabase
        .from('contributor_applications')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', contributorId);

      if (!error) {
        // Immediate state update (optimistic)
        setContributors(
          contributors.map((c) =>
            c.id === contributorId ? { ...c, status: 'rejected' } : c
          )
        );
      }
    } catch (error) {
      console.error('Error rejecting contributor:', error);
    } finally {
      setApprovingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-900/20 text-green-300 border-green-700/50';
      case 'rejected':
        return 'bg-red-900/20 text-red-300 border-red-700/50';
      default:
        return 'bg-yellow-900/20 text-yellow-300 border-yellow-700/50';
    }
  };

  return (
    <AdminDashboardLayout userRole="admin">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white">Contributor Approvals</h2>
          <p className="mt-1 text-sm text-gray-400">Review and approve/reject contributor applications in real-time</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, email, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
            title="Filter contributors by status"
            className="rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Count Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-slate-700/30 border border-slate-600 p-3">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-lg font-bold text-white">{contributors.length}</p>
          </div>
          <div className="rounded-lg bg-yellow-900/20 border border-yellow-700/50 p-3">
            <p className="text-xs text-yellow-300">Pending</p>
            <p className="text-lg font-bold text-yellow-300">{contributors.filter(c => c.status === 'pending').length}</p>
          </div>
          <div className="rounded-lg bg-green-900/20 border border-green-700/50 p-3">
            <p className="text-xs text-green-300">Approved</p>
            <p className="text-lg font-bold text-green-300">{contributors.filter(c => c.status === 'approved').length}</p>
          </div>
        </div>

        {/* Contributors List */}
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader className="h-8 w-8 text-cyan-500 animate-spin" />
          </div>
        ) : filteredContributors.length === 0 ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
            <p className="text-gray-400">No contributors found matching your criteria</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredContributors.map((contributor) => (
              <div
                key={contributor.id}
                className={`rounded-lg border p-3 flex items-center justify-between transition-all ${getStatusColor(contributor.status)}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(contributor.status)}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-white truncate">{contributor.full_name}</h4>
                      <p className="text-xs opacity-75">{contributor.email} • {contributor.experience_level}</p>
                      {contributor.design_categories.length > 0 && (
                        <p className="text-xs opacity-75 mt-1">{contributor.design_categories.slice(0, 2).join(', ')}{contributor.design_categories.length > 2 ? '...' : ''}</p>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs opacity-75 ml-2">{new Date(contributor.created_at).toLocaleDateString()}</p>
                {contributor.status === 'pending' && (
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleApprove(contributor.id);
                      }}
                      disabled={approvingId === contributor.id}
                      type="button"
                      className="rounded bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed p-2 text-white transition-all cursor-pointer active:scale-95"
                      title="Approve Contributor"
                    >
                      {approvingId === contributor.id ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <ThumbsUp className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleReject(contributor.id);
                      }}
                      disabled={approvingId === contributor.id}
                      type="button"
                      className="rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed p-2 text-white transition-all cursor-pointer active:scale-95"
                      title="Reject Contributor"
                    >
                      {approvingId === contributor.id ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <ThumbsDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
}
