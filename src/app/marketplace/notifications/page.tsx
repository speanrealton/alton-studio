// src/app/marketplace/notifications/page.tsx ← CREATE THIS
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Heart, MessageCircle, UserPlus, Share2, ArrowLeft, User, Video } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadNotifications();
    
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // Real-time subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    setNotifications(data || []);
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = async () => {
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-8 h-8 text-red-500 fill-red-500" />;
      case 'comment':
        return <MessageCircle className="w-8 h-8 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-8 h-8 text-purple-500" />;
      case 'share':
        return <Share2 className="w-8 h-8 text-green-500" />;
      default:
        return <Heart className="w-8 h-8 text-gray-500" />;
    }
  };

  const getNotificationText = (notification: any) => {
    switch (notification.type) {
      case 'like':
        return 'liked your video';
      case 'comment':
        return `commented: "${notification.comment_text}"`;
      case 'follow':
        return 'started following you';
      case 'share':
        return 'shared your video';
      default:
        return 'interacted with your content';
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-4xl font-black animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-4">
        <MessageCircle className="w-20 h-20 text-purple-500" />
        <h1 className="text-4xl font-black text-center">Sign In to See Notifications</h1>
        <p className="text-gray-400 text-center">Log in to get notified about likes, comments, and follows</p>
        <Link href="/auth">
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-full font-bold">
            Log In
          </button>
        </Link>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/95 backdrop-blur-lg sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/marketplace">
                <ArrowLeft className="w-6 h-6 text-gray-400 hover:text-white" />
              </Link>
              <div>
                <h1 className="text-2xl font-black">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-purple-400">{unreadCount} unread</p>
                )}
              </div>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-purple-400 font-bold hover:text-purple-300"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-2xl font-black text-gray-400 mb-2">No notifications yet</p>
            <p className="text-gray-500">When someone interacts with your content, you'll see it here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => !notification.read && markAsRead(notification.id)}
                className={`flex items-start gap-4 p-4 rounded-xl transition cursor-pointer ${
                  notification.read 
                    ? 'bg-white/5 hover:bg-white/10' 
                    : 'bg-purple-900/20 border border-purple-500/30 hover:bg-purple-900/30'
                }`}
              >
                {/* Actor Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden">
                    {notification.actor_profile_picture ? (
                      <img 
                        src={notification.actor_profile_picture} 
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <Link 
                          href={`/marketplace/user/${notification.actor_id}`}
                          className="font-bold hover:underline"
                        >
                          @{notification.actor_username}
                        </Link>
                        {' '}
                        <span className="text-gray-400">{getNotificationText(notification)}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getTimeAgo(notification.created_at)}
                      </p>
                    </div>

                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                </div>

                {/* Video Thumbnail (if applicable) */}
                {notification.video_id && notification.type !== 'follow' && (
                  <Link href="/marketplace" className="flex-shrink-0">
                    <div className="w-12 h-16 bg-zinc-900 rounded-lg overflow-hidden">
                      <Video className="w-full h-full p-3 text-gray-600" />
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}