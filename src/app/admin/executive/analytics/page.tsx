'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Filter,
} from 'lucide-react';
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MetricData {
  date: string;
  designs_submitted: number;
  designs_approved: number;
  designs_rejected: number;
  printers_submitted: number;
  printers_approved: number;
  printers_rejected: number;
  total: number;
}

interface AgentMetrics {
  id: string;
  name: string;
  email: string;
  team: string;
  approvals: number;
  rejections: number;
  pending: number;
  approval_rate: number;
}

const AnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
    const unsubscribe = subscribeToUpdates();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [dateRange]);

  const getDaysBack = () => {
    switch (dateRange) {
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      default:
        return 30;
    }
  };

  const fetchAnalytics = async () => {
    try {
      const daysBack = getDaysBack();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Fetch metrics, agents, and approval data in parallel
      const [metricsRes, agentsRes, designsRes, printersRes] = await Promise.all([
        supabase
          .from('approval_metrics')
          .select('*')
          .gte('date', startDate.toISOString().split('T')[0])
          .order('date', { ascending: true }),
        supabase
          .from('team_members')
          .select('*')
          .eq('is_active', true)
          .order('approvals_count', { ascending: false }),
        supabase
          .from('design_submissions')
          .select('*, created_by')
          .gte('submitted_at', startDate.toISOString()),
        supabase
          .from('printer_submissions')
          .select('*, submitted_by_name')
          .gte('submitted_at', startDate.toISOString()),
      ]);

      setMetrics(metricsRes.data || []);
      
      // Calculate rejection rates and pending for each agent
      const agentsWithStats = (agentsRes.data || []).map((agent: any) => {
        const agentDesigns = (designsRes.data || []).filter((d: any) => d.created_by === agent.user_id);
        const agentPrinters = (printersRes.data || []).filter((p: any) => p.submitted_by_name === agent.name);
        
        const totalSubmissions = agentDesigns.length + agentPrinters.length;
        const approvedDesigns = agentDesigns.filter((d: any) => d.status === 'approved').length;
        const approvedPrinters = agentPrinters.filter((p: any) => p.status === 'approved').length;
        const rejectedDesigns = agentDesigns.filter((d: any) => d.status === 'rejected').length;
        const rejectedPrinters = agentPrinters.filter((p: any) => p.status === 'rejected').length;
        const pendingDesigns = agentDesigns.filter((d: any) => d.status === 'pending').length;
        const pendingPrinters = agentPrinters.filter((p: any) => p.status === 'pending').length;

        return {
          id: agent.user_id,
          name: agent.name || 'Unknown',
          email: agent.email || '',
          team: agent.team || 'Unassigned',
          approvals: approvedDesigns + approvedPrinters,
          rejections: rejectedDesigns + rejectedPrinters,
          pending: pendingDesigns + pendingPrinters,
          approval_rate: totalSubmissions > 0 ? Math.round(((approvedDesigns + approvedPrinters) / totalSubmissions) * 100) : 0,
        };
      });

      setAgentMetrics(agentsWithStats);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setIsLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const metricsChannel = supabase
      .channel('analytics-metrics-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approval_metrics' }, () => {
        fetchAnalytics();
      })
      .subscribe();

    const membersChannel = supabase
      .channel('analytics-members-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
        fetchAnalytics();
      })
      .subscribe();

    const designsChannel = supabase
      .channel('analytics-designs-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'design_submissions' }, () => {
        fetchAnalytics();
      })
      .subscribe();

    const printersChannel = supabase
      .channel('analytics-printers-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'printer_submissions' }, () => {
        fetchAnalytics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(metricsChannel);
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(designsChannel);
      supabase.removeChannel(printersChannel);
    };
  };

  // Calculate totals
  const totals = metrics.reduce(
    (acc, metric) => ({
      designs_submitted: acc.designs_submitted + metric.designs_submitted,
      designs_approved: acc.designs_approved + metric.designs_approved,
      designs_rejected: acc.designs_rejected + metric.designs_rejected,
      printers_submitted: acc.printers_submitted + metric.printers_submitted,
      printers_approved: acc.printers_approved + metric.printers_approved,
      printers_rejected: acc.printers_rejected + metric.printers_rejected,
    }),
    {
      designs_submitted: 0,
      designs_approved: 0,
      designs_rejected: 0,
      printers_submitted: 0,
      printers_approved: 0,
      printers_rejected: 0,
    }
  );

  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
  }) => (
    <div className={`rounded-lg border ${color} p-6 bg-opacity-10`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <AdminDashboardLayout userRole="executive">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-4 rounded-full border-4 border-slate-700 border-t-cyan-500 animate-spin" />
            <p className="text-gray-400">Loading analytics...</p>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout userRole="executive">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Analytics Dashboard</h2>
            <p className="mt-1 text-gray-400">Performance metrics and team insights</p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Designs Approved"
            value={totals.designs_approved}
            icon="✅"
            color="border-green-500"
          />
          <StatCard
            title="Printers Approved"
            value={totals.printers_approved}
            icon="✔️"
            color="border-blue-500"
          />
          <StatCard
            title="Total Approvals"
            value={totals.designs_approved + totals.printers_approved}
            icon="📊"
            color="border-purple-500"
          />
          <StatCard
            title="Designs Rejected"
            value={totals.designs_rejected}
            icon="❌"
            color="border-red-500"
          />
          <StatCard
            title="Printers Rejected"
            value={totals.printers_rejected}
            icon="⛔"
            color="border-yellow-500"
          />
          <StatCard
            title="Approval Rate"
            value={`${
              totals.designs_submitted + totals.printers_submitted > 0
                ? Math.round(
                    ((totals.designs_approved + totals.printers_approved) /
                      (totals.designs_submitted + totals.printers_submitted)) *
                      100
                  )
                : 0
            }%`}
            icon="📈"
            color="border-cyan-500"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Approval Trend */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <TrendingUp size={20} />
              Daily Approvals Trend
            </h3>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {metrics.map((metric) => (
                <div key={metric.date} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-400">{metric.date}</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${Math.max(metric.designs_approved * 2, 20)}px` }}
                      />
                      <span className="text-xs text-gray-400">{metric.designs_approved}D</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${Math.max(metric.printers_approved * 2, 20)}px` }}
                      />
                      <span className="text-xs text-gray-400">{metric.printers_approved}P</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-4 border-t border-slate-700 pt-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-400">Designs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-400">Printers</span>
              </div>
            </div>
          </div>

          {/* Submission Status */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <BarChart3 size={20} />
              Submission Status
            </h3>

            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-gray-400">Designs Submitted</span>
                  <span className="font-bold text-white">{totals.designs_submitted}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    style={{
                      width: `${
                        totals.designs_submitted + totals.designs_approved + totals.designs_rejected > 0
                          ? (totals.designs_submitted /
                              (totals.designs_submitted +
                                totals.designs_approved +
                                totals.designs_rejected)) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-gray-400">Printers Submitted</span>
                  <span className="font-bold text-white">{totals.printers_submitted}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{
                      width: `${
                        totals.printers_submitted + totals.printers_approved + totals.printers_rejected > 0
                          ? (totals.printers_submitted /
                              (totals.printers_submitted +
                                totals.printers_approved +
                                totals.printers_rejected)) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-gray-400">Total Approvals</span>
                  <span className="font-bold text-white">
                    {totals.designs_approved + totals.printers_approved}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    style={{
                      width: `${
                        totals.designs_submitted + totals.printers_submitted > 0
                          ? ((totals.designs_approved + totals.printers_approved) /
                              (totals.designs_submitted + totals.printers_submitted)) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Performance */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <Users size={20} />
            Top Performers
          </h3>

          <div className="space-y-3">
            {agentMetrics.slice(0, 10).map((agent, index) => (
              <div key={agent.id} className="flex items-center justify-between rounded-lg bg-slate-700/20 p-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-900/30">
                    <span className="text-sm font-bold text-cyan-300">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{agent.name}</p>
                    <p className="text-xs text-gray-400">{agent.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">{agent.approvals}</p>
                  <p className="text-xs text-gray-400">approvals</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AnalyticsDashboard;
