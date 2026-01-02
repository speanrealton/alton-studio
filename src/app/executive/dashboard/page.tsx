'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  Users, TrendingUp, BarChart3, LogOut, Menu, X,
  Home, Settings, Activity, Bell
} from 'lucide-react';

export default function ExecutiveDashboard() {
  // Check if user has executive role
  useAdminAuth('executive');
  
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalAgents: 0,
    totalApprovals: 0,
    pendingReviews: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch basic stats
      setStats({
        totalTeams: 12,
        totalAgents: 45,
        totalApprovals: 234,
        pendingReviews: 8,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-2xl font-bold">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h1 className={`font-black text-xl ${!sidebarOpen && 'hidden'}`}>Executive</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem icon={Home} label="Dashboard" href="/executive/dashboard" active={true} />
          <NavItem icon={Users} label="Teams" href="/executive/teams" />
          <NavItem icon={Activity} label="Activity" href="/executive/analytics" />
          <NavItem icon={Settings} label="Settings" href="/executive/settings" />
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold ${!sidebarOpen && 'justify-center'}`}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">Executive Dashboard</h2>
              <p className="text-gray-400 text-sm">Welcome back!</p>
            </div>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <StatCard
              label="Teams"
              value={stats.totalTeams}
              icon={Users}
              color="blue"
            />
            <StatCard
              label="Agents"
              value={stats.totalAgents}
              icon={Activity}
              color="purple"
            />
            <StatCard
              label="Total Approvals"
              value={stats.totalApprovals}
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              label="Pending Reviews"
              value={stats.pendingReviews}
              icon={BarChart3}
              color="orange"
            />
          </div>

          {/* Content Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-black mb-3">Recent Activity</h3>
              <div className="space-y-2">
                <ActivityItem title="Design approved" subtitle="2 hours ago" />
                <ActivityItem title="New printer submission" subtitle="5 hours ago" />
                <ActivityItem title="Team member joined" subtitle="1 day ago" />
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-black mb-3">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Approval Rate</span>
                  <span className="font-bold">94%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Response Time</span>
                  <span className="font-bold">2.5 hrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Team Efficiency</span>
                  <span className="font-bold">98%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colorMap: any = {
    blue: 'bg-blue-500/10 border-blue-500/30',
    purple: 'bg-purple-500/10 border-purple-500/30',
    green: 'bg-green-500/10 border-green-500/30',
    orange: 'bg-orange-500/10 border-orange-500/30',
  };

  return (
    <div className={`${colorMap[color]} border rounded-lg p-3`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium opacity-75">{label}</p>
          <p className="text-2xl font-black mt-1">{value}</p>
        </div>
        <Icon className="h-6 w-6 opacity-30" />
      </div>
    </div>
  );
}

function ActivityItem({ title, subtitle }: any) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors">
      <div className="w-2 h-2 bg-green-500 rounded-full" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, href, active }: any) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-semibold ${
        active
          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </a>
  );
}
