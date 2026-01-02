// components/AuthButton.tsx — FIXED VERSION
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';
import Link from 'next/link';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useLanguageContext } from '@/providers/LanguageProvider';

export default function AuthButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguageContext();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user state
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      // Redirect to main page (/) after signup/signin from /auth page
      if (event === 'SIGNED_IN' && pathname.includes('/auth')) {
        router.push('/');
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router, pathname]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show nothing while loading to prevent layout shift
  if (loading) {
    return <div className="w-24 h-10" />;
  }

  return (
    <div className="flex items-center gap-3">
      {user ? (
        <>
          <Link href="/settings">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-purple-400 hover:bg-purple-500/20"
            >
              <User className="w-5 h-5 mr-2" /> 
              {t('nav.settings')}
            </Button>
          </Link>
          <Button 
            onClick={handleSignOut} 
            variant="outline" 
            size="sm" 
            className="border-purple-500 text-purple-400 hover:bg-purple-500/20"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </>
      ) : (
        <Link href="/auth">
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-2 rounded-full font-semibold">
            {t('btn.signin') || 'Sign In'}
          </Button>
        </Link>
      )}
    </div>
  );
}