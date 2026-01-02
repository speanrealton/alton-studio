import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, subject, message, category } = await request.json();

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create support ticket
    const { data, error } = await supabase
      .from('support_tickets')
      .insert([
        {
          user_id: userId,
          subject: subject || 'Support Request',
          status: 'open',
          category: category || 'general',
        }
      ])
      .select();

    if (error) {
      console.error('Error creating ticket:', error);
      return NextResponse.json(
        { error: 'Failed to create support ticket' },
        { status: 500 }
      );
    }

    // Add initial message to the ticket
    if (data && data.length > 0) {
      const ticketId = data[0].id;
      
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert([
          {
            ticket_id: ticketId,
            user_id: userId,
            message_type: 'user',
            content: message,
          }
        ]);

      if (messageError) {
        console.error('Error creating message:', messageError);
      }

      return NextResponse.json({
        success: true,
        ticket_id: ticketId,
        ticket: data[0],
        message: 'Support ticket created successfully'
      }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Support API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const ticketId = request.nextUrl.searchParams.get('ticketId');

    if (ticketId) {
      // Get specific ticket with messages
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (ticketError) {
        return NextResponse.json(
          { error: 'Ticket not found' },
          { status: 404 }
        );
      }

      const { data: messages } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      return NextResponse.json({
        ticket,
        messages
      });
    }

    if (userId) {
      // Get all tickets for user
      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch tickets' },
          { status: 500 }
        );
      }

      return NextResponse.json({ tickets });
    }

    return NextResponse.json(
      { error: 'Missing userId or ticketId parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Support API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
