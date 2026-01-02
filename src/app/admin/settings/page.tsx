'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  Settings, Save, LogOut, Menu, X, Bell, Lock, Database,
  Users, Shield, Activity, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function AdminSettings() {
  useAdminAuth('admin');
  
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    auto_approve_enabled: false,
    max_pending_items: 50,
    approval_timeout_hours: 24,
    email_notifications: true,
    slack_notifications: false,
    two_factor_enabled: true,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setSaved(false);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Simulate saving to database
      await new Promise(resolve => setTimeout(resolve, 500));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col fixed h-screen z-40`}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <Link href="/admin/dashboard" className={`font-black text-xl ${!sidebarOpen && 'hidden'}`}>
            Admin
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem
            icon={Settings}
            label="Dashboard"
            href="/admin/dashboard"
            active={false}
            sidebarOpen={sidebarOpen}
          />
          <NavItem
            icon={Users}
            label="Contributors"
            href="/admin/dashboard/contributors"
            active={false}
            sidebarOpen={sidebarOpen}
          />
          <NavItem
            icon={Activity}
            label="Printers"
            href="/admin/dashboard/printers"
            active={false}
            sidebarOpen={sidebarOpen}
          />
          <NavItem
            icon={Settings}
            label="Settings"
            href="/admin/settings"
            active={true}
            sidebarOpen={sidebarOpen}
          />
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
      <main className={`flex-1 overflow-auto ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black">Settings</h1>
              <p className="text-gray-400 text-sm mt-1">Manage your admin preferences</p>
            </div>
            {saved && (
              <div className="bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm font-semibold">
                ✓ Settings saved!
              </div>
            )}
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Main Settings */}
            <div className="lg:col-span-2 space-y-3">
              {/* Notifications Section */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-bold">Notifications</h3>
                </div>
                
                <div className="space-y-3">
                  <SettingToggle
                    label="Email Notifications"
                    description="Receive email alerts for important actions"
                    enabled={settings.email_notifications}
                    onChange={(value: boolean) => handleSettingChange('email_notifications', value)}
                  />
                  <SettingToggle
                    label="Slack Notifications"
                    description="Send approval updates to Slack"
                    enabled={settings.slack_notifications}
                    onChange={(value: boolean) => handleSettingChange('slack_notifications', value)}
                  />
                  <SettingToggle
                    label="System Notifications"
                    description="Show browser notifications"
                    enabled={settings.notifications_enabled}
                    onChange={(value: boolean) => handleSettingChange('notifications_enabled', value)}
                  />
                </div>
              </div>

              {/* Approval Settings */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-bold">Approval Settings</h3>
                </div>

                <div className="space-y-3">
                  <SettingToggle
                    label="Auto-Approve Enabled"
                    description="Automatically approve items matching criteria"
                    enabled={settings.auto_approve_enabled}
                    onChange={(value: boolean) => handleSettingChange('auto_approve_enabled', value)}
                  />
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-300">Max Pending Items</label>
                    <input
                      type="number"
                      value={settings.max_pending_items}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSettingChange('max_pending_items', parseInt(e.target.value))}
                      className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum items to display in pending queue</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-300">Approval Timeout (hours)</label>
                    <input
                      type="number"
                      value={settings.approval_timeout_hours}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSettingChange('approval_timeout_hours', parseInt(e.target.value))}
                      className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">How long before an item times out (auto-reject)</p>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="h-5 w-5 text-red-400" />
                  <h3 className="text-lg font-bold">Security</h3>
                </div>

                <div className="space-y-3">
                  <SettingToggle
                    label="Two-Factor Authentication"
                    description="Require 2FA for admin access"
                    enabled={settings.two_factor_enabled}
                    onChange={(value: boolean) => handleSettingChange('two_factor_enabled', value)}
                  />

                  <button className="w-full px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition text-sm font-semibold">
                    Change Password
                  </button>

                  <button className="w-full px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 transition text-sm font-semibold">
                    View Session History
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveSettings}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 transition"
              >
                <Save className="h-5 w-5" />
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

            {/* Info Panel */}
            <div className="space-y-3">
              {/* Quick Stats */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-bold mb-3 text-gray-400 uppercase">Quick Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Pending Items</span>
                    <span className="font-bold text-white">24</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Processed Today</span>
                    <span className="font-bold text-green-400">52</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Approval Rate</span>
                    <span className="font-bold text-blue-400">92%</span>
                  </div>
                </div>
              </div>

              {/* Help */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-bold mb-3 text-gray-400 uppercase">Need Help?</h3>
                <div className="space-y-2">
                  <button className="w-full text-left text-sm text-purple-400 hover:text-purple-300 transition flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" />
                    Documentation
                  </button>
                  <button className="w-full text-left text-sm text-purple-400 hover:text-purple-300 transition flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" />
                    Support Chat
                  </button>
                  <button className="w-full text-left text-sm text-purple-400 hover:text-purple-300 transition flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" />
                    API Docs
                  </button>
                </div>
              </div>

              {/* Version */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500">Admin Dashboard</p>
                <p className="text-sm font-bold text-gray-400 mt-1">v1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SettingToggle({ label, description, enabled, onChange }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-300">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? 'bg-purple-600' : 'bg-gray-700'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function NavItem({ icon: Icon, label, href, active, sidebarOpen }: any) {
  return (
    <Link href={href}>
      <div
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-semibold ${
          active
            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
            : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }`}
      >
        <Icon className="h-4 w-4" />
        {sidebarOpen && <span>{label}</span>}
      </div>
    </Link>
  );
}
