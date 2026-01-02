'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Settings,
  Save,
  RefreshCw,
  Shield,
  Eye,
  Lock,
  Zap,
  Globe,
  Users,
  AlertCircle,
  CheckCircle,
  ToggleRight,
  ToggleLeft,
  Server,
  Database,
  Mail,
  Smartphone,
  TrendingUp,
} from 'lucide-react';
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Setting {
  id: string;
  category: string;
  key: string;
  label: string;
  description: string;
  value: any;
  type: 'boolean' | 'text' | 'number' | 'select' | 'textarea';
  options?: { label: string; value: any }[];
  impact: 'critical' | 'high' | 'medium' | 'low';
  requiresRestart?: boolean;
}

const ExecutiveSettingsPage = () => {
  const [settings, setSettings] = useState<Setting[]>([
    // SECURITY & ACCESS
    {
      id: '1',
      category: 'Security',
      key: 'two_factor_required',
      label: 'Require Two-Factor Authentication',
      description: 'Force all users to use 2FA for account security',
      value: false,
      type: 'boolean',
      impact: 'critical',
    },
    {
      id: '2',
      category: 'Security',
      key: 'ip_whitelist_enabled',
      label: 'Enable IP Whitelist',
      description: 'Only allow access from whitelisted IP addresses',
      value: false,
      type: 'boolean',
      impact: 'critical',
    },
    {
      id: '3',
      category: 'Security',
      key: 'password_strength',
      label: 'Password Strength Requirements',
      description: 'Enforce strong password policy across all accounts',
      value: 'medium',
      type: 'select',
      options: [
        { label: 'Basic', value: 'basic' },
        { label: 'Medium', value: 'medium' },
        { label: 'Strong', value: 'strong' },
        { label: 'Enterprise', value: 'enterprise' },
      ],
      impact: 'high',
    },
    {
      id: '4',
      category: 'Security',
      key: 'session_timeout',
      label: 'Session Timeout (minutes)',
      description: 'Automatic logout after inactivity',
      value: 30,
      type: 'number',
      impact: 'high',
    },

    // USER MANAGEMENT
    {
      id: '5',
      category: 'User Management',
      key: 'allow_registration',
      label: 'Allow New User Registration',
      description: 'Enable/disable new user signups',
      value: true,
      type: 'boolean',
      impact: 'high',
    },
    {
      id: '6',
      category: 'User Management',
      key: 'registration_approval_required',
      label: 'Require Admin Approval for Registration',
      description: 'New registrations must be approved by admin',
      value: false,
      type: 'boolean',
      impact: 'medium',
    },
    {
      id: '7',
      category: 'User Management',
      key: 'max_users',
      label: 'Maximum Users Limit',
      description: 'Maximum concurrent users allowed (0 = unlimited)',
      value: 0,
      type: 'number',
      impact: 'high',
    },
    {
      id: '8',
      category: 'User Management',
      key: 'auto_disable_inactive',
      label: 'Auto-Disable Inactive Users',
      description: 'Automatically disable users after 90 days of inactivity',
      value: true,
      type: 'boolean',
      impact: 'medium',
    },

    // CONTENT & PUBLISHING
    {
      id: '9',
      category: 'Content',
      key: 'content_requires_approval',
      label: 'Require Approval for Content Publishing',
      description: 'All content must be approved before publishing',
      value: true,
      type: 'boolean',
      impact: 'high',
    },
    {
      id: '10',
      category: 'Content',
      key: 'content_publishing_mode',
      label: 'Content Publishing Mode',
      description: 'Controls how content is published',
      value: 'moderated',
      type: 'select',
      options: [
        { label: 'Moderated', value: 'moderated' },
        { label: 'Auto-Publish', value: 'auto' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Manual', value: 'manual' },
      ],
      impact: 'critical',
    },
    {
      id: '11',
      category: 'Content',
      key: 'max_upload_size_mb',
      label: 'Max Upload Size (MB)',
      description: 'Maximum file upload size',
      value: 50,
      type: 'number',
      impact: 'medium',
    },

    // PERFORMANCE & OPTIMIZATION
    {
      id: '12',
      category: 'Performance',
      key: 'enable_caching',
      label: 'Enable Content Caching',
      description: 'Cache content for faster delivery',
      value: true,
      type: 'boolean',
      impact: 'medium',
      requiresRestart: true,
    },
    {
      id: '13',
      category: 'Performance',
      key: 'cache_ttl_hours',
      label: 'Cache TTL (hours)',
      description: 'How long to cache content',
      value: 24,
      type: 'number',
      impact: 'low',
    },
    {
      id: '14',
      category: 'Performance',
      key: 'enable_cdn',
      label: 'Enable CDN',
      description: 'Use CDN for global content delivery',
      value: false,
      type: 'boolean',
      impact: 'medium',
      requiresRestart: true,
    },

    // NOTIFICATIONS & COMMUNICATION
    {
      id: '15',
      category: 'Communications',
      key: 'email_notifications_enabled',
      label: 'Enable Email Notifications',
      description: 'Send email notifications to users',
      value: true,
      type: 'boolean',
      impact: 'medium',
    },
    {
      id: '16',
      category: 'Communications',
      key: 'sms_notifications_enabled',
      label: 'Enable SMS Notifications',
      description: 'Send SMS alerts for critical events',
      value: false,
      type: 'boolean',
      impact: 'medium',
    },
    {
      id: '17',
      category: 'Communications',
      key: 'push_notifications_enabled',
      label: 'Enable Push Notifications',
      description: 'Send push notifications to mobile devices',
      value: true,
      type: 'boolean',
      impact: 'medium',
    },

    // ANALYTICS & MONITORING
    {
      id: '18',
      category: 'Analytics',
      key: 'track_user_behavior',
      label: 'Track User Behavior',
      description: 'Collect analytics on user interactions',
      value: true,
      type: 'boolean',
      impact: 'low',
    },
    {
      id: '19',
      category: 'Analytics',
      key: 'retention_days',
      label: 'Data Retention (days)',
      description: 'How long to keep analytics data',
      value: 90,
      type: 'number',
      impact: 'low',
    },
    {
      id: '20',
      category: 'Analytics',
      key: 'heatmap_enabled',
      label: 'Enable Heatmap Analytics',
      description: 'Track user clicks and interactions visually',
      value: false,
      type: 'boolean',
      impact: 'low',
    },

    // INTEGRATIONS
    {
      id: '21',
      category: 'Integrations',
      key: 'api_access_enabled',
      label: 'Enable API Access',
      description: 'Allow third-party API integrations',
      value: true,
      type: 'boolean',
      impact: 'high',
    },
    {
      id: '22',
      category: 'Integrations',
      key: 'webhook_enabled',
      label: 'Enable Webhooks',
      description: 'Allow external webhooks for events',
      value: false,
      type: 'boolean',
      impact: 'high',
    },
    {
      id: '23',
      category: 'Integrations',
      key: 'oauth_providers',
      label: 'OAuth Providers',
      description: 'Enable OAuth login providers',
      value: 'google,github',
      type: 'text',
      impact: 'medium',
    },

    // MAINTENANCE & BACKUP
    {
      id: '24',
      category: 'Maintenance',
      key: 'maintenance_mode',
      label: 'Maintenance Mode',
      description: 'Take website offline for maintenance',
      value: false,
      type: 'boolean',
      impact: 'critical',
    },
    {
      id: '25',
      category: 'Maintenance',
      key: 'auto_backup_enabled',
      label: 'Enable Automatic Backups',
      description: 'Automatic daily backups',
      value: true,
      type: 'boolean',
      impact: 'high',
    },
    {
      id: '26',
      category: 'Maintenance',
      key: 'backup_frequency',
      label: 'Backup Frequency',
      description: 'How often to backup data',
      value: 'daily',
      type: 'select',
      options: [
        { label: 'Hourly', value: 'hourly' },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
      ],
      impact: 'high',
    },
  ]);

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Security');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [restartRequired, setRestartRequired] = useState(false);

  const categories = Array.from(new Set(settings.map((s) => s.category)));

  const handleSettingChange = (id: string, newValue: any) => {
    setSettings(
      settings.map((s) => (s.id === id ? { ...s, value: newValue } : s))
    );
    setUnsavedChanges(true);
    setRestartRequired(
      settings.find((s) => s.id === id)?.requiresRestart || false
    );
  };

  const saveSettings = async () => {
    setSaveStatus('saving');
    try {
      // Simulate saving to database
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUnsavedChanges(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('idle');
    }
  };

  const resetSettings = () => {
    if (confirm('Reset all settings to defaults?')) {
      // Reset logic
      window.location.reload();
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'text-red-400 bg-red-900/20';
      case 'high':
        return 'text-orange-400 bg-orange-900/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'low':
        return 'text-green-400 bg-green-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const categorySettings = settings.filter((s) => s.category === activeCategory);

  return (
    <AdminDashboardLayout userRole="executive">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Advanced Settings</h2>
            <p className="text-sm text-gray-400 mt-1">
              Control system-wide features that impact the entire website
            </p>
          </div>
          <div className="flex gap-2">
            {unsavedChanges && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-slate-700/50 text-white hover:bg-slate-700 transition-colors text-sm"
              >
                Discard
              </button>
            )}
            <button
              onClick={saveSettings}
              disabled={!unsavedChanges || saveStatus === 'saving'}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                unsavedChanges
                  ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30'
                  : 'bg-slate-700/50 text-gray-400 cursor-not-allowed'
              }`}
            >
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Saving...
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircle size={16} />
                  Saved!
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Alerts */}
        {restartRequired && (
          <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-900/20 p-4">
            <AlertCircle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-300">Restart Required</p>
              <p className="text-xs text-yellow-400 mt-1">
                Some changes require a system restart to take effect. Please save and restart the server.
              </p>
            </div>
          </div>
        )}

        {/* Settings Container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Sidebar Categories */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-lg border border-slate-700 bg-slate-800/30 p-3 space-y-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === category
                      ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Settings List */}
          <div className="lg:col-span-3">
            <div className="space-y-3">
              {categorySettings.map((setting) => (
                <div
                  key={setting.id}
                  className="rounded-lg border border-slate-700 bg-slate-800/30 p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <h3 className="text-base font-semibold text-white">{setting.label}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getImpactColor(
                          setting.impact
                        )}`}>
                          {setting.impact.toUpperCase()}
                        </span>
                        {setting.requiresRestart && (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-red-900/20 text-red-300">
                            RESTART
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-2">{setting.description}</p>
                    </div>

                    {/* Control */}
                    <div className="md:w-48">
                      {setting.type === 'boolean' ? (
                        <button
                          onClick={() =>
                            handleSettingChange(setting.id, !setting.value)
                          }
                          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                            setting.value
                              ? 'bg-green-900/30 text-green-300 border border-green-500/30'
                              : 'bg-gray-900/30 text-gray-400 border border-gray-500/30'
                          }`}
                        >
                          {setting.value ? (
                            <>
                              <ToggleRight size={16} />
                              Enabled
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={16} />
                              Disabled
                            </>
                          )}
                        </button>
                      ) : setting.type === 'select' ? (
                        <select
                          value={setting.value}
                          onChange={(e) =>
                            handleSettingChange(setting.id, e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
                        >
                          {setting.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : setting.type === 'textarea' ? (
                        <textarea
                          value={setting.value}
                          onChange={(e) =>
                            handleSettingChange(setting.id, e.target.value)
                          }
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
                        />
                      ) : (
                        <input
                          type={setting.type}
                          value={setting.value}
                          onChange={(e) =>
                            handleSettingChange(
                              setting.id,
                              setting.type === 'number'
                                ? parseInt(e.target.value) || 0
                                : e.target.value
                            )
                          }
                          className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
          <h3 className="text-lg font-bold text-white mb-4">System Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-slate-700/50 p-3">
              <p className="text-xs text-gray-400 mb-1">Database</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-semibold text-green-300">Connected</span>
              </div>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-3">
              <p className="text-xs text-gray-400 mb-1">API Server</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-semibold text-green-300">Running</span>
              </div>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-3">
              <p className="text-xs text-gray-400 mb-1">Cache</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-semibold text-green-300">Active</span>
              </div>
            </div>
            <div className="rounded-lg bg-slate-700/50 p-3">
              <p className="text-xs text-gray-400 mb-1">Uptime</p>
              <p className="text-sm font-semibold text-cyan-300">99.9%</p>
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default ExecutiveSettingsPage;
