'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Shield, Loader } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Simple SHA-256 implementation for client-side hashing
async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

const SecuredAccessPage = () => {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateAndRedirect = async () => {
      try {
        if (!slug) {
          setError('Invalid access link');
          return;
        }

        // Extract role from obfuscated path
        const roleParts = slug.split('-');
        const role = roleParts[0] as 'admin' | 'executive';

        if (!['admin', 'executive'].includes(role)) {
          setError('Invalid role in access link');
          return;
        }

        // Get session token from sessionStorage
        const sessionToken = sessionStorage.getItem(`${role}_token`);
        const obfuscatedPath = sessionStorage.getItem(`${role}_obfuscated_path`);

        if (!sessionToken || !obfuscatedPath) {
          console.error('No session token or obfuscated path in sessionStorage');
          setError('Session not found. Please sign in again.');
          setTimeout(() => {
            sessionStorage.removeItem(`${role}_token`);
            sessionStorage.removeItem(`${role}_obfuscated_path`);
            router.push('/secure-admin');
          }, 2000);
          return;
        }

        // Verify the path matches
        if (obfuscatedPath !== slug) {
          console.error('Obfuscated path mismatch', { expected: obfuscatedPath, got: slug });
          setError('Invalid session path');
          setTimeout(() => {
            sessionStorage.removeItem(`${role}_token`);
            sessionStorage.removeItem(`${role}_obfuscated_path`);
            router.push('/secure-admin');
          }, 2000);
          return;
        }

        try {
          // Verify session in database
          const { data: sessionRecord, error: sessionError } = await supabase
            .from(`${role}_sessions`)
            .select('*')
            .eq('obfuscated_path', slug)
            .eq('is_active', true)
            .gt('expires_at', new Date().toISOString())
            .single();

          if (sessionError || !sessionRecord) {
            console.error('Session verification error:', sessionError);
            setError('Session expired or invalid. Please sign in again.');
            setTimeout(() => {
              sessionStorage.removeItem(`${role}_token`);
              sessionStorage.removeItem(`${role}_obfuscated_path`);
              router.push('/secure-admin');
            }, 2000);
            return;
          }

          // Verify token hash using Web Crypto API
          const hashedToken = await sha256(sessionToken);

          if (hashedToken !== sessionRecord.session_token_hash) {
            console.error('Token hash mismatch');
            setError('Invalid session token');
            setTimeout(() => {
              sessionStorage.removeItem(`${role}_token`);
              sessionStorage.removeItem(`${role}_obfuscated_path`);
              router.push('/secure-admin');
            }, 2000);
            return;
          }

          // All checks passed, store in sessionStorage and redirect to dashboard
          sessionStorage.setItem(`${role}_authenticated`, 'true');
          
          const dashboardPath = role === 'admin' 
            ? '/admin/dashboard' 
            : '/admin/executive/dashboard';

          router.push(dashboardPath);
        } catch (parseError) {
          console.error('Error during session validation:', parseError);
          setError('Failed to process session');
          setTimeout(() => {
            sessionStorage.removeItem(`${role}_token`);
            sessionStorage.removeItem(`${role}_obfuscated_path`);
            router.push('/secure-admin');
          }, 2000);
        }
      } catch (err) {
        console.error('Error in validateAndRedirect:', err);
        setError('An error occurred during access validation');
        setTimeout(() => {
          sessionStorage.removeItem(`admin_token`);
          sessionStorage.removeItem(`executive_token`);
          sessionStorage.removeItem(`admin_obfuscated_path`);
          sessionStorage.removeItem(`executive_obfuscated_path`);
          router.push('/secure-admin');
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };

    validateAndRedirect();
  }, [slug, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <Shield className="h-12 w-12 text-green-500 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Validating Access...</h1>
          <p className="text-gray-400 flex items-center justify-center gap-2">
            <Loader className="h-4 w-4 animate-spin" />
            Please wait while we verify your credentials
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-red-900/50 bg-red-900/10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-red-900/30 p-2">
                <Shield className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-red-400">Access Denied</h2>
            </div>
            <p className="text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => router.push('/secure-admin')}
              className="w-full rounded-lg bg-cyan-600 px-4 py-2 font-semibold text-white hover:bg-cyan-700 transition-colors"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SecuredAccessPage;
