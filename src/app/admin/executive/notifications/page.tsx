'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  MessageSquare,
  Send,
  Users,
  Clock,
  Search,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Filter,
} from 'lucide-react';
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  id: string;
  subject: string;
  content: string;
  type: 'announcement' | 'notification' | 'alert' | 'broadcast';
  recipients: string;
  sent_to: number;
  read_count: number;
  status: 'draft' | 'scheduled' | 'sent';
  created_at: string;
  sent_at?: string;
  created_by: string;
  priority: 'low' | 'normal' | 'high';
}

const NotificationsPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [newMessage, setNewMessage] = useState({
    subject: '',
    content: '',
    type: 'notification',
    recipients: 'all',
    priority: 'normal',
  });
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    fetchMessages();
    const unsubscribe = subscribeToChanges();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    filterMessagesList();
  }, [messages, searchQuery, filterType, filterStatus]);

  const fetchMessages = async () => {
    try {
      // Fetch notifications and support messages
      const [notificationsRes, supportRes] = await Promise.all([
        supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('support_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);

      if (notificationsRes.error) throw notificationsRes.error;

      // Transform support messages to notification format
      const notificationMessages = (notificationsRes.data || []).map((m: any) => ({
        ...m,
        type: m.type || 'notification',
      }));

      const supportMessages = (supportRes.data || []).map((msg: any) => ({
        id: msg.id,
        subject: 'Support Message',
        content: msg.content || msg.message,
        type: 'notification' as const,
        recipients: 'specific',
        sent_to: 1,
        read_count: msg.read ? 1 : 0,
        status: 'sent' as const,
        created_at: msg.created_at,
        sent_at: msg.created_at,
        created_by: msg.created_by || 'System',
        priority: 'normal' as const,
      }));

      setMessages([...notificationMessages, ...supportMessages]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const notificationsChannel = supabase
      .channel('executive-notifications-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchMessages();
      })
      .subscribe();

    const supportChannel = supabase
      .channel('executive-support-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(supportChannel);
    };
  };

  const filterMessagesList = () => {
    let filtered = messages;

    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.content?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((m) => m.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((m) => m.status === filterStatus);
    }

    setFilteredMessages(filtered);
  };

  const sendMessage = async () => {
    if (!newMessage.subject || !newMessage.content) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('You must be authenticated to send messages');
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: user.id,
          title: newMessage.subject,
          message: newMessage.content,
          type: newMessage.type,
          actor_name: 'Executive',
          link: null,
          read: false,
        }]);

      if (error) throw error;
      setNewMessage({
        subject: '',
        content: '',
        type: 'notification',
        recipients: 'all',
        priority: 'normal',
      });
      setShowModal(false);
      fetchMessages();
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as any).message);
      } else if (error) {
        errorMessage = JSON.stringify(error);
      }
      console.error('Error sending message:', errorMessage, error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const stats = {
    total: messages.length,
    sent: messages.filter((m) => m.status === 'sent').length,
    draft: messages.filter((m) => m.status === 'draft').length,
    totalReads: messages.reduce((sum, m) => sum + m.read_count, 0),
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-900/30 text-red-300 border-red-500/30';
      case 'normal':
        return 'bg-blue-900/30 text-blue-300 border-blue-500/30';
      case 'low':
        return 'bg-green-900/30 text-green-300 border-green-500/30';
      default:
        return 'bg-slate-900/30 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <AdminDashboardLayout userRole="executive">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Notifications & Messages</h2>
            <p className="text-sm text-gray-400 mt-1">
              Send and manage platform-wide messages
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
          >
            <Send size={18} />
            Send Message
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <p className="text-xs text-gray-400 uppercase font-semibold">Total Messages</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <p className="text-xs text-gray-400 uppercase font-semibold">Sent</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{stats.sent}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <p className="text-xs text-gray-400 uppercase font-semibold">Drafts</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.draft}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <p className="text-xs text-gray-400 uppercase font-semibold">Total Reads</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">{stats.totalReads}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 bg-slate-800/30 border border-slate-700 rounded-lg p-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-gray-500 text-sm"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
          >
            <option value="all">All Types</option>
            <option value="announcement">Announcement</option>
            <option value="notification">Notification</option>
            <option value="alert">Alert</option>
            <option value="broadcast">Broadcast</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>

        {/* Messages List */}
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="h-12 w-12 mx-auto mb-4 rounded-full border-4 border-slate-700 border-t-cyan-500 animate-spin" />
              <p className="text-gray-400">Loading messages...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className="rounded-lg border border-slate-700 bg-slate-800/30 p-4 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-slate-700/50">
                        <MessageSquare size={18} className="text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{message.subject}</h3>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{message.content}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3 text-xs">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded border ${getPriorityColor(
                        message.priority
                      )}`}>
                        {message.priority.toUpperCase()}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Users size={14} />
                        {message.recipients}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Clock size={14} />
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-1 rounded font-semibold ${
                        message.status === 'sent'
                          ? 'bg-green-900/30 text-green-300'
                          : message.status === 'draft'
                          ? 'bg-yellow-900/30 text-yellow-300'
                          : 'bg-blue-900/30 text-blue-300'
                      }`}>
                        {message.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>Sent to: {message.sent_to}</span>
                      <span>Read by: {message.read_count}</span>
                      {message.sent_to > 0 && (
                        <div className="w-24 bg-slate-700/50 rounded-full h-1.5">
                          <div
                            className="bg-cyan-500 h-1.5 rounded-full"
                            style={{
                              width: `${(message.read_count / message.sent_to) * 100}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="p-2 rounded hover:bg-red-900/20 text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredMessages.length === 0 && (
              <div className="text-center py-12 rounded-lg border border-slate-700 bg-slate-800/30">
                <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No messages found</p>
              </div>
            )}
          </div>
        )}

        {/* Send Message Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-2xl w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Send Message</h3>

              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  placeholder="Subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-gray-500 text-sm"
                />

                <textarea
                  placeholder="Message content"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-gray-500 text-sm"
                />

                <div className="grid grid-cols-3 gap-4">
                  <select
                    value={newMessage.type}
                    onChange={(e) => setNewMessage({ ...newMessage, type: e.target.value as any })}
                    className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
                  >
                    <option value="announcement">Announcement</option>
                    <option value="notification">Notification</option>
                    <option value="alert">Alert</option>
                    <option value="broadcast">Broadcast</option>
                  </select>

                  <select
                    value={newMessage.recipients}
                    onChange={(e) => setNewMessage({ ...newMessage, recipients: e.target.value })}
                    className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
                  >
                    <option value="all">All Users</option>
                    <option value="agents">Agents</option>
                    <option value="team_leads">Team Leads</option>
                    <option value="executives">Executives</option>
                  </select>

                  <select
                    value={newMessage.priority}
                    onChange={(e) => setNewMessage({ ...newMessage, priority: e.target.value as any })}
                    className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
                  >
                    <option value="low">Low Priority</option>
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700/50 text-white hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={sendMessage}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                >
                  <Send size={16} />
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default NotificationsPage;
