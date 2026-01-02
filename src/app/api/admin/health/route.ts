// Health check endpoint for debugging admin API
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[health-check] Health check endpoint called');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: supabaseUrl ? '✓' : '✗ MISSING',
        serviceRoleKey: hasServiceRole ? '✓' : '✗ MISSING (using anon key)',
        anonKey: hasAnonKey ? '✓' : '✗ MISSING',
        nodeEnv: process.env.NODE_ENV,
      },
      api: {
        createSessionEndpoint: '/api/admin/create-session',
        method: 'POST',
        expectedBody: {
          userId: 'uuid-here',
          role: 'admin or executive',
          expiresIn: 'optional milliseconds',
        }
      }
    });
  } catch (error) {
    console.error('[health-check] Error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
