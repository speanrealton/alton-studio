'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  MessageCircle, DollarSign, TrendingUp, Eye, Star, Package,
  LogOut, User, Search, Send, Check, CheckCheck, Calendar,
  Loader2, X, Settings, Bell, Menu, Home, FileText, Image as ImageIcon,
  BarChart3, Users, Clock, Filter, MoreVertical, Download, Upload,
  CheckCircle, XCircle, AlertCircle, ChevronDown, RefreshCw, Zap,
  MapPin, Globe, Phone, Mail, Edit, Trash2, Plus, ChevronRight,
  Activity, TrendingDown, Award, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function PrinterDashboard() {
  const [user, setUser] = useState<any>(null);
  const [printer, setPrinter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [quoteRequests, setQuoteRequests] = useState<any[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [quoteMessages, setQuoteMessages] = useState<any[]>([]);
  const [newQuoteMessage, setNewQuoteMessage] = useState('');
  const [quoteResponse, setQuoteResponse] = useState({ price: '', notes: '', delivery_time: '' });
  const [quoteFilter, setQuoteFilter] = useState('all');

  const [orders, setOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [portfolioImages, setPortfolioImages] = useState<any[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioUpload, setPortfolioUpload] = useState<{ title: string; description: string; image: File | null }>({ title: '', description: '', image: null });
  const [selectedPortfolioImage, setSelectedPortfolioImage] = useState<any>(null);

  const [stats, setStats] = useState({
    unreadMessages: 0,
    pendingQuotes: 0,
    activeOrders: 0,
    totalRevenue: 0,
    totalViews: 0,
    avgRating: 4.5,
    totalClients: 0,
    conversionRate: 0,
    supportRequests: 0
  });

  const [supportNotifications, setSupportNotifications] = useState<any[]>([]);
  const [selectedSupportChat, setSelectedSupportChat] = useState<any>(null);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [supportReply, setSupportReply] = useState('');

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    initializeDashboard();
  }, []);

  const fetchOrders = async (printerId = printer?.id) => {
    const { data } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('printer_id', printerId)
      .eq('status', 'accepted')
      .order('updated_at', { ascending: false });

    if (data) setOrders(data);
  };

  const fetchPortfolioImages = async (printerId = printer?.id) => {
    const { data } = await supabase
      .from('portfolio_images')
      .select('*')
      .eq('printer_id', printerId)
      .order('created_at', { ascending: false });

    if (data) setPortfolioImages(data);
  };

  useEffect(() => {
    if (!printer) return;

    const conversationsChannel = supabase
      .channel('printer-conversations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `printer_id=eq.${printer.id}`
      }, () => fetchConversations())
      .subscribe();

    const quotesChannel = supabase
      .channel('printer-quotes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'quote_requests',
        filter: `printer_id=eq.${printer.id}`
      }, () => {
        fetchQuoteRequests();
        fetchOrders();
        fetchStats(printer.id);
      })
      .subscribe();

    const portfolioChannel = supabase
      .channel('printer-portfolio')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'portfolio_images',
        filter: `printer_id=eq.${printer.id}`
      }, () => fetchPortfolioImages())
      .subscribe();

    return () => {
      conversationsChannel.unsubscribe();
      quotesChannel.unsubscribe();
      portfolioChannel.unsubscribe();
    };
  }, [printer]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      
      // Subscribe to chat messages
      const messagesChannel = supabase
        .channel(`messages-${selectedConversation.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        }, (payload) => {
          console.log('New chat message:', payload.new);
          setMessages(prev => [...prev, { ...payload.new, type: 'chat' }]);
          scrollToBottom();
        })
        .subscribe();

      // Also subscribe to quote messages for this conversation
      const quoteMessagesChannel = supabase
        .channel(`quote-messages-messages-tab-${selectedConversation.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'quote_messages',
          filter: `quote_request_id=eq.${selectedConversation.id}`
        }, (payload) => {
          console.log('New quote message in messages tab:', payload.new);
          setMessages(prev => [...prev, { ...payload.new, type: 'quote' }]);
          scrollToBottom();
        })
        .subscribe();

      return () => {
        messagesChannel.unsubscribe();
        quoteMessagesChannel.unsubscribe();
      };
    }
  }, [selectedConversation]);

  // Subscribe to support chat messages
  useEffect(() => {
    if (selectedSupportChat) {
      const messagesChannel = supabase
        .channel(`support-messages-${selectedSupportChat.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'support_chat_messages',
          filter: `session_id=eq.${selectedSupportChat.id}`
        }, (payload) => {
          setSupportMessages(prev => [...prev, payload.new]);
          scrollToBottom();
        })
        .subscribe();

      return () => {
        messagesChannel.unsubscribe();
      };
    }
  }, [selectedSupportChat]);

  const initializeDashboard = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/auth';
      return;
    }
    setUser(user);

    const { data: printerData } = await supabase
      .from('printers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!printerData) {
      alert('No printer profile found');
      window.location.href = '/printer/register';
      return;
    }

    setPrinter(printerData);
    await Promise.all([
      fetchConversations(printerData.id),
      fetchQuoteRequests(printerData.id),
      fetchStats(printerData.id),
      fetchOrders(printerData.id),
      fetchPortfolioImages(printerData.id),
      fetchSupportNotifications(user.id)
    ]);
    setLoading(false);
  };

  const fetchSupportNotifications = async (userId: string) => {
    try {
      const { data: notifications } = await supabase
        .from('notifications')
        .select(`*, related_id`)
        .eq('user_id', userId)
        .eq('type', 'support_request')
        .eq('read', false)
        .order('created_at', { ascending: false });

      if (notifications) {
        const sessionIds = notifications.map(n => n.related_id);
        
        // Fetch the support chat sessions
        const { data: sessions } = await supabase
          .from('support_chat_sessions')
          .select('*')
          .in('id', sessionIds);

        setSupportNotifications(notifications.map(notif => ({
          ...notif,
          session: sessions?.find(s => s.id === notif.related_id)
        })));
      }
    } catch (error) {
      console.error('Error fetching support notifications:', error);
    }
  };

  const fetchConversations = async (printerId = printer?.id) => {
    // Get regular chat conversations
    const { data: chatConversations } = await supabase
      .from('conversations')
      .select('*')
      .eq('printer_id', printerId)
      .order('last_message_at', { ascending: false });

    // Get quote requests as conversations
    const { data: quoteConversations } = await supabase
      .from('quote_requests')
      .select(`
        id,
        user_id,
        created_at,
        updated_at,
        status,
        service_type,
        description,
        quantity
      `)
      .eq('printer_id', printerId)
      .order('updated_at', { ascending: false });

    // Combine and format them
    const formattedQuotes = (quoteConversations || []).map(q => ({
      id: q.id,
      type: 'quote',
      user_id: q.user_id,
      user_name: `Quote: ${q.service_type}`,
      last_message: q.description?.substring(0, 50) || 'Quote request',
      last_message_at: q.updated_at,
      status: q.status,
      unread_count_printer: 0
    }));

    const formattedChats = (chatConversations || []).map(c => ({
      ...c,
      type: 'chat',
      user_name: `Client #${c.id.slice(0, 8)}`
    }));

    // Merge and sort by last message time
    const allConversations = [...formattedChats, ...formattedQuotes].sort((a, b) => {
      const timeA = new Date(a.last_message_at).getTime();
      const timeB = new Date(b.last_message_at).getTime();
      return timeB - timeA;
    });

    if (allConversations) setConversations(allConversations);
  };

  const fetchMessages = async (conversationId: string) => {
    // Fetch regular chat messages
    const { data: chatMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // Fetch quote messages for this conversation (if it's a quote conversation)
    const { data: quoteMessageData } = await supabase
      .from('quote_messages')
      .select('*')
      .eq('quote_request_id', conversationId)
      .order('created_at', { ascending: true });

    // Combine both message types
    const allMessages = [
      ...(chatMessages || []).map(msg => ({ ...msg, type: 'chat' })),
      ...(quoteMessageData || []).map(msg => ({ ...msg, type: 'quote' }))
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (allMessages.length > 0) {
      setMessages(allMessages);
      setTimeout(scrollToBottom, 100);
    }
  };

  const fetchQuoteRequests = async (printerId = printer?.id) => {
    const { data } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('printer_id', printerId)
      .order('created_at', { ascending: false });

    if (data) setQuoteRequests(data);
  };

  const fetchStats = async (printerId: string) => {
    const { data: conversations } = await supabase
      .from('conversations')
      .select('unread_count_printer')
      .eq('printer_id', printerId);

    const { data: quotes } = await supabase
      .from('quote_requests')
      .select('id, status, quoted_price')
      .eq('printer_id', printerId);

    const pendingQuotes = quotes?.filter(q => q.status === 'pending').length || 0;
    const activeOrders = quotes?.filter(q => q.status === 'accepted').length || 0;
    const totalRevenue = quotes?.filter(q => q.status === 'accepted').reduce((sum, q) => sum + (q.quoted_price || 0), 0) || 0;

    setStats({
      unreadMessages: conversations?.reduce((sum, c) => sum + (c.unread_count_printer || 0), 0) || 0,
      pendingQuotes,
      activeOrders,
      totalRevenue,
      totalViews: Math.floor(Math.random() * 10000) + 1000,
      avgRating: 4.5,
      totalClients: conversations?.length || 0,
      conversionRate: (quotes && quotes.length > 0) ? parseFloat(((activeOrders / quotes.length) * 100).toFixed(1)) : 0,
      supportRequests: 0
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      if (selectedConversation.type === 'quote') {
        // Send as quote message
        const { error } = await supabase.from('quote_messages').insert({
          quote_request_id: selectedConversation.id,
          sender_id: user.id,
          sender_type: 'printer',
          message: newMessage.trim()
        });

        if (!error) {
          setNewMessage('');
          await fetchMessages(selectedConversation.id);
          console.log('Quote message sent successfully');
        } else {
          console.error('Error sending quote message:', error);
          alert('Failed to send message. Please try again.');
        }
      } else {
        // Send as chat message
        const { error } = await supabase.from('chat_messages').insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          message: newMessage.trim()
        });

        if (!error) {
          setNewMessage('');
          fetchMessages(selectedConversation.id);
          console.log('Chat message sent successfully');
        } else {
          console.error('Error sending chat message:', error);
          alert('Failed to send message. Please try again.');
        }
      }
    } catch (err) {
      console.error('Exception sending message:', err);
      alert('Failed to send message. Please try again.');
    }
  };

  const fetchQuoteMessages = async (quoteId: string) => {
    const { data } = await supabase
      .from('quote_messages')
      .select('*')
      .eq('quote_request_id', quoteId)
      .order('created_at', { ascending: true });

    if (data) {
      setQuoteMessages(data);
    }
  };

  // Subscribe to real-time quote message updates for printer
  useEffect(() => {
    if (!selectedQuote?.id) return;

    // Initial fetch
    fetchQuoteMessages(selectedQuote.id);

    // Subscribe to new messages from client
    const messagesChannel = supabase
      .channel(`quote-messages-printer-${selectedQuote.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'quote_messages',
        filter: `quote_request_id=eq.${selectedQuote.id}`
      }, (payload) => {
        console.log('New message from client:', payload.new);
        setQuoteMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      messagesChannel.unsubscribe();
    };
  }, [selectedQuote?.id]);

  const sendQuoteMessage = async (quoteId: string) => {
    if (!newQuoteMessage.trim() || !user) return;

    try {
      console.log('Sending quote message:', { quoteId, userId: user.id });
      const { error } = await supabase.from('quote_messages').insert({
        quote_request_id: quoteId,
        sender_id: user.id,
        sender_type: 'printer',
        message: newQuoteMessage.trim()
      });

      if (error) {
        console.error('Error sending quote message:', error);
        alert(`Failed to send message: ${error.message || JSON.stringify(error)}`);
      } else {
        console.log('Quote message sent successfully');
        setNewQuoteMessage('');
        await fetchQuoteMessages(quoteId);
      }
    } catch (err) {
      console.error('Exception sending message:', err);
      alert('Failed to send message. Please try again.');
    }
  };

  const respondToQuote = async (quoteId: string) => {
    if (!quoteResponse.price) {
      alert('Please enter a price');
      return;
    }

    try {
      // Update quote status
      const { error } = await supabase
        .from('quote_requests')
        .update({
          status: 'quoted',
          quoted_price: parseFloat(quoteResponse.price),
          printer_notes: quoteResponse.notes,
          delivery_time: quoteResponse.delivery_time,
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId);

      if (error) {
        console.error('Error updating quote request:', error);
        alert(`Error sending quote: ${error.message || 'Failed to update quote'}`);
        return;
      }

      // Send quote message to client
      const quoteMessage = `Quote Offer: $${quoteResponse.price}\nDelivery: ${quoteResponse.delivery_time}\nNotes: ${quoteResponse.notes}`;
      
      const { error: msgError } = await supabase.from('quote_messages').insert({
        quote_request_id: quoteId,
        sender_id: user.id,
        sender_type: 'printer',
        message: quoteMessage
      });

      if (msgError) {
        console.error('Error sending quote message:', msgError);
        alert(`Error sending quote: ${msgError.message || 'Failed to send message'}`);
        return;
      }

      console.log('Quote response sent successfully');
      setQuoteRequests(prev => 
        prev.map(q => q.id === quoteId 
          ? { 
              ...q, 
              status: 'quoted', 
              quoted_price: parseFloat(quoteResponse.price),
              printer_notes: quoteResponse.notes,
              delivery_time: quoteResponse.delivery_time 
            } 
          : q
        )
      );
      
      setNewQuoteMessage('');
      setQuoteResponse({ price: '', notes: '', delivery_time: '' });
      fetchQuoteRequests();
      fetchStats(printer.id);
      setSelectedQuote(null);

      try {
        const { data: updatedQuote } = await supabase
          .from('quote_requests')
          .select('*')
          .eq('id', quoteId)
          .single();

        if (updatedQuote && updatedQuote.user_id) {
          await supabase.from('notifications').insert({
            user_id: updatedQuote.user_id,
            type: 'quote',
            title: `Quote from ${printer.company_name}`,
            message: `${printer.company_name} sent a quote for $${quoteResponse.price}. Check your quote messages!`,
            link: `/print`,
            actor_id: printer.user_id,
            actor_username: printer.company_name,
            actor_profile_picture: printer.logo_url,
            read: false
          });
        }
      } catch (notifErr) {
        console.error('Failed to create notification for quote:', notifErr);
      }

      alert('Quote sent successfully! The client will see your message.');
    } catch (err) {
      console.error('Exception in respondToQuote:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Error sending quote: ${errorMessage}`);
    }
  };

  const handleSupportChatAction = async (sessionId: string, action: 'accept' | 'decline') => {
    if (!user) return;

    try {
      const response = await fetch('/api/support-chat/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action,
          agentId: user.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update chat');
      }

      if (action === 'accept') {
        // Load the chat
        const { data: session } = await supabase
          .from('support_chat_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (session) {
          setSelectedSupportChat(session);
          
          // Load messages
          const { data: messages } = await supabase
            .from('support_chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

          setSupportMessages(messages || []);
        }
      }

      // Remove from notifications
      setSupportNotifications(prev => 
        prev.filter(n => n.related_id !== sessionId)
      );

      // Mark notification as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('related_id', sessionId)
        .eq('type', 'support_request');
    } catch (error) {
      console.error('Error handling support chat action:', error);
      alert('Failed to process your request');
    }
  };

  const sendSupportMessage = async () => {
    if (!supportReply.trim() || !selectedSupportChat || !user) return;

    try {
      const response = await fetch('/api/support-chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedSupportChat.id,
          message: supportReply,
          senderId: user.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setSupportReply('');
    } catch (error) {
      console.error('Error sending support message:', error);
      alert('Failed to send message');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredQuotes = quoteRequests.filter(q => {
    if (quoteFilter === 'all') return true;
    return q.status === quoteFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      
      {/* Compact Sidebar */}
      <motion.div 
        animate={{ width: sidebarCollapsed ? 60 : 220 }}
        className="bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col fixed h-screen z-30"
      >
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-3">
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-white text-sm truncate">{printer?.company_name}</h2>
              <p className="text-[10px] text-gray-500 truncate">{printer?.city}, {printer?.country}</p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition flex-shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          <NavButton icon={BarChart3} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} collapsed={sidebarCollapsed} />
          <NavButton icon={MessageCircle} label="Messages" active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} collapsed={sidebarCollapsed} badge={stats.unreadMessages} />
          <NavButton icon={MessageCircle} label="Support Chat" active={activeTab === 'support'} onClick={() => setActiveTab('support')} collapsed={sidebarCollapsed} badge={supportNotifications.length} />
          <NavButton icon={DollarSign} label="Quotes" active={activeTab === 'quotes'} onClick={() => setActiveTab('quotes')} collapsed={sidebarCollapsed} badge={stats.pendingQuotes} />
          <NavButton icon={Package} label="Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} collapsed={sidebarCollapsed} badge={stats.activeOrders} />
          <NavButton icon={ImageIcon} label="Portfolio" active={activeTab === 'portfolio'} onClick={() => setActiveTab('portfolio')} collapsed={sidebarCollapsed} />
          <NavButton icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} collapsed={sidebarCollapsed} />
        </nav>

        <div className="p-2 border-t border-white/5">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/auth';
            }}
            className={`w-full flex items-center gap-2 px-2 py-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition text-xs ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all ${sidebarCollapsed ? 'ml-[60px]' : 'ml-[220px]'}`}>
        
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-black/20 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {activeTab === 'overview' && 'Dashboard'}
              {activeTab === 'messages' && 'Messages'}
              {activeTab === 'support' && 'Customer Support'}
              {activeTab === 'quotes' && 'Quotes'}
              {activeTab === 'orders' && 'Orders'}
              {activeTab === 'portfolio' && 'Portfolio'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setActiveTab('quotes')} className="relative p-2 hover:bg-white/10 rounded-lg transition">
              <Bell className="w-4 h-4 text-gray-400" />
              {stats.unreadMessages + stats.pendingQuotes > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            <Link href="/print">
              <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Profile</span>
              </button>
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-950 to-black">
          
          {activeTab === 'overview' && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <CompactStatCard icon={Package} label="Active Orders" value={stats.activeOrders} change="+3" positive={true} color="from-blue-600 to-cyan-600" />
                <CompactStatCard icon={MessageCircle} label="Pending Quotes" value={stats.pendingQuotes} change="Urgent" positive={false} color="from-yellow-600 to-orange-600" />
                <CompactStatCard icon={Users} label="Total Clients" value={stats.totalClients} change={`${stats.conversionRate}% rate`} positive={true} color="from-purple-600 to-pink-600" />
                <CompactStatCard icon={Star} label="Avg Rating" value={stats.avgRating} change="Excellent" positive={true} color="from-green-600 to-emerald-600" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <div className="p-3 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Recent Quote Requests</h3>
                    <button onClick={() => setActiveTab('quotes')} className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1">
                      View All <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="divide-y divide-white/5">
                    {quoteRequests.slice(0, 5).map((quote) => (
                      <div key={quote.id} className="p-3 flex items-center justify-between hover:bg-white/5 transition">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            quote.status === 'pending' ? 'bg-yellow-500/20' :
                            quote.status === 'quoted' ? 'bg-blue-500/20' : 'bg-green-500/20'
                          }`}>
                            {quote.status === 'pending' ? <Clock className="w-3.5 h-3.5 text-yellow-400" /> :
                             quote.status === 'quoted' ? <CheckCircle className="w-3.5 h-3.5 text-blue-400" /> :
                             <Check className="w-3.5 h-3.5 text-green-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-xs truncate">{quote.service_type}</p>
                            <p className="text-[10px] text-gray-400">Qty: {quote.quantity} • {formatTime(quote.created_at)}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-white">{quote.quoted_price ? `$${quote.quoted_price}` : '-'}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                            quote.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            quote.status === 'quoted' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                          }`}>{quote.status}</span>
                        </div>
                      </div>
                    ))}
                    {quoteRequests.length === 0 && (
                      <div className="p-8 text-center">
                        <DollarSign className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">No quote requests yet</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <QuickActionCard icon={DollarSign} title="Respond to Quotes" description={`${stats.pendingQuotes} awaiting`} onClick={() => setActiveTab('quotes')} gradient="from-purple-600/10 to-pink-600/10" iconColor="text-purple-400" />
                  <QuickActionCard icon={MessageCircle} title="Check Messages" description={`${stats.unreadMessages} unread`} onClick={() => setActiveTab('messages')} gradient="from-blue-600/10 to-cyan-600/10" iconColor="text-blue-400" />
                  <QuickActionCard icon={ImageIcon} title="Update Portfolio" description="Add new work" onClick={() => setActiveTab('portfolio')} gradient="from-orange-600/10 to-red-600/10" iconColor="text-orange-400" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="h-[calc(100vh-3.5rem)] flex">
              <div className="w-72 border-r border-white/10 flex flex-col bg-black/20">
                <div className="p-3 border-b border-white/10">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {conversations.map(conv => (
                    <button key={conv.id} onClick={() => setSelectedConversation(conv)} className={`w-full p-3 border-b border-white/5 hover:bg-white/5 transition text-left ${selectedConversation?.id === conv.id ? 'bg-white/10' : ''}`}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                          {conv.type === 'quote' ? <DollarSign className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-semibold text-white truncate">
                              {conv.type === 'quote' ? `Quote: ${conv.user_name?.split(': ')[1] || 'Request'}` : `Client #${conv.id.slice(0, 8)}`}
                            </h4>
                            {conv.unread_count_printer > 0 && (
                              <span className="w-4 h-4 bg-purple-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center flex-shrink-0">{conv.unread_count_printer}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 truncate">{conv.last_message || 'No messages'}</p>
                          <span className="text-[9px] text-gray-500">{formatTime(conv.last_message_at)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                  {conversations.length === 0 && (
                    <div className="p-8 text-center">
                      <MessageCircle className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">No conversations yet</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-black/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                          {selectedConversation.type === 'quote' ? <DollarSign className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-white">
                            {selectedConversation.type === 'quote' ? `Quote: ${selectedConversation.user_name?.split(': ')[1] || 'Request'}` : `Client #${selectedConversation.id.slice(0, 8)}`}
                          </h3>
                          <p className="text-[10px] text-gray-400">
                            {selectedConversation.type === 'quote' ? `Status: ${selectedConversation.status}` : 'Active now'}
                          </p>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${msg.sender_id === user?.id ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-white/10'} rounded-2xl px-3 py-2`}>
                            <p className="text-white text-xs leading-relaxed">{msg.message}</p>
                            <span className="text-[9px] text-white/60 mt-1 block">{formatTime(msg.created_at)}</span>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 border-t border-white/10 bg-black/20">
                      <div className="flex gap-2">
                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                        <button onClick={sendMessage} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <MessageCircle className="w-12 h-12 text-gray-600 mb-3" />
                    <p className="text-gray-400 text-sm">Select a conversation</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="p-4">
              {supportNotifications.length === 0 && !selectedSupportChat ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No support requests</p>
                </div>
              ) : selectedSupportChat ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold">Customer Support Chat</h3>
                    <button
                      onClick={() => setSelectedSupportChat(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Messages */}
                  <div className="bg-black/30 rounded-lg p-4 h-96 overflow-y-auto space-y-3">
                    {supportMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.sender_type === 'user' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-xs rounded-lg p-3 text-sm ${
                            msg.sender_type === 'user'
                              ? 'bg-white/10 text-white'
                              : msg.sender_type === 'system'
                              ? 'bg-purple-600/20 text-purple-200'
                              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          }`}
                        >
                          <p>{msg.message}</p>
                          <p className="text-xs opacity-50 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={supportReply}
                      onChange={(e) => setSupportReply(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendSupportMessage()}
                      placeholder="Type your response..."
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      onClick={sendSupportMessage}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-white font-bold mb-4">Pending Support Requests</h3>
                  {supportNotifications.map(notif => (
                    <div
                      key={notif.id}
                      className="bg-white/5 border border-white/10 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-white font-semibold">{notif.title}</h4>
                          <p className="text-gray-400 text-sm">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notif.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSupportChatAction(notif.related_id, 'accept')}
                          className="flex-1 px-3 py-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg transition text-sm font-semibold"
                        >
                          Accept Chat
                        </button>
                        <button
                          onClick={() => handleSupportChatAction(notif.related_id, 'decline')}
                          className="flex-1 px-3 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition text-sm font-semibold"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {[
                  { value: 'all', label: 'All', count: quoteRequests.length },
                  { value: 'pending', label: 'Pending', count: quoteRequests.filter(q => q.status === 'pending').length },
                  { value: 'quoted', label: 'Quoted', count: quoteRequests.filter(q => q.status === 'quoted').length },
                  { value: 'accepted', label: 'Accepted', count: quoteRequests.filter(q => q.status === 'accepted').length }
                ].map(filter => (
                  <button key={filter.value} onClick={() => setQuoteFilter(filter.value)} className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${quoteFilter === filter.value ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredQuotes.map(quote => (
                  <motion.div key={quote.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-xl p-3 hover:border-purple-500/50 transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-sm mb-0.5 truncate">{quote.service_type}</h4>
                        <p className="text-xs text-gray-400">Qty: {quote.quantity}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${
                        quote.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        quote.status === 'quoted' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                      }`}>{quote.status}</span>
                    </div>

                    <p className="text-gray-300 text-xs mb-3 line-clamp-2 leading-relaxed">{quote.description}</p>

                    {quote.quoted_price && (
                      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-2 mb-3">
                        <p className="text-[10px] text-purple-400 mb-0.5">Your Quote</p>
                        <p className="text-lg font-black text-white">${quote.quoted_price}</p>
                        {quote.delivery_time && (
                          <p className="text-[10px] text-gray-400 mt-1">{quote.delivery_time}</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center text-[10px] text-gray-500 mb-3">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatTime(quote.created_at)}
                    </div>

                    {quote.status === 'pending' && (
                      <button onClick={() => {
                        setSelectedQuote(quote);
                        fetchQuoteMessages(quote.id);
                      }} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-2 rounded-lg font-semibold text-xs transition">
                        Send Quote
                      </button>
                    )}

                    {quote.status === 'quoted' && (
                      <button onClick={() => {
                        setSelectedQuote(quote);
                        fetchQuoteMessages(quote.id);
                      }} className="w-full bg-blue-600/20 text-blue-400 py-2 rounded-lg font-semibold text-xs hover:bg-blue-600/30 transition flex items-center justify-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" />
                        View Messages
                      </button>
                    )}

                    {quote.status === 'accepted' && (
                      <button onClick={() => {
                        setSelectedQuote(quote);
                        fetchQuoteMessages(quote.id);
                      }} className="w-full bg-green-600/20 text-green-400 py-2 rounded-lg font-semibold text-xs hover:bg-green-600/30 transition flex items-center justify-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" />
                        View Details
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>

              {filteredQuotes.length === 0 && (
                <div className="text-center py-16">
                  <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No {quoteFilter !== 'all' ? quoteFilter : ''} quotes found</p>
                </div>
              )}

              <AnimatePresence>
                {selectedQuote && (
                  <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedQuote(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" />
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-xl z-50 max-h-[90vh] overflow-hidden flex flex-col">
                      <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <h2 className="text-base font-bold text-white">Quote Conversation</h2>
                        <button onClick={() => setSelectedQuote(null)} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto flex flex-col">
                        {/* Client Request Summary */}
                        <div className="bg-white/5 border border-white/10 m-4 rounded-lg p-3 flex-shrink-0">
                          <p className="text-xs text-gray-400 mb-1">CLIENT REQUEST</p>
                          <p className="text-white font-semibold text-sm mb-1">{selectedQuote.service_type}</p>
                          <p className="text-xs text-gray-300 mb-2 leading-relaxed">{selectedQuote.description}</p>
                          <p className="text-xs text-gray-400">Quantity: {selectedQuote.quantity}</p>
                        </div>

                        {/* Messages Display */}
                        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                          {quoteMessages.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-sm text-gray-400">No messages yet. Send your quote below!</p>
                            </div>
                          ) : (
                            quoteMessages.map(msg => (
                              <div key={msg.id} className={`flex ${msg.sender_type === 'printer' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs ${
                                  msg.sender_type === 'printer'
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                                    : 'bg-white/10 border border-white/20'
                                } rounded-2xl px-3 py-2`}>
                                  <p className="text-white text-xs leading-relaxed">{msg.message}</p>
                                  <span className="text-[9px] text-white/60 mt-1 block">
                                    {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="border-t border-white/10 bg-black/20 p-4 space-y-3 flex-shrink-0">
                        {selectedQuote.status === 'pending' && (
                          <>
                            <div>
                              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Price (USD) *</label>
                              <div className="relative">
                                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input type="number" value={quoteResponse.price} onChange={(e) => setQuoteResponse({...quoteResponse, price: e.target.value})} placeholder="0.00" className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Delivery Time</label>
                              <input type="text" value={quoteResponse.delivery_time} onChange={(e) => setQuoteResponse({...quoteResponse, delivery_time: e.target.value})} placeholder="e.g., 5-7 business days" className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Additional Notes</label>
                              <textarea rows={2} value={quoteResponse.notes} onChange={(e) => setQuoteResponse({...quoteResponse, notes: e.target.value})} placeholder="Materials, process, shipping details..." className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
                            </div>

                            <button onClick={() => respondToQuote(selectedQuote.id)} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-2.5 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2">
                              <Send className="w-4 h-4" />
                              Send Quote
                            </button>
                          </>
                        )}

                        {selectedQuote.status === 'quoted' && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Message to Client</label>
                            <div className="flex gap-2">
                              <input type="text" value={newQuoteMessage} onChange={(e) => setNewQuoteMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendQuoteMessage(selectedQuote.id)} placeholder="Send a message..." className="flex-1 px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                              <button onClick={() => sendQuoteMessage(selectedQuote.id)} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition">
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {selectedQuote.status === 'accepted' && (
                          <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-3 text-center">
                            <p className="text-sm font-semibold text-green-400 flex items-center justify-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Quote Accepted by Client
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {[
                  { value: 'all', label: 'All', count: orders.length },
                  { value: 'pending', label: 'In Progress', count: orders.filter(o => o.order_status === 'in_progress' || !o.order_status).length },
                  { value: 'completed', label: 'Completed', count: orders.filter(o => o.order_status === 'completed').length }
                ].map(filter => (
                  <button key={filter.value} onClick={() => setOrderFilter(filter.value)} className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${orderFilter === filter.value ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {orders.map(order => (
                  <motion.div 
                    key={order.id} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="bg-white/5 border border-white/10 rounded-xl p-3 hover:border-blue-500/50 transition cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-sm mb-0.5 truncate">{order.service_type}</h4>
                        <p className="text-xs text-gray-400">Qty: {order.quantity}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${
                        order.order_status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>{order.order_status === 'completed' ? 'Completed' : 'In Progress'}</span>
                    </div>

                    <p className="text-gray-300 text-xs mb-3 line-clamp-2 leading-relaxed">{order.description}</p>

                    <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-lg p-2 mb-3">
                      <p className="text-[10px] text-blue-400 mb-0.5">Order Value</p>
                      <p className="text-lg font-black text-white">${order.quoted_price}</p>
                      {order.delivery_time && (
                        <p className="text-[10px] text-gray-400 mt-1">Delivery: {order.delivery_time}</p>
                      )}
                    </div>

                    <div className="flex items-center text-[10px] text-gray-500 mb-3">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatTime(order.created_at)}
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 py-2 rounded-lg font-semibold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Package className="w-3.5 h-3.5" />
                      View Details
                    </button>
                  </motion.div>
                ))}
              </div>

              {orders.length === 0 && (
                <div className="text-center py-16">
                  <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No active orders yet</p>
                  <p className="text-xs text-gray-500 mt-1">Accepted quotes will appear here</p>
                </div>
              )}

              <AnimatePresence>
                {selectedOrder && (
                  <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" />
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-xl z-50 max-h-[90vh] overflow-hidden flex flex-col">
                      <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <h2 className="text-base font-bold text-white">Order Details</h2>
                        <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-xs text-gray-400 mb-1">SERVICE</p>
                              <p className="text-white font-bold text-sm">{selectedOrder.service_type}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                              selectedOrder.order_status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                            }`}>{selectedOrder.order_status === 'completed' ? 'Completed' : 'In Progress'}</span>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed mb-3">{selectedOrder.description}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-[10px] text-gray-500">Quantity</p>
                              <p className="text-sm font-bold text-white">{selectedOrder.quantity}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500">Order Value</p>
                              <p className="text-sm font-bold text-white">${selectedOrder.quoted_price}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-lg p-3">
                          <p className="text-xs text-blue-400 font-semibold mb-2">Delivery Timeline</p>
                          <p className="text-sm text-white font-semibold">{selectedOrder.delivery_time || 'Not specified'}</p>
                        </div>

                        {selectedOrder.printer_notes && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                            <p className="text-xs text-gray-400 font-semibold mb-2">PRINTER NOTES</p>
                            <p className="text-xs text-gray-300">{selectedOrder.printer_notes}</p>
                          </div>
                        )}

                        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                          <p className="text-xs text-gray-400 font-semibold mb-2">TIMELINE</p>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-300">Created: {new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <span className="text-gray-300">Updated: {new Date(selectedOrder.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-white/10 bg-black/20 p-4 flex-shrink-0">
                        <button 
                          onClick={async () => {
                            if (selectedOrder.order_status === 'completed') {
                              alert('Order is already completed');
                              return;
                            }
                            const { error } = await supabase
                              .from('quote_requests')
                              .update({ order_status: 'completed', updated_at: new Date().toISOString() })
                              .eq('id', selectedOrder.id);
                            if (!error) {
                              await fetchOrders();
                              setSelectedOrder(null);
                              alert('Order marked as completed!');
                            }
                          }}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-4 py-2.5 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {selectedOrder.order_status === 'completed' ? 'Completed' : 'Mark as Completed'}
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-white">Portfolio Gallery</h3>
                  <p className="text-xs text-gray-400">{portfolioImages.length} items</p>
                </div>
                <button 
                  onClick={() => setSelectedPortfolioImage('upload')}
                  className="px-3 py-1.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Work
                </button>
              </div>

              {portfolioImages.length === 0 ? (
                <div className="text-center py-16 bg-white/5 border-2 border-dashed border-white/10 rounded-xl">
                  <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">No Portfolio Items Yet</h3>
                  <p className="text-xs text-gray-400 mb-4">Showcase your best work to attract clients</p>
                  <button 
                    onClick={() => setSelectedPortfolioImage('upload')}
                    className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition"
                  >
                    <Upload className="w-4 h-4" />
                    Upload First Image
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {portfolioImages.map((image) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group relative rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:border-orange-500/50 transition cursor-pointer"
                      onClick={() => setSelectedPortfolioImage(image)}
                    >
                      <div className="aspect-square bg-gradient-to-br from-orange-900/20 to-red-900/20 flex items-center justify-center relative overflow-hidden">
                        {image.image_url ? (
                          <img 
                            src={image.image_url} 
                            alt={image.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                          />
                        ) : (
                          <ImageIcon className="w-10 h-10 text-gray-600" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                          <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition" />
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="font-bold text-sm text-white truncate mb-1">{image.title || 'Untitled'}</h4>
                        <p className="text-[10px] text-gray-400 line-clamp-2 mb-2">{image.description || 'No description'}</p>
                        <p className="text-[9px] text-gray-500">{formatTime(image.created_at)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              <AnimatePresence>
                {selectedPortfolioImage && (
                  <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPortfolioImage(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40" />
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-xl z-50 max-h-[90vh] overflow-hidden flex flex-col">
                      
                      {selectedPortfolioImage === 'upload' ? (
                        <>
                          <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-base font-bold text-white">Add Work to Portfolio</h2>
                            <button onClick={() => setSelectedPortfolioImage(null)} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-300 mb-2">Project Title *</label>
                              <input 
                                type="text"
                                value={portfolioUpload.title}
                                onChange={(e) => setPortfolioUpload({...portfolioUpload, title: e.target.value})}
                                placeholder="e.g., Custom Business Cards"
                                className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-300 mb-2">Description</label>
                              <textarea 
                                rows={3}
                                value={portfolioUpload.description}
                                onChange={(e) => setPortfolioUpload({...portfolioUpload, description: e.target.value})}
                                placeholder="Describe the project, materials, process..."
                                className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-300 mb-2">Upload Image *</label>
                              <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center hover:border-orange-500/50 transition cursor-pointer">
                                <input 
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      setPortfolioUpload({...portfolioUpload, image: e.target.files[0]});
                                    }
                                  }}
                                  className="hidden"
                                  id="portfolio-upload"
                                />
                                <label htmlFor="portfolio-upload" className="cursor-pointer block">
                                  {portfolioUpload.image ? (
                                    <>
                                      <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
                                      <p className="text-xs text-green-400 font-semibold">{portfolioUpload.image.name}</p>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                      <p className="text-xs text-gray-400">Click to upload or drag and drop</p>
                                      <p className="text-[10px] text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                    </>
                                  )}
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-white/10 bg-black/20 p-4 flex-shrink-0 flex gap-2">
                            <button 
                              onClick={() => setSelectedPortfolioImage(null)}
                              className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-semibold text-sm transition"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={async () => {
                                if (!portfolioUpload.title.trim() || !portfolioUpload.image) {
                                  alert('Please add a title and image');
                                  return;
                                }

                                setPortfolioLoading(true);
                                try {
                                  // Upload image to Supabase storage
                                  const fileName = `${printer.id}/${Date.now()}-${portfolioUpload.image.name}`;
                                  console.log('Uploading to bucket: portfolio-images');
                                  console.log('File path:', fileName);
                                  
                                  const { data: uploadData, error: uploadError } = await supabase.storage
                                    .from('portfolio-images')
                                    .upload(fileName, portfolioUpload.image);

                                  console.log('Upload response:', { uploadData, uploadError });

                                  if (uploadError) {
                                    console.error('Upload error details:', uploadError);
                                    throw uploadError;
                                  }

                                  // Get public URL
                                  const { data: { publicUrl } } = supabase.storage
                                    .from('portfolio-images')
                                    .getPublicUrl(fileName);

                                  // Save portfolio record
                                  const { error: dbError } = await supabase
                                    .from('portfolio_images')
                                    .insert({
                                      printer_id: printer.id,
                                      title: portfolioUpload.title,
                                      description: portfolioUpload.description,
                                      image_url: publicUrl,
                                      storage_path: fileName
                                    });

                                  if (dbError) throw dbError;

                                  await fetchPortfolioImages();
                                  setPortfolioUpload({ title: '', description: '', image: null });
                                  setSelectedPortfolioImage(null);
                                  alert('Work added to portfolio!');
                                } catch (error) {
                                  console.error('Portfolio upload error:', error);
                                  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                                  alert(`Error uploading: ${errorMessage}`);
                                } finally {
                                  setPortfolioLoading(false);
                                }
                              }}
                              disabled={portfolioLoading}
                              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:opacity-50 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
                            >
                              {portfolioLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  Add to Portfolio
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-base font-bold text-white">Portfolio Item</h2>
                            <button onClick={() => setSelectedPortfolioImage(null)} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {selectedPortfolioImage?.image_url && (
                              <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                                <img 
                                  src={selectedPortfolioImage.image_url}
                                  alt={selectedPortfolioImage.title}
                                  className="w-full h-64 object-cover"
                                />
                              </div>
                            )}

                            <div>
                              <p className="text-xs text-gray-400 mb-1">TITLE</p>
                              <p className="text-sm font-bold text-white">{selectedPortfolioImage?.title}</p>
                            </div>

                            {selectedPortfolioImage?.description && (
                              <div>
                                <p className="text-xs text-gray-400 mb-1">DESCRIPTION</p>
                                <p className="text-xs text-gray-300 leading-relaxed">{selectedPortfolioImage.description}</p>
                              </div>
                            )}

                            <div>
                              <p className="text-xs text-gray-400 mb-1">CREATED</p>
                              <p className="text-xs text-gray-300">{new Date(selectedPortfolioImage?.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>

                          <div className="border-t border-white/10 bg-black/20 p-4 flex-shrink-0 flex gap-2">
                            <button 
                              onClick={() => setSelectedPortfolioImage(null)}
                              className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-semibold text-sm transition"
                            >
                              Close
                            </button>
                            <button 
                              onClick={async () => {
                                if (confirm('Delete this portfolio item?')) {
                                  try {
                                    const { error: deleteError } = await supabase.storage
                                      .from('portfolio-images')
                                      .remove([selectedPortfolioImage.storage_path]);

                                    if (deleteError) console.error('Storage error:', deleteError);

                                    const { error: dbError } = await supabase
                                      .from('portfolio_images')
                                      .delete()
                                      .eq('id', selectedPortfolioImage.id);

                                    if (dbError) throw dbError;

                                    await fetchPortfolioImages();
                                    setSelectedPortfolioImage(null);
                                    alert('Portfolio item deleted');
                                  } catch (error) {
                                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                                    alert(`Error deleting: ${errorMessage}`);
                                  }
                                }
                              }}
                              className="flex-1 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-4 max-w-3xl mx-auto">
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-3">Company Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">Company Name</label>
                      <input type="text" value={printer?.company_name} disabled className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">City</label>
                        <input type="text" value={printer?.city} disabled className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">Country</label>
                        <input type="text" value={printer?.country} disabled className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-3">Account Status</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Account Active</p>
                      <p className="text-xs text-gray-400">Your profile is visible</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CompactStatCard({ icon: Icon, label, value, change, positive, color }: any) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 hover:border-purple-500/50 transition">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-8 h-8 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${positive ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
          {change}
        </span>
      </div>
      <p className="text-xl font-black text-white mb-0.5">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function QuickActionCard({ icon: Icon, title, description, onClick, gradient, iconColor }: any) {
  return (
    <button onClick={onClick} className={`bg-gradient-to-br ${gradient} border border-white/10 rounded-xl p-3 text-left hover:scale-105 transition group w-full`}>
      <Icon className={`w-6 h-6 ${iconColor} mb-2 group-hover:scale-110 transition`} />
      <h4 className="text-white font-bold text-sm mb-0.5">{title}</h4>
      <p className="text-xs text-gray-400">{description}</p>
    </button>
  );
}

function NavButton({ icon: Icon, label, active, onClick, collapsed, badge = 0 }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg font-medium transition text-xs ${
        active ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'
      } ${collapsed ? 'justify-center' : ''}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{label}</span>
          {badge > 0 && (
            <span className="w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  );
}