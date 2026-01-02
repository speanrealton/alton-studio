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

interface DesignSubmission {
  id: string;
  title: string;
  designer_name: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  thumbnail_url?: string;
  category: string;
}

export default function DesignApprovals() {
  useAdminAuth('admin');

  const [designs, setDesigns] = useState<DesignSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchDesigns = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('design_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching designs:', error);
        return;
      }

      setDesigns(data || []);
    } catch (error) {
      console.error('Error fetching designs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('design-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'design_submissions' },
        () => {
          fetchDesigns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filterDesigns = () => {
    let filtered = designs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(query) ||
          d.designer_name.toLowerCase().includes(query) ||
          d.category.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }

    return filtered;
  };

  const filteredDesigns = filterDesigns();

  const handleApprove = async (designId: string) => {
    setApprovingId(designId);
    try {
      const { error } = await supabase
        .from('design_submissions')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', designId);

      if (!error) {
        // Immediate state update (optimistic)
        setDesigns(
          designs.map((d) =>
            d.id === designId ? { ...d, status: 'approved' } : d
          )
        );

        // Log the action
        await supabase.from('admin_activity_log').insert({
          admin_id: 'admin',
          action: 'approve_design',
          target_id: designId,
          ip_address: 'admin-panel',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error approving design:', error);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (designId: string) => {
    setApprovingId(designId);
    try {
      const { error } = await supabase
        .from('design_submissions')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', designId);

      if (!error) {
        // Immediate state update (optimistic)
        setDesigns(
          designs.map((d) =>
            d.id === designId ? { ...d, status: 'rejected' } : d
          )
        );

        // Log the action
        await supabase.from('admin_activity_log').insert({
          admin_id: 'admin',
          action: 'reject_design',
          target_id: designId,
          ip_address: 'admin-panel',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error rejecting design:', error);
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
          <h2 className="text-2xl font-bold text-white">Design Approvals</h2>
          <p className="mt-1 text-sm text-gray-400">Review and approve/reject designs in real-time</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by title, designer, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
            title="Filter designs by status"
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
            <p className="text-lg font-bold text-white">{designs.length}</p>
          </div>
          <div className="rounded-lg bg-yellow-900/20 border border-yellow-700/50 p-3">
            <p className="text-xs text-yellow-300">Pending</p>
            <p className="text-lg font-bold text-yellow-300">{designs.filter(d => d.status === 'pending').length}</p>
          </div>
          <div className="rounded-lg bg-green-900/20 border border-green-700/50 p-3">
            <p className="text-xs text-green-300">Approved</p>
            <p className="text-lg font-bold text-green-300">{designs.filter(d => d.status === 'approved').length}</p>
          </div>
        </div>

        {/* Designs List */}
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader className="h-8 w-8 text-cyan-500 animate-spin" />
          </div>
        ) : filteredDesigns.length === 0 ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
            <p className="text-gray-400">No designs found matching your criteria</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredDesigns.map((design) => (
              <div
                key={design.id}
                className={`rounded-lg border p-3 flex items-center justify-between transition-all ${getStatusColor(design.status)}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(design.status)}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-white truncate">{design.title}</h4>
                      <p className="text-xs opacity-75">{design.designer_name} • {design.category}</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs opacity-75 ml-2">{new Date(design.submitted_at).toLocaleDateString()}</p>
                {design.status === 'pending' && (
                  <div className="flex gap-2 ml-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleApprove(design.id);
                      }}
                      disabled={approvingId === design.id}
                      type="button"
                      className="rounded bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed p-2 text-white transition-all cursor-pointer active:scale-95"
                      title="Approve Design"
                    >
                      {approvingId === design.id ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <ThumbsUp className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleReject(design.id);
                      }}
                      disabled={approvingId === design.id}
                      type="button"
                      className="rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed p-2 text-white transition-all cursor-pointer active:scale-95"
                      title="Reject Design"
                    >
                      {approvingId === design.id ? (
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
