import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { checkApiPermission, getFilteredQueryForRole } from '@/lib/permission-checks';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId, message, category } = await request.json();

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Users can only create chats for themselves
    if (user.id !== userId) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'You can only create chats for yourself' },
          { status: 403 }
        );
      }
    }

    // Create a support chat session
    const { data: chatSession, error: chatError } = await supabase
      .from('support_chat_sessions')
      .insert({
        user_id: userId,
        status: 'pending', // waiting for agent to accept
        category: category || 'general'
      })
      .select()
      .single();

    if (chatError || !chatSession) {
      return NextResponse.json(
        { error: 'Failed to create chat session' },
        { status: 500 }
      );
    }

    // Insert user's first message
    await supabase.from('support_chat_messages').insert({
      session_id: chatSession.id,
      user_id: userId,
      message: message,
      sender_type: 'user'
    });

    // Send automatic first response
    const { error: autoReplyError } = await supabase
      .from('support_chat_messages')
      .insert({
        session_id: chatSession.id,
        message: `Thank you for reaching out! 👋 Your support request has been received. A support agent will be with you shortly to assist you.`,
        sender_type: 'system'
      });

    if (autoReplyError) {
      console.error('Error sending auto-reply:', autoReplyError);
    }

    // Notify agents about new support request
    const { data: agentIds } = await supabase
      .from('support_team')
      .select('user_id')
      .eq('status', 'available');

    if (agentIds && agentIds.length > 0) {
      const notifications = agentIds.map(agent => ({
        user_id: agent.user_id,
        type: 'support_request',
        title: 'New Support Request',
        message: `A customer needs assistance. Category: ${category || 'general'}`,
        related_id: chatSession.id,
        read: false
      }));

      await supabase.from('notifications').insert(notifications);
    }

    return NextResponse.json({
      success: true,
      session_id: chatSession.id,
      message: 'Chat session created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Support chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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
    const currentUserId = session.user.id;

    const sessionId = request.nextUrl.searchParams.get('sessionId');
    const userId = request.nextUrl.searchParams.get('userId');

    if (sessionId) {
      // Get messages for a specific session
      const { data: messages, error } = await supabase
        .from('support_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch messages' },
          { status: 500 }
        );
      }

      // Get session details and check authorization
      const { data: chatSession } = await supabase
        .from('support_chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (!chatSession) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      // Authorization check
      const isOwner = chatSession.user_id === currentUserId;
      const isAssignedAgent = chatSession.assigned_agent_id === currentUserId;
      const isAdmin = userRole === 'admin';

      if (!isOwner && !isAssignedAgent && !isAdmin) {
        return NextResponse.json(
          { error: 'You do not have access to this chat' },
          { status: 403 }
        );
      }

      return NextResponse.json({ session: chatSession, messages });
    }

    if (userId) {
      // Authorization check: users can only see their own, agents/admins see assigned/all
      if (userRole === 'user' && userId !== currentUserId) {
        return NextResponse.json(
          { error: 'You can only view your own chats' },
          { status: 403 }
        );
      }

      let query = supabase
        .from('support_chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (userRole === 'user') {
        // Users see only their chats
        query = query.eq('user_id', currentUserId);
      } else if (userRole === 'agent') {
        // Agents see chats assigned to them
        query = query.eq('assigned_agent_id', currentUserId);
      }
      // Admins see all (no filter)

      const { data: sessions, error } = await query;

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch sessions' },
          { status: 500 }
        );
      }

      return NextResponse.json({ sessions });
    }

    return NextResponse.json(
      { error: 'Missing sessionId or userId' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Support chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
