import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name, role } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Use service role key for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Create user in auth system
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: Math.random().toString(36).slice(-12), // Generate random password
      user_metadata: {
        name: name,
      },
      email_confirm: true, // Auto-confirm the email
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // Get first team (teams table should have at least one)
    const { data: teamsData, error: teamsError } = await supabaseAdmin
      .from('teams')
      .select('id')
      .limit(1);

    if (teamsError || !teamsData || teamsData.length === 0) {
      console.error('Error fetching teams:', teamsError);
      // Delete the created user since we can't add them to a team
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'No teams found. Please create a team first.' },
        { status: 400 }
      );
    }

    const team_id = teamsData[0].id;

    // Insert into team_members using service role (bypasses RLS)
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('team_members')
      .insert([{
        user_id: authData.user.id,
        team_id: team_id,
        role: role || 'agent',
        is_active: true,
        approvals_count: 0,
        joined_at: new Date().toISOString(),
      }])
      .select();

    if (memberError) {
      console.error('Error adding to team_members:', memberError);
      // Delete the created user since we couldn't add them to team_members
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: memberError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      user: authData.user,
      teamMember: memberData?.[0]
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
