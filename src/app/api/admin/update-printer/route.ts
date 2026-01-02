// Update printer status - uses service role to bypass RLS
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
    const { printerId, newStatus } = body;

    console.log('[update-printer] Request received:', { printerId, newStatus });

    if (!printerId || !newStatus) {
      return NextResponse.json(
        { error: 'Missing printerId or newStatus', success: false },
        { status: 400 }
      );
    }

    let updateSuccessful = false;
    let error = null;

    // Try updating printer_submissions first
    console.log('[update-printer] Attempting printer_submissions table...');
    const { data: submissionsData, error: submissionsError } = await supabase
      .from('printer_submissions')
      .update({ 
        status: newStatus, 
        reviewed_at: new Date().toISOString() 
      })
      .eq('id', printerId)
      .select();

    if (submissionsError) {
      console.log('[update-printer] printer_submissions error:', submissionsError.message);
    } else if (submissionsData && submissionsData.length > 0) {
      console.log('[update-printer] ✅ Updated printer_submissions');
      updateSuccessful = true;
    } else {
      console.log('[update-printer] No rows in printer_submissions, trying printers table...');
    }

    // If not found in submissions, try printers table
    if (!updateSuccessful) {
      console.log('[update-printer] Attempting printers table...');
      const { data: printersData, error: printersError } = await supabase
        .from('printers')
        .update({ status: newStatus })
        .eq('id', printerId)
        .select();

      if (printersError) {
        console.error('[update-printer] printers error:', printersError.message);
        error = printersError.message;
      } else if (printersData && printersData.length > 0) {
        console.log('[update-printer] ✅ Updated printers table');
        updateSuccessful = true;
      } else {
        console.error('[update-printer] No rows updated in either table');
        error = 'Printer not found in database';
      }
    }

    if (updateSuccessful) {
      return NextResponse.json({
        success: true,
        message: `Printer marked as ${newStatus}`,
      });
    } else {
      return NextResponse.json(
        { 
          error: error || 'Failed to update printer',
          success: false
        },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error('[update-printer] Exception:', err);
    return NextResponse.json(
      { 
        error: 'Failed to update printer',
        details: err instanceof Error ? err.message : String(err),
        success: false
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
