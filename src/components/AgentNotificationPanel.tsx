import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell } from 'lucide-react';
import AgentChatPanel from './AgentChatPanel';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_id: string;
  read: boolean;
  created_at: string;
}

interface UserProfile {
  email: string;
  name?: string;
}

export function AgentNotificationPanel() {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };
    getUser();
  }, []);

  // Load notifications for this agent
  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      setIsLoading(true);
      try {
        // Get pending support requests (not yet assigned to another agent)
        const { data: sessions } = await supabase
          .from('support_chat_sessions')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (sessions) {
          // Fetch user profiles for each session
          const profiles: Record<string, UserProfile> = {};
          
          for (const session of sessions) {
            const { data: authUser } = await supabase.auth.admin.getUserById(session.user_id);
            profiles[session.user_id] = {
              email: authUser?.user?.email || 'Unknown',
              name: authUser?.user?.user_metadata?.name,
            };
          }

          setUserProfiles(profiles);

          // Convert sessions to notifications
          const notifs: Notification[] = sessions.map((session) => ({
            id: session.id,
            user_id: session.user_id,
            type: 'support_request',
            title: 'New Support Request',
            message: `From ${profiles[session.user_id]?.name || profiles[session.user_id]?.email}`,
            related_id: session.id,
            read: false,
            created_at: session.created_at,
          }));

          setNotifications(notifs);
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();

    // Subscribe to new chat sessions
    const subscription = supabase
      .channel('new-support-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_chat_sessions',
          filter: 'status=eq.pending',
        },
        async (payload) => {
          const session = payload.new;
          
          // Fetch user profile
          const { data: authUser } = await supabase.auth.admin.getUserById(session.user_id);
          const profile: UserProfile = {
            email: authUser?.user?.email || 'Unknown',
            name: authUser?.user?.user_metadata?.name,
          };

          setUserProfiles((prev) => ({
            ...prev,
            [session.user_id]: profile,
          }));

          const newNotif: Notification = {
            id: session.id,
            user_id: session.user_id,
            type: 'support_request',
            title: 'New Support Request',
            message: `From ${profile.name || profile.email}`,
            related_id: session.id,
            read: false,
            created_at: session.created_at,
          };

          setNotifications((prev) => [newNotif, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const acceptRequest = async (sessionId: string) => {
    if (!user) return;

    try {
      // Update session to assign to this agent
      await supabase
        .from('support_chat_sessions')
        .update({
          assigned_agent_id: user.id,
          status: 'active',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      // Remove from notifications
      setNotifications((prev) => prev.filter((n) => n.related_id !== sessionId));
      
      // Open the chat
      setSelectedSession(sessionId);
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const declineRequest = async (sessionId: string) => {
    try {
      // Mark session as declined (will be shown to other agents)
      await supabase
        .from('support_chat_sessions')
        .update({ status: 'declined' })
        .eq('id', sessionId);

      // Remove from notifications
      setNotifications((prev) => prev.filter((n) => n.related_id !== sessionId));
    } catch (error) {
      console.error('Failed to decline request:', error);
    }
  };

  // If a session is selected, show the chat panel
  if (selectedSession) {
    return (
      <AgentChatPanel
        sessionId={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-amber-500 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bell size={20} />
          <h3 className="font-semibold">
            Support Requests ({notifications.length})
          </h3>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading requests...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No pending support requests
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-gray-50 border border-gray-200 rounded p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{notif.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {userProfiles[notif.user_id]?.email}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => acceptRequest(notif.related_id)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium py-1 px-2 rounded transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => declineRequest(notif.related_id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium py-1 px-2 rounded transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
