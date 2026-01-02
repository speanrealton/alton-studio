// Update design status - uses service role to bypass RLS
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    console.log('[update-design] Request received:', { id, status });

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing id or status', success: false },
        { status: 400 }
      );
    }

    // Update design_submissions
    console.log('[update-design] Updating design_submissions table...');
    const { data, error } = await supabase
      .from('design_submissions')
      .update({ 
        status: status, 
        reviewed_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select();

    if (error) {
      console.log('[update-design] Error:', error.message);
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 400 }
      );
    }

    if (data && data.length > 0) {
      console.log('[update-design] ✅ Successfully updated design');
      return NextResponse.json({
        success: true,
        message: 'Design status updated',
        data: data[0],
      });
    } else {
      console.log('[update-design] ❌ No design found with id:', id);
      return NextResponse.json(
        { error: 'Design not found', success: false },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('[update-design] Exception:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
