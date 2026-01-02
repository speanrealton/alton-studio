import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const { name, email, role } = await request.json();

    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let userId: string | null = null;
    
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === email);

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: Math.random().toString(36).slice(-12),
        email_confirm: true,
      });

      if (authError || !authData.user) {
        return NextResponse.json(
          { error: authError?.message || 'Failed to create user' },
          { status: 400 }
        );
      }

      userId = authData.user.id;
    }

    // Check if already in support_team
    const { data: existingTeamMember } = await supabaseAdmin
      .from('support_team')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingTeamMember) {
      return NextResponse.json(
        { error: 'User is already a team member' },
        { status: 400 }
      );
    }

    // Add to support_team table
    const { data: teamData, error: teamError } = await supabaseAdmin
      .from('support_team')
      .insert([
        {
          user_id: userId,
          name,
          email,
          role,
          status: 'available',
        },
      ])
      .select();

    if (teamError) {
      return NextResponse.json(
        { error: teamError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      team_member: teamData?.[0],
    });
  } catch (error) {
    console.error('Error in team API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
