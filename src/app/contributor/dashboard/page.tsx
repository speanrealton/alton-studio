// src/app/contributor/dashboard/page.tsx — FIXED REAL-TIME UPDATES
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { 
  Upload, Download, Heart, Eye, TrendingUp, DollarSign, 
  FileText, BarChart3, Settings, LogOut, Sparkles, 
  Plus, MoreHorizontal, Edit, Trash2, ExternalLink,
  ArrowUpRight, Users, Star, Activity, Zap, Target, Award,
  Filter, Search, Grid, List, RefreshCw, Bell, ChevronRight,
  Moon, Sun, Mail, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Contributor = {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  portfolio_url: string | null;
  total_uploads: number;
  total_downloads: number;
  total_likes: number;
  total_views: number;
  total_earnings: number;
  status: string;
  approved_date: string;
};

type Design = {
  id: string;
  slug: string;
  title: string;
  preview_image_url: string;
  file_type: string;
  download_count: number;
  like_count: number;
  view_count: number;
  created_at: string;
  status: string;
  category: string;
  tags: string[];
};

export default function ContributorDashboard() {
  const router = useRouter();
  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'uploads' | 'analytics'>('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'downloads'>('recent');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    checkContributorStatus();
  }, []);

  useEffect(() => {
    if (contributor) {
      const cleanup = subscribeToRealtimeUpdates();
      return cleanup;
    }
  }, [contributor?.id]);

  const checkContributorStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth?redirect=/contributor/dashboard');
        return;
      }

      const { data: contributorData, error } = await supabase
        .from('contributors')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single();

      if (error || !contributorData) {
        router.push('/contributor/apply');
        return;
      }

      setContributor(contributorData);
      await fetchDesigns(contributorData.id);
      setLoading(false);
    } catch (err) {
      console.error('Error checking contributor status:', err);
      router.push('/contributor/apply');
    }
  };

  const fetchDesigns = async (contributorId: string) => {
    // First get the contributor's user_id
    const { data: contributorData } = await supabase
      .from('contributors')
      .select('user_id')
      .eq('id', contributorId)
      .single();

    if (!contributorData) {
      console.error('Contributor not found');
      return;
    }

    // Fetch designs using user_id instead of contributor_id
    const { data: designsData, error } = await supabase
      .from('marketplace_designs')
      .select('*')
      .eq('user_id', contributorData.user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching designs:', error);
      return;
    }

    if (designsData) {
      console.log('Fetched designs:', designsData.length);
      setDesigns(designsData);
      updateContributorStatsLocally(designsData);
    }
  };

  const updateContributorStatsLocally = (designsData: Design[]) => {
    const totalDownloads = designsData.reduce((sum, d) => sum + d.download_count, 0);
    const totalLikes = designsData.reduce((sum, d) => sum + d.like_count, 0);
    const totalViews = designsData.reduce((sum, d) => sum + d.view_count, 0);

    setContributor(prev => prev ? { 
      ...prev, 
      total_uploads: designsData.length,
      total_downloads: totalDownloads,
      total_likes: totalLikes,
      total_views: totalViews
    } : null);
  };

  const subscribeToRealtimeUpdates = () => {
    if (!contributor) return () => {};

    console.log('Setting up real-time subscriptions for contributor:', contributor.id);
    setRealtimeStatus('connecting');

    // Subscribe to designs changes - filter by user_id, not contributor_id
    const designsChannel = supabase
      .channel(`contributor_designs_${contributor.id}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_designs',
          filter: `user_id=eq.${contributor.user_id}`
        },
        (payload) => {
          console.log('✅ Design change detected:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT') {
            const newDesign = payload.new as Design;
            console.log('New design added:', newDesign.title);
            
            setDesigns(prev => {
              const updated = [newDesign, ...prev];
              updateContributorStatsLocally(updated);
              return updated;
            });
          } 
          else if (payload.eventType === 'UPDATE') {
            const updatedDesign = payload.new as Design;
            console.log('Design updated:', updatedDesign.title, {
              views: updatedDesign.view_count,
              likes: updatedDesign.like_count,
              downloads: updatedDesign.download_count
            });
            
            setDesigns(prev => {
              const updated = prev.map(d => 
                d.id === updatedDesign.id ? updatedDesign : d
              );
              updateContributorStatsLocally(updated);
              return updated;
            });
          } 
          else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            console.log('Design deleted:', deletedId);
            
            setDesigns(prev => {
              const updated = prev.filter(d => d.id !== deletedId);
              updateContributorStatsLocally(updated);
              return updated;
            });
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Designs subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
          console.log('✅ Successfully subscribed to design changes');
        } else if (status === 'CLOSED') {
          setRealtimeStatus('disconnected');
          console.log('❌ Subscription closed');
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('disconnected');
          if (err) {
            console.error('❌ Channel error:', err);
          } else {
            console.error('❌ Channel error occurred');
          }
        }
      });

    // Subscribe to contributor stats changes (for earnings updates, etc.)
    const contributorChannel = supabase
      .channel(`contributor_stats_${contributor.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contributors',
          filter: `id=eq.${contributor.id}`
        },
        (payload) => {
          console.log('✅ Contributor stats updated:', payload);
          const updatedContributor = payload.new as Contributor;
          setContributor(updatedContributor);
        }
      )
      .subscribe((status) => {
        console.log('Contributor subscription status:', status);
      });

    // Cleanup function
    return () => {
      console.log('Cleaning up subscriptions');
      supabase.removeChannel(designsChannel);
      supabase.removeChannel(contributorChannel);
    };
  };

  const handleRefresh = async () => {
    if (!contributor) return;
    setIsRefreshing(true);
    await fetchDesigns(contributor.id);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDeleteDesign = async (designId: string) => {
    if (!confirm('Are you sure you want to delete this design?')) return;
    
    const { error } = await supabase
      .from('marketplace_designs')
      .delete()
      .eq('id', designId);
    
    if (error) {
      console.error('Error deleting design:', error);
      alert('Failed to delete design');
    }
    // Real-time subscription will handle UI update automatically
  };

  const filteredDesigns = designs.filter(design => {
    const matchesSearch = design.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         design.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || design.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'popular') return b.view_count - a.view_count;
    if (sortBy === 'downloads') return b.download_count - a.download_count;
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  const stats = [
    { icon: FileText, label: 'Designs', value: contributor?.total_uploads || 0, change: '+12%', trend: 'up', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { icon: Download, label: 'Downloads', value: contributor?.total_downloads || 0, change: '+8%', trend: 'up', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
    { icon: Eye, label: 'Views', value: contributor?.total_views || 0, change: '+24%', trend: 'up', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
    { icon: Heart, label: 'Likes', value: contributor?.total_likes || 0, change: '+15%', trend: 'up', color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-950/30' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      
      {/* Compact Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 overflow-y-auto z-50">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-6 px-2">
          <Image src="/logo2.svg" alt="Alton Stock" width={48} height={48} />
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">Alton Stock</p>
            <p className="text-[10px] text-gray-500">Contributor</p>
          </div>
        </Link>

        {/* Real-time Status Indicator */}
        <div className={`mb-4 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
          realtimeStatus === 'connected' ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
          realtimeStatus === 'connecting' ? 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400' :
          'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            realtimeStatus === 'connected' ? 'bg-green-500 animate-pulse' :
            realtimeStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            'bg-red-500'
          }`} />
          {realtimeStatus === 'connected' ? 'Live Updates Active' :
           realtimeStatus === 'connecting' ? 'Connecting...' :
           'Disconnected'}
        </div>

        {/* Compact Profile Card */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-3 mb-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{contributor?.display_name}</p>
              <p className="text-[10px] opacity-75">Approved</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center">
            <div className="bg-white/10 rounded-lg p-1.5 backdrop-blur-sm">
              <p className="text-sm font-bold">{contributor?.total_uploads || 0}</p>
              <p className="text-[9px] opacity-75">Files</p>
            </div>
            <div className="bg-white/10 rounded-lg p-1.5 backdrop-blur-sm">
              <p className="text-sm font-bold">{contributor?.total_downloads || 0}</p>
              <p className="text-[9px] opacity-75">DLs</p>
            </div>
            <div className="bg-white/10 rounded-lg p-1.5 backdrop-blur-sm">
              <p className="text-sm font-bold">{contributor?.total_likes || 0}</p>
              <p className="text-[9px] opacity-75">Likes</p>
            </div>
          </div>
        </div>

        {/* Compact Navigation */}
        <nav className="space-y-0.5 mb-6">
          {[
            { id: 'overview', icon: BarChart3, label: 'Overview' },
            { id: 'uploads', icon: Upload, label: 'My Designs', badge: contributor?.total_uploads },
            { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  activeTab === item.id ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <Link href="/contributor/settings">
            <div className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </div>
          </Link>
        </nav>

        {/* Compact Resources */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 mb-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase mb-2 px-2">Resources</p>
          <div className="space-y-0.5 text-xs">
            <a href="#" className="block px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-purple-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">Guidelines</a>
            <a href="#" className="block px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-purple-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">Trends</a>
            <a href="#" className="block px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-purple-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">Support</a>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-6">
        
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-0.5">
              Welcome, {contributor?.display_name} 👋
            </h1>
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              Real-time updates • {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefreshing}>
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={toggleTheme} variant="outline" size="sm">
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </Button>
            <Link href="/alton-designs/upload">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Upload
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Compact Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              className={`${stat.bg} rounded-xl border border-gray-200 dark:border-gray-800 p-4`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  stat.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stat.value.toLocaleString()}</h3>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Content Tabs */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              
              {/* Getting Started - Compact */}
              {designs.length === 0 && (
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-black mb-1">Get Started 🚀</h2>
                      <p className="text-sm text-white/80 mb-4">Upload your first designs and start earning</p>
                      <Link href="/alton-designs/upload">
                        <Button className="bg-white text-purple-600 hover:bg-gray-100 text-sm">
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          Upload Design
                        </Button>
                      </Link>
                    </div>
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Image src="/logo2.svg" alt="Alton Stock" width={64} height={64} />
                    </div>
                  </div>
                </div>
              )}

              {/* Two Columns */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Recent Designs */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-purple-600" />
                      Recent Designs
                    </h2>
                    <button onClick={() => setActiveTab('uploads')} className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-0.5">
                      View All <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  {designs.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">No designs yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {designs.slice(0, 3).map((design) => (
                        <Link key={design.id} href={`/alton-designs/${design.slug}`}>
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition group"
                          >
                            <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                              <Image src={design.preview_image_url} alt={design.title} fill className="object-cover" unoptimized />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{design.title}</p>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                <span className="flex items-center gap-0.5"><Download className="w-2.5 h-2.5" />{design.download_count}</span>
                                <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" />{design.like_count}</span>
                              </div>
                            </div>
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Performers */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      Top Performers
                    </h2>
                  </div>

                  {designs.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">No data yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {designs.sort((a, b) => b.download_count - a.download_count).slice(0, 3).map((design, i) => (
                        <motion.div
                          key={design.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-2"
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? 'bg-yellow-100 text-yellow-700' :
                            i === 1 ? 'bg-gray-100 text-gray-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>{i + 1}</div>
                          <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                            <Image src={design.preview_image_url} alt={design.title} fill className="object-cover" unoptimized />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{design.title}</p>
                            <p className="text-[10px] text-gray-500">{design.download_count} downloads</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Uploads Tab */}
          {activeTab === 'uploads' && (
            <motion.div
              key="uploads"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
            >
              {/* Compact Toolbar */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex-1 relative max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {/* Filters */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="all">All</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="recent">Recent</option>
                    <option value="popular">Popular</option>
                    <option value="downloads">Downloads</option>
                  </select>

                  {/* View Toggle */}
                  <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Designs Display */}
              {filteredDesigns.length === 0 ? (
                <div className="text-center py-16">
                  <Upload className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">No designs found</p>
                  <p className="text-xs text-gray-500 mb-4">
                    {searchQuery ? 'Try adjusting your search' : 'Upload your first design'}
                  </p>
                  {!searchQuery && (
                    <Link href="/alton-designs/upload">
                      <Button size="sm">Upload Design</Button>
                    </Link>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
                  {filteredDesigns.map((design) => (
                    <motion.div
                      key={design.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -2 }}
                      className="group relative"
                    >
                      <Link href={`/alton-designs/${design.slug}`}>
                        <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-purple-300 transition">
                          <Image src={design.preview_image_url} alt={design.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
                            <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                              <p className="text-xs font-bold truncate mb-1">{design.title}</p>
                              <div className="flex items-center gap-2 text-[10px]">
                                <span className="flex items-center gap-0.5"><Download className="w-2.5 h-2.5" />{design.download_count}</span>
                                <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" />{design.like_count}</span>
                              </div>
                            </div>
                          </div>
                          <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold backdrop-blur-sm ${
                            design.status === 'published' ? 'bg-green-500/80 text-white' : 'bg-yellow-500/80 text-white'
                          }`}>{design.status}</span>
                        </div>
                      </Link>
                      <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition flex gap-1">
                        <button
                          onClick={(e) => { e.preventDefault(); handleDeleteDesign(design.id); }}
                          className="p-1 bg-white dark:bg-gray-800 rounded shadow hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-2.5 h-2.5 text-red-600" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredDesigns.map((design) => (
                    <motion.div
                      key={design.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                    >
                      <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                        <Image src={design.preview_image_url} alt={design.title} fill className="object-cover" unoptimized />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{design.title}</p>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500">
                          <span className="flex items-center gap-0.5"><Download className="w-2.5 h-2.5" />{design.download_count}</span>
                          <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" />{design.like_count}</span>
                          <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{design.view_count}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        design.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>{design.status}</span>
                      <div className="flex items-center gap-1">
                        <Link href={`/alton-designs/${design.slug}`}>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDeleteDesign(design.id)}>
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Quick Metrics */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Avg. Downloads', value: Math.round((contributor?.total_downloads || 0) / Math.max(1, contributor?.total_uploads || 1)), icon: Download },
                  { label: 'Avg. Likes', value: Math.round((contributor?.total_likes || 0) / Math.max(1, contributor?.total_uploads || 1)), icon: Heart },
                  { label: 'Engagement', value: `${Math.round(((contributor?.total_likes || 0) / Math.max(1, contributor?.total_views || 1)) * 100)}%`, icon: Activity },
                  { label: 'Total Earnings', value: `€${contributor?.total_earnings?.toFixed(2) || '0.00'}`, icon: DollarSign },
                ].map((metric, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center"
                  >
                    <metric.icon className="w-5 h-5 text-purple-600 mx-auto mb-2" />
                    <p className="text-xl font-black text-gray-900 dark:text-white mb-0.5">{metric.value}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">{metric.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Charts Placeholder */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-4">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Advanced Analytics</h3>
                <p className="text-sm text-gray-500 mb-6">Detailed performance charts and insights coming soon</p>
                <div className="grid md:grid-cols-3 gap-3">
                  {['Performance Trends', 'Audience Insights', 'Revenue Analytics'].map((item, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-bold text-gray-900 dark:text-white mb-0.5">{item}</p>
                      <p className="text-[10px] text-gray-500">Coming Soon</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance by Category */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Performance by Category</h3>
                {designs.length > 0 ? (
                  <div className="space-y-2">
                    {Array.from(new Set(designs.map(d => d.category))).slice(0, 5).map((category, i) => {
                      const categoryDesigns = designs.filter(d => d.category === category);
                      const totalDownloads = categoryDesigns.reduce((sum, d) => sum + d.download_count, 0);
                      const maxDownloads = Math.max(...Array.from(new Set(designs.map(d => d.category))).map(cat => 
                        designs.filter(d => d.category === cat).reduce((sum, d) => sum + d.download_count, 0)
                      ));
                      const percentage = maxDownloads > 0 ? (totalDownloads / maxDownloads) * 100 : 0;
                      
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{category}</span>
                            <span className="text-gray-500">{totalDownloads} downloads</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">No data available</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className="fixed bottom-6 right-6 z-40"
      >
        <Link href="/alton-designs/upload">
          <button className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center group hover:scale-110">
            <Plus className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
          </button>
        </Link>
      </motion.div>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-400 dark:text-gray-500 py-12 px-4 mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/logo2.svg" alt="Alton Designs" width={32} height={32} />
                <h3 className="text-lg font-bold text-white">Alton Studio</h3>
              </div>
              <p className="text-sm">Premium design resources from talented creators worldwide.</p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Explore</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/alton-designs" className="hover:text-white transition">Browse Designs</Link></li>
                <li><Link href="/contributor/dashboard" className="hover:text-white transition">Dashboard</Link></li>
                <li><Link href="/help" className="hover:text-white transition">Help Center</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:support@altonstudio.com" className="hover:text-white transition">Email Support</a></li>
                <li><a href="https://twitter.com" className="hover:text-white transition">Twitter</a></li>
                <li><a href="https://instagram.com" className="hover:text-white transition">Instagram</a></li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-xs">
              <p>&copy; 2025 Alton Studio. All rights reserved.</p>
              <div className="flex gap-4 mt-4 md:mt-0">
                <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}