'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { MessageSquare, CheckCircle, Clock, AlertCircle, Send, X, Search, Filter } from 'lucide-react';
import Link from 'next/link';

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  category: string;
  priority: string;
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
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

export default function SupportDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Check if user is admin
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/';
        return;
      }

      // Check if user has admin role (you can customize this logic)
      const { data: userData, error } = await supabase
        .from('support_team')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking admin status:', error);
      }

      if (!userData) {
        // User is not a support team member
        console.warn('User not in support_team table');
        window.location.href = '/';
        return;
      }

      setCurrentUser(session.user);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Fetch all tickets
  useEffect(() => {
    const fetchTickets = async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tickets:', error);
        return;
      }

      setTickets(data || []);
    };

    if (currentUser) {
      fetchTickets();

      // Subscribe to real-time changes
      const subscription = supabase
        .channel('support_tickets')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'support_tickets' },
          (payload) => {
            fetchTickets();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [currentUser]);

  // Fetch messages for selected ticket
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedTicket) return;

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

      // Fetch user info for the ticket
      const { data: userData } = await supabase.auth.admin.getUserById(selectedTicket.user_id);
      if (userData && userData.user) {
        setUsers(prev => ({
          ...prev,
          [selectedTicket.user_id]: userData.user
        }));
      }
    };

    fetchMessages();

    // Subscribe to new messages
    if (selectedTicket) {
      const subscription = supabase
        .channel(`messages_${selectedTicket.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${selectedTicket.id}` },
          (payload) => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedTicket]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket || !currentUser) return;

    try {
      const response = await fetch('/api/support/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          content: replyText.trim(),
          agentId: currentUser.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error sending message:', error);
        alert('Failed to send message');
        return;
      }

      setReplyText('');
      // Messages will be updated via real-time subscription
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send message');
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTicket) return;

    const { error } = await supabase
      .from('support_tickets')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString(),
        resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null
      })
      .eq('id', selectedTicket.id);

    if (error) {
      console.error('Error updating ticket:', error);
      return;
    }

    setSelectedTicket(prev => prev ? { ...prev, status: newStatus as any } : null);
    setTickets(prev => prev.map(t => 
      t.id === selectedTicket.id ? { ...t, status: newStatus as any } : t
    ));
  };

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Support Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Manage customer support tickets</p>
          </div>
          <Link href="/" className="text-purple-400 hover:text-purple-300 transition">
            ← Back to Home
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 border border-purple-500/20 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Total Tickets</p>
            <p className="text-3xl font-bold text-purple-400">{tickets.length}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900 border border-blue-500/20 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Open</p>
            <p className="text-3xl font-bold text-blue-400">{tickets.filter(t => t.status === 'open').length}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900 border border-yellow-500/20 rounded-lg p-4">
            <p className="text-gray-400 text-sm">In Progress</p>
            <p className="text-3xl font-bold text-yellow-400">{tickets.filter(t => t.status === 'in-progress').length}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-900 border border-green-500/20 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Resolved</p>
            <p className="text-3xl font-bold text-green-400">{tickets.filter(t => t.status === 'resolved').length}</p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="col-span-1 bg-slate-900 border border-purple-500/20 rounded-lg overflow-hidden flex flex-col">
          {/* Search & Filter */}
          <div className="p-4 border-b border-purple-500/20 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-purple-500/30 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 bg-slate-800 border border-purple-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="flex-1 bg-slate-800 border border-purple-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="all">All Categories</option>
                <option value="billing">Billing</option>
                <option value="technical">Technical</option>
                <option value="orders">Orders</option>
                <option value="design">Design</option>
                <option value="account">Account</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          {/* Tickets */}
          <div className="flex-1 overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <p>No tickets found</p>
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <motion.button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                  className={`w-full text-left p-4 border-b border-purple-500/10 transition ${
                    selectedTicket?.id === ticket.id ? 'bg-purple-500/20 border-l-2 border-l-purple-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white truncate flex-1">{ticket.subject}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 whitespace-nowrap ml-2 ${getStatusColor(ticket.status)}`}>
                      {getStatusIcon(ticket.status)}
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">ID: {ticket.id.slice(0, 8)}...</p>
                  <p className="text-xs text-gray-400">Category: {ticket.category}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(ticket.created_at).toLocaleDateString()} {new Date(ticket.created_at).toLocaleTimeString()}
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
                    <p className="text-gray-400 text-sm mt-1">Ticket ID: {selectedTicket.id}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-gray-400 hover:text-white transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Status</p>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className={`mt-1 px-3 py-1 rounded-lg border text-white text-sm focus:outline-none ${getStatusColor(selectedTicket.status)}`}
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="mt-1 text-white capitalize">{selectedTicket.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Priority</p>
                    <p className="mt-1 text-white capitalize">{selectedTicket.priority}</p>
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
                    <p>No messages yet</p>
                  </div>
                ) : (
                  messages.map(message => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.message_type === 'support' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs rounded-lg p-4 ${
                          message.message_type === 'support'
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-gray-200 border border-purple-500/20'
                        }`}
                      >
                        <p className="text-xs font-semibold mb-2 opacity-75">
                          {message.message_type === 'support' ? 'Support Team' : 'Customer'}
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
                    onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                    placeholder="Type your response..."
                    className="flex-1 bg-slate-800 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 transition"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
