import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    console.log('Delete request for userId:', userId);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', type: 'validation' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration', type: 'config' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // First, get the user info to find their auth user_id
    const { data: userMember, error: fetchError } = await supabaseAdmin
      .from('team_members')
      .select('user_id, name, email')
      .eq('id', userId)
      .single();

    console.log('Found user:', userMember, 'Error:', fetchError);

    // Delete from team_members
    const { error: deleteError, count } = await supabaseAdmin
      .from('team_members')
      .delete()
      .eq('id', userId);

    console.log('Delete result - Count:', count, 'Error:', deleteError);

    if (deleteError) {
      console.error('Error deleting from team_members:', deleteError);
      return NextResponse.json(
        { error: deleteError.message, type: 'db_error' },
        { status: 400 }
      );
    }

    // Also delete the auth user if they have a user_id
    if (userMember?.user_id) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(userMember.user_id);
        console.log('Deleted auth user:', userMember.user_id);
      } catch (error) {
        console.error('Error deleting auth user:', error);
        // Don't fail the request - user is already deleted from team_members
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `User "${userMember?.name || 'Unknown'}" has been deleted`,
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        type: 'server_error'
      },
      { status: 500 }
    );
  }
}

