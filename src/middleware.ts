import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Get the user session
  const { data: { session } } = await supabase.auth.getSession();

  // Get the user's role from the database (check both tables for compatibility)
  let userRole = 'user'; // default role
  let isAdmin = false;
  let isExecutive = false;

  if (session?.user) {
    // Check user_roles table (admin/executive)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('is_active', true);

    if (roleData && roleData.length > 0) {
      const roles = roleData.map((r: any) => r.role);
      isAdmin = roles.includes('admin');
      isExecutive = roles.includes('executive');
    }

    // Fallback to user_profiles table
    if (!isAdmin && !isExecutive) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      userRole = profile?.role || 'user';
      isAdmin = userRole === 'admin';
    }
  }

  // Parse the pathname
  const pathname = request.nextUrl.pathname;

  // Define route access rules
  const isAgentRoute = pathname.startsWith('/agent');
  const isAdminRoute = pathname.startsWith('/admin');
  const isExecutiveRoute = pathname.startsWith('/executive');
  const isSecureAdminRoute = pathname.startsWith('/secure-admin');

  // Protect /admin routes - require admin role
  if (isAdminRoute) {
    if (!session || !isAdmin) {
      // Not authenticated or not admin, redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }
    return res;
  }

  // Protect /executive routes - require executive role
  if (isExecutiveRoute) {
    if (!session || !isExecutive) {
      // Not authenticated or not executive, redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }
    return res;
  }

  // Allow public access to secure-admin pages (old system, can be deprecated)
  if (isSecureAdminRoute) {
    return res;
  }

  // If not authenticated, allow public routes and some pages
  if (!session) {
    // Allow access to main page, auth routes, and public pages
    if (pathname === '/' || 
        pathname.startsWith('/auth') ||
        pathname.startsWith('/privacy') ||
        pathname.startsWith('/terms') ||
        pathname.startsWith('/help') ||
        pathname.startsWith('/alton-designs') ||
        pathname.startsWith('/marketplace') ||
        pathname.startsWith('/print') ||
        pathname.startsWith('/community') ||
        pathname.startsWith('/home') ||
        pathname.startsWith('/designs')) {
      return res;
    }

    // Redirect to home for protected routes (only /studio is protected for unauthenticated users)
    if (pathname.startsWith('/studio') ||
        pathname.startsWith('/saved') ||
        pathname.startsWith('/settings') ||
        pathname.startsWith('/notifications')) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    return res;
  }

  // Route-based access control for regular routes
  if (isAgentRoute && userRole !== 'agent' && userRole !== 'admin') {
    // Only agents and admins can access agent routes
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow access
  return res;
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|jpg|jpeg|png|gif|webp|ico)).*)',
  ],
};