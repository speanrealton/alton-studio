'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { AlertCircle, Lock, Shield, Eye, EyeOff } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AdminSignInProps {
  role: 'admin' | 'executive';
  obfuscatedPath: string;
}

const AdminSignIn: React.FC<AdminSignInProps> = ({ role, obfuscatedPath }) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'credentials' | 'totp'>('credentials');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // First sign in with email/password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Check if user has admin/executive role
      console.log('[handleSignIn] Checking role for user:', data.user?.id, 'Required role:', role);
      
      // First, get all roles for this user (no filters) to debug
      const { data: allRoles, error: allRolesError } = await supabase
        .from('user_roles')
        .select('role, is_active')
        .eq('user_id', data.user?.id);
      
      console.log('[handleSignIn] All roles for user:', { allRoles, allRolesError });

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user?.id)
        .eq('role', role)
        .eq('is_active', true);

      console.log('[handleSignIn] Role query result:', { roleError, roleData, dataLength: roleData?.length });

      if (roleError) {
        console.error('[handleSignIn] RLS or query error:', roleError);
      }

      if (roleError || !roleData || roleData.length === 0) {
        console.error('Role check failed:', { roleError, roleData, userId: data.user?.id, requiredRole: role, allRoles });
        setError(`You do not have ${role} access. Contact system administrator.`);
        await supabase.auth.signOut();
        return;
      }

      // Check if 2FA is enabled
      const { data: twoFaData } = await supabase
        .from('user_2fa')
        .select('enabled')
        .eq('user_id', data.user?.id)
        .single();

      if (twoFaData?.enabled) {
        // Move to TOTP step
        setStep('totp');
        return;
      }

      // Create secure session and redirect
      console.log('[handleSignIn] Creating session with:', { userId: data.user?.id, role, obfuscatedPath });
      
      const response = await fetch('/api/admin/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user?.id,
          role,
          obfuscatedPath,
        }),
      });

      console.log('[handleSignIn] Response status:', response.status, 'Content-Type:', response.headers.get('content-type'));

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        // Response is not JSON (probably HTML error page)
        const text = await response.text();
        console.error('[handleSignIn] Non-JSON response received');
        console.error('[handleSignIn] Status:', response.status);
        console.error('[handleSignIn] Content-Type:', contentType);
        console.error('[handleSignIn] First 500 chars:', text.substring(0, 500));
        
        // Try to extract error message if it's JSON wrapped in HTML
        try {
          const match = text.match(/"message":"([^"]+)"/);
          if (match) {
            setError(`API Error: ${match[1]}`);
          } else {
            setError(`Server error (HTTP ${response.status}). Check browser console for full response.`);
          }
        } catch (e) {
          setError(`Server error (HTTP ${response.status}). Check browser console for details.`);
        }
        return;
      }

      if (response.ok && responseData.success) {
        // Store token in sessionStorage for validation page to access
        sessionStorage.setItem(`${role}_token`, responseData.sessionToken);
        sessionStorage.setItem(`${role}_obfuscated_path`, responseData.obfuscatedPath);
        
        // Wait a moment for cookie to be set, then redirect
        setTimeout(() => {
          router.push(`/secured/${responseData.obfuscatedPath}`);
        }, 100);
      } else {
        console.error('Session creation failed:', responseData);
        // Show more detailed error message
        const errorMsg = responseData.details || responseData.error || 'Failed to create session';
        setError(`Sign-in error: ${errorMsg}`);
      }
    } catch (err) {
      console.error('Sign in exception:', err);
      setError(`Sign-in error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Verify TOTP with your 2FA provider
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          totpToken: totp,
        }),
      });

      if (response.ok) {
        // Create secure session and redirect
        const sessionResponse = await fetch('/api/auth/create-admin-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            role,
            obfuscatedPath,
          }),
        });

        if (sessionResponse.ok) {
          router.push(`/secured/${obfuscatedPath}`);
        } else {
          setError('Failed to create session');
        }
      } else {
        setError('Invalid TOTP code');
      }
    } catch (err) {
      setError('Error verifying 2FA code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Security Badge */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <Shield className="h-8 w-8 text-green-500" />
          <h1 className="text-2xl font-bold text-white">
            {role === 'admin' ? 'Admin Panel' : 'Executive Portal'}
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-8 backdrop-blur-sm">
          {/* Security Info */}
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-cyan-700/30 bg-cyan-900/20 p-4">
            <Lock className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-cyan-300">
              This is a secure, encrypted access point. All connections are monitored and logged.
            </p>
          </div>

          {step === 'credentials' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-700/50 bg-red-900/20 p-4">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  placeholder="your@email.com"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 font-semibold text-white hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 transition-all"
              >
                {isLoading ? 'Verifying...' : 'Sign In Securely'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleTotpSubmit} className="space-y-4">
              <p className="text-sm text-gray-300 mb-6">
                Enter the 6-digit code from your authenticator app:
              </p>

              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-700/50 bg-red-900/20 p-4">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div>
                <input
                  type="text"
                  value={totp}
                  onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  placeholder="000000"
                  className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-center text-2xl font-mono text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || totp.length !== 6}
                className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 font-semibold text-white hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 transition-all"
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="w-full text-sm text-gray-400 hover:text-gray-300"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {/* Security Footer */}
          <div className="mt-6 border-t border-slate-700 pt-4">
            <p className="text-xs text-gray-500 text-center">
              🔐 This session is encrypted and monitored. Do not share your credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSignIn;
