// Update contributor status - uses service role to bypass RLS
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

    console.log('[update-contributor] Request received:', { id, status });

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing id or status', success: false },
        { status: 400 }
      );
    }

    // Update contributor_applications
    console.log('[update-contributor] Updating contributor_applications table...');
    const { data, error } = await supabase
      .from('contributor_applications')
      .update({ 
        status: status, 
        reviewed_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select();

    if (error) {
      console.log('[update-contributor] Error:', error.message);
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 400 }
      );
    }

    if (data && data.length > 0) {
      console.log('[update-contributor] ✅ Successfully updated contributor');
      return NextResponse.json({
        success: true,
        message: 'Contributor status updated',
        data: data[0],
      });
    } else {
      return NextResponse.json(
        { error: 'Contributor not found', success: false },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error('[update-contributor] Exception:', error);
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
