'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, TrendingUp, AlertCircle, BarChart3, Activity, Settings, ToggleRight, 
  Globe, MessageSquare, Lock, Shield, Zap, Eye, EyeOff, Trash2, Edit2, Plus,
  MoreVertical, Download, RefreshCw
} from 'lucide-react';
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ExecutiveStats {
  totalTeams: number;
  totalAgents: number;
  totalApprovals: number;
  approvalRate: number;
  totalUsers: number;
  activeContent: number;
  pendingApprovals: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'agent' | 'team_lead';
  team: string;
  status: 'active' | 'inactive';
  approvals_count: number;
}

interface ApprovalMetrics {
  date: string;
  designs_approved: number;
  printers_approved: number;
  total: number;
}

interface SystemControl {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
}

const ExecutiveDashboard = () => {
  const [stats, setStats] = useState<ExecutiveStats>({
    totalTeams: 0,
    totalAgents: 0,
    totalApprovals: 0,
    approvalRate: 0,
    totalUsers: 0,
    activeContent: 0,
    pendingApprovals: 0,
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [metrics, setMetrics] = useState<ApprovalMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [systemControls, setSystemControls] = useState<SystemControl[]>([
    { id: '1', name: 'User Registration', enabled: true, description: 'Allow new users to register' },
    { id: '2', name: 'Content Publishing', enabled: true, description: 'Allow content publishing' },
    { id: '3', name: 'Design Approvals', enabled: true, description: 'Require approval for designs' },
    { id: '4', name: 'Email Notifications', enabled: true, description: 'Send email notifications' },
    { id: '5', name: 'API Access', enabled: false, description: 'Allow third-party API access' },
    { id: '6', name: 'Advanced Analytics', enabled: true, description: 'Track advanced metrics' },
  ]);
  const [activeView, setActiveView] = useState<'overview' | 'controls' | 'reports' | 'users'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchExecutiveData();
    const unsubscribe = subscribeToUpdates();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const fetchExecutiveData = async () => {
    try {
      // Fetch team statistics
      const [teamsRes, agentsRes, designsRes, printersRes, membersRes, metricsRes] = await Promise.all([
        supabase.from('teams').select('id').eq('is_active', true),
        supabase.from('team_members').select('id').eq('role', 'agent').eq('is_active', true),
        supabase.from('design_submissions').select('id').eq('status', 'approved'),
        supabase.from('printer_submissions').select('id').eq('status', 'approved'),
        supabase.from('team_members').select('*').eq('is_active', true).order('approvals_count', { ascending: false }),
        supabase.from('approval_metrics').select('*').order('date', { ascending: false }).limit(30),
      ]);

      // Fetch pending approvals
      const [pendingDesignsRes, pendingPrintersRes] = await Promise.all([
        supabase.from('design_submissions').select('id').eq('status', 'pending'),
        supabase.from('printer_submissions').select('id').eq('status', 'pending'),
      ]);

      // Fetch content statistics
      const { data: contentData } = await supabase
        .from('content')
        .select('id')
        .eq('status', 'published');

      const totalApprovals = (designsRes.data?.length || 0) + (printersRes.data?.length || 0);
      const pendingApprovals = (pendingDesignsRes.data?.length || 0) + (pendingPrintersRes.data?.length || 0);

      setStats({
        totalTeams: teamsRes.data?.length || 0,
        totalAgents: agentsRes.data?.length || 0,
        totalApprovals: totalApprovals,
        approvalRate: totalApprovals > 0 ? Math.round((totalApprovals / (totalApprovals + pendingApprovals)) * 100) : 0,
        totalUsers: (teamsRes.data?.length || 0) + (agentsRes.data?.length || 0),
        activeContent: contentData?.length || 0,
        pendingApprovals: pendingApprovals,
      });

      setTeamMembers(membersRes.data || []);
      setMetrics(metricsRes.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching executive data:', error);
      setIsLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const designChannel = supabase
      .channel('executive-design-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'design_submissions' }, () => {
        fetchExecutiveData();
      })
      .subscribe();

    const printerChannel = supabase
      .channel('executive-printer-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'printer_submissions' }, () => {
        fetchExecutiveData();
      })
      .subscribe();

    const teamChannel = supabase
      .channel('executive-team-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
        fetchExecutiveData();
      })
      .subscribe();

    const metricsChannel = supabase
      .channel('executive-metrics-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approval_metrics' }, () => {
        fetchExecutiveData();
      })
      .subscribe();

    const contentChannel = supabase
      .channel('executive-content-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content' }, () => {
        fetchExecutiveData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(designChannel);
      supabase.removeChannel(printerChannel);
      supabase.removeChannel(teamChannel);
      supabase.removeChannel(metricsChannel);
      supabase.removeChannel(contentChannel);
    };
  };

  const StatCard = ({
    icon: Icon,
    title,
    value,
    color,
    subtitle,
  }: {
    icon?: React.ReactNode;
    title: string;
    value: number | string;
    color: string;
    subtitle?: string;
  }) => (
    <div className={`rounded-lg border ${color} p-4 bg-opacity-10 flex flex-col justify-between h-full`}>
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</p>
        <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      </div>
      {subtitle && <p className="mt-2 text-xs text-gray-500">{subtitle}</p>}
    </div>
  );

  const toggleControl = (id: string) => {
    setSystemControls(
      systemControls.map((control) =>
        control.id === id ? { ...control, enabled: !control.enabled } : control
      )
    );
  };

  return (
    <AdminDashboardLayout userRole="executive">
      <div className="space-y-4">
        {/* Header with Navigation */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Executive Dashboard</h2>
            <p className="mt-1 text-sm text-gray-400">Complete website and team control center</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white hover:bg-slate-700 transition-colors text-sm"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-700 overflow-x-auto">
          {['overview', 'controls', 'reports', 'users'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveView(tab as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeView === tab
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="h-12 w-12 mx-auto mb-4 rounded-full border-4 border-slate-700 border-t-cyan-500 animate-spin" />
              <p className="text-gray-400">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeView === 'overview' && (
              <div className="space-y-4">
                {/* Compact Stats Grid */}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-7">
                  <StatCard
                    title="Teams"
                    value={stats.totalTeams}
                    color="border-blue-500"
                  />
                  <StatCard
                    title="Agents"
                    value={stats.totalAgents}
                    color="border-purple-500"
                  />
                  <StatCard
                    title="Approved"
                    value={stats.totalApprovals}
                    color="border-green-500"
                  />
                  <StatCard
                    title="Content"
                    value={stats.activeContent}
                    color="border-orange-500"
                  />
                  <StatCard
                    title="Pending"
                    value={stats.pendingApprovals}
                    color="border-yellow-500"
                  />
                  <StatCard
                    title="Users"
                    value={stats.totalUsers}
                    color="border-pink-500"
                  />
                  <StatCard
                    title="Rate"
                    value={`${stats.approvalRate}%`}
                    color="border-cyan-500"
                  />
                </div>

                {/* Team Members & Metrics */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {/* Top Team Members */}
                  <div className="lg:col-span-2 rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
                      <Users size={18} />
                      Top Performers
                    </h3>

                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {teamMembers.length === 0 ? (
                        <p className="text-center text-gray-400 py-4 text-sm">No team members</p>
                      ) : (
                        teamMembers.slice(0, 8).map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-700/20 p-2.5 hover:bg-slate-700/40 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{member.name}</p>
                              <p className="text-xs text-gray-500 truncate">{member.team}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              <span className="text-xs font-bold text-cyan-400 px-2 py-1 bg-cyan-900/30 rounded">
                                {member.approvals_count}
                              </span>
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  member.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                                }`}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quick Alerts */}
                  <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
                      <AlertCircle size={18} />
                      Alerts
                    </h3>

                    <div className="space-y-2">
                      {teamMembers.slice(0, 3).length > 0 ? (
                        teamMembers.slice(0, 3).map((member, i) => (
                          <div
                            key={member.id}
                            className="rounded-lg bg-slate-700/20 p-2.5 border border-slate-700/50 text-xs"
                          >
                            <p className="text-white font-medium">{member.name}</p>
                            <p className="text-gray-400 text-xs">
                              {member.approvals_count} approvals
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-400 py-6 text-sm">No alerts</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Approval Trends - Compact */}
                <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
                    <Activity size={18} />
                    Last 7 Days
                  </h3>

                  <div className="overflow-x-auto">
                    <div className="flex gap-1.5">
                      {metrics.slice(0, 7).map((metric) => (
                        <div key={metric.date} className="flex-1 text-center">
                          <div className="h-20 rounded-lg border border-slate-700/50 bg-slate-700/30 p-2 flex flex-col justify-between text-xs">
                            <p className="font-bold text-white text-sm">{metric.total}</p>
                            <div className="text-gray-500 text-xs">
                              <p>{metric.designs_approved}D</p>
                              <p>{metric.printers_approved}P</p>
                            </div>
                            <p className="text-gray-600 text-xs">{metric.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONTROLS TAB */}
            {activeView === 'controls' && (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Shield size={20} className="text-cyan-400" />
                      <h3 className="text-lg font-bold text-white">Website Controls</h3>
                    </div>
                    <span className="text-xs text-gray-400">
                      {systemControls.filter((c) => c.enabled).length} / {systemControls.length} Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {systemControls.map((control) => (
                      <div
                        key={control.id}
                        className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-700/20 p-3 hover:bg-slate-700/30 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{control.name}</p>
                          <p className="text-xs text-gray-400">{control.description}</p>
                        </div>
                        <button
                          onClick={() => toggleControl(control.id)}
                          className={`ml-3 p-2 rounded transition-all ${
                            control.enabled
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-gray-900/30 text-gray-500'
                          }`}
                        >
                          {control.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <a
                    href="/admin/executive/teams"
                    className="rounded-lg border border-blue-500/30 bg-blue-900/10 p-4 hover:bg-blue-900/20 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users size={16} className="text-blue-400 group-hover:text-blue-300" />
                      <h4 className="font-semibold text-white group-hover:text-blue-300 text-sm">Teams</h4>
                    </div>
                    <p className="text-xs text-gray-400">Manage teams & members</p>
                  </a>

                  <a
                    href="/admin/executive/users"
                    className="rounded-lg border border-indigo-500/30 bg-indigo-900/10 p-4 hover:bg-indigo-900/20 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users size={16} className="text-indigo-400 group-hover:text-indigo-300" />
                      <h4 className="font-semibold text-white group-hover:text-indigo-300 text-sm">Users</h4>
                    </div>
                    <p className="text-xs text-gray-400">Manage users & roles</p>
                  </a>

                  <a
                    href="/admin/executive/analytics"
                    className="rounded-lg border border-purple-500/30 bg-purple-900/10 p-4 hover:bg-purple-900/20 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart3 size={16} className="text-purple-400 group-hover:text-purple-300" />
                      <h4 className="font-semibold text-white group-hover:text-purple-300 text-sm">Analytics</h4>
                    </div>
                    <p className="text-xs text-gray-400">View detailed reports</p>
                  </a>

                  <a
                    href="/admin/executive/content"
                    className="rounded-lg border border-green-500/30 bg-green-900/10 p-4 hover:bg-green-900/20 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Globe size={16} className="text-green-400 group-hover:text-green-300" />
                      <h4 className="font-semibold text-white group-hover:text-green-300 text-sm">Content</h4>
                    </div>
                    <p className="text-xs text-gray-400">Publish & manage content</p>
                  </a>

                  <a
                    href="/admin/executive/approvals"
                    className="rounded-lg border border-yellow-500/30 bg-yellow-900/10 p-4 hover:bg-yellow-900/20 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={16} className="text-yellow-400 group-hover:text-yellow-300" />
                      <h4 className="font-semibold text-white group-hover:text-yellow-300 text-sm">Approvals</h4>
                    </div>
                    <p className="text-xs text-gray-400">Manage approvals queue</p>
                  </a>

                  <a
                    href="/admin/executive/notifications"
                    className="rounded-lg border border-pink-500/30 bg-pink-900/10 p-4 hover:bg-pink-900/20 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare size={16} className="text-pink-400 group-hover:text-pink-300" />
                      <h4 className="font-semibold text-white group-hover:text-pink-300 text-sm">Messages</h4>
                    </div>
                    <p className="text-xs text-gray-400">Send notifications</p>
                  </a>

                  <a
                    href="/admin/executive/settings"
                    className="rounded-lg border border-cyan-500/30 bg-cyan-900/10 p-4 hover:bg-cyan-900/20 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Settings size={16} className="text-cyan-400 group-hover:text-cyan-300" />
                      <h4 className="font-semibold text-white group-hover:text-cyan-300 text-sm">Settings</h4>
                    </div>
                    <p className="text-xs text-gray-400">System configuration</p>
                  </a>
                </div>
              </div>
            )}

            {/* REPORTS TAB */}
            {activeView === 'reports' && (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={20} className="text-cyan-400" />
                      <h3 className="text-lg font-bold text-white">Analytics & Reports</h3>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 text-white hover:bg-slate-700 transition-colors text-xs">
                      <Download size={14} />
                      Export
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-700/50 bg-slate-700/20 p-3">
                      <p className="text-sm font-semibold text-white mb-2">Approval Success Rate</p>
                      <div className="w-full bg-slate-700/50 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">85% of submissions approved</p>
                    </div>

                    <div className="rounded-lg border border-slate-700/50 bg-slate-700/20 p-3">
                      <p className="text-sm font-semibold text-white mb-2">Team Performance</p>
                      <div className="text-2xl font-bold text-cyan-400">{stats.totalApprovals}</div>
                      <p className="text-xs text-gray-400 mt-1">Total approvals this period</p>
                    </div>

                    <div className="rounded-lg border border-slate-700/50 bg-slate-700/20 p-3">
                      <p className="text-sm font-semibold text-white mb-2">User Engagement</p>
                      <div className="text-2xl font-bold text-purple-400">{stats.totalUsers}</div>
                      <p className="text-xs text-gray-400 mt-1">Active users on platform</p>
                    </div>

                    <div className="rounded-lg border border-slate-700/50 bg-slate-700/20 p-3">
                      <p className="text-sm font-semibold text-white mb-2">Content Published</p>
                      <div className="text-2xl font-bold text-orange-400">{stats.activeContent}</div>
                      <p className="text-xs text-gray-400 mt-1">Active content items</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeView === 'users' && (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                  <div className="flex items-center justify-between mb-4 gap-2">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Users size={20} />
                      User Management
                    </h3>
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 max-w-xs px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-gray-500 text-sm"
                    />
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-colors text-sm">
                      <Plus size={16} />
                      Add User
                    </button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {teamMembers.length === 0 ? (
                      <p className="text-center text-gray-400 py-6 text-sm">No users found</p>
                    ) : (
                      teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-700/20 p-2.5 hover:bg-slate-700/40 transition-colors group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-xs font-bold text-white">
                                {member.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{member.name}</p>
                                <p className="text-xs text-gray-500 truncate">{member.email}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              member.role === 'agent'
                                ? 'bg-blue-900/30 text-blue-300'
                                : 'bg-purple-900/30 text-purple-300'
                            }`}>
                              {member.role}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 rounded hover:bg-slate-700/50 text-gray-400 hover:text-white">
                                <Edit2 size={14} />
                              </button>
                              <button className="p-1.5 rounded hover:bg-red-900/20 text-gray-400 hover:text-red-400">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default ExecutiveDashboard;
