import { NextRequest, NextResponse } from 'next/server';
import { supabase } from './supabase';
import { UserRole } from './auth-utils';

/**
 * Check if a user has permission for an API endpoint
 */
export async function checkApiPermission(
  request: NextRequest,
  requiredRole: UserRole | UserRole[]
): Promise<{ allowed: boolean; userId?: string; role?: UserRole; error?: string }> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return { allowed: false, error: 'No authorization header' };
    }

    // Extract token (assuming Bearer token)
    const token = authHeader.replace('Bearer ', '');

    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return { allowed: false, error: 'Invalid or expired token' };
    }

    // Get user role from database
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const userRole = (profile?.role as UserRole) || 'user';

    // Check if user has required role
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const allowed = roles.includes(userRole);

    if (!allowed) {
      return { 
        allowed: false, 
        userId: user.id,
        role: userRole,
        error: `User role '${userRole}' is not authorized. Required: ${roles.join(' or ')}` 
      };
    }

    return { allowed: true, userId: user.id, role: userRole };
  } catch (error) {
    console.error('Permission check error:', error);
    return { allowed: false, error: 'Permission check failed' };
  }
}

/**
 * Middleware wrapper for API routes
 */
export async function withRoleProtection(
  requiredRole: UserRole | UserRole[],
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    const permission = await checkApiPermission(request, requiredRole);

    if (!permission.allowed) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: permission.error || 'You do not have permission to access this resource'
        },
        { status: 403 }
      );
    }

    // Add user info to request for the handler
    (request as any).userId = permission.userId;
    (request as any).userRole = permission.role;

    return handler(request, context);
  };
}

/**
 * Verify user owns the resource
 */
export async function verifyResourceOwnership(
  userId: string,
  resourceType: 'support_chat_sessions' | 'notifications',
  resourceId: string
): Promise<boolean> {
  try {
    let query = supabase
      .from(resourceType)
      .select('id');

    if (resourceType === 'support_chat_sessions') {
      query = query.eq('user_id', userId).eq('id', resourceId);
    } else if (resourceType === 'notifications') {
      query = query.eq('user_id', userId).eq('id', resourceId);
    }

    const { data } = await query.single();

    return !!data;
  } catch (error) {
    console.error('Resource ownership verification error:', error);
    return false;
  }
}

/**
 * Verify agent is assigned to chat
 */
export async function verifyAgentAssignment(
  agentId: string,
  sessionId: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('support_chat_sessions')
      .select('assigned_agent_id')
      .eq('id', sessionId)
      .single();

    // Agent is assigned if they're the assigned agent OR if they're an admin (through role check)
    return data?.assigned_agent_id === agentId;
  } catch (error) {
    console.error('Agent assignment verification error:', error);
    return false;
  }
}

/**
 * Get user's allowed resources based on role
 */
export async function getFilteredQueryForRole(
  userId: string,
  role: UserRole,
  resourceType: 'support_chat_sessions' | 'notifications'
) {
  let query = supabase.from(resourceType).select('*');

  if (role === 'user') {
    // Users can only see their own
    query = query.eq('user_id', userId);
  } else if (role === 'agent') {
    // Agents see notifications for them and chats assigned to them
    if (resourceType === 'notifications') {
      query = query.eq('user_id', userId);
    } else if (resourceType === 'support_chat_sessions') {
      query = query.eq('assigned_agent_id', userId);
    }
  }
  // Admins get full access (no filtering)

  return query;
}
