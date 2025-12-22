'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Heart, MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Toast = {
  id: string;
  type: 'like' | 'comment' | string;
  message: string;
  actor_name?: string;
  actor_image?: string;
};

export default function NotificationToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setCurrentUser(user);

      if (!user) return;

      // Listen for new notifications in real-time
      const channel = supabase
        .channel(`notifications-toast-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (!mounted) return;
            
            const notification = payload.new as any;
            if (!notification || !notification.id) return;
            
            const toastId = notification.id;
            
            // Create toast with notification data
            setToasts(prev => [...prev, {
              id: toastId,
              type: notification.type,
              message: notification.message || 'You have a new notification',
              actor_name: notification.actor_name || 'Someone',
              actor_image: notification.actor_image
            }]);

            // Auto-remove after 5 seconds
            const timer = setTimeout(() => {
              setToasts(prev => prev.filter(t => t.id !== toastId));
            }, 5000);

            return () => clearTimeout(timer);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    getUser();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 pointer-events-none max-w-md">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4 shadow-2xl pointer-events-auto"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {toast.actor_image ? (
                  <img 
                    src={toast.actor_image} 
                    alt={toast.actor_name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    {toast.type === 'like' ? (
                      <Heart className="w-5 h-5 text-white" />
                    ) : (
                      <MessageCircle className="w-5 h-5 text-white" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">
                  {toast.type === 'like' ? '❤️ Video Liked!' : '💬 New Comment!'}
                </p>
                <p className="text-white/90 text-xs line-clamp-2">
                  {toast.message}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
