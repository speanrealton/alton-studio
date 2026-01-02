import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { ticketId, content, agentId } = await request.json();

    if (!ticketId || !content || !agentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the ticket to find the user
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('user_id, id')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Insert the support agent's message
    const { data: messageData, error: messageError } = await supabase
      .from('support_messages')
      .insert([
        {
          ticket_id: ticketId,
          user_id: agentId,
          message_type: 'support',
          content: content.trim(),
        }
      ])
      .select();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    // Create notification in a notifications table (optional, for tracking)
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: ticket.user_id,
          type: 'support_response',
          title: 'New Support Response',
          message: content.substring(0, 100),
          related_id: ticketId,
          read: false
        }
      ])
      .select();

    if (notificationError) {
      console.warn('Warning creating notification (non-critical):', notificationError);
    }

    // Update ticket status if needed
    const { error: updateError } = await supabase
      .from('support_tickets')
      .update({ 
        updated_at: new Date().toISOString(),
        status: 'in-progress'
      })
      .eq('id', ticketId);

    if (updateError) {
      console.warn('Warning updating ticket:', updateError);
    }

    return NextResponse.json({
      success: true,
      message: messageData?.[0],
      notification: 'Message sent and user will be notified'
    }, { status: 201 });
  } catch (error) {
    console.error('Support message API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
