import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, X } from 'lucide-react';

interface Message {
  id: string;
  session_id: string;
  message: string;
  sender_type: string;
  user_id?: string;
  created_at: string;
}

interface UserProfile {
  email: string;
  name?: string;
}

interface AgentChatPanelProps {
  sessionId: string;
  onClose: () => void;
}

export default function AgentChatPanel({ sessionId, onClose }: AgentChatPanelProps) {
  const { user: agentUser } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load session info and user profile
  useEffect(() => {
    const loadSessionInfo = async () => {
      try {
        const { data: session } = await supabase
          .from('support_chat_sessions')
          .select('user_id')
          .eq('id', sessionId)
          .single();

        if (session) {
          setUserId(session.user_id);

          // Fetch user profile info
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(
              session.user_id
            );
            if (authUser?.user) {
              setUserProfile({
                email: authUser.user.email || 'Unknown',
                name: authUser.user.user_metadata?.name,
              });
            }
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
          }
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    };

    loadSessionInfo();
  }, [sessionId]);

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('support_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };

    loadMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`agent-chat-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !agentUser) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('support_chat_messages').insert([
        {
          session_id: sessionId,
          user_id: agentUser.id,
          message: newMessage,
          sender_type: 'agent',
        },
      ]);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const closeChat = async () => {
    try {
      // Mark session as closed
      await supabase
        .from('support_chat_sessions')
        .update({ status: 'closed' })
        .eq('id', sessionId);

      onClose();
    } catch (error) {
      console.error('Failed to close chat:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-96 bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-blue-500 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Chat with Customer</h3>
          <p className="text-xs opacity-90 mt-1">
            {userProfile?.name || userProfile?.email || 'Customer'}
          </p>
        </div>
        <button
          onClick={closeChat}
          className="hover:bg-blue-600 p-1 rounded transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.sender_type === 'agent'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-300 text-gray-900 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{msg.message}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(msg.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form
        onSubmit={sendMessage}
        className="border-t border-gray-200 p-3 bg-white rounded-b-lg flex gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={isLoading || !newMessage.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white p-2 rounded transition-colors"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
