// Secured Admin/Executive Routing API
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    console.log('[create-session] Processing POST request');
    const body = await request.json();
    console.log('[create-session] Body received:', { userId: !!body.userId, role: body.role });
    
    const { userId, role } = body;
    if (!userId || !role) {
      console.log('[create-session] Missing params');
      return NextResponse.json({ error: 'Missing userId or role', success: false }, { status: 400 });
    }

    // Dynamically import Supabase to avoid import errors
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      console.error('[create-session] Missing env vars');
      return NextResponse.json(
        { error: 'Server config error', success: false },
        { status: 500 }
      );
    }

    const supabase = createClient(url, key);
    const tableName = `${role}_sessions`;

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(sessionToken).digest('hex');

    console.log('[create-session] Inserting into:', tableName);
    
    const insertData = {
      user_id: userId,
      session_token_hash: hashedToken,
      obfuscated_path: crypto.randomBytes(16).toString('hex'),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      ip_address: 'unknown',
      user_agent: 'unknown',
      is_active: true,
    };

    console.log('[create-session] Insert data:', { ...insertData, session_token_hash: '***' });

    const { data, error } = await supabase
      .from(tableName)
      .insert(insertData)
      .select();

    if (error) {
      console.error('[create-session] DB error:', error.message, error.code);
      return NextResponse.json(
        { error: error.message, success: false, code: error.code },
        { status: 500 }
      );
    }

    console.log('[create-session] SUCCESS, data:', data);
    return NextResponse.json({
      success: true,
      sessionToken,
      obfuscatedPath: data?.[0]?.obfuscated_path || 'path',
    });
  } catch (error: any) {
    console.error('[create-session] Exception:', error?.message, error?.stack);
    return NextResponse.json(
      { error: error?.message || 'Error', success: false },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed', success: false }, { status: 405 });
}
