import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Get unread messages for user's tickets
    const { data: userTickets } = await supabase
      .from('support_tickets')
      .select('id')
      .eq('user_id', userId);

    if (!userTickets || userTickets.length === 0) {
      return NextResponse.json({
        unreadCount: 0,
        notifications: []
      });
    }

    const ticketIds = userTickets.map(t => t.id);

    // Get unread support responses (messages not sent by the user)
    const { data: unreadMessages } = await supabase
      .from('support_messages')
      .select('id, ticket_id, message_type, content, created_at, support_tickets(subject)')
      .in('ticket_id', ticketIds)
      .eq('message_type', 'support')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      unreadCount: unreadMessages?.length || 0,
      notifications: unreadMessages || []
    });
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
