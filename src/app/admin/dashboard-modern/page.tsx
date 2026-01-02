'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  BarChart3, Clock, CheckCircle2, XCircle, FileText, Printer,
  Users, Settings, LogOut, Menu, X, TrendingUp, AlertCircle,
  Home, ArrowRight, Activity, Zap, Shield, Bell, ChevronRight,
  LineChart, PieChart, Calendar, Filter
} from 'lucide-react';

export default function ModernAdminDashboard() {
  useAdminAuth('admin');
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState({
    designsPending: 0,
    designsApproved: 0,
    designsRejected: 0,
    printersPending: 0,
    printersApproved: 0,
    printersRejected: 0,
    totalProcessed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentActivity();
    const interval = setInterval(() => {
      fetchStats();
      fetchRecentActivity();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const { count: dpending } = await supabase
        .from('design_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: dapproved } = await supabase
        .from('design_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { count: drejected } = await supabase
        .from('design_submissions')
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

      setStats({
        designsPending: dpending || 0,
        designsApproved: dapproved || 0,
        designsRejected: drejected || 0,
        printersPending: ppending || 0,
        printersApproved: papproved || 0,
        printersRejected: prejected || 0,
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
      const { data } = await supabase
        .from('design_submissions')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentActivity(data || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
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
      blue: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border-blue-200 hover:shadow-blue-100',
      green: 'bg-gradient-to-br from-green-50 to-green-100 text-green-600 border-green-200 hover:shadow-green-100',
      orange: 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600 border-orange-200 hover:shadow-orange-100',
      red: 'bg-gradient-to-br from-red-50 to-red-100 text-red-600 border-red-200 hover:shadow-red-100',
      purple: 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 border-purple-200 hover:shadow-purple-100',
      cyan: 'bg-gradient-to-br from-cyan-50 to-cyan-100 text-cyan-600 border-cyan-200 hover:shadow-cyan-100',
    };

    const cardClasses = `rounded-2xl border-2 ${colorMap[color]} p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer group`;

    return (
      <button onClick={onClick} className={cardClasses}>
        <div className="flex items-start justify-between">
          <div className="text-left">
            <p className="text-sm font-medium opacity-75">{label}</p>
            <p className="text-4xl font-black mt-3">{value}</p>
            {subtitle && <p className="text-xs mt-2 opacity-60">{subtitle}</p>}
            {trend && (
              <p className="text-xs mt-3 flex items-center gap-1 font-semibold">
                <TrendingUp className="h-4 w-4" />
                {trend}
              </p>
            )}
          </div>
          <Icon className="h-10 w-10 opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-300" />
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
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className={`${!sidebarOpen && 'hidden'}`}>{label}</span>
    </button>
  );

  const getTotalPending = () => stats.designsPending + stats.printersPending;
  const getTotalApproved = () => stats.designsApproved + stats.printersApproved;
  const getApprovalRate = () => {
    const total = getTotalApproved() + getTotalPending();
    return total > 0 ? Math.round((getTotalApproved() / total) * 100) : 0;
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-300 bg-black`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r transition-all duration-300 flex flex-col fixed h-screen z-40`}>
        {/* Logo/Brand */}
        <div className={`p-6 ${darkMode ? 'border-gray-800' : 'border-gray-200'} border-b`}>
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className={`font-black text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>Admin</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
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
            href="/admin/dashboard-modern"
            active={true}
          />
          <NavItem
            icon={FileText}
            label="Design Approvals"
            href="/admin/dashboard/designs"
          />
          <NavItem
            icon={Printer}
            label="Printer Approvals"
            href="/admin/dashboard/printers"
          />
          <NavItem
            icon={Users}
            label="Team Members"
            href="/admin/executive/teams"
          />
          <NavItem
            icon={Settings}
            label="Settings"
            href="/admin/executive/settings"
          />
        </nav>

        {/* Footer */}
        <div className={`p-4 ${darkMode ? 'border-gray-800' : 'border-gray-200'} border-t space-y-3`}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-700'}`}
          >
            {darkMode ? '🌙' : '☀️'}
            {sidebarOpen && <span className="text-sm font-medium">{darkMode ? 'Dark' : 'Light'}</span>}
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
        <div className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-30`}>
          <div className="px-8 py-6 flex items-center justify-between">
            <div>
              <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard</h2>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Welcome back to your admin panel</p>
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-2`}>
              <Calendar className="h-4 w-4" />
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading dashboard...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div>
                <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>📊 Key Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon={Zap}
                    label="Pending Review"
                    value={getTotalPending()}
                    color="orange"
                    onClick={() => router.push('/admin/dashboard/designs')}
                    subtitle="Designs + Printers"
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
                <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>📋 Detailed Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <StatCard
                    icon={Clock}
                    label="Designs Pending"
                    value={stats.designsPending}
                    color="orange"
                    onClick={() => router.push('/admin/dashboard/designs')}
                  />
                  <StatCard
                    icon={CheckCircle2}
                    label="Designs Approved"
                    value={stats.designsApproved}
                    color="green"
                  />
                  <StatCard
                    icon={XCircle}
                    label="Designs Rejected"
                    value={stats.designsRejected}
                    color="red"
                  />
                  <StatCard
                    icon={Clock}
                    label="Printers Pending"
                    value={stats.printersPending}
                    color="cyan"
                    onClick={() => router.push('/admin/dashboard/printers')}
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
                </div>
              </div>

              {/* Action Cards */}
              <div>
                <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>⚡ Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Design Approvals Card */}
                  <button
                    onClick={() => router.push('/admin/dashboard/designs')}
                    className={`group p-8 ${darkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 border-gray-200'} rounded-2xl border-2 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 text-left`}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <span className={`px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-bold ${stats.designsPending > 0 ? 'animate-pulse' : ''}`}>
                        {stats.designsPending} pending
                      </span>
                    </div>
                    <h4 className={`text-xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Design Approvals</h4>
                    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Review and approve submitted designs</p>
                    <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-4 transition-all">
                      <span>Start Reviewing</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>

                  {/* Printer Approvals Card */}
                  <button
                    onClick={() => router.push('/admin/dashboard/printers')}
                    className={`group p-8 ${darkMode ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 border-gray-200'} rounded-2xl border-2 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 text-left`}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Printer className="h-6 w-6 text-white" />
                      </div>
                      <span className={`px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-bold ${stats.printersPending > 0 ? 'animate-pulse' : ''}`}>
                        {stats.printersPending} pending
                      </span>
                    </div>
                    <h4 className={`text-xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Printer Approvals</h4>
                    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Review and approve submitted printers</p>
                    <div className="flex items-center gap-2 text-purple-600 font-semibold group-hover:gap-4 transition-all">
                      <span>Start Reviewing</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Info Banner */}
              <div className={`rounded-2xl border-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'} p-6 flex items-start gap-4`}>
                <Bell className={`h-6 w-6 flex-shrink-0 mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <div>
                  <h4 className={`font-bold mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>💡 Pro Tip</h4>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-blue-700'}`}>
                    Keep your dashboard organized by regularly approving or rejecting pending submissions. All actions are logged for audit purposes.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
