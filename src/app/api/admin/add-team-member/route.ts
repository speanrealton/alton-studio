import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name, role, team_id } = await request.json();

    console.log('🔄 Add team member request:', { email, name, role, team_id });

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required', type: 'validation' },
        { status: 400 }
      );
    }

    if (!team_id) {
      return NextResponse.json(
        { error: 'Team selection is required', type: 'validation' },
        { status: 400 }
      );
    }

    // Use service role key for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration', type: 'config' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // First, check if user already exists in auth
    let authUser: any = null;
    try {
      const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error('Error listing users:', listError);
        // Continue anyway, try to get single user
      } else if (existingUsers) {
        authUser = existingUsers.find((u: any) => u.email === email);
      }
    } catch (error) {
      console.error('Exception listing users:', error);
      // Continue anyway
    }

    // If user doesn't exist, create them
    if (!authUser) {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: Math.random().toString(36).slice(-12),
        user_metadata: { name: name },
        email_confirm: true,
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        // Check if it's "already exists" error
        if (authError.message?.includes('already') || authError.message?.includes('exists')) {
          return NextResponse.json(
            { 
              error: `User with email "${email}" is already registered.`,
              type: 'already_registered',
              email: email
            },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: authError.message, type: 'auth_error' },
          { status: 400 }
        );
      }
      authUser = authData.user;
    } else {
      // User already registered
      return NextResponse.json(
        { 
          error: `User with email "${email}" is already registered.`,
          type: 'already_registered',
          email: email,
          alreadyExists: true
        },
        { status: 409 }
      );
    }

    // Get first team
    const { data: teamsData, error: teamsError } = await supabaseAdmin
      .from('teams')
      .select('id')
      .eq('id', team_id)
      .single();

    if (teamsError || !teamsData) {
      console.error('Error verifying team:', teamsError);
      return NextResponse.json(
        { error: 'Team not found', type: 'no_teams' },
        { status: 400 }
      );
    }

    const actualTeamId = teamsData.id;

    // Check if user is already in this team
    const { data: existingMember } = await supabaseAdmin
      .from('team_members')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('team_id', actualTeamId);

    if (existingMember && existingMember.length > 0) {
      return NextResponse.json(
        { 
          error: `User "${name}" is already a member of this team.`,
          type: 'already_member',
          alreadyExists: true
        },
        { status: 409 }
      );
    }

    // Add to team_members
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('team_members')
      .insert([{
        user_id: authUser.id,
        team_id: actualTeamId,
        role: role || 'agent',
        is_active: true,
        approvals_count: 0,
        joined_at: new Date().toISOString(),
      }])
      .select();

    console.log('✅ Team member created with role:', role, 'in team:', actualTeamId, 'Data:', memberData);

    if (memberError) {
      console.error('Error adding to team_members:', memberError);
      return NextResponse.json(
        { error: memberError.message, type: 'member_error' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      user: authUser,
      teamMember: memberData?.[0],
      isNewUser: false
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
