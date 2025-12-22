// src/app/marketplace/explore/page.tsx ← CREATE THIS
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Search, TrendingUp, Eye, Heart, ArrowLeft, User, Play } from 'lucide-react';

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<any[]>([]);
  const [mostViewedVideos, setMostViewedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trending' | 'views'>('trending');

  useEffect(() => {
    loadExplorePage();
  }, []);

  const loadExplorePage = async () => {
    // Get trending videos (most likes in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: trending } = await supabase
      .from('printing_videos')
      .select('*')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('likes', { ascending: false })
      .limit(20);

    setTrendingVideos(trending || []);

    // Get most viewed videos (all time)
    const { data: mostViewed } = await supabase
      .from('printing_videos')
      .select('*')
      .order('views', { ascending: false })
      .limit(20);

    setMostViewedVideos(mostViewed || []);
    setLoading(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Search by username, description, or product slug
    const { data } = await supabase
      .from('printing_videos')
      .select('*')
      .or(`creator_username.ilike.%${query}%,description.ilike.%${query}%,tagged_product_slug.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    setSearchResults(data || []);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-4xl font-black animate-pulse">Loading...</div>
      </div>
    );
  }

  const displayVideos = searchQuery ? searchResults : activeTab === 'trending' ? trendingVideos : mostViewedVideos;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/95 backdrop-blur-lg sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/marketplace">
              <ArrowLeft className="w-6 h-6 text-gray-400 hover:text-white" />
            </Link>
            <h1 className="text-2xl font-black">Explore</h1>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos, creators, products..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-full pl-12 pr-4 py-3 text-white placeholder:text-gray-400 focus:border-purple-500 focus:outline-none transition"
            />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        {!searchQuery && (
          <div className="flex gap-4 mb-6 border-b border-white/10">
            <button
              onClick={() => setActiveTab('trending')}
              className={`pb-3 px-4 font-bold flex items-center gap-2 transition ${
                activeTab === 'trending' ? 'border-b-2 border-purple-500 text-white' : 'text-gray-400'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Trending
            </button>
            <button
              onClick={() => setActiveTab('views')}
              className={`pb-3 px-4 font-bold flex items-center gap-2 transition ${
                activeTab === 'views' ? 'border-b-2 border-purple-500 text-white' : 'text-gray-400'
              }`}
            >
              <Eye className="w-5 h-5" />
              Most Viewed
            </button>
          </div>
        )}

        {/* Search Results Header */}
        {searchQuery && (
          <div className="mb-6">
            <h2 className="text-xl font-bold">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            </h2>
          </div>
        )}

        {/* Video Grid */}
        {displayVideos.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-2xl font-black text-gray-400 mb-2">
              {searchQuery ? 'No results found' : 'No videos yet'}
            </p>
            <p className="text-gray-500">
              {searchQuery ? 'Try a different search term' : 'Check back later for trending content'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayVideos.map((video) => (
              <Link key={video.id} href="/marketplace">
                <div className="relative aspect-[9/16] bg-zinc-900 rounded-xl overflow-hidden group cursor-pointer">
                  <video
                    src={video.video_url}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center p-3">
                    <Play className="w-12 h-12 mb-4" />
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <Heart className="w-4 h-4" />
                        <span>{video.likes || 0}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <Eye className="w-4 h-4" />
                        <span>{video.views || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Creator Badge */}
                  <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-sm rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {video.creator_profile_picture ? (
                          <img src={video.creator_profile_picture} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <p className="text-xs font-bold truncate">@{video.creator_username}</p>
                    </div>
                  </div>

                  {/* Stats Badge */}
                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span className="text-xs font-bold">
                      {video.views >= 1000 ? (video.views / 1000).toFixed(1) + 'K' : video.views || 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}