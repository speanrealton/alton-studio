// src/app/community/page.tsx — FIXED VERSION
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { 
  MessageCircle, Users, Search, Plus, TrendingUp, Home, Compass, 
  Bell, Bookmark, Menu, CheckCircle, X, Sun, Moon, Heart, Share2, Settings,
  Grid3x3, List, Zap, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthButton from '@/components/AuthButton';
import { CurrencyConverter } from '@/components/CurrencyConverter';
import type { Currency } from '@/lib/currencies';

type Post = {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: { username: string; avatar_url: string | null };
};

type Circle = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  member_count: number;
  category: string;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
};

export default function Community() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [filteredCircles, setFilteredCircles] = useState<Circle[]>([]);
  const [memberCircles, setMemberCircles] = useState<Set<string>>(new Set());
  const [joiningCircles, setJoiningCircles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [layoutView, setLayoutView] = useState<'grid' | 'list'>('grid');
  const [showTrendingCircles, setShowTrendingCircles] = useState(true);
  const [showLatestPosts, setShowLatestPosts] = useState(true);
  const [postsPerPage, setPostsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<'latest' | 'trending' | 'oldest'>('latest');
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [userCurrency, setUserCurrency] = useState<Currency>('USD');

  // Dark mode
  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    const isDark = stored === 'true' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Load community settings from localStorage
  useEffect(() => {
    const savedLayoutView = localStorage.getItem('communityLayoutView') as 'grid' | 'list' || 'grid';
    const savedShowTrending = localStorage.getItem('communityShowTrending') === 'false' ? false : true;
    const savedShowLatest = localStorage.getItem('communityShowLatest') === 'false' ? false : true;
    const savedPostsPerPage = parseInt(localStorage.getItem('communityPostsPerPage') || '10');
    const savedSortBy = (localStorage.getItem('communitySortBy') as 'latest' | 'trending' | 'oldest') || 'latest';
    const savedEnableNotifications = localStorage.getItem('communityEnableNotifications') === 'false' ? false : true;

    setLayoutView(savedLayoutView);
    setShowTrendingCircles(savedShowTrending);
    setShowLatestPosts(savedShowLatest);
    setPostsPerPage(savedPostsPerPage);
    setSortBy(savedSortBy);
    setEnableNotifications(savedEnableNotifications);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Save community settings to localStorage and database
  const saveCommunitySettings = async () => {
    localStorage.setItem('communityLayoutView', layoutView);
    localStorage.setItem('communityShowTrending', showTrendingCircles.toString());
    localStorage.setItem('communityShowLatest', showLatestPosts.toString());
    localStorage.setItem('communityPostsPerPage', postsPerPage.toString());
    localStorage.setItem('communitySortBy', sortBy);
    localStorage.setItem('communityEnableNotifications', enableNotifications.toString());

    // Try to save to database if user is logged in
    if (userId) {
      try {
        await supabase
          .from('community_settings')
          .upsert({
            user_id: userId,
            layout_view: layoutView,
            show_trending_circles: showTrendingCircles,
            show_latest_posts: showLatestPosts,
            posts_per_page: postsPerPage,
            sort_by: sortBy,
            enable_notifications: enableNotifications,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
      } catch (error) {
        console.error('Error saving settings to database:', error);
      }
    }

    setShowSettings(false);
    const successNotif: Notification = {
      id: Date.now().toString(),
      title: 'Settings Saved',
      message: 'Your community preferences have been updated',
      type: 'success',
      link: null
    };
    setLatestNotification(successNotif);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  };

  const updateLayoutView = (view: 'grid' | 'list') => {
    setLayoutView(view);
  };

  const resetSettings = () => {
    setLayoutView('grid');
    setShowTrendingCircles(true);
    setShowLatestPosts(true);
    setPostsPerPage(10);
    setSortBy('latest');
    setEnableNotifications(true);
  };

  // Fetch data (memoized to prevent infinite loops)
  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);

      // Load user's preferred currency
      const preferredCurrency = (user.user_metadata as any)?.preferred_currency || 'USD';
      setUserCurrency(preferredCurrency as Currency);

      // Fetch user's circles
      const { data: memberData } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', user.id);
      
      setMemberCircles(new Set(memberData?.map(m => m.circle_id) || []));

      // Fetch unread notifications
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false);
      
      setUnreadCount(notifData?.length || 0);

      // Fetch liked posts from database
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);
      
      const likedPostsSet = new Set(likesData?.map(l => l.post_id) || []);
      setLikedPosts(likedPostsSet);
      
      // Also store in localStorage for offline persistence
      localStorage.setItem(`likedPosts_${user.id}`, JSON.stringify(Array.from(likedPostsSet)));

      // Fetch saved posts
      const { data: savedData } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id);
      
      setSavedPosts(new Set(savedData?.map(s => s.post_id) || []));
    }

    try {
      const { data: postData, error: postError } = await supabase
        .from('community_posts')
        .select(`*, profiles(username, avatar_url)`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postError) {
        console.error('Error fetching posts:', postError);
      }

      // Count likes and comments for each post
      const postsWithCounts = await Promise.all((postData || []).map(async (post) => {
        // Count likes
        const { count: likesCount } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        // Count comments
        const { count: commentsCount } = await supabase
          .from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        return {
          ...post,
          likes_count: likesCount || 0,
          comments_count: commentsCount || 0
        } as Post;
      }));

      const postsWithDefaults = postsWithCounts;

      const { data: circleData, error: circleError } = await supabase
        .from('circles')
        .select('*')
        .order('member_count', { ascending: false })
        .limit(20);

      if (circleError) {
        console.error('Error fetching circles:', circleError);
      }

      setPosts(postsWithDefaults);
      setCircles(circleData || []);
      setFilteredCircles(circleData || []);
    } catch (error) {
      console.error('Error in fetchData:', error);
    } finally {
      // Ensure minimum 3 seconds loading time
      setTimeout(() => {
        setLoading(false);
      }, 3000);
    }
  }, []); // No dependencies - this function doesn't depend on any state

  // Initial data fetch
  useEffect(() => {
    fetchData();

    const postsChannel = supabase.channel('posts').on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'community_posts' },
      () => fetchData()
    ).subscribe();

    // Subscribe to real-time like updates
    const likesChannel = supabase.channel('post_likes').on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'post_likes' },
      () => {
        // Refresh the posts with updated like counts
        const refreshPosts = async () => {
          const { data: postData } = await supabase
            .from('community_posts')
            .select(`*, profiles(username, avatar_url)`)
            .order('created_at', { ascending: false })
            .limit(20);

          // Count likes for each post
          const postsWithCounts = await Promise.all((postData || []).map(async (post) => {
            const { count: likesCount } = await supabase
              .from('post_likes')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            const { count: commentsCount } = await supabase
              .from('post_comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            return {
              ...post,
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0
            } as Post;
          }));

          setPosts(postsWithCounts);
        };
        refreshPosts();
      }
    ).subscribe();

    // Subscribe to real-time comment updates
    const commentsChannel = supabase.channel('post_comments').on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'post_comments' },
      () => {
        // Refresh posts to get updated comment counts
        const refreshPosts = async () => {
          const { data: postData } = await supabase
            .from('community_posts')
            .select(`*, profiles(username, avatar_url)`)
            .order('created_at', { ascending: false })
            .limit(20);

          // Count likes and comments for each post
          const postsWithCounts = await Promise.all((postData || []).map(async (post) => {
            const { count: likesCount } = await supabase
              .from('post_likes')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            const { count: commentsCount } = await supabase
              .from('post_comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            return {
              ...post,
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0
            } as Post;
          }));

          setPosts(postsWithCounts);
        };
        refreshPosts();
      }
    ).subscribe();

    const circlesChannel = supabase.channel('circles').on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'circles' },
      () => fetchData()
    ).subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(circlesChannel);
    };
  }, [fetchData]);

  // Real-time notifications (separate effect with proper dependency)
  useEffect(() => {
    if (!userId) return;

    const notifChannel = supabase
      .channel('user-notifications')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setLatestNotification(newNotif);
          setUnreadCount(prev => prev + 1);
          setShowNotification(true);
          
          // Auto-hide after 5 seconds
          setTimeout(() => setShowNotification(false), 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
    };
  }, [userId]); // Only depends on userId

  // Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCircles(circles);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = circles.filter(circle => 
      circle.name.toLowerCase().includes(query) ||
      circle.category.toLowerCase().includes(query)
    );
    setFilteredCircles(filtered);
  }, [searchQuery, circles]);

  // Join/Leave circle
  const handleJoinCircle = async (circle: Circle) => {
    if (!userId) {
      // Redirect to login
      window.location.href = '/auth';
      return;
    }

    setJoiningCircles(new Set(joiningCircles).add(circle.id));

    try {
      if (memberCircles.has(circle.id)) {
        // Leave
        await supabase
          .from('circle_members')
          .delete()
          .eq('circle_id', circle.id)
          .eq('user_id', userId);

        const newMembers = new Set(memberCircles);
        newMembers.delete(circle.id);
        setMemberCircles(newMembers);

        // Update member count
        await supabase
          .from('circles')
          .update({ member_count: Math.max(0, circle.member_count - 1) })
          .eq('id', circle.id);
      } else {
        // Join
        await supabase
          .from('circle_members')
          .insert({
            circle_id: circle.id,
            user_id: userId,
            role: 'member'
          });

        const newMembers = new Set(memberCircles);
        newMembers.add(circle.id);
        setMemberCircles(newMembers);

        // Update member count
        await supabase
          .from('circles')
          .update({ member_count: circle.member_count + 1 })
          .eq('id', circle.id);

        // Show success notification
        const successNotif: Notification = {
          id: Date.now().toString(),
          title: 'Joined Circle',
          message: `You're now a member of ${circle.name}`,
          type: 'success',
          link: `/community/circle/${circle.slug}`
        };
        setLatestNotification(successNotif);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (error) {
      console.error('Error joining/leaving circle:', error);
    } finally {
      const newJoining = new Set(joiningCircles);
      newJoining.delete(circle.id);
      setJoiningCircles(newJoining);
    }
  };

  // Like/Unlike post
  const handleLikePost = async (post: Post) => {
    if (!userId) {
      window.location.href = '/auth';
      return;
    }

    const isLiked = likedPosts.has(post.id);

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', userId);

        const newLiked = new Set(likedPosts);
        newLiked.delete(post.id);
        setLikedPosts(newLiked);
        
        // Persist to localStorage
        localStorage.setItem(`likedPosts_${userId}`, JSON.stringify(Array.from(newLiked)));

        // Update like count
        setPosts(posts.map(p => 
          p.id === post.id 
            ? { ...p, likes_count: Math.max(0, p.likes_count - 1) }
            : p
        ));
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: userId
          });

        const newLiked = new Set(likedPosts);
        newLiked.add(post.id);
        setLikedPosts(newLiked);
        
        // Persist to localStorage
        localStorage.setItem(`likedPosts_${userId}`, JSON.stringify(Array.from(newLiked)));

        // Update like count
        setPosts(posts.map(p => 
          p.id === post.id 
            ? { ...p, likes_count: p.likes_count + 1 }
            : p
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  // Save/Unsave post
  const handleSavePost = async (post: Post) => {
    if (!userId) {
      window.location.href = '/auth';
      return;
    }

    const isSaved = savedPosts.has(post.id);

    try {
      if (isSaved) {
        // Unsave
        await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', userId);

        const newSaved = new Set(savedPosts);
        newSaved.delete(post.id);
        setSavedPosts(newSaved);
      } else {
        // Save
        await supabase
          .from('saved_posts')
          .insert({
            post_id: post.id,
            user_id: userId
          });

        const newSaved = new Set(savedPosts);
        newSaved.add(post.id);
        setSavedPosts(newSaved);

        // Show notification
        const successNotif: Notification = {
          id: Date.now().toString(),
          title: 'Post Saved',
          message: 'Post saved to your collection',
          type: 'success',
          link: '/saved'
        };
        setLatestNotification(successNotif);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 2000);
      }
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  // Share post
  const handleSharePost = async (post: Post) => {
    const url = `${window.location.origin}/community/post/${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by @${post.profiles?.username}`,
          text: post.content,
          url: url
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      const successNotif: Notification = {
        id: Date.now().toString(),
        title: 'Link Copied',
        message: 'Post link copied to clipboard',
        type: 'success',
        link: null
      };
      setLatestNotification(successNotif);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
    });
  };

  return (
    <>
      {loading ? (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <img 
              src="/logo2.svg" 
              alt="Loading" 
              className="w-32 h-32 mx-auto animate-pulse drop-shadow-lg"
              style={{
                filter: 'drop-shadow(0 0 30px rgba(168, 85, 247, 0.8))',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            />
          </div>
          <style>{`
            @keyframes glow {
              0%, 100% { filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.6)); }
              50% { filter: drop-shadow(0 0 40px rgba(168, 85, 247, 1)); }
            }
          `}</style>
        </div>
      ) : (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Community Settings</h2>
                </div>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                  aria-label="Close settings"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                
                {/* Layout View */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Layout View
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateLayoutView('grid')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition ${
                        layoutView === 'grid'
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      aria-label="Switch to grid layout"
                      aria-pressed={layoutView === 'grid' ? 'true' : 'false'}
                    >
                      <Grid3x3 className="w-4 h-4" />
                      <span className="text-sm font-medium">Grid</span>
                    </button>
                    <button
                      onClick={() => updateLayoutView('list')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition ${
                        layoutView === 'list'
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      aria-label="Switch to list layout"
                      aria-pressed={layoutView === 'list' ? 'true' : 'false'}
                    >
                      <List className="w-4 h-4" />
                      <span className="text-sm font-medium">List</span>
                    </button>
                  </div>
                </div>

                {/* Trending Circles Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                      Show Trending Circles
                    </label>
                  </div>
                  <button
                    onClick={() => setShowTrendingCircles(!showTrendingCircles)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      showTrendingCircles ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    role="switch"
                    aria-checked={showTrendingCircles ? 'true' : 'false'}
                    aria-label="Toggle trending circles visibility"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        showTrendingCircles ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Latest Posts Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                      Show Latest Posts
                    </label>
                  </div>
                  <button
                    onClick={() => setShowLatestPosts(!showLatestPosts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      showLatestPosts ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    role="switch"
                    aria-checked={showLatestPosts ? 'true' : 'false'}
                    aria-label="Toggle latest posts visibility"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        showLatestPosts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Enable Notifications Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-600" />
                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                      Enable Notifications
                    </label>
                  </div>
                  <button
                    onClick={() => setEnableNotifications(!enableNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      enableNotifications ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    role="switch"
                    aria-checked={enableNotifications ? 'true' : 'false'}
                    aria-label="Toggle notifications"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        enableNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Sort By */}
                <div>
                  <label htmlFor="sort-select" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Sort Posts By
                  </label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'latest' | 'trending' | 'oldest')}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    aria-label="Sort posts by"
                  >
                    <option value="latest">Latest First</option>
                    <option value="trending">Trending First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>

                {/* Posts Per Page */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Posts Per Page: {postsPerPage}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={postsPerPage}
                    onChange={(e) => setPostsPerPage(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    aria-label="Posts per page"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>5</span>
                    <span>50</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    ℹ️ Your preferences are saved locally and synced to your account. Changes apply in real-time.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
                <button
                  onClick={resetSettings}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  aria-label="Reset settings to defaults"
                >
                  Reset Defaults
                </button>
                <button
                  onClick={saveCommunitySettings}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium text-white transition"
                  aria-label="Save community settings"
                >
                  Save Settings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showNotification && latestNotification && (
          <motion.div
            initial={{ opacity: 0, y: -100, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -100, x: '-50%' }}
            className="fixed top-0 left-1/2 z-50 w-96 max-w-[90vw]"
          >
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                    {latestNotification.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {latestNotification.message}
                  </p>
                </div>
                <button onClick={() => setShowNotification(false)} aria-label="Close notification">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/">
            <Image src="/logo.svg" alt="Alton" width={100} height={28} />
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <Link href="/community">
            <motion.div whileHover={{ x: 4 }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-medium">
              <Home className="w-5 h-5" />
              <span className="text-sm">Home</span>
            </motion.div>
          </Link>
          
          <Link href="/community/explore">
            <motion.div whileHover={{ x: 4 }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition">
              <Compass className="w-5 h-5" />
              <span className="text-sm">Explore</span>
            </motion.div>
          </Link>

          <Link href="/notifications">
            <motion.div whileHover={{ x: 4 }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition relative">
              <Bell className="w-5 h-5" />
              <span className="text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </motion.div>
          </Link>

          <Link href="/saved">
            <motion.div whileHover={{ x: 4 }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition">
              <Bookmark className="w-5 h-5" />
              <span className="text-sm">Saved</span>
            </motion.div>
          </Link>

          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Your Circles
            </p>
            {circles.filter(c => memberCircles.has(c.id)).slice(0, 5).map((circle) => (
              <Link key={circle.id} href={`/community/circle/${circle.slug}`}>
                <motion.div whileHover={{ x: 4 }} className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs flex-shrink-0 overflow-hidden">
                    {circle.icon ? (
                      typeof circle.icon === 'string' && circle.icon.startsWith('http') ? (
                        <img src={circle.icon} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{circle.icon}</span>
                      )
                    ) : (
                      circle.name[0]
                    )}
                  </div>
                  <span className="text-sm truncate">{circle.name}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <Link href="/community/circle/create">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm py-2">
              <Plus className="w-4 h-4 mr-2" /> New Circle
            </Button>
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP NAVBAR */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="lg:hidden"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search circles, posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Community Settings"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            <button
              onClick={toggleDarkMode}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>

            <Link href="/notifications">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
              </Button>
            </Link>

            <AuthButton />
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 lg:p-6">
            
            {/* Trending Circles */}
            {!searchQuery && showTrendingCircles && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Trending Circles
                  </h2>
                  <Link href="/community/explore" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                    View all
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                  {circles.slice(0, 8).map((circle) => (
                    <div key={circle.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2 hover:shadow-lg transition">
                      <Link href={`/community/circle/${circle.slug}`}>
                        <div className="flex flex-col items-center text-center mb-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm mb-2 shadow overflow-hidden">
                            {circle.icon ? (
                              typeof circle.icon === 'string' && circle.icon.startsWith('http') ? (
                                <img src={circle.icon} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span>{circle.icon}</span>
                              )
                            ) : (
                              <Users className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <h3 className="font-semibold text-xs text-gray-900 dark:text-white line-clamp-1 mb-1">
                            {circle.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {circle.member_count.toLocaleString()} members
                          </p>
                        </div>
                      </Link>
                      <Button
                        onClick={() => handleJoinCircle(circle)}
                        disabled={joiningCircles.has(circle.id)}
                        size="sm"
                        variant={memberCircles.has(circle.id) ? 'outline' : 'default'}
                        className="w-full text-xs"
                      >
                        {joiningCircles.has(circle.id) ? 'Loading...' : memberCircles.has(circle.id) ? 'Joined' : 'Join'}
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Latest Posts from All Circles */}
            {!searchQuery && showLatestPosts && posts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Latest Posts</h2>
                  <Link href="/community/post/create" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                    Create Post
                  </Link>
                </div>
                <div className={layoutView === 'grid' ? "grid grid-cols-1 gap-4" : "space-y-4"}>
                  {posts.slice(0, postsPerPage).map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition ${
                        layoutView === 'list' ? 'flex flex-row' : 'flex flex-col'
                      }`}
                    >
                      {/* Post Header */}
                      <div className={`${layoutView === 'list' ? 'flex-1' : ''} p-4 flex items-center justify-between`}>
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white overflow-hidden flex-shrink-0">
                            {post.profiles?.avatar_url ? (
                              <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              post.profiles?.username?.[0]?.toUpperCase() || '?'
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                              @{post.profiles?.username || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(post.created_at).toLocaleDateString()} • {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="px-4 pb-3">
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap line-clamp-3">
                          {post.content}
                        </p>
                      </div>

                      {/* Post Media */}
                      {layoutView === 'grid' && post.media_urls && post.media_urls.length > 0 && post.media_urls[0] && (
                        <div className="relative">
                          {post.media_urls[0].toLowerCase().endsWith('.mp4') || 
                           post.media_urls[0].toLowerCase().endsWith('.mov') ? (
                            <video src={post.media_urls[0]} controls className="w-full h-96 object-cover" />
                          ) : (
                            <img src={post.media_urls[0]} alt="" className="w-full h-96 object-cover" />
                          )}
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 flex-wrap gap-2">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => handleLikePost(post)}
                            className={`flex items-center gap-1.5 transition ${
                              likedPosts.has(post.id)
                                ? 'text-red-600'
                                : 'text-gray-600 dark:text-gray-400 hover:text-red-600'
                            }`}
                            aria-label={likedPosts.has(post.id) ? 'Unlike post' : 'Like post'}
                            aria-pressed={likedPosts.has(post.id) ? 'true' : 'false'}
                          >
                            <Heart className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                            <span className="text-xs font-medium">{post.likes_count || 0}</span>
                          </button>
                          <Link href={`/community/post/${post.id}`} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-purple-600 transition">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">{post.comments_count || 0}</span>
                          </Link>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleSavePost(post)}
                            className={`p-2 transition ${
                              savedPosts.has(post.id)
                                ? 'text-purple-600'
                                : 'text-gray-600 dark:text-gray-400 hover:text-purple-600'
                            }`}
                            aria-label={savedPosts.has(post.id) ? 'Unsave post' : 'Save post'}
                            aria-pressed={savedPosts.has(post.id) ? 'true' : 'false'}
                          >
                            <Bookmark className={`w-4 h-4 ${savedPosts.has(post.id) ? 'fill-current' : ''}`} />
                          </button>
                          <button 
                            onClick={() => handleSharePost(post)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 transition"
                            aria-label="Share post"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Load More */}
                {posts.length > postsPerPage && (
                  <div className="mt-6 text-center">
                    <Button variant="outline" size="sm">
                      Load More Posts
                    </Button>
                  </div>
                )}
              </section>
            )}

            {/* Empty State */}
            {!searchQuery && showLatestPosts && posts.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <MessageCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts yet</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Join circles and start posting to see content here
                </p>
                <Link href="/community/explore">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Compass className="w-4 h-4 mr-2" />
                    Explore Circles
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FAB */}
      <Link href="/community/post/create" className="lg:hidden">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg z-30"
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
      </Link>
    </div>
      )}
    </>
  );
}