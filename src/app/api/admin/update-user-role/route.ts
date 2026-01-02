import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, newRole } = await request.json();

    console.log('🔄 Update role request - userId:', userId, 'newRole:', newRole);

    if (!userId || !newRole) {
      return NextResponse.json(
        { error: 'User ID and role are required', type: 'validation' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase config');
      return NextResponse.json(
        { error: 'Missing Supabase configuration', type: 'config' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // First verify the user exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('team_members')
      .select('id, role')
      .eq('id', userId)
      .single();

    console.log('✓ Found user:', existingUser, 'Error:', fetchError);

    if (fetchError || !existingUser) {
      console.error('User not found:', fetchError);
      return NextResponse.json(
        { error: 'User not found', type: 'not_found' },
        { status: 404 }
      );
    }

    // Update role in team_members
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .update({ role: newRole })
      .eq('id', userId)
      .select();

    console.log('📝 Update result - Error:', error, 'Data:', data);

    if (error) {
      console.error('❌ Error updating user role:', error);
      return NextResponse.json(
        { error: error.message, type: 'db_error' },
        { status: 400 }
      );
    }

    if (!data || data.length === 0) {
      console.error('❌ No data returned after update');
      return NextResponse.json(
        { error: 'Update failed - no data returned', type: 'db_error' },
        { status: 400 }
      );
    }

    console.log('✅ Role updated successfully to:', newRole);

    return NextResponse.json({ 
      success: true,
      message: `Role updated to ${newRole}`,
      data: data[0]
    });
  } catch (error: any) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        type: 'server_error'
      },
      { status: 500 }
    );
  }
}

