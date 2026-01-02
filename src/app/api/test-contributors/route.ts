import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return Response.json({ error: 'Not authenticated', user: null });
    }

    // Test 1: Check user_roles for current user
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);

    // Test 2: Check if table exists and get count
    const { count, error: countError } = await supabase
      .from('contributor_applications')
      .select('*', { count: 'exact', head: true });

    // Test 3: Fetch some data
    const { data, error } = await supabase
      .from('contributor_applications')
      .select('*')
      .limit(5);

    // Test 4: Check printer_submissions
    const { data: printers, error: printerError } = await supabase
      .from('printer_submissions')
      .select('*')
      .limit(5);

    return Response.json({
      currentUser: {
        id: user.id,
        email: user.email,
      },
      userRoles: {
        data: userRoles,
        error: rolesError,
      },
      contributors: {
        count,
        countError,
        data: data?.slice(0, 2),
        error,
        totalRows: data?.length
      },
      printers: {
        data: printers?.slice(0, 2),
        error: printerError,
        totalRows: printers?.length
      }
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
