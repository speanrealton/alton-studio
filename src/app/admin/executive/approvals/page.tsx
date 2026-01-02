'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Search,
  Filter,
  AlertCircle,
  Zap,
  Eye,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ApprovalRequest {
  id: string;
  type: 'design' | 'printer' | 'content' | 'feature';
  title: string;
  description: string;
  requester: string;
  requester_email: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  notes?: string;
}

const ApprovalsQueuePage = () => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [filteredApprovals, setFilteredApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchApprovals();
    subscribeToChanges();
  }, []);

  useEffect(() => {
    filterApprovalsList();
  }, [approvals, searchQuery, filterStatus, filterType, filterPriority]);

  const fetchApprovals = async () => {
    try {
      // Fetch pending designs and printers that need approval
      const [designsRes, printersRes] = await Promise.all([
        supabase
          .from('design_submissions')
          .select('*')
          .eq('status', 'pending')
          .order('submitted_at', { ascending: false }),
        supabase
          .from('printer_submissions')
          .select('*')
          .eq('status', 'pending')
          .order('submitted_at', { ascending: false }),
      ]);

      if (designsRes.error) throw designsRes.error;
      if (printersRes.error) throw printersRes.error;

      // Transform and combine the data
      const designs = (designsRes.data || []).map((d: any) => ({
        id: d.id,
        type: 'design' as const,
        title: d.title,
        description: d.description || '',
        requester: d.designer_name,
        requester_email: d.designer_email || '',
        status: d.status,
        priority: 'medium' as const,
        created_at: d.submitted_at,
        updated_at: d.submitted_at,
        notes: d.feedback,
      }));

      const printers = (printersRes.data || []).map((p: any) => ({
        id: p.id,
        type: 'printer' as const,
        title: p.printer_name,
        description: p.specifications || '',
        requester: p.submitted_by_name,
        requester_email: p.submitted_by_email || '',
        status: p.status,
        priority: 'medium' as const,
        created_at: p.submitted_at,
        updated_at: p.submitted_at,
        notes: p.feedback,
      }));

      setApprovals([...designs, ...printers]);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const designChannel = supabase
      .channel('design-approvals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'design_submissions' }, () => {
        fetchApprovals();
      })
      .subscribe();

    const printerChannel = supabase
      .channel('printer-approvals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'printer_submissions' }, () => {
        fetchApprovals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(designChannel);
      supabase.removeChannel(printerChannel);
    };
  };

  const filterApprovalsList = () => {
    let filtered = approvals;

    if (searchQuery) {
      filtered = filtered.filter(
        (a) =>
          a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.requester?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((a) => a.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((a) => a.type === filterType);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter((a) => a.priority === filterPriority);
    }

    setFilteredApprovals(filtered);
  };

  const approveRequest = async (approvalId: string) => {
    try {
      const approval = selectedApproval;
      if (!approval) return;

      const table = approval.type === 'design' ? 'design_submissions' : 'printer_submissions';
      const { error } = await supabase
        .from(table)
        .update({ status: 'approved' })
        .eq('id', approvalId);

      if (error) throw error;
      setSelectedApproval(null);
      fetchApprovals();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const rejectRequest = async (approvalId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      const approval = selectedApproval;
      if (!approval) return;

      const table = approval.type === 'design' ? 'design_submissions' : 'printer_submissions';
      const feedbackField = approval.type === 'design' ? 'feedback' : 'feedback';
      
      const { error } = await supabase
        .from(table)
        .update({
          status: 'rejected',
          [feedbackField]: rejectionReason,
        })
        .eq('id', approvalId);

      if (error) throw error;
      setSelectedApproval(null);
      setRejectionReason('');
      fetchApprovals();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-900/30 text-red-300 border-red-500/30';
      case 'high':
        return 'bg-orange-900/30 text-orange-300 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-500/30';
      case 'low':
        return 'bg-green-900/30 text-green-300 border-green-500/30';
      default:
        return 'bg-slate-900/30 text-slate-300 border-slate-500/30';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Zap size={16} />;
      case 'high':
        return <AlertCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const stats = {
    pending: approvals.filter((a) => a.status === 'pending').length,
    approved: approvals.filter((a) => a.status === 'approved').length,
    rejected: approvals.filter((a) => a.status === 'rejected').length,
    critical: approvals.filter((a) => a.priority === 'critical' && a.status === 'pending').length,
  };

  return (
    <AdminDashboardLayout userRole="executive">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Approvals Queue</h2>
            <p className="text-sm text-gray-400 mt-1">
              Review and approve pending requests
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <p className="text-xs text-gray-400 uppercase font-semibold">Pending</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.pending}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <p className="text-xs text-gray-400 uppercase font-semibold">Approved</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{stats.approved}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <p className="text-xs text-gray-400 uppercase font-semibold">Rejected</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{stats.rejected}</p>
          </div>
          <div className="rounded-lg border border-red-700 bg-red-900/20 p-4">
            <p className="text-xs text-red-300 uppercase font-semibold">Critical</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{stats.critical}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 bg-slate-800/30 border border-slate-700 rounded-lg p-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search approvals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-gray-500 text-sm"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
          >
            <option value="all">All Types</option>
            <option value="design">Design</option>
            <option value="printer">Printer</option>
            <option value="content">Content</option>
            <option value="feature">Feature</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Approvals List */}
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="h-12 w-12 mx-auto mb-4 rounded-full border-4 border-slate-700 border-t-cyan-500 animate-spin" />
              <p className="text-gray-400">Loading approvals...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApprovals.map((approval) => (
              <div
                key={approval.id}
                className={`rounded-lg border p-4 transition-all cursor-pointer ${
                  approval.status === 'pending'
                    ? 'border-yellow-500/30 bg-yellow-900/10 hover:bg-yellow-900/20'
                    : approval.status === 'approved'
                    ? 'border-green-500/30 bg-green-900/10'
                    : 'border-red-500/30 bg-red-900/10'
                }`}
                onClick={() => setSelectedApproval(approval)}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <div>
                        <h3 className="text-base font-bold text-white">{approval.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">{approval.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3 text-xs">
                      <span className="flex items-center gap-1 text-gray-500">
                        <User size={14} />
                        {approval.requester}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Clock size={14} />
                        {new Date(approval.created_at).toLocaleDateString()}
                      </span>
                      <span className={`flex items-center gap-1 px-2 py-1 rounded border ${getPriorityColor(
                        approval.priority
                      )}`}>
                        {getPriorityIcon(approval.priority)}
                        {approval.priority.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 rounded bg-slate-700/50 text-slate-300 text-xs uppercase font-semibold">
                        {approval.type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {approval.status === 'pending' ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            approveRequest(approval.id);
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors text-sm"
                        >
                          <ThumbsUp size={16} />
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApproval(approval);
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
                        >
                          <ThumbsDown size={16} />
                          Reject
                        </button>
                      </>
                    ) : (
                      <span
                        className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                          approval.status === 'approved'
                            ? 'bg-green-900/30 text-green-300'
                            : 'bg-red-900/30 text-red-300'
                        }`}
                      >
                        {approval.status === 'approved' ? (
                          <CheckCircle size={16} className="inline mr-1" />
                        ) : (
                          <XCircle size={16} className="inline mr-1" />
                        )}
                        {approval.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredApprovals.length === 0 && (
              <div className="text-center py-12 rounded-lg border border-slate-700 bg-slate-800/30">
                <CheckCircle size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No approvals to review</p>
              </div>
            )}
          </div>
        )}

        {/* Rejection Modal */}
        {selectedApproval && selectedApproval.status === 'pending' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-2">Reject Request</h3>
              <p className="text-sm text-gray-400 mb-4">{selectedApproval.title}</p>

              <textarea
                placeholder="Reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-gray-500 text-sm mb-4"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedApproval(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700/50 text-white hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => rejectRequest(selectedApproval.id)}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default ApprovalsQueuePage;
