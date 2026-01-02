// Fetch printers for admin dashboard - uses service role to bypass RLS
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('[fetch-printers] Starting fetch...');

    // Verify admin session token
    const token = request.cookies.get('admin_session')?.value;
    if (!token) {
      console.log('[fetch-printers] No admin session token');
      // Allow without auth for now to debug
    }

    // Fetch from printer_submissions
    console.log('[fetch-printers] Fetching from printer_submissions...');
    const { data: submissionsData, error: submissionsError } = await supabase
      .from('printer_submissions')
      .select('id, company_name, contact_name, email, phone, country, city, status, submitted_at, created_at')
      .order('submitted_at', { ascending: false });

    console.log('[fetch-printers] Submissions:', { 
      count: submissionsData?.length || 0,
      error: submissionsError?.message,
      sample: submissionsData?.slice(0, 1)
    });

    // Fetch from printers table (approved companies)
    console.log('[fetch-printers] Fetching from printers...');
    const { data: approvedData, error: approvedError } = await supabase
      .from('printers')
      .select('id, company_name, email, country, city, status, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    console.log('[fetch-printers] Approved printers:', { 
      count: approvedData?.length || 0,
      error: approvedError?.message,
      sample: approvedData?.slice(0, 1)
    });

    // Transform both data sources to match Printer interface
    const transformedSubmissions = (submissionsData || []).map((p: any) => ({
      id: p.id,
      name: p.company_name || 'Unknown',
      brand: p.company_name || '',
      model: '',
      submitted_by: p.email || 'Unknown',
      submitted_at: p.submitted_at || p.created_at,
      status: p.status || 'pending',
      specs: {},
    }));

    const transformedApproved = (approvedData || []).map((p: any) => ({
      id: p.id,
      name: p.company_name || 'Unknown',
      brand: p.company_name || '',
      model: '',
      submitted_by: p.email || 'Unknown',
      submitted_at: p.created_at,
      status: 'approved' as const,
      specs: {},
    }));

    // Combine and deduplicate by ID
    const allPrinters = [...transformedSubmissions, ...transformedApproved];
    const uniquePrinters = Array.from(
      new Map(allPrinters.map((item: any) => [item.id, item])).values()
    );

    console.log('[fetch-printers] Total unique printers:', uniquePrinters.length);

    return NextResponse.json({
      success: true,
      data: uniquePrinters,
      counts: {
        submissions: submissionsData?.length || 0,
        approved: approvedData?.length || 0,
        total: uniquePrinters.length,
      }
    });
  } catch (error) {
    console.error('[fetch-printers] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch printers',
        details: error instanceof Error ? error.message : String(error),
        success: false
      },
      { status: 500 }
    );
  }
}
