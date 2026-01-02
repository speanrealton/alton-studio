// Debug endpoint to check printer data in database
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG] Checking printer data...');

    // Check printer_submissions table
    console.log('[DEBUG] Checking printer_submissions table...');
    const { data: submissions, error: submError, count: submCount } = await supabase
      .from('printer_submissions')
      .select('*', { count: 'exact' })
      .limit(3);

    console.log('[DEBUG] printer_submissions:', { submCount, error: submError?.message });
    if (submissions && submissions.length > 0) {
      console.log('[DEBUG] Sample submission fields:', Object.keys(submissions[0]));
    }

    // Check printers table
    console.log('[DEBUG] Checking printers table...');
    const { data: allPrinters, error: allError, count: allCount } = await supabase
      .from('printers')
      .select('*', { count: 'exact' })
      .limit(3);

    console.log('[DEBUG] printers (all):', { allCount, error: allError?.message });
    if (allPrinters && allPrinters.length > 0) {
      console.log('[DEBUG] Sample printer fields:', Object.keys(allPrinters[0]));
    }

    // Check approved printers
    console.log('[DEBUG] Checking printers table (status=approved)...');
    const { data: approved, error: approvedError, count: approvedCount } = await supabase
      .from('printers')
      .select('*', { count: 'exact' })
      .eq('status', 'approved')
      .limit(3);

    console.log('[DEBUG] printers (approved):', { approvedCount, error: approvedError?.message });

    return NextResponse.json({
      debug: true,
      printer_submissions: {
        total_count: submCount,
        error: submError?.message,
        sample: submissions?.slice(0, 1),
        fields: submissions && submissions.length > 0 ? Object.keys(submissions[0]) : [],
      },
      printers_all: {
        total_count: allCount,
        error: allError?.message,
        sample: allPrinters?.slice(0, 1),
        fields: allPrinters && allPrinters.length > 0 ? Object.keys(allPrinters[0]) : [],
      },
      printers_approved: {
        total_count: approvedCount,
        error: approvedError?.message,
        sample: approved?.slice(0, 1),
      },
      note: 'Check browser console for detailed logs from the server'
    });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
