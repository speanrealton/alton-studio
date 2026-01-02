import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function useAdminAuth(role: 'admin' | 'executive') {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in and has the required role
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // Not logged in, redirect to home
          router.push('/');
          return;
        }

        // Check if user has the required role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', role)
          .eq('is_active', true);

        if (!roleData || roleData.length === 0) {
          // User doesn't have required role, redirect to home
          console.log(`User does not have ${role} role`);
          router.push('/');
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [role, router]);

  return { isAuthenticated, isLoading };
}

