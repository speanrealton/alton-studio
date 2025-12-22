'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function NotificationListener() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const load = async () => {
        try {
          const { data } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('read', false);
          if (!mounted) return;
          const unread = data ? data.length : 0;
          setCount(unread);
          // expose globally and dispatch event for consumers
          try { window.__ALTON_NOTIF_COUNT__ = unread; } catch (e) {}
          window.dispatchEvent(new CustomEvent('alton:notifications', { detail: { unread } }));
        } catch (err) {
          console.error('Error loading notifications:', err);
        }
      };

      await load();

      const channel = supabase
        .channel('global-notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          load();
        })
        .subscribe();

      return () => {
        mounted = false;
        try { supabase.removeChannel(channel); } catch (e) {}
      };
    };

    init();
  }, []);

  // Render a minimal visually-hidden element that other scripts can query
  return (
    <div aria-hidden className="sr-only" data-alton-notifications={count} />
  );
}
