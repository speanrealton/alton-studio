'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, LogIn } from 'lucide-react';
import AdminSignIn from '@/components/admin/AdminSignIn';

const AdminAccessPortal = () => {
  const [role, setRole] = useState<'admin' | 'executive' | null>(null);
  const [obfuscatedPath, setObfuscatedPath] = useState('');

  const handleRoleSelect = async (selectedRole: 'admin' | 'executive') => {
    // Generate obfuscated path
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const path = `${selectedRole}-${timestamp}-${randomSuffix}`;
    
    setRole(selectedRole);
    setObfuscatedPath(path);
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Shield className="h-10 w-10 text-green-500" />
              <h1 className="text-4xl font-bold text-white">Secure Admin Portal</h1>
            </div>
            <p className="text-gray-400 text-lg">
              Select your access level to continue
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Admin Card */}
            <div
              onClick={() => handleRoleSelect('admin')}
              className="group cursor-pointer rounded-xl border border-slate-700 bg-slate-800/50 p-8 backdrop-blur-sm hover:border-cyan-500 hover:bg-cyan-900/10 transition-all"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="rounded-lg bg-cyan-900/20 p-4">
                  <Lock className="h-8 w-8 text-cyan-400" />
                </div>
                <LogIn className="h-6 w-6 text-gray-400 group-hover:text-cyan-400 transition-colors" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">Admin Panel</h2>
              <p className="text-gray-400 mb-6">
                Access design and printer approvals, manage audit logs, and system settings.
              </p>

              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span> Design Approvals
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span> Printer Approvals
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span> Audit Logs
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span> System Settings
                </li>
              </ul>

              <div className="mt-6 rounded-lg bg-cyan-900/20 px-4 py-2">
                <p className="text-xs text-cyan-300">Click to sign in as Admin</p>
              </div>
            </div>

            {/* Executive Card */}
            <div
              onClick={() => handleRoleSelect('executive')}
              className="group cursor-pointer rounded-xl border border-slate-700 bg-slate-800/50 p-8 backdrop-blur-sm hover:border-purple-500 hover:bg-purple-900/10 transition-all"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="rounded-lg bg-purple-900/20 p-4">
                  <Shield className="h-8 w-8 text-purple-400" />
                </div>
                <LogIn className="h-6 w-6 text-gray-400 group-hover:text-purple-400 transition-colors" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">Executive Dashboard</h2>
              <p className="text-gray-400 mb-6">
                Monitor team performance, manage employees, and view analytics.
              </p>

              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">✓</span> Team Management
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">✓</span> Performance Metrics
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">✓</span> Analytics Dashboard
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">✓</span> Employee Controls
                </li>
              </ul>

              <div className="mt-6 rounded-lg bg-purple-900/20 px-4 py-2">
                <p className="text-xs text-purple-300">Click to sign in as Executive</p>
              </div>
            </div>
          </div>

          {/* Security Footer */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-300">
                <p className="font-semibold text-white mb-1">🔐 Security Notice</p>
                <p>
                  This is a secured, encrypted admin portal. All access is monitored and logged. 
                  Unauthorized access attempts will be recorded and reported.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AdminSignIn role={role} obfuscatedPath={obfuscatedPath} />;
};

export default AdminAccessPortal;
