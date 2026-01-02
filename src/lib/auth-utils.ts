import { supabase } from './supabase';

export type UserRole = 'user' | 'agent' | 'admin';

interface UserWithRole {
  id: string;
  email?: string;
  role: UserRole;
}

/**
 * Get current user with their role
 */
export async function getCurrentUserWithRole(): Promise<UserWithRole | null> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', session.user.id)
    .single();

  return {
    id: session.user.id,
    email: session.user.email,
    role: (profile?.role as UserRole) || 'user',
  };
}

/**
 * Check if user has a specific role
 */
export async function userHasRole(requiredRole: UserRole | UserRole[]): Promise<boolean> {
  const user = await getCurrentUserWithRole();
  
  if (!user) {
    return false;
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(user.role);
}

/**
 * Check if user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  return userHasRole('admin');
}

/**
 * Check if user is an agent
 */
export async function isAgent(): Promise<boolean> {
  return userHasRole(['agent', 'admin']);
}

/**
 * Get user's role directly
 */
export async function getUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUserWithRole();
  return user?.role || null;
}

/**
 * Get agent details for a user
 */
export async function getAgentDetails(userId: string) {
  const { data } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .single();

  return data;
}

/**
 * Get all available agents
 */
export async function getAvailableAgents() {
  const { data } = await supabase
    .from('agents')
    .select('*')
    .eq('status', 'available')
    .order('assigned_chats', { ascending: true });

  return data || [];
}

/**
 * Assign user a role
 */
export async function assignRole(userId: string, role: UserRole) {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: userId,
        role,
        status: 'active'
      },
      { onConflict: 'user_id' }
    )
    .select();

  if (error) {
    console.error('Error assigning role:', error);
    throw error;
  }

  return data;
}

/**
 * Get all users with their roles (admin only)
 */
export async function getAllUsersWithRoles() {
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return data || [];
}

/**
 * Get all agents with their details
 */
export async function getAllAgents() {
  const { data } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: false });

  return data || [];
}

/**
 * Update agent status
 */
export async function updateAgentStatus(agentId: string, status: 'available' | 'busy' | 'offline') {
  const { data, error } = await supabase
    .from('agents')
    .update({ status })
    .eq('id', agentId)
    .select();

  if (error) {
    console.error('Error updating agent status:', error);
    throw error;
  }

  return data?.[0];
}

/**
 * Create or update agent record
 */
export async function createOrUpdateAgent(userId: string, agentData: {
  name: string;
  email: string;
  role?: string;
  status?: string;
}) {
  const { data, error } = await supabase
    .from('agents')
    .upsert(
      {
        user_id: userId,
        ...agentData,
        status: agentData.status || 'available'
      },
      { onConflict: 'user_id' }
    )
    .select();

  if (error) {
    console.error('Error creating/updating agent:', error);
    throw error;
  }

  return data?.[0];
}
