// src/app/notifications/page.tsx — REAL-TIME NOTIFICATIONS
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { 
  Bell, Users, MessageCircle, Heart, UserPlus, ArrowLeft,
  Check, CheckCheck, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthButton from '@/components/AuthButton';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  actor_name?: string;
  actor_image?: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      setUserId(user.id);

      const { data } = await supabase
        .from('notifications')
        .select('id, user_id, type, title, message, actor_name, actor_image, link, read, created_at, video_id, comment_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Fetched notifications:', data); // Debug log
      setNotifications(data || []);
      setLoading(false);
    };

    fetchNotifications();

    // Real-time subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, userId]);

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'circle_join': return <Users className="w-5 h-5 text-purple-600" />;
      case 'post_like': return <Heart className="w-5 h-5 text-red-600" />;
      case 'post_comment': return <MessageCircle className="w-5 h-5 text-blue-600" />;
      case 'follow': return <UserPlus className="w-5 h-5 text-green-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* Header */}
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6">
        <Link href="/community" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium text-sm">Back</span>
        </Link>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="ghost" size="sm">
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
          <AuthButton />
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Notifications
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">No notifications yet</p>
            <p className="text-sm text-gray-500">We'll notify you when something happens</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition ${
                    !notification.read ? 'border-l-4 border-l-purple-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                      !notification.read ? 'bg-purple-100 dark:bg-purple-900/30 ring-2 ring-purple-600' : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {notification.actor_image ? (
                        <img 
                          src={notification.actor_image} 
                          alt={notification.actor_name || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getIcon(notification.type)
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h3 className={`font-semibold text-sm ${
                            !notification.read 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {notification.title}
                          </h3>
                          {notification.actor_name && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              by <span className="font-medium">{notification.actor_name}</span>
                            </p>
                          )}
                        </div>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>

                        <div className="flex items-center gap-2">
                          {notification.link && (
                            <Link href={notification.link}>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs h-7 text-purple-600 hover:text-purple-700"
                              >
                                View
                              </Button>
                            </Link>
                          )}
                          
                          {!notification.read && (
                            <Button
                              onClick={() => markAsRead(notification.id)}
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Mark read
                            </Button>
                          )}

                          <Button
                            onClick={() => deleteNotification(notification.id)}
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}