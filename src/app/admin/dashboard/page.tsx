'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  BarChart3, Clock, CheckCircle2, XCircle, FileText, Printer,
  Users, Settings, LogOut, Menu, X, TrendingUp, AlertCircle,
  Home, ArrowRight, Activity, Zap, Bell, ChevronRight,
  LineChart, PieChart, Calendar, Filter, Flame, Target, Eye,
  Download, Search, CheckSquare, Square, Palette, Trash2
} from 'lucide-react';

export default function ModernAdminDashboard() {
  useAdminAuth('admin');
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [stats, setStats] = useState({
    contributorsPending: 0,
    contributorsApproved: 0,
    contributorsRejected: 0,
    printersPending: 0,
    printersApproved: 0,
    printersRejected: 0,
    designsTotal: 0,
    totalProcessed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [showContributorsModal, setShowContributorsModal] = useState(false);
  const [showPrintersModal, setShowPrintersModal] = useState(false);
  const [contributors, setContributors] = useState<any[]>([]);
  const [printers, setPrinters] = useState<any[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    hourlyApprovals: Array(24).fill(0),
    hourlyRejections: Array(24).fill(0),
    totalApprovalTime: 0,
    avgReviewTime: 0,
    topApprovers: [] as any[],
    trendsData: [] as any[],
  });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // New features state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'contributors' | 'printers' | 'designs'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setLastUpdate(new Date());
    fetchStats();
    fetchRecentActivity();
    fetchAnalytics();
    setRealtimeActive(true);
    
    // Subscribe to real-time changes - PRINTERS
    const channel2 = supabase
      .channel('printer_stats_realtime_' + Date.now())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'printer_submissions' }, (payload) => {
        console.log('🖨️ Printer change detected:', payload);
        fetchStats();
        fetchAnalytics();
        fetchRecentActivity();
        setLastUpdate(new Date());
      })
      .subscribe((status) => {
        console.log('Printer subscription status:', status);
      });

    // Subscribe to real-time changes - CONTRIBUTORS
    const channel1 = supabase
      .channel('contributor_stats_realtime_' + Date.now())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributor_applications' }, (payload) => {
        console.log('👤 Contributor change detected:', payload);
        fetchStats();
        fetchAnalytics();
        fetchRecentActivity();
        setLastUpdate(new Date());
      })
      .subscribe((status) => {
        console.log('Contributor subscription status:', status);
      });

    // Subscribe to real-time changes - DESIGNS
    const channel3 = supabase
      .channel('design_stats_realtime_' + Date.now())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'design_submissions' }, (payload) => {
        console.log('🎨 Design change detected:', payload);
        fetchStats();
        fetchAnalytics();
        fetchRecentActivity();
        setLastUpdate(new Date());
      })
      .subscribe((status) => {
        console.log('Design subscription status:', status);
      });
    
    // Fallback polling every 10 seconds for all submissions
    const interval = setInterval(() => {
      fetchStats();
      fetchAnalytics();
      fetchRecentActivity();
      setLastUpdate(new Date());
    }, 10000);
    
    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
      supabase.removeChannel(channel3);
      clearInterval(interval);
      setRealtimeActive(false);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const { count: dpending } = await supabase
        .from('contributor_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: dapproved } = await supabase
        .from('contributor_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { count: drejected } = await supabase
        .from('contributor_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected');

      const { count: ppending } = await supabase
        .from('printer_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: papproved } = await supabase
        .from('printer_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { count: prejected } = await supabase
        .from('printer_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected');

      // Count total designs uploaded
      const { data: designData } = await supabase
        .from('design_submissions')
        .select('id');

      const desTotal = designData?.length || 0;

      console.log('📊 Stats Fetched:', {
        printers: { pending: ppending, approved: papproved, rejected: prejected },
        contributors: { pending: dpending, approved: dapproved, rejected: drejected },
        designs: { total: desTotal }
      });

      setStats({
        contributorsPending: dpending || 0,
        contributorsApproved: dapproved || 0,
        contributorsRejected: drejected || 0,
        printersPending: ppending || 0,
        printersApproved: papproved || 0,
        printersRejected: prejected || 0,
        designsTotal: desTotal || 0,
        totalProcessed: (dapproved || 0) + (papproved || 0),
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data: contribData } = await supabase
        .from('contributor_applications')
        .select('id, full_name as title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: printerData } = await supabase
        .from('printer_submissions')
        .select('id, printer_name as title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: designData } = await supabase
        .from('design_submissions')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      // Combine and sort by date
      const allActivity = [
        ...(contribData || []).map((a: any) => ({ ...a, type: 'contributor' })),
        ...(printerData || []).map((a: any) => ({ ...a, type: 'printer' })),
        ...(designData || []).map((a: any) => ({ ...a, type: 'design' }))
      ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 15);

      setRecentActivity(allActivity);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Get hourly data for last 24 hours
      const now = new Date();
      const hourlyApprovals = Array(24).fill(0);
      const hourlyRejections = Array(24).fill(0);
      
      // Get last 24 hours of data - COMBINED from both tables
      for (let i = 0; i < 24; i++) {
        const hour = new Date(now);
        hour.setHours(hour.getHours() - (23 - i));
        const startOfHour = new Date(hour.setMinutes(0, 0, 0));
        const endOfHour = new Date(startOfHour.getTime() + 3600000);

        // Get contributor approvals
        const { count: contribApprovals } = await supabase
          .from('contributor_applications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .gte('created_at', startOfHour.toISOString())
          .lt('created_at', endOfHour.toISOString());

        // Get contributor rejections
        const { count: contribRejections } = await supabase
          .from('contributor_applications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'rejected')
          .gte('created_at', startOfHour.toISOString())
          .lt('created_at', endOfHour.toISOString());

        // Get printer approvals
        const { count: printerApprovals } = await supabase
          .from('printer_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved')
          .gte('created_at', startOfHour.toISOString())
          .lt('created_at', endOfHour.toISOString());

        // Get printer rejections
        const { count: printerRejections } = await supabase
          .from('printer_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'rejected')
          .gte('created_at', startOfHour.toISOString())
          .lt('created_at', endOfHour.toISOString());

        // Combine both
        hourlyApprovals[i] = (contribApprovals || 0) + (printerApprovals || 0);
        hourlyRejections[i] = (contribRejections || 0) + (printerRejections || 0);
      }

      const approvalTotal = hourlyApprovals.reduce((a, b) => a + b, 0);
      const rejectionTotal = hourlyRejections.reduce((a, b) => a + b, 0);

      setAnalyticsData({
        hourlyApprovals,
        hourlyRejections,
        totalApprovalTime: approvalTotal,
        avgReviewTime: Math.round((approvalTotal / Math.max(approvalTotal + rejectionTotal, 1)) * 100),
        topApprovers: [],
        trendsData: [],
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchContributors = async () => {
    setLoadingModal(true);
    try {
      const { data } = await supabase
        .from('contributor_applications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      setContributors(data || []);
    } catch (error) {
      console.error('Error fetching contributors:', error);
    } finally {
      setLoadingModal(false);
    }
  };

  const fetchPrinters = async () => {
    setLoadingModal(true);
    try {
      const { data } = await supabase
        .from('printer_submissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      setPrinters(data || []);
    } catch (error) {
      console.error('Error fetching printers:', error);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleContributorAction = async (id: string, action: 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/admin/update-contributor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: action }),
      });
      if (response.ok) {
        setContributors(contributors.filter(c => c.id !== id));
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating contributor:', error);
    }
  };

  const handlePrinterAction = async (id: string, action: 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/admin/update-printer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: action }),
      });
      if (response.ok) {
        setPrinters(printers.filter(p => p.id !== id));
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating printer:', error);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedItems.size === 0) return;
    setBulkLoading(true);
    setBulkAction(action);

    try {
      for (const id of selectedItems) {
        if (id.startsWith('c_')) {
          await handleContributorAction(id.replace('c_', ''), action === 'approve' ? 'approved' : 'rejected');
        } else if (id.startsWith('p_')) {
          await handlePrinterAction(id.replace('p_', ''), action === 'approve' ? 'approved' : 'rejected');
        }
      }
      setSelectedItems(new Set());
      await fetchStats();
    } catch (error) {
      console.error('Error with bulk action:', error);
    } finally {
      setBulkLoading(false);
      setBulkAction(null);
    }
  };

  const exportMetricsToCSV = () => {
    const metrics = {
      'Export Date': new Date().toISOString(),
      'Contributors - Pending': stats.contributorsPending,
      'Contributors - Approved': stats.contributorsApproved,
      'Contributors - Rejected': stats.contributorsRejected,
      'Printers - Pending': stats.printersPending,
      'Printers - Approved': stats.printersApproved,
      'Printers - Rejected': stats.printersRejected,
      'Designs - Total Uploaded': stats.designsTotal,
      'Total Processed': stats.totalProcessed,
      'Approval Rate': getApprovalRate() + '%'
    };

    const csvContent = 'data:text/csv;charset=utf-8,' +
      Object.entries(metrics).map(([key, value]) => `${key},${value}`).join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `metrics-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/secure-admin');
  };

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    color = 'blue',
    trend,
    onClick,
    subtitle
  }: any) => {
    const colorMap: any = {
      blue: 'bg-gradient-to-br from-blue-500/10 to-blue-600/10 text-blue-400 border-blue-500/30 hover:border-blue-500/60',
      green: 'bg-gradient-to-br from-green-500/10 to-green-600/10 text-green-400 border-green-500/30 hover:border-green-500/60',
      orange: 'bg-gradient-to-br from-orange-500/10 to-orange-600/10 text-orange-400 border-orange-500/30 hover:border-orange-500/60',
      red: 'bg-gradient-to-br from-red-500/10 to-red-600/10 text-red-400 border-red-500/30 hover:border-red-500/60',
      purple: 'bg-gradient-to-br from-purple-500/10 to-purple-600/10 text-purple-400 border-purple-500/30 hover:border-purple-500/60',
      cyan: 'bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 text-cyan-400 border-cyan-500/30 hover:border-cyan-500/60',
    };

    const cardClasses = `rounded-lg border-2 ${colorMap[color]} p-3 transition-all duration-300 hover:shadow-lg hover:shadow-${color}-500/20 hover:scale-105 cursor-pointer group`;

    return (
      <button onClick={onClick} className={cardClasses}>
        <div className="flex items-start justify-between">
          <div className="text-left">
            <p className="text-xs font-medium opacity-75">{label}</p>
            <p className="text-2xl font-black mt-1">{value}</p>
            {subtitle && <p className="text-[10px] mt-1 opacity-60">{subtitle}</p>}
            {trend && (
              <p className="text-xs mt-3 flex items-center gap-1 font-semibold">
                <TrendingUp className="h-4 w-4" />
                {trend}
              </p>
            )}
          </div>
          <Icon className="h-7 w-7 opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-300" />
        </div>
      </button>
    );
  };

  const NavItem = ({ 
    icon: Icon, 
    label, 
    href, 
    onClick,
    active
  }: any) => (
    <button
      onClick={() => onClick ? onClick() : router.push(href)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left font-medium ${
        active 
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
          : 'text-gray-300 hover:bg-gray-800'
      }`}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className={`${!sidebarOpen && 'hidden'}`}>{label}</span>
    </button>
  );

  const getTotalPending = () => stats.contributorsPending + stats.printersPending;
  const getTotalApproved = () => stats.contributorsApproved + stats.printersApproved;
  const getApprovalRate = () => {
    const total = getTotalApproved() + getTotalPending();
    return total > 0 ? Math.round((getTotalApproved() / total) * 100) : 0;
  };

  return (
    <div className="min-h-screen flex transition-colors duration-300 bg-black">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-950 border-gray-800 border-r transition-all duration-300 flex flex-col fixed h-screen z-40`}>
        {/* Logo/Brand */}
        <div className="p-6 border-gray-800 border-b">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <img src="/logo2.svg" alt="Logo" className="h-12 w-12 rounded-lg" />
                <span className="font-black text-2xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Admin</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg transition-colors hover:bg-gray-800"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem
            icon={Home}
            label="Dashboard"
            href="/admin/dashboard"
            active={true}
          />
          <NavItem
            icon={FileText}
            label="Contributor Approvals"
            href="/admin/contributors"
          />
          <NavItem
            icon={Printer}
            label="Printer Approvals"
            href="/admin/printers"
          />
          <NavItem
            icon={Settings}
            label="Settings"
            href="/admin/settings"
          />
        </nav>

        {/* Footer */}
        <div className="p-4 border-gray-800 border-t space-y-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors bg-gray-800 text-yellow-400"
          >
            🌙
            {sidebarOpen && <span className="text-sm font-medium">Dark Mode</span>}
          </button>
          <NavItem
            icon={LogOut}
            label="Logout"
            href="#"
            onClick={handleLogout}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-auto ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Top Bar */}
        <div className="bg-gray-950 border-gray-800 border-b sticky top-0 z-30">
          <div className="px-8 py-6 flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-black text-white">Dashboard</h2>
              <p className="text-sm mt-1 text-gray-400">Welcome back to your admin panel</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Realtime Status */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg">
                <div className={`h-2 w-2 rounded-full ${realtimeActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs font-semibold text-gray-400">
                  {realtimeActive ? 'Live' : 'Offline'}
                </span>
              </div>

              {/* Last Update Time - Only render on client */}
              {isMounted && lastUpdate && (
                <div className="text-xs text-gray-500 text-right">
                  <p className="text-gray-400 font-semibold">Updated</p>
                  <p>{lastUpdate.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true 
                  })}</p>
                </div>
              )}

              {/* Date - Only render on client */}
              {isMounted && (
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="h-12 w-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading dashboard...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Search & Filter Bar */}
              <div className="flex flex-col md:flex-row gap-3 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search submissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800/50 pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="contributors">Contributors</option>
                  <option value="printers">Printers</option>
                  <option value="designs">Designs</option>
                </select>
                <button
                  onClick={exportMetricsToCSV}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-all"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
              </div>

              {/* Key Metrics */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-gray-100">📊 Key Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                  <StatCard
                    icon={Zap}
                    label="Pending Review"
                    value={getTotalPending()}
                    color="orange"
                    onClick={() => {
                      fetchContributors();
                      setShowContributorsModal(true);
                    }}
                    subtitle="Contributors + Printers"
                  />
                  <StatCard
                    icon={CheckCircle2}
                    label="Approved"
                    value={getTotalApproved()}
                    color="green"
                    subtitle="Total processed"
                  />
                  <StatCard
                    icon={Activity}
                    label="Approval Rate"
                    value={`${getApprovalRate()}%`}
                    color="blue"
                    trend="Updated today"
                  />
                  <StatCard
                    icon={TrendingUp}
                    label="Total Processed"
                    value={stats.totalProcessed}
                    color="purple"
                    subtitle="All time"
                  />
                </div>
              </div>

              {/* Detailed Stats Grid */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-gray-100">📋 Detailed Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-2">
                  <StatCard
                    icon={Clock}
                    label="Contributors Pending"
                    value={stats.contributorsPending}
                    color="orange"
                    onClick={() => {
                      fetchContributors();
                      setShowContributorsModal(true);
                    }}
                  />
                  <StatCard
                    icon={CheckCircle2}
                    label="Contributors Approved"
                    value={stats.contributorsApproved}
                    color="green"
                  />
                  <StatCard
                    icon={XCircle}
                    label="Contributors Rejected"
                    value={stats.contributorsRejected}
                    color="red"
                  />
                  <StatCard
                    icon={Clock}
                    label="Printers Pending"
                    value={stats.printersPending}
                    color="cyan"
                    subtitle={`${stats.printersPending > 0 ? '🔴 LIVE' : '✓ All clear'}`}
                    onClick={() => {
                      fetchPrinters();
                      setShowPrintersModal(true);
                    }}
                  />
                  <StatCard
                    icon={CheckCircle2}
                    label="Printers Approved"
                    value={stats.printersApproved}
                    color="green"
                  />
                  <StatCard
                    icon={XCircle}
                    label="Printers Rejected"
                    value={stats.printersRejected}
                    color="red"
                  />
                  <StatCard
                    icon={Palette}
                    label="Designs Uploaded"
                    value={stats.designsTotal}
                    color="purple"
                    subtitle="Total designs"
                  />
                </div>
              </div>

              {/* Action Cards */}
              <div>
                <h3 className="text-lg font-bold mb-4 text-gray-100">⚡ Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Contributor Approvals Card */}
                  <button
                    onClick={() => {
                      fetchContributors();
                      setShowContributorsModal(true);
                    }}
                    className="group p-4 bg-gray-900 hover:bg-gray-800 border-gray-700 rounded-lg border-2 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 text-left"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <span className={`px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-bold ${stats.contributorsPending > 0 ? 'animate-pulse' : ''}`}>
                        {stats.contributorsPending} pending
                      </span>
                    </div>
                    <h4 className="text-sm font-black mb-1 text-white">Contributor Approvals</h4>
                    <p className="text-xs mb-3 text-gray-400">Review and approve submitted contributors</p>
                    <div className="flex items-center gap-2 text-blue-400 font-semibold group-hover:gap-4 transition-all text-xs">
                      <span>Start Reviewing</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>

                  {/* Printer Approvals Card */}
                  <button
                    onClick={() => {
                      fetchPrinters();
                      setShowPrintersModal(true);
                    }}
                    className={`group p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-lg text-left ${
                      stats.printersPending > 0
                        ? 'bg-cyan-500/10 border-cyan-500/50 hover:border-cyan-500/80 hover:shadow-cyan-500/30'
                        : 'bg-gray-900 hover:bg-gray-800 border-gray-700 hover:shadow-purple-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
                        stats.printersPending > 0
                          ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                          : 'bg-gradient-to-br from-purple-500 to-purple-600'
                      }`}>
                        <Printer className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        {stats.printersPending > 0 && (
                          <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          stats.printersPending > 0
                            ? 'bg-red-500/30 text-red-300 animate-pulse'
                            : 'bg-gray-700/50 text-gray-400'
                        }`}>
                          {stats.printersPending} pending
                        </span>
                      </div>
                    </div>
                    <h4 className="text-sm font-black mb-1 text-white flex items-center gap-2">
                      Printer Approvals
                      {stats.printersPending > 0 && <span className="text-xs bg-red-500/30 text-red-300 px-2 py-0.5 rounded">LIVE</span>}
                    </h4>
                    <p className="text-xs mb-3 text-gray-400">Review and approve submitted printers in real-time</p>
                    <div className={`flex items-center gap-2 font-semibold group-hover:gap-4 transition-all text-xs ${
                      stats.printersPending > 0 ? 'text-cyan-400' : 'text-purple-400'
                    }`}>
                      <span>Start Reviewing</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="border-t border-gray-800 pt-6 mt-6">
                <h3 className="text-lg font-bold mb-4 text-gray-100 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-400" />
                  📋 Recent Activity Timeline
                </h3>
                <div className="space-y-3">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">No activity yet</div>
                  ) : (
                    <div className="relative space-y-4">
                      {recentActivity.map((activity, idx) => {
                        const typeColors = {
                          contributor: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', icon: FileText, color: 'text-blue-400' },
                          printer: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', icon: Printer, color: 'text-cyan-400' },
                          design: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', icon: Palette, color: 'text-purple-400' }
                        };
                        const typeConfig = typeColors[activity.type as keyof typeof typeColors] || typeColors.contributor;
                        const IconComponent = typeConfig.icon;

                        return (
                          <div key={activity.id} className="relative flex gap-4">
                            {/* Timeline dot */}
                            <div className="relative flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full ${typeConfig.bg} border-2 ${typeConfig.border} flex items-center justify-center`}>
                                <IconComponent className={`h-5 w-5 ${typeConfig.color}`} />
                              </div>
                              {idx !== recentActivity.length - 1 && (
                                <div className={`w-0.5 h-12 ${typeConfig.bg.replace('20', '10')} mt-2`} />
                              )}
                            </div>
                            
                            {/* Timeline content */}
                            <div className="flex-1 py-1">
                              <div className="flex items-start justify-between mb-1">
                                <h4 className="font-semibold text-white text-sm capitalize">{activity.type} - {activity.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  activity.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                                  activity.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {activity.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {new Date(activity.created_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Pro Tips Section */}
              <div className="space-y-2">
                <div className="rounded-lg border-2 bg-gray-900 border-blue-700/30 p-3 flex items-start gap-3">
                  <Bell className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-400" />
                  <div>
                    <h4 className="font-bold mb-0.5 text-blue-300 text-sm">💡 Pro Tip #1</h4>
                    <p className="text-xs text-gray-400">
                      Keep your dashboard organized by regularly approving or rejecting pending submissions. All actions are logged for audit purposes.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border-2 bg-gray-900 border-purple-700/30 p-3 flex items-start gap-3">
                  <Zap className="h-5 w-5 flex-shrink-0 mt-0.5 text-purple-400" />
                  <div>
                    <h4 className="font-bold mb-0.5 text-purple-300 text-sm">⚡ Pro Tip #2</h4>
                    <p className="text-xs text-gray-400">
                      Use the bulk actions feature to approve or reject multiple submissions at once. Select items and use the action buttons.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border-2 bg-gray-900 border-green-700/30 p-3 flex items-start gap-3">
                  <Activity className="h-5 w-5 flex-shrink-0 mt-0.5 text-green-400" />
                  <div>
                    <h4 className="font-bold mb-0.5 text-green-300 text-sm">📊 Pro Tip #3</h4>
                    <p className="text-xs text-gray-400">
                      Export your metrics as CSV anytime. Click the "Export CSV" button to download approval statistics for reporting.
                    </p>
                  </div>
                </div>
              </div>

              {/* Realtime Analytics Section */}
              <div className="border-t border-gray-800 pt-6 mt-6">
                <h3 className="text-lg font-bold mb-4 text-gray-100 flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-blue-400" />
                  📈 Realtime Analytics
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
                  {/* Advanced Hourly Chart with Dual Data */}
                  <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <h4 className="text-sm font-bold mb-4 text-gray-300">24-Hour Approval & Rejection Trends</h4>
                    
                    {/* Legend */}
                    <div className="flex gap-4 mb-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gradient-to-t from-green-500 to-emerald-400 rounded-sm" />
                        <span className="text-gray-400">Approvals</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gradient-to-t from-red-500 to-rose-400 rounded-sm" />
                        <span className="text-gray-400">Rejections</span>
                      </div>
                    </div>

                    {/* Dual Bar Chart */}
                    <div className="flex items-end justify-between h-40 gap-0.5 bg-gray-800/30 p-3 rounded-lg">
                      {analyticsData.hourlyApprovals.map((approvalValue, idx) => {
                        const rejectionValue = analyticsData.hourlyRejections[idx];
                        const maxValue = 15; // Scale for visibility
                        const approvalHeight = Math.max((approvalValue / maxValue) * 100, 2);
                        const rejectionHeight = Math.max((rejectionValue / maxValue) * 100, 2);

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                            {/* Stacked bars */}
                            <div className="w-full flex flex-col gap-0.5">
                              {rejectionValue > 0 && (
                                <div
                                  className="w-full bg-gradient-to-t from-red-500 to-rose-400 rounded-t-sm"
                                  style={{ height: `${rejectionHeight}px` }}
                                  title={`Rejections: ${rejectionValue}`}
                                />
                              )}
                              {approvalValue > 0 && (
                                <div
                                  className={`w-full bg-gradient-to-t from-green-500 to-emerald-400 ${rejectionValue > 0 ? '' : 'rounded-t-sm'}`}
                                  style={{ height: `${approvalHeight}px` }}
                                  title={`Approvals: ${approvalValue}`}
                                />
                              )}
                            </div>
                            
                            {/* Hover tooltip */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-950 border border-gray-700 rounded px-2 py-1 text-xs font-semibold text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              <div>✓ {approvalValue}</div>
                              <div>✕ {rejectionValue}</div>
                            </div>
                            
                            {/* Hour label */}
                            <span className="text-[9px] text-gray-600 text-center mt-1 group-hover:text-gray-400 transition">{idx}h</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chart info */}
                    <div className="text-xs text-gray-500 mt-2 text-center">
                      Last 24 hours • Combined Contributors & Printers
                    </div>
                  </div>

                  {/* Analytics Stats */}
                  <div className="space-y-2">
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-400">Approvals (24h)</span>
                        <Flame className="h-4 w-4 text-green-400" />
                      </div>
                      <p className="text-2xl font-black text-green-400">{analyticsData.totalApprovalTime}</p>
                      <p className="text-xs text-gray-500 mt-1">Total approved</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-400">Rejections (24h)</span>
                        <AlertCircle className="h-4 w-4 text-red-400" />
                      </div>
                      <p className="text-2xl font-black text-red-400">{analyticsData.hourlyRejections.reduce((a, b) => a + b, 0)}</p>
                      <p className="text-xs text-gray-500 mt-1">Total rejected</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-400">Approval Rate</span>
                        <Target className="h-4 w-4 text-blue-400" />
                      </div>
                      <p className="text-2xl font-black text-blue-400">{analyticsData.avgReviewTime}%</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-400">Live Monitoring</span>
                        <Eye className="h-4 w-4 text-purple-400 animate-pulse" />
                      </div>
                      <p className="text-xs text-purple-400 font-semibold">Active</p>
                    </div>
                  </div>
                </div>

                {/* Printer & Contributor Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Printer Stats Breakdown */}
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <h4 className="text-sm font-bold mb-3 text-gray-300 flex items-center gap-2">
                      <Printer className="h-4 w-4 text-cyan-400" />
                      Printer Submissions
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Pending</span>
                        <span className="font-bold text-orange-400">{stats.printersPending}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1">
                        <div className="bg-orange-500 h-1 rounded-full" style={{ width: `${Math.min((stats.printersPending / Math.max(getTotalPending(), 1)) * 100, 100)}%` }} />
                      </div>
                      
                      <div className="flex items-center justify-between text-sm mt-3">
                        <span className="text-gray-400">Approved</span>
                        <span className="font-bold text-green-400">{stats.printersApproved}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1">
                        <div className="bg-green-500 h-1 rounded-full" style={{ width: `${Math.min((stats.printersApproved / Math.max(getTotalApproved(), 1)) * 100, 100)}%` }} />
                      </div>

                      <div className="flex items-center justify-between text-sm mt-3">
                        <span className="text-gray-400">Rejected</span>
                        <span className="font-bold text-red-400">{stats.printersRejected}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1">
                        <div className="bg-red-500 h-1 rounded-full" style={{ width: `${Math.min((stats.printersRejected / Math.max((stats.printersRejected || 1), 1)) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Contributor Stats Breakdown */}
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <h4 className="text-sm font-bold mb-3 text-gray-300 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-400" />
                      Contributor Submissions
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Pending</span>
                        <span className="font-bold text-orange-400">{stats.contributorsPending}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1">
                        <div className="bg-orange-500 h-1 rounded-full" style={{ width: `${Math.min((stats.contributorsPending / Math.max(getTotalPending(), 1)) * 100, 100)}%` }} />
                      </div>

                      <div className="flex items-center justify-between text-sm mt-3">
                        <span className="text-gray-400">Approved</span>
                        <span className="font-bold text-green-400">{stats.contributorsApproved}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1">
                        <div className="bg-green-500 h-1 rounded-full" style={{ width: `${Math.min((stats.contributorsApproved / Math.max(getTotalApproved(), 1)) * 100, 100)}%` }} />
                      </div>

                      <div className="flex items-center justify-between text-sm mt-3">
                        <span className="text-gray-400">Rejected</span>
                        <span className="font-bold text-red-400">{stats.contributorsRejected}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1">
                        <div className="bg-red-500 h-1 rounded-full" style={{ width: `${Math.min((stats.contributorsRejected / Math.max((stats.contributorsRejected || 1), 1)) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contributors Modal */}
      {showContributorsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border-2 border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-3 flex items-center justify-between text-sm">
              <h2 className="text-lg font-black text-white">Pending Contributors</h2>
              <button
                onClick={() => setShowContributorsModal(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="p-3 space-y-2">
              {loadingModal ? (
                <div className="text-center py-6 text-gray-400 text-sm">Loading...</div>
              ) : contributors.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">No pending contributors</div>
              ) : (
                contributors.map((contributor) => (
                  <div
                    key={contributor.id}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-all text-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{contributor.full_name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{contributor.email}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Applied: {new Date(contributor.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-semibold">
                        {contributor.status}
                      </span>
                    </div>
                    {contributor.bio && (
                      <p className="text-gray-300 text-sm mb-4">{contributor.bio}</p>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleContributorAction(contributor.id, 'approved')}
                        className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-semibold rounded-lg transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleContributorAction(contributor.id, 'rejected')}
                        className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-lg transition-colors"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printers Modal */}
      {showPrintersModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border-2 border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-3 flex items-center justify-between text-sm">
              <h2 className="text-lg font-black text-white">Pending Printers</h2>
              <button
                onClick={() => setShowPrintersModal(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="p-3 space-y-2">
              {loadingModal ? (
                <div className="text-center py-6 text-gray-400 text-sm">Loading...</div>
              ) : printers.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">No pending printers</div>
              ) : (
                printers.map((printer) => (
                  <div
                    key={printer.id}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-all text-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-white">{printer.printer_name || 'Printer'}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{printer.email}</p>
                        <p className="text-[10px] text-gray-500 mt-1">
                          Submitted: {new Date(printer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-semibold">
                        {printer.status}
                      </span>
                    </div>
                    {printer.description && (
                      <p className="text-gray-300 text-sm mb-4">{printer.description}</p>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handlePrinterAction(printer.id, 'approved')}
                        className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-semibold rounded-lg transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handlePrinterAction(printer.id, 'rejected')}
                        className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-lg transition-colors"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
