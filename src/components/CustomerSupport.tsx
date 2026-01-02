'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Phone, Mail, Clock, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import '@/styles/customer-support.css';

interface Message {
  id: string;
  type: 'user' | 'support' | 'system';
  content: string;
  timestamp: Date;
  senderName?: string;
}

export default function CustomerSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{id: string} | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatActive, setChatActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supportCategories = [
    { id: 'billing', label: 'Billing & Payments', icon: '💳' },
    { id: 'technical', label: 'Technical Issues', icon: '⚙️' },
    { id: 'orders', label: 'Orders & Shipping', icon: '📦' },
    { id: 'design', label: 'Design Tools', icon: '🎨' },
    { id: 'account', label: 'Account & Profile', icon: '👤' },
    { id: 'other', label: 'Other', icon: '❓' },
  ];

  useEffect(() => {
    // Check auth
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);
    };
    checkAuth();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentUser) return;

    // If no session yet, create one
    if (!sessionId) {
      await createNewChatSession();
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send message to API
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/support-chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          sessionId: sessionId,
          message: inputValue
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChatSession = async () => {
    if (!currentUser || !inputValue.trim()) return;

    setIsLoading(true);
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/support-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: currentUser.id,
          message: inputValue,
          category: selectedCategory || 'general'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create chat session');
      }

      const data = await response.json();
      setSessionId(data.session_id);
      
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: inputValue,
        timestamp: new Date(),
      };

      // Add system message
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Thank you for reaching out! 👋 Your support request has been received. A support agent will be with you shortly to assist you.',
        timestamp: new Date(),
        senderName: 'System'
      };

      setMessages(prev => [...prev, userMessage, systemMessage]);
      setInputValue('');
      setChatActive(true);
    } catch (error) {
      console.error('Error creating chat session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to real-time messages
  useEffect(() => {
    if (!sessionId) return;

    const subscription = supabase
      .channel(`support-chat-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload: any) => {
          const newMessage: Message = {
            id: payload.new.id,
            type: payload.new.sender_type === 'user' ? 'user' : (payload.new.sender_type === 'system' ? 'system' : 'support'),
            content: payload.new.message,
            timestamp: new Date(payload.new.created_at),
            senderName: payload.new.sender_type === 'agent' ? 'Support Agent' : (payload.new.sender_type === 'system' ? 'System' : undefined)
          };
          
          setMessages(prev => {
            // Avoid duplicates
            if (prev.find(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const categoryName = supportCategories.find(c => c.id === categoryId)?.label;
    const categoryMessage: Message = {
      id: Date.now().toString(),
      type: 'system',
      content: `Great! I'll help you with ${categoryName}. Please describe your issue in detail, and our team will assist you.`,
      timestamp: new Date(),
      senderName: 'System'
    };
    setMessages(prev => [...prev, categoryMessage]);
  };

  return (
    <>
      {/* Chat Widget Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 right-8 z-40 group"
            title="Open support chat"
          >
            <div className="absolute inset-0 bg-linear-to-r from-purple-600 to-pink-600 rounded-full blur-lg group-hover:blur-xl transition opacity-75 group-hover:opacity-100" />
            <div className="relative bg-linear-to-r from-purple-600 to-pink-600 rounded-full p-4 shadow-2xl hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 text-white" />
              <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-8 right-8 z-50 w-96 max-h-[600px] bg-linear-to-b from-slate-900 to-slate-950 rounded-2xl border border-purple-500/20 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-linear-to-r from-purple-600 to-pink-600 p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-white" />
                <div>
                  <h3 className="text-white font-bold">Alton Support</h3>
                  <p className="text-xs text-purple-100">We&apos;re here to help</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsExpanded(false);
                }}
                className="text-white hover:bg-white/20 p-1 rounded-lg transition"
                title="Close support chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Expanded View Toggle */}
            {!isExpanded && (
              <button
                onClick={() => setIsExpanded(true)}
                className="bg-slate-800/50 text-xs text-gray-300 p-2 hover:bg-slate-700/50 transition flex items-center justify-center gap-2"
              >
                <ChevronDown className="w-3 h-3" />
                View More Options
              </button>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {isExpanded ? (
                /* Category Selection View */
                <div className="p-4 overflow-y-auto">
                  <p className="text-sm text-gray-300 mb-4">What do you need help with?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {supportCategories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => {
                          handleCategorySelect(category.id);
                          setIsExpanded(false);
                        }}
                        className="group bg-slate-800/50 hover:bg-purple-600/30 border border-purple-500/20 hover:border-purple-500/60 rounded-lg p-3 transition text-left"
                      >
                        <div className="text-2xl mb-2">{category.icon}</div>
                        <p className="text-xs font-semibold text-gray-200 group-hover:text-white transition">{category.label}</p>
                      </button>
                    ))}
                  </div>

                  {/* Contact Information */}
                  <div className="mt-6 pt-4 border-t border-purple-500/10 space-y-3">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <Phone className="w-4 h-4 text-purple-400" />
                      <span>📞 +1-844-ALTON-00</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <Mail className="w-4 h-4 text-purple-400" />
                      <span>✉️ support@altonstudio.com</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span>⏰ 24/7 Support Available</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Chat View */
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        <p className="text-sm">Welcome to Alton Studio Support! 👋</p>
                        <p className="text-xs mt-2">Select a category to get started</p>
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs rounded-lg p-3 text-sm ${
                              message.type === 'user'
                                ? 'bg-linear-to-r from-purple-600 to-pink-600 text-white'
                                : 'bg-slate-800 text-gray-200 border border-purple-500/20'
                            }`}
                          >
                            {message.senderName && (
                              <p className="text-xs font-semibold mb-1 opacity-75">{message.senderName}</p>
                            )}
                            <p>{message.content}</p>
                            <p className="text-xs opacity-50 mt-1">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-800 border border-purple-500/20 rounded-lg p-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce support-bounce-delay-1" />
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce support-bounce-delay-2" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-purple-500/10 flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 bg-slate-800 border border-purple-500/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/60 transition"
                      disabled={isLoading}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg p-2 transition"
                      title="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
