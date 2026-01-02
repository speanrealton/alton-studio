'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AgentNotificationPanel } from '@/components/AgentNotificationPanel';
import { LogOut, Activity } from 'lucide-react';

interface AgentProfile {
  name: string;
  email: string;
  status: string;
  chats_resolved: number;
  assigned_chats: number;
  customer_satisfaction: number;
}

export default function AgentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is an agent
  useEffect(() => {
    const checkAgentAccess = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        // Check if user has agent role
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', currentUser.id)
          .single();

        if (profileError || !profile) {
          setError('Access denied: Not an agent');
          router.push('/');
          return;
        }

        if (profile.role !== 'agent' && profile.role !== 'admin') {
          setError('Access denied: Only agents can access this dashboard');
          router.push('/');
          return;
        }

        // Load agent profile
        const { data: agent } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (agent) {
          setAgentProfile({
            name: agent.name || 'Agent',
            email: agent.email || currentUser.email || '',
            status: agent.status,
            chats_resolved: agent.chats_resolved || 0,
            assigned_chats: agent.assigned_chats || 0,
            customer_satisfaction: agent.customer_satisfaction || 0,
          });
        } else {
          setAgentProfile({
            name: 'Agent',
            email: currentUser.email || '',
            status: 'available',
            chats_resolved: 0,
            assigned_chats: 0,
            customer_satisfaction: 0,
          });
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error checking agent access:', err);
        setError('Error loading dashboard');
        setIsLoading(false);
      }
    };

    checkAgentAccess();
  }, [user, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-white">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Agent Dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-1">Welcome, {agentProfile?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Status Card */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <p className="text-2xl font-bold text-white mt-2 capitalize">
                  {agentProfile?.status}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  agentProfile?.status === 'available'
                    ? 'bg-green-500/20'
                    : 'bg-amber-500/20'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    agentProfile?.status === 'available'
                      ? 'bg-green-500'
                      : 'bg-amber-500'
                  }`}
                ></div>
              </div>
            </div>
          </div>

          {/* Active Chats Card */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
            <p className="text-gray-400 text-sm">Active Chats</p>
            <p className="text-3xl font-bold text-white mt-2">
              {agentProfile?.assigned_chats || 0}
            </p>
          </div>

          {/* Resolved Chats Card */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
            <p className="text-gray-400 text-sm">Resolved Chats</p>
            <p className="text-3xl font-bold text-white mt-2">
              {agentProfile?.chats_resolved}
            </p>
          </div>

          {/* Satisfaction Card */}
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
            <p className="text-gray-400 text-sm">Avg. Rating</p>
            <p className="text-3xl font-bold text-white mt-2">
              {agentProfile?.customer_satisfaction
                ? agentProfile.customer_satisfaction.toFixed(1)
                : 'N/A'}
              ⭐
            </p>
          </div>
        </div>

        {/* Support Requests Section */}
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Activity size={24} className="text-blue-400" />
            <h2 className="text-xl font-bold">Support Requests</h2>
          </div>
          
          <p className="text-gray-400 text-sm mb-4">
            Pending support requests appear below. Click "Accept" to start chatting with the customer.
          </p>

          {/* Notification Panel - Main Component */}
          <div className="mt-4">
            <AgentNotificationPanel />
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
          <h3 className="font-semibold text-blue-400 mb-2">💡 How it Works</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>✅ Support requests will appear in the panel above</li>
            <li>✅ Click "Accept" to start a chat with the customer</li>
            <li>✅ Your chat panel will open automatically</li>
            <li>✅ Click "Close" to end the conversation</li>
            <li>✅ Customer satisfaction ratings help you improve</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
