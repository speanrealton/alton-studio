'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { MessageSquare, CheckCircle, Clock, AlertCircle, Send, X, Plus } from 'lucide-react';
import Link from 'next/link';

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  category: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  ticket_id: string;
  user_id: string;
  message_type: 'user' | 'support';
  content: string;
  created_at: string;
}

interface User {
  id: string;
  email?: string;
}

export default function UserSupportPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [newTicketMode, setNewTicketMode] = useState(false);
  const [newTicketData, setNewTicketData] = useState({
    subject: '',
    message: '',
    category: 'general'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchUserTickets = async (userId: string) => {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tickets:', error);
      return;
    }

    setTickets(data || []);

    const subscription = supabase
      .channel(`user-tickets-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets', filter: `user_id=eq.${userId}` },
        () => {
          fetchUserTickets(userId);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  // Check authentication and fetch tickets
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const initialize = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        window.location.href = '/login';
        return;
      }

      setUser({ id: authUser.id, email: authUser.email });
      await fetchUserTickets(authUser.id);
      setIsLoading(false);
    };

    initialize();
  }, []);

  // Fetch messages for selected ticket
  useEffect(() => {
    if (!selectedTicket) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', selectedTicket.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();

    // Subscribe to new messages (real-time updates when agents reply)
    const subscription = supabase
      .channel(`user-messages-${selectedTicket.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${selectedTicket.id}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedTicket]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTicketData.subject.trim() || !newTicketData.message.trim()) return;

    setSending(true);
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          subject: newTicketData.subject,
          message: newTicketData.message,
          category: newTicketData.category
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Refresh tickets
        await fetchUserTickets(user.id);
        
        // Clear form and close modal
        setNewTicketData({ subject: '', message: '', category: 'general' });
        setNewTicketMode(false);
        
        // Select the new ticket
        if (data.ticket_id) {
          const { data: newTicket } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('id', data.ticket_id)
            .single();
          if (newTicket) setSelectedTicket(newTicket);
        }
      } else {
        alert('Failed to create support ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Error creating ticket');
    } finally {
      setSending(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from('support_messages').insert([
        {
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message_type: 'user',
          content: replyText.trim(),
        }
      ]);

      if (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message');
      } else {
        setReplyText('');
        // Messages will update via real-time subscription
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error sending message');
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'in-progress': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'resolved': return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'closed': return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Support Tickets
            </h1>
            <p className="text-gray-400 mt-2">View and manage your support requests</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setNewTicketMode(true)}
              title="Create a new support ticket"
              className="flex items-center gap-2 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              New Ticket
            </button>
            <Link href="/" className="text-purple-400 hover:text-purple-300 transition">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="col-span-1 bg-slate-900 border border-purple-500/20 rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-purple-500/20">
            <h2 className="font-semibold text-white">Your Tickets</h2>
            <p className="text-xs text-gray-400">{tickets.length} total</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {tickets.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No support tickets yet</p>
                <p className="text-xs mt-2">Create one to get started</p>
              </div>
            ) : (
              tickets.map(ticket => (
                <motion.button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                  className={`w-full text-left p-4 border-b border-purple-500/10 transition ${
                    selectedTicket?.id === ticket.id ? 'bg-purple-500/20 border-l-2 border-l-purple-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white truncate flex-1 text-sm">{ticket.subject}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-semibold border flex items-center gap-1 whitespace-nowrap ml-2 ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Category: {ticket.category}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </motion.button>
              ))
            )}
          </div>
        </div>

        {/* Chat View */}
        <div className="col-span-2 bg-slate-900 border border-purple-500/20 rounded-lg flex flex-col">
          {selectedTicket ? (
            <>
              {/* Ticket Header */}
              <div className="p-6 border-b border-purple-500/20">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedTicket.subject}</h2>
                    <p className="text-gray-400 text-sm mt-1">Ticket ID: {selectedTicket.id.slice(0, 8)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    title="Close ticket details"
                    className="text-gray-400 hover:text-white transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Status</p>
                    <span className={`mt-1 px-3 py-1 rounded-lg border text-white text-sm font-semibold flex items-center gap-1 w-fit ${getStatusColor(selectedTicket.status)}`}>
                      {getStatusIcon(selectedTicket.status)}
                      {selectedTicket.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="mt-1 text-white capitalize text-sm">{selectedTicket.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="mt-1 text-white text-xs">{new Date(selectedTicket.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <p>No messages yet. Awaiting support team response...</p>
                  </div>
                ) : (
                  messages.map(message => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.message_type === 'support' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-xs rounded-lg p-4 ${
                          message.message_type === 'support'
                            ? 'bg-purple-600/20 text-gray-200 border border-purple-500/50'
                            : 'bg-blue-600/20 text-blue-200 border border-blue-500/50'
                        }`}
                      >
                        <p className="text-xs font-semibold mb-2 opacity-75">
                          {message.message_type === 'support' ? 'Support Team' : 'You'}
                        </p>
                        <p className="text-sm mb-2">{message.content}</p>
                        <p className="text-xs opacity-50">
                          {new Date(message.created_at).toLocaleString()}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Reply Input */}
              <div className="p-6 border-t border-purple-500/20">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendReply()}
                    placeholder="Type your response..."
                    disabled={sending}
                    className="flex-1 bg-slate-800 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sending}
                    title="Send your response"
                    className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 transition"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a ticket to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {newTicketMode && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-purple-500/20 rounded-lg max-w-lg w-full p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Create Support Ticket</h2>
              <button
                onClick={() => setNewTicketMode(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={newTicketData.category}
                  onChange={(e) => setNewTicketData(prev => ({ ...prev, category: e.target.value }))}
                  title="Select a support category"
                  className="w-full bg-slate-800 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="general">General</option>
                  <option value="billing">Billing</option>
                  <option value="technical">Technical</option>
                  <option value="orders">Orders</option>
                  <option value="design">Design</option>
                  <option value="account">Account</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                <input
                  type="text"
                  value={newTicketData.subject}
                  onChange={(e) => setNewTicketData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief description of your issue..."
                  className="w-full bg-slate-800 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                <textarea
                  value={newTicketData.message}
                  onChange={(e) => setNewTicketData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Describe your issue in detail..."
                  rows={5}
                  className="w-full bg-slate-800 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 font-semibold transition"
                >
                  {sending ? 'Creating...' : 'Create Ticket'}
                </button>
                <button
                  type="button"
                  onClick={() => setNewTicketMode(false)}
                  title="Cancel creating a new ticket"
                  className="flex-1 bg-slate-800 border border-purple-500/30 text-white rounded-lg px-4 py-3 font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
