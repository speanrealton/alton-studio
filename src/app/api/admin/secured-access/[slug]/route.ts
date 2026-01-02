// Secured admin/executive routes
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const obfuscatedPath = slug;

    // Decode obfuscated path
    const parts = obfuscatedPath.split('-');
    if (parts.length < 3) {
      return NextResponse.json(
        { error: 'Invalid access path' },
        { status: 400 }
      );
    }

    const role = parts[0];
    const encodedUserId = parts[1];

    // Verify session
    const sessionCookie = request.cookies.get(`${role}_session`)?.value;
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/secure-admin', request.url));
    }

    // Verify the obfuscated path matches stored session
    const { data: session } = await supabase
      .from(`${role}_sessions`)
      .select('*')
      .eq('obfuscated_path', obfuscatedPath)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 401 }
      );
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      await supabase
        .from(`${role}_sessions`)
        .delete()
        .eq('id', session.id);
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // Log access
    await supabase.from('admin_access_logs').insert({
      user_id: session.user_id,
      role,
      path: obfuscatedPath,
      accessed_at: new Date(),
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    });

    // Redirect to appropriate dashboard
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    } else if (role === 'executive') {
      return NextResponse.redirect(new URL('/admin/executive/dashboard', request.url));
    }

    return NextResponse.json(
      { error: 'Invalid role' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in secured route:', error);
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }
}
