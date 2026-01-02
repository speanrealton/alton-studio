// src/app/marketplace/following/page.tsx — PROFESSIONAL & ADVANCED VERSION
'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Flame, Heart, MessageCircle, Share2, User, Home, Upload, Play, Volume2, VolumeX, Eye,
  Bookmark, Flag, Search, Filter, TrendingUp, Clock, Zap, X, Send,
  Settings, Users, Calendar, Award, Bell, Grid3x3, List,
  Music, Tag, MapPin, ExternalLink, Share, BarChart3, AlertCircle, Copy, Download as DownloadIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Video = {
  id: string;
  video_url: string;
  creator_id: string;
  creator_username: string;
  creator_profile_picture: string | null;
  description: string;
  views: number;
  likes: number;
  duration?: number;
  category?: string;
  created_at: string;
  shop_link?: string;
};

type Comment = {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
  likes: number;
};

export default function FollowingFeed() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoPaused, setVideoPaused] = useState<{ [key: string]: boolean }>({});
  const [videoMuted, setVideoMuted] = useState<{ [key: string]: boolean }>({});
  const [userLikes, setUserLikes] = useState<{ [key: string]: boolean }>({});
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Set<string>>(new Set());
  const [videoComments, setVideoComments] = useState<{ [key: string]: Comment[] }>({});
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [userFollowStatus, setUserFollowStatus] = useState<{ [key: string]: boolean }>({});
  const [followerCounts, setFollowerCounts] = useState<{ [key: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'trending' | 'viewed'>('latest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [videoQuality, setVideoQuality] = useState<'auto' | '720' | '480' | '360'>('auto');
  const [showNotifications, setShowNotifications] = useState(false);
  const [newVideosCount, setNewVideosCount] = useState(0);
  const [viewMode, setViewMode] = useState<'feed' | 'grid'>('feed');
  const [showCreatorInfo, setShowCreatorInfo] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const [lastLoadTime, setLastLoadTime] = useState<Date>(new Date());

  useEffect(() => {
    initializeUser();
    loadFollowingVideos();

    const channel = supabase
      .channel('following-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'printing_videos' }, () => {
        checkNewVideos();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_likes' }, () => {
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) loadUserLikes(data.user.id);
        });
        loadFollowingVideos();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [videos, searchQuery, sortBy, selectedCategory]);

  // Debug output
  useEffect(() => {
    console.log('Page state:', {
      videosCount: videos.length,
      filteredVideosCount: filteredVideos.length,
      currentIndex,
      viewMode,
      userExists: !!currentUser,
    });
  }, [videos, filteredVideos, currentIndex, viewMode, currentUser]);

  const initializeUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    if (user) {
      loadUserLikes(user.id);
      loadBookmarkedVideos(user.id);
    }
  };

  const loadFollowingVideos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Get list of users current user is following
      const { data: followingData, error: followingError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followingError) {
        console.error('Error loading following:', followingError);
        setVideos([]);
        setLoading(false);
        return;
      }

      const followingIds = followingData?.map(f => f.following_id) || [];
      console.log('Following IDs:', followingIds);

      if (followingIds.length === 0) {
        console.log('User is not following anyone');
        setVideos([]);
        setLoading(false);
        return;
      }

      // Get videos from followed users - try with 'videos' table first
      let videosData;
      let videosError;
      
      const { data, error } = await supabase
        .from('printing_videos')
        .select('*')
        .in('creator_id', followingIds)
        .order('created_at', { ascending: false });
      
      videosData = data;
      videosError = error;

      if (videosError) {
        console.error('Error loading videos:', videosError);
        setVideos([]);
        setLoading(false);
        return;
      }

      console.log('Videos loaded:', videosData?.length || 0);

      // Fetch like counts
      const { data: likesData } = await supabase
        .from('video_likes')
        .select('video_id');

      const likesCountMap: { [key: string]: number } = {};
      likesData?.forEach(like => {
        likesCountMap[like.video_id] = (likesCountMap[like.video_id] || 0) + 1;
      });

      // Add like counts to videos
      const videosWithLikes = (videosData || []).map(video => ({
        ...video,
        likes: likesCountMap[video.id] || 0
      }));

      loadFollowerCounts(followingIds);
      loadFollowStatus(followingIds, user.id);

      setVideos(videosWithLikes);
      setLastLoadTime(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Unexpected error loading videos:', err);
      setVideos([]);
      setLoading(false);
    }
  };

  const checkNewVideos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: followingData } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followingIds = followingData?.map(f => f.following_id) || [];

    const { data: newVideosData } = await supabase
      .from('printing_videos')
      .select('id')
      .in('creator_id', followingIds)
      .gte('created_at', lastLoadTime.toISOString());

    setNewVideosCount(newVideosData?.length || 0);
  };

  const loadFollowerCounts = async (creatorIds: string[]) => {
    const { data } = await supabase
      .from('user_follows')
      .select('following_id')
      .in('following_id', creatorIds);

    const countsMap: { [key: string]: number } = {};
    creatorIds.forEach(id => {
      countsMap[id] = data?.filter(d => d.following_id === id).length || 0;
    });
    setFollowerCounts(countsMap);
  };

  const loadFollowStatus = async (creatorIds: string[], userId: string) => {
    const { data } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId)
      .in('following_id', creatorIds);

    const statusMap: { [key: string]: boolean } = {};
    data?.forEach(f => {
      statusMap[f.following_id] = true;
    });
    setUserFollowStatus(statusMap);
  };

  const loadUserLikes = async (userId: string) => {
    const { data: likesData } = await supabase
      .from('video_likes')
      .select('video_id')
      .eq('user_id', userId);
    
    const likes: { [key: string]: boolean } = {};
    likesData?.forEach(like => {
      likes[like.video_id] = true;
    });
    setUserLikes(likes);
  };

  const loadBookmarkedVideos = async (userId: string) => {
    const { data } = await supabase
      .from('video_bookmarks')
      .select('video_id')
      .eq('user_id', userId);
    
    const bookmarks = new Set<string>();
    data?.forEach(b => bookmarks.add(b.video_id));
    setBookmarkedVideos(bookmarks);
  };

  const applyFiltersAndSort = () => {
    let filtered = [...videos];

    if (searchQuery) {
      filtered = filtered.filter(v =>
        v.creator_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(v => v.category === selectedCategory);
    }

    switch (sortBy) {
      case 'trending':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'viewed':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'latest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredVideos(filtered);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.target as HTMLDivElement;
    const scrollPosition = container.scrollTop;
    const videoHeight = container.clientHeight;
    const newIndex = Math.round(scrollPosition / videoHeight);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < filteredVideos.length) {
      setCurrentIndex(newIndex);
    }
  };

  const togglePlayPause = (videoId: string) => {
    const video = videoRefs.current[videoId];
    if (!video) return;
    if (video.paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          if (err.name !== 'AbortError') {
            console.log('Play error:', err);
          }
        });
      }
      setVideoPaused(prev => ({ ...prev, [videoId]: false }));
    } else {
      video.pause();
      setVideoPaused(prev => ({ ...prev, [videoId]: true }));
    }
  };

  const toggleMute = (videoId: string) => {
    const video = videoRefs.current[videoId];
    if (!video) return;
    video.muted = !video.muted;
    setVideoMuted(prev => ({ ...prev, [videoId]: !prev[videoId] }));
  };

  const toggleLike = async (videoId: string) => {
    if (!currentUser) {
      alert('Log in to like videos');
      return;
    }

    const { data: existingLike } = await supabase
      .from('video_likes')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', currentUser.id)
      .single();

    try {
      if (existingLike) {
        await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', currentUser.id);
      } else {
        await supabase
          .from('video_likes')
          .insert({
            video_id: videoId,
            user_id: currentUser.id
          });
      }
      
      loadFollowingVideos();
      loadUserLikes(currentUser.id);
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const toggleBookmark = async (videoId: string) => {
    if (!currentUser) {
      alert('Log in to bookmark videos');
      return;
    }

    try {
      if (bookmarkedVideos.has(videoId)) {
        await supabase
          .from('video_bookmarks')
          .delete()
          .eq('video_id', videoId)
          .eq('user_id', currentUser.id);
        setBookmarkedVideos(prev => {
          const updated = new Set(prev);
          updated.delete(videoId);
          return updated;
        });
      } else {
        await supabase
          .from('video_bookmarks')
          .insert({
            video_id: videoId,
            user_id: currentUser.id
          });
        setBookmarkedVideos(prev => new Set(prev).add(videoId));
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const toggleFollow = async (creatorId: string) => {
    if (!currentUser) {
      alert('Log in to follow creators');
      return;
    }

    try {
      if (userFollowStatus[creatorId]) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', creatorId);
      } else {
        await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUser.id,
            following_id: creatorId
          });
      }
      
      setUserFollowStatus(prev => ({
        ...prev,
        [creatorId]: !prev[creatorId]
      }));
      loadFollowerCounts([creatorId]);
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  const addComment = async (videoId: string) => {
    if (!currentUser || !commentInput.trim()) return;

    try {
      const { data: newComment } = await supabase
        .from('video_comments')
        .insert({
          video_id: videoId,
          user_id: currentUser.id,
          username: currentUser.user_metadata?.username || currentUser.email,
          content: commentInput,
          avatar_url: currentUser.user_metadata?.avatar_url
        })
        .select()
        .single();

      if (newComment) {
        setVideoComments(prev => ({
          ...prev,
          [videoId]: [...(prev[videoId] || []), newComment]
        }));
        setCommentInput('');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}m ago`;
  };

  const handleDownloadVideo = async () => {
    if (!currentVideo?.video_url) {
      alert('Video URL not available');
      return;
    }

    try {
      const response = await fetch(currentVideo.video_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-${currentVideo.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      alert('Video downloaded successfully!');
    } catch (error) {
      console.error('Error downloading video:', error);
      alert('Failed to download video. Please try again.');
    }
  };

  const handleReportVideo = async () => {
    if (!reportReason) {
      alert('Please select a reason for reporting');
      return;
    }

    setIsReporting(true);
    try {
      const { error } = await supabase.from('video_reports').insert([
        {
          video_id: currentVideo?.id,
          reporter_id: user?.id,
          reason: reportReason,
          message: reportMessage,
          created_at: new Date().toISOString(),
          status: 'pending'
        }
      ]);

      if (error) throw error;

      alert('Report submitted successfully! Our team will review it shortly.');
      setShowReportModal(false);
      setReportReason('');
      setReportMessage('');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsReporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-bold">Loading your feed...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <Heart className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-center">Sign In to Your Feed</h1>
        <p className="text-gray-400 text-center max-w-md">
          See exclusive videos from creators you follow
        </p>
        <Link href="/auth">
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 rounded-full font-bold transition">
            Log In Now
          </button>
        </Link>
      </div>
    );
  }

  if (filteredVideos.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-4">
        <Search className="w-20 h-20 text-gray-600" />
        <h1 className="text-3xl font-black text-center">No Videos Found</h1>
        <p className="text-gray-400 text-center max-w-md">
          {searchQuery ? 'Try a different search' : 'Follow creators to see their videos here!'}
        </p>
        <Link href="/marketplace">
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 rounded-full font-bold transition">
            Discover Creators
          </button>
        </Link>
      </div>
    );
  }

  const currentVideo = filteredVideos[currentIndex];

  return (
    <div className="min-h-screen bg-black">
      {/* Advanced Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-md mx-auto px-4">
          {/* Header */}
          <div className="h-16 flex items-center justify-between">
            <h1 className="text-xl font-black text-white">Following</h1>
            <div className="flex items-center gap-2">
              {newVideosCount > 0 && (
                <button
                  onClick={() => {
                    setLastLoadTime(new Date());
                    loadFollowingVideos();
                    setNewVideosCount(0);
                  }}
                  className="relative bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-2 rounded-full text-xs font-bold text-white flex items-center gap-1 hover:from-purple-700 hover:to-pink-700 transition"
                >
                  <Bell className="w-4 h-4" />
                  <span>{newVideosCount}</span>
                </button>
              )}
              <Link href="/marketplace"><Home className="w-5 h-5 text-gray-400 hover:text-white transition" /></Link>
              <Link href="/marketplace/upload"><Upload className="w-5 h-5 text-white hover:text-purple-400 transition" /></Link>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="py-3 flex gap-2 border-t border-white/10">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="py-3 border-t border-white/10 bg-gray-900/50 space-y-3"
              >
                {/* Sort Options */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Sort By</label>
                  <div className="flex gap-2 mt-2">
                    {['latest', 'trending', 'viewed'].map(option => (
                      <button
                        key={option}
                        onClick={() => setSortBy(option as any)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                          sortBy === option
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Video Quality */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">Video Quality</label>
                  <select
                    value={videoQuality}
                    onChange={(e) => setVideoQuality(e.target.value as any)}
                    className="w-full mt-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="auto">Auto</option>
                    <option value="720">720p</option>
                    <option value="480">480p</option>
                    <option value="360">360p</option>
                  </select>
                </div>

                {/* View Mode */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase">View Mode</label>
                  <div className="flex gap-2 mt-2">
                    {['feed', 'grid'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode as any)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                          viewMode === mode
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {mode === 'feed' ? <Play className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Main Content */}
      {viewMode === 'feed' ? (
        <div className="pt-32 flex items-center justify-center min-h-screen">
          <div 
            ref={containerRef}
            onScroll={handleScroll}
            className="h-screen w-full max-w-md overflow-y-scroll snap-y snap-mandatory bg-black"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>

            {filteredVideos.map((video, index) => {
              const userLiked = userLikes[video.id] || false;
              const isBookmarked = bookmarkedVideos.has(video.id);
              const isFollowing = userFollowStatus[video.creator_id] || false;

              return (
                <div key={video.id} className="relative h-screen w-full snap-start snap-always flex items-center justify-center bg-black">
                  <div className="relative w-full h-[85vh] aspect-[9/16] mx-auto">
                    <video
                      ref={el => { if (el) videoRefs.current[video.id] = el; }}
                      src={video.video_url}
                      className="absolute inset-0 w-full h-full object-cover rounded-2xl lg:rounded-xl"
                      loop
                      playsInline
                      onClick={() => togglePlayPause(video.id)}
                    />

                    {videoPaused[video.id] && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/50 rounded-full p-6">
                          <Play className="w-16 h-16 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Top Controls */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                      <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                        <Clock className="w-3 h-3 text-gray-300" />
                        <span className="text-xs text-gray-300">{formatDate(video.created_at)}</span>
                      </div>
                      <button
                        onClick={() => toggleMute(video.id)}
                        className="bg-black/50 backdrop-blur-sm rounded-full p-3 hover:bg-black/70 transition"
                      >
                        {videoMuted[video.id] ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                      </button>
                    </div>

                    {/* Right Side Advanced Actions */}
                    <div className="absolute right-3 bottom-48 flex flex-col gap-4 z-10">
                      {/* Flame/Like */}
                      <motion.button onClick={() => toggleLike(video.id)} whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                        <div className={`backdrop-blur-sm rounded-full p-3 transition ${userLiked ? 'bg-orange-500/20' : 'bg-black/40'}`}>
                          <Flame className={`w-6 h-6 ${userLiked ? 'text-orange-500' : 'text-white'}`} />
                        </div>
                        <span className={`text-xs font-bold mt-1 ${userLiked ? 'text-orange-500' : 'text-white'}`}>
                          {formatViews(video.likes)}
                        </span>
                      </motion.button>

                      {/* Comments */}
                      <motion.button onClick={() => setShowComments(!showComments)} whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                        <div className="bg-black/40 backdrop-blur-sm rounded-full p-3 hover:bg-black/60 transition">
                          <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                      </motion.button>

                      {/* Bookmark */}
                      <motion.button onClick={() => toggleBookmark(video.id)} whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                        <div className={`backdrop-blur-sm rounded-full p-3 transition ${isBookmarked ? 'bg-blue-500/20' : 'bg-black/40'}`}>
                          <Bookmark className={`w-6 h-6 ${isBookmarked ? 'text-blue-400' : 'text-white'}`} fill={isBookmarked ? 'currentColor' : 'none'} />
                        </div>
                      </motion.button>

                      {/* Share */}
                      <motion.button onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const fullUrl = `${window.location.origin}/marketplace?video=${video.id}`;
                        if (navigator.share) {
                          navigator.share({ 
                            title: `Check out this print!`, 
                            url: fullUrl
                          }).catch(err => console.log('Share cancelled'));
                        } else {
                          navigator.clipboard.writeText(fullUrl);
                          alert('Link copied to clipboard!');
                        }
                      }} onClick={(e) => e.stopPropagation()} whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                        <div className="bg-black/40 backdrop-blur-sm rounded-full p-3 hover:bg-black/60 transition">
                          <Share2 className="w-6 h-6 text-white" />
                        </div>
                      </motion.button>

                      {/* Sidebar Toggle */}
                      <motion.button onClick={() => setShowSidebar(!showSidebar)} whileTap={{ scale: 0.9 }} className="flex flex-col items-center">
                        <div className={`backdrop-blur-sm rounded-full p-3 transition ${showSidebar ? 'bg-purple-500/20' : 'bg-black/40'}`}>
                          <BarChart3 className={`w-6 h-6 ${showSidebar ? 'text-purple-400' : 'text-white'}`} />
                        </div>
                      </motion.button>
                    </div>

                    {/* Bottom Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 z-10 bg-gradient-to-t from-black via-black/80 to-transparent pt-20">
                      {/* Creator & Stats */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-white text-lg font-black">@{video.creator_username}</p>
                          <p className="text-gray-400 text-xs flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {followerCounts[video.creator_id] || 0} followers
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {video.views > 0 && (
                            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
                              <Eye className="w-3 h-3 text-gray-300" />
                              <span className="text-xs font-bold text-gray-300">{formatViews(video.views)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description & Category */}
                      {video.description && (
                        <p className="text-white text-sm mb-2 line-clamp-2">{video.description}</p>
                      )}
                      
                      {video.category && (
                        <div className="flex gap-2 mb-3">
                          <span className="inline-block bg-purple-500/20 text-purple-300 text-xs font-bold px-2 py-1 rounded-full">
                            #{video.category}
                          </span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {video.shop_link && (
                          <a href={video.shop_link} target="_blank" rel="noopener noreferrer">
                            <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-4 py-2 rounded-full hover:from-purple-700 hover:to-pink-700 transition flex items-center gap-2">
                              <ExternalLink className="w-3 h-3" />
                              Shop Now
                            </button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="pt-32 max-w-6xl mx-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.map((video) => {
              const userLiked = userLikes[video.id] || false;
              const isBookmarked = bookmarkedVideos.has(video.id);

              return (
                <motion.div
                  key={video.id}
                  whileHover={{ scale: 1.02 }}
                  className="relative group rounded-xl overflow-hidden bg-gray-900 cursor-pointer"
                >
                  <div className="aspect-[9/16] bg-black relative">
                    <video
                      src={video.video_url}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Play className="w-16 h-16 text-white" />
                    </div>

                    {/* Stats */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Flame className={`w-4 h-4 ${userLiked ? 'text-orange-500' : 'text-white'}`} />
                          <span className="text-xs font-bold text-white">{formatViews(video.likes)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-white" />
                          <span className="text-xs font-bold text-white">{formatViews(video.views)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-200 line-clamp-1">@{video.creator_username}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Advanced Features Sidebar */}
      <AnimatePresence>
        {showSidebar && currentVideo && (
          <motion.div
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-gradient-to-b from-gray-900 to-black border-r border-gray-800 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-black/50 sticky top-0">
              <h3 className="font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Video Stats
              </h3>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1 hover:bg-gray-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Creator Card */}
              <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 overflow-hidden flex-shrink-0">
                    {currentVideo.creator_profile_picture ? (
                      <img src={currentVideo.creator_profile_picture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold">
                        {currentVideo.creator_username[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">@{currentVideo.creator_username}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {followerCounts[currentVideo.creator_id] || 0} followers
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleFollow(currentVideo.creator_id)}
                  className={`w-full py-2 rounded-lg font-bold text-sm transition ${
                    userFollowStatus[currentVideo.creator_id]
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                  }`}
                >
                  {userFollowStatus[currentVideo.creator_id] ? 'Following' : 'Follow'}
                </button>
              </div>

              {/* Video Statistics */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Performance</h4>
                
                <div className="bg-black/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">Views</span>
                    </div>
                    <span className="text-white font-bold">{formatViews(currentVideo.views)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full w-3/4"></div>
                  </div>
                </div>

                <div className="bg-black/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">Flames</span>
                    </div>
                    <span className="text-white font-bold">{formatViews(currentVideo.likes)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full w-2/3"></div>
                  </div>
                </div>

                <div className="bg-black/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-gray-400">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">Comments</span>
                    </div>
                    <span className="text-white font-bold">{videoComments[currentVideo.id]?.length || 0}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full w-1/2"></div>
                  </div>
                </div>

                <div className="bg-black/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm">Engagement Rate</span>
                    </div>
                    <span className="text-white font-bold">
                      {currentVideo.views > 0 
                        ? ((currentVideo.likes / currentVideo.views) * 100).toFixed(1) 
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full w-1/3"></div>
                  </div>
                </div>
              </div>

              {/* Video Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Details</h4>
                
                {currentVideo.category && (
                  <div className="bg-black/50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="text-xs text-gray-400">Category</p>
                        <p className="text-sm font-bold text-white">{currentVideo.category}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-black/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-pink-400" />
                    <div>
                      <p className="text-xs text-gray-400">Uploaded</p>
                      <p className="text-sm font-bold text-white">{formatDate(currentVideo.created_at)}</p>
                    </div>
                  </div>
                </div>

                {currentVideo.description && (
                  <div className="bg-black/50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Music className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 mb-1">Description</p>
                        <p className="text-sm text-gray-200 line-clamp-3">{currentVideo.description}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Actions</h4>
                
                <button
                  onClick={() => {
                    const fullUrl = `${window.location.origin}/marketplace?video=${currentVideo.id}`;
                    navigator.clipboard.writeText(fullUrl);
                    alert('Video link copied!');
                  }}
                  className="w-full bg-black/50 hover:bg-black/70 border border-gray-700 text-gray-300 hover:text-white py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 text-sm font-bold"
                >
                  <Copy className="w-4 h-4" />
                  Copy Link
                </button>

                <button 
                  onClick={handleDownloadVideo}
                  className="w-full bg-black/50 hover:bg-black/70 border border-gray-700 text-gray-300 hover:text-white py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 text-sm font-bold"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Download Video
                </button>

                <button 
                  onClick={() => setShowReportModal(true)}
                  className="w-full bg-black/50 hover:bg-black/70 border border-gray-700 text-gray-300 hover:text-white py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 text-sm font-bold"
                >
                  <Flag className="w-4 h-4" />
                  Report Video
                </button>
              </div>

              {/* Creator Stats (if your videos) */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Creator Tools</h4>
                
                <button className="w-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/30 text-white py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 text-sm font-bold">
                  <BarChart3 className="w-4 h-4" />
                  Detailed Analytics
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Comments Sidebar */}
      <AnimatePresence>
        {showComments && currentVideo && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-gray-800 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-black/50">
              <h3 className="font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Comments
              </h3>
              <button
                onClick={() => setShowComments(false)}
                className="p-1 hover:bg-gray-800 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {videoComments[currentVideo.id]?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No comments yet. Be the first!</p>
                </div>
              ) : (
                videoComments[currentVideo.id]?.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex-shrink-0 overflow-hidden">
                      {comment.avatar_url ? (
                        <img src={comment.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                          {comment.username[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{comment.username}</p>
                      <p className="text-sm text-gray-300 line-clamp-2">{comment.content}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(comment.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <div className="p-4 border-t border-gray-800 bg-black/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addComment(currentVideo.id);
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => addComment(currentVideo.id)}
                  className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white hover:from-purple-700 hover:to-pink-700 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}