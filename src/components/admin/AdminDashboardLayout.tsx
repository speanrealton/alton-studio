'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, Menu, X, Bell, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
  userRole: 'admin' | 'executive';
}

const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({ children, userRole }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      setSidebarOpen(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Subscribe to real-time notifications
  useEffect(() => {
    const channel = supabase
      .channel(`${userRole}-notifications`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, (payload) => {
        setNotifications((prev) => [payload.new, ...prev]);
        setNotificationCount((prev) => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const navigationItems = {
    admin: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
      { label: 'Contributors', href: '/admin/contributors', icon: '👥' },
      { label: 'Printer Approvals', href: '/admin/printers', icon: '🖨️' },
      { label: 'Audit Logs', href: '/admin/logs', icon: '📋' },
      { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
    ],
    executive: [
      { label: 'Dashboard', href: '/admin/executive/dashboard', icon: '📊' },
      { label: 'Team Management', href: '/admin/executive/teams', icon: '👥' },
      { label: 'Approvals Monitor', href: '/admin/executive/approvals', icon: '✅' },
      { label: 'Analytics', href: '/admin/executive/analytics', icon: '📈' },
      { label: 'System Settings', href: '/admin/executive/settings', icon: '⚙️' },
    ],
  };

  const navItems = navigationItems[userRole];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 hover:bg-slate-800 lg:hidden"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="text-xl font-bold text-white">
              {userRole === 'admin' ? '🔐 Admin Dashboard' : '👔 Executive Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Badge */}
            <button className="relative rounded-lg p-2 hover:bg-slate-800">
              <Bell size={20} />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-xs font-bold text-white flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-red-600/20 px-4 py-2 text-red-400 hover:bg-red-600/30"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed inset-y-16 left-0 w-64 border-r border-slate-700 bg-slate-800/50 backdrop-blur-sm transition-transform duration-300 lg:static lg:translate-x-0 overflow-y-auto`}
        >
          <nav className="space-y-2 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-300 transition-all hover:bg-slate-700 hover:text-white"
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8">
            {/* Security Notice */}
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-yellow-700/50 bg-yellow-900/20 px-4 py-3 text-yellow-300">
              <AlertCircle size={20} />
              <p className="text-sm">
                This is a secure admin panel. All activities are logged and monitored.
              </p>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
