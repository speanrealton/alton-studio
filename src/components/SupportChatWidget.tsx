import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, X, ArrowLeft, MessageSquare, Zap, Shield, Globe } from 'lucide-react';

interface ChatSession {
  id: string;
  status: string;
  category?: string;
  assigned_agent_id?: string;
}

interface Message {
  id: string;
  session_id: string;
  message: string;
  sender_type: string;
  user_id?: string;
  created_at: string;
}

const SUPPORT_CATEGORIES = [
  { id: 'design', name: 'Design Help', icon: '🎨', description: 'Get help with design features' },
  { id: 'printing', name: 'Printing Issues', icon: '🖨️', description: 'Troubleshoot printing problems' },
  { id: 'account', name: 'Account Support', icon: '👤', description: 'Manage your account' },
  { id: 'billing', name: 'Billing & Payments', icon: '💳', description: 'Payment and invoice questions' },
  { id: 'shipping', name: 'Shipping & Delivery', icon: '📦', description: 'Track your orders' },
  { id: 'other', name: 'Other Issues', icon: '❓', description: 'Something else?' },
];

export function SupportChatWidget() {
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState<'welcome' | 'category' | 'chat'>('welcome');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user session
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };
    getUser();
  }, []);

  // Load user's active sessions
  useEffect(() => {
    if (!user) return;

    const loadSessions = async () => {
      const { data } = await supabase
        .from('support_chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: false });

      if (data) {
        setSessions(data);
        if (data.length > 0 && !activeSession) {
          setActiveSession(data[0]);
          setStep('chat');
        }
      }
    };

    loadSessions();
  }, [user]);

  // Subscribe to messages in active session
  useEffect(() => {
    if (!activeSession) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from('support_chat_messages')
        .select('*')
        .eq('session_id', activeSession.id)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };

    loadMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat-${activeSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_chat_messages',
          filter: `session_id=eq.${activeSession.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeSession]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createNewSession = async (category: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_chat_sessions')
        .insert([
          {
            user_id: user.id,
            status: 'pending',
            category: category,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setActiveSession(data);
        setSessions((prev) => [data, ...prev]);
        setStep('chat');
        
        // Create auto-reply system message
        await supabase.from('support_chat_messages').insert([
          {
            session_id: data.id,
            message: 'Thank you for contacting support. An agent will be with you shortly.',
            sender_type: 'system',
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeSession || !user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('support_chat_messages').insert([
        {
          session_id: activeSession.id,
          user_id: user.id,
          message: newMessage,
          sender_type: 'user',
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

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {step === 'welcome' && (
        <div className="min-h-96 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 md:p-12 flex flex-col justify-center">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Alton Support</h2>
            <p className="text-xl text-gray-600 mb-6">We're here to help 👋</p>
            <button
              onClick={() => setStep('category')}
              className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-lg transition-all mb-8"
            >
              View More Options →
            </button>
            <div className="bg-white rounded-lg p-6 mt-8 text-left">
              <p className="text-lg font-semibold text-gray-900 mb-4">Welcome to Alton Studio Support! 👋</p>
              <p className="text-gray-700">Select a category to get started</p>
            </div>
          </div>
        </div>
      )}

      {step === 'category' && (
        <div className="p-8 md:p-12">
          <button
            onClick={() => setStep('welcome')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 font-semibold"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Select a Category</h2>
          <p className="text-gray-600 mb-8">Choose the best category for your issue</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SUPPORT_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => createNewSession(category.id)}
                disabled={isLoading}
                className="p-6 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-3xl mb-3">{category.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-600 mt-2">{category.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'chat' && activeSession && (
        <div className="min-h-96 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Support Chat</h3>
              <p className="text-blue-100 text-sm">
                {activeSession.status === 'pending' && '⏳ Waiting for an agent...'}
                {activeSession.status === 'active' && '✅ Agent connected'}
              </p>
            </div>
            <button
              onClick={() => {
                setStep('welcome');
                setActiveSession(null);
                setMessages([]);
              }}
              className="hover:bg-blue-600 p-2 rounded transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Start the conversation...</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender_type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-sm px-4 py-3 rounded-lg ${
                      msg.sender_type === 'user'
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-2 ${msg.sender_type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form
            onSubmit={sendMessage}
            className="border-t border-gray-200 p-6 bg-white flex gap-3"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={isLoading || !newMessage.trim()}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              <Send size={18} />
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
