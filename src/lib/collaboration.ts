import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Collaboration types
export interface Collaborator {
  id: string;
  name: string;
  color: string;
  lastSeen: number;
}

export interface ChatMessage {
  id: string;
  sessionCode: string;
  user: string;
  message: string;
  timestamp: number;
  color: string;
}

export interface CollaborationSession {
  code: string;
  createdAt: number;
  createdBy: string;
  isActive: boolean;
}

// Session management
export const createCollaborationSession = async (userName: string): Promise<string> => {
  // Generate 6-digit code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Store session in Supabase (in a real app, you'd use a database)
  // For now, we'll rely on channel presence which is built into Supabase Realtime
  return code;
};

// Subscribe to collaborators in a session
export const subscribeToCollaborators = (
  sessionCode: string,
  onUpdate: (collaborators: Collaborator[]) => void
) => {
  const channel = supabase.channel(`collab:${sessionCode}`, {
    config: {
      presence: {
        key: sessionCode,
      },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const collaborators: Collaborator[] = [];
      
      for (const key in state) {
        const presences = state[key];
        if (Array.isArray(presences)) {
          presences.forEach((presence: any) => {
            if (presence.user) {
              collaborators.push(presence.user);
            }
          });
        }
      }
      
      onUpdate(collaborators);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', newPresences);
      const state = channel.presenceState();
      const collaborators: Collaborator[] = [];
      
      for (const k in state) {
        const presences = state[k];
        if (Array.isArray(presences)) {
          presences.forEach((presence: any) => {
            if (presence.user) {
              collaborators.push(presence.user);
            }
          });
        }
      }
      
      onUpdate(collaborators);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', leftPresences);
      const state = channel.presenceState();
      const collaborators: Collaborator[] = [];
      
      for (const k in state) {
        const presences = state[k];
        if (Array.isArray(presences)) {
          presences.forEach((presence: any) => {
            if (presence.user) {
              collaborators.push(presence.user);
            }
          });
        }
      }
      
      onUpdate(collaborators);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to collaborators');
      }
    });

  return channel;
};

// Broadcast presence (join session)
export const broadcastPresence = async (
  channel: any,
  collaborator: Collaborator
) => {
  await channel.track({
    user: collaborator,
    timestamp: Date.now(),
  });
};

// Subscribe to chat messages in a session
export const subscribeToMessages = (
  sessionCode: string,
  onMessage: (message: ChatMessage) => void
) => {
  const channel = supabase.channel(`messages:${sessionCode}`);

  channel
    .on(
      'broadcast',
      { event: 'chat' },
      (payload) => {
        const message: ChatMessage = payload.payload;
        onMessage(message);
      }
    )
    .subscribe();

  return channel;
};

// Broadcast a chat message to all collaborators
export const broadcastChatMessage = async (
  sessionCode: string,
  message: ChatMessage
) => {
  const channel = supabase.channel(`messages:${sessionCode}`);
  
  await channel.send({
    type: 'broadcast',
    event: 'chat',
    payload: message,
  });
};

// Subscribe to canvas updates in a session
export const subscribeToCanvasUpdates = (
  sessionCode: string,
  onCanvasUpdate: (update: any) => void
) => {
  const channel = supabase.channel(`canvas:${sessionCode}`, {
    config: {
      broadcast: { self: false }
    }
  });

  channel
    .on('broadcast', { event: 'canvas' }, (payload: any) => {
      console.log('Received canvas broadcast:', payload);
      onCanvasUpdate(payload.payload);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Subscribed to canvas updates');
      }
    });

  return channel;
};

// Broadcast a canvas update to all collaborators
export const broadcastCanvasUpdate = async (
  sessionCode: string,
  canvasData: any,
  userId: string
) => {
  const channel = supabase.channel(`canvas:${sessionCode}`);
  
  await channel.send({
    type: 'broadcast',
    event: 'canvas',
    payload: {
      canvasData,
      userId,
      timestamp: Date.now(),
    },
  });
};

// Clean up subscriptions
export const unsubscribeFromSession = async (channel: any) => {
  if (channel) {
    await supabase.removeChannel(channel);
  }
};
