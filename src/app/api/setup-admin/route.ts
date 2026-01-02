import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin operations
    );

    // Get current authenticated user
    const { data, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      return Response.json({ error: 'Failed to list users', details: userError }, { status: 400 });
    }

    // Get the first user (usually the one who signed up first - you)
    if (!data?.users || data.users.length === 0) {
      return Response.json({ error: 'No users found in the system' }, { status: 404 });
    }

    const firstUser = data.users[0];
    const userId = firstUser.id;

    // Add admin role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin',
        is_active: true
      })
      .select();

    if (insertError) {
      // If it already exists, try to update
      if (insertError.code === '23505') { // Unique constraint violation
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ is_active: true })
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (updateError) {
          return Response.json({ 
            error: 'Failed to update admin role', 
            details: updateError 
          }, { status: 400 });
        }
      } else {
        return Response.json({ 
          error: 'Failed to add admin role', 
          details: insertError 
        }, { status: 400 });
      }
    }

    return Response.json({
      success: true,
      message: `User ${firstUser.email} (${userId}) is now an admin!`,
      email: firstUser.email,
      userId: userId
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
