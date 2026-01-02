// Secure Admin & Executive Authentication System
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  attempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

// Session token encryption
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Obfuscate sensitive URLs
export function generateObfuscatedPath(baseId: string, role: 'admin' | 'executive'): string {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(16).toString('hex');
  return `${role}-${Buffer.from(baseId).toString('base64')}-${timestamp}-${randomSuffix}`;
}

export function decodeObfuscatedPath(obfuscatedPath: string): {
  role: 'admin' | 'executive';
  userId: string;
} | null {
  try {
    const parts = obfuscatedPath.split('-');
    if (parts.length < 3) return null;

    const role = parts[0] as 'admin' | 'executive';
    const encodedUserId = parts[1];
    const userId = Buffer.from(encodedUserId, 'base64').toString();

    return { role, userId };
  } catch {
    return null;
  }
}

// Check if user has admin role
export async function isAdminUser(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

// Check if user has executive role
export async function isExecutiveUser(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'executive')
      .single();

    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

// Check admin permissions with caching
export async function checkAdminPermissions(
  userId: string,
  permission: 'approve_designs' | 'approve_printers' | 'manage_team' | 'manage_settings'
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('admin_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('permission', permission)
      .eq('is_active', true)
      .single();

    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

// Verify session with encryption
export async function verifyAdminSession(sessionToken: string): Promise<string | null> {
  try {
    const hashedToken = hashToken(sessionToken);
    const { data, error } = await supabase
      .from('admin_sessions')
      .select('user_id, expires_at')
      .eq('session_token_hash', hashedToken)
      .single();

    if (error || !data) return null;

    // Check if session is expired
    if (new Date(data.expires_at) < new Date()) {
      // Delete expired session
      await supabase
        .from('admin_sessions')
        .delete()
        .eq('session_token_hash', hashedToken);
      return null;
    }

    return data.user_id;
  } catch {
    return null;
  }
}

// Create new secure admin session
export async function createAdminSession(userId: string, expiresIn: number = 12 * 60 * 60 * 1000) {
  const sessionToken = generateSecureToken();
  const hashedToken = hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + expiresIn);

  try {
    await supabase.from('admin_sessions').insert({
      user_id: userId,
      session_token_hash: hashedToken,
      created_at: new Date(),
      expires_at: expiresAt,
    });

    return sessionToken;
  } catch (error) {
    console.error('Error creating admin session:', error);
    return null;
  }
}

// Log admin activities for audit trail
export async function logAdminActivity(
  userId: string,
  action: string,
  details: Record<string, any>
): Promise<void> {
  try {
    await supabase.from('admin_activity_logs').insert({
      user_id: userId,
      action,
      details,
      timestamp: new Date(),
      ip_address: '', // Will be set from middleware
    });
  } catch (error) {
    console.error('Error logging admin activity:', error);
  }
}

// Get admin activity logs
export async function getAdminActivityLogs(
  userId?: string,
  limit: number = 100
): Promise<any[]> {
  try {
    let query = supabase.from('admin_activity_logs').select('*').order('timestamp', { ascending: false }).limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}
