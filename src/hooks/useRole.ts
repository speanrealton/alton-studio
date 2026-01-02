'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserWithRole, UserRole } from '@/lib/auth-utils';

interface UseRoleReturn {
  role: UserRole | null;
  isLoading: boolean;
  isUser: boolean;
  isAgent: boolean;
  isAdmin: boolean;
}

/**
 * Hook to get current user's role
 */
export function useRole(): UseRoleReturn {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchRole() {
      try {
        const user = await getCurrentUserWithRole();
        
        if (!user) {
          // No user, redirect to home
          router.push('/');
          return;
        }

        setRole(user.role);
      } catch (error) {
        console.error('Error fetching user role:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }

    fetchRole();
  }, [router]);

  return {
    role,
    isLoading,
    isUser: role === 'user',
    isAgent: role === 'agent' || role === 'admin',
    isAdmin: role === 'admin',
  };
}

/**
 * Wrapper component to protect routes based on role
 */
export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}) {
  const { role, isLoading } = useRole();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to check if user can perform an action
 */
export function useCanPerformAction(requiredRole: UserRole | UserRole[]) {
  const { role } = useRole();
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  return role ? roles.includes(role) : false;
}
