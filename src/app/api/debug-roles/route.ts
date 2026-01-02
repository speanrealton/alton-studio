import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all users with their roles
    const { data: allRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('id, user_id, role, is_active');

    if (rolesError) {
      return Response.json({ error: 'Failed to fetch roles', details: rolesError }, { status: 400 });
    }

    // Get all auth users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      return Response.json({ error: 'Failed to list users', details: usersError }, { status: 400 });
    }

    // Combine the data
    const combined = users.map(user => {
      const userRoles = allRoles?.filter(r => r.user_id === user.id) || [];
      return {
        email: user.email,
        id: user.id,
        roles: userRoles,
        hasAdminRole: userRoles.some(r => r.role === 'admin')
      };
    });

    // Also get current user from regular client to check their session
    const regularSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user: currentUser } } = await regularSupabase.auth.getUser();

    // Try to query the user's own roles
    const { data: myRoles, error: myRolesError } = await regularSupabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser?.id || 'no-user');

    return Response.json({
      currentUser: {
        id: currentUser?.id,
        email: currentUser?.email
      },
      myRoles: myRoles,
      myRolesError: myRolesError,
      allUsers: combined,
      totalUsers: users.length,
      totalRoles: allRoles?.length || 0
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

