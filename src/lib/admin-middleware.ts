// Admin/Executive Authentication Middleware
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { attempts: number; resetTime: number }>();

export async function adminAuthMiddleware(request: NextRequest, role: 'admin' | 'executive') {
  const path = request.nextUrl.pathname;
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  // Check rate limiting
  const rateLimitKey = `${ip}-${role}`;
  const rateLimitData = rateLimitStore.get(rateLimitKey);

  if (rateLimitData) {
    if (Date.now() < rateLimitData.resetTime) {
      if (rateLimitData.attempts >= 5) {
        return NextResponse.json(
          { error: 'Too many attempts. Try again later.' },
          { status: 429 }
        );
      }
      rateLimitData.attempts++;
    } else {
      rateLimitStore.delete(rateLimitKey);
    }
  } else {
    rateLimitStore.set(rateLimitKey, {
      attempts: 1,
      resetTime: Date.now() + 15 * 60 * 1000,
    });
  }

  // Get session cookie
  const sessionCookie = request.cookies.get(`${role}_session`)?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify session
  try {
    const sessionData = JSON.parse(Buffer.from(sessionCookie, 'base64').toString());
    const tokenHash = crypto.createHash('sha256').update(sessionData.token).digest('hex');

    const { data: session, error } = await supabase
      .from(`${role}_sessions`)
      .select('user_id, expires_at')
      .eq('session_token_hash', tokenHash)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check expiration
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Log access
    await supabase.from('admin_access_logs').insert({
      user_id: session.user_id,
      path,
      method: request.method,
      ip_address: ip,
      timestamp: new Date(),
    });

    // Add user context to request
    const response = NextResponse.next();
    response.headers.set('x-user-id', session.user_id);
    response.headers.set('x-user-role', role);
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}

export async function getAdminUserFromRequest(request: NextRequest): Promise<string | null> {
  return request.headers.get('x-user-id');
}

export async function getAdminRoleFromRequest(request: NextRequest): Promise<'admin' | 'executive' | null> {
  const role = request.headers.get('x-user-role');
  if (role === 'admin' || role === 'executive') {
    return role;
  }
  return null;
}
