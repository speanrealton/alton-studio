import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    const userRole = profile?.role || 'user';

    // Only agents and admins can accept/decline chats
    if (userRole !== 'agent' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only agents can perform this action' },
        { status: 403 }
      );
    }

    const { sessionId, action, agentId } = await request.json();

    if (!sessionId || !action || !agentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify agent is attempting to accept their own chat (unless admin)
    if (userRole === 'agent' && agentId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only accept chats assigned to you' },
        { status: 403 }
      );
    }

    if (action === 'accept') {
      // Update session status to active
      const { error } = await supabase
        .from('support_chat_sessions')
        .update({
          status: 'active',
          assigned_agent_id: agentId,
          accepted_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to accept chat' },
          { status: 500 }
        );
      }

      // Send system message that agent joined
      await supabase.from('support_chat_messages').insert({
        session_id: sessionId,
        message: `Support agent has joined the chat. How can we help you?`,
        sender_type: 'system'
      });

      return NextResponse.json({
        success: true,
        message: 'Chat accepted successfully'
      });
    } else if (action === 'decline') {
      // Update session status to declined
      const { error } = await supabase
        .from('support_chat_sessions')
        .update({ status: 'declined' })
        .eq('id', sessionId);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to decline chat' },
          { status: 500 }
        );
      }

      // Send system message that agent declined
      await supabase.from('support_chat_messages').insert({
        session_id: sessionId,
        message: `This agent is currently unavailable. We'll connect you with another support specialist shortly.`,
        sender_type: 'system'
      });

      return NextResponse.json({
        success: true,
        message: 'Chat declined. Another agent will be notified.'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Chat action API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
