// src/app/marketplace/user/[id]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { User, ArrowLeft, Heart, Video, Share2, Flame, Eye, MessageCircle, Star } from 'lucide-react';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [bio, setBio] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  useEffect(() => {
    loadProfile();
    
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user);
      if (data.user) {
        checkFollowing(data.user.id);
      }
    });

    // Real-time updates
    const channel = supabase
      .channel('user-profile-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'printing_videos' }, (payload: any) => {
        if (payload.new) {
          setVideos(prev => prev.map(v => 
            v.id === payload.new.id ? payload.new : v
          ));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'printing_videos' }, () => {
        loadProfile();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_follows' }, () => {
        loadProfile();
        if (currentUser) checkFollowing(currentUser.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    Object.keys(videoRefs.current).forEach((videoId) => {
      const video = videoRefs.current[videoId];
      if (video && video.paused) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            if (err.name !== 'AbortError') console.log('Auto-play error:', err);
          });
        }
      }
    });
  }, [videos]);

  const loadProfile = async () => {
    try {
      // Always get creator info from videos table - most reliable source
      const { data: videosData } = await supabase
        .from('printing_videos')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });
      
      if (videosData && videosData.length > 0) {
        const firstVideo = videosData[0];
        setUsername(firstVideo.creator_username || 'Creator');
        setProfileImage(firstVideo.creator_profile_picture || '');
        setBio(firstVideo.creator_bio || '');
        setVideos(videosData);

        // Calculate total views and likes
        let totalV = 0;
        let totalL = 0;
        videosData.forEach(v => {
          totalV += v.views || 0;
          totalL += v.likes || 0;
        });
        setTotalViews(totalV);
        setTotalLikes(totalL);
      } else {
        setUsername('Creator');
        setVideos([]);
      }

      const { data: followersData } = await supabase
        .from('user_follows')
        .select('*')
        .eq('following_id', userId);
      
      setFollowers(followersData?.length || 0);

      const { data: followingData } = await supabase
        .from('user_follows')
        .select('*')
        .eq('follower_id', userId);
      
      setFollowing(followingData?.length || 0);

    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowing = async (currentUserId: string) => {
    const { data } = await supabase
      .from('user_follows')
      .select('*')
      .eq('follower_id', currentUserId)
      .eq('following_id', userId)
      .single();
    
    setIsFollowing(!!data);
  };

  const toggleFollow = async () => {
    if (!currentUser) {
      alert('Log in to follow users');
      return;
    }

    if (isFollowing) {
      await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId);
      
      setIsFollowing(false);
      setFollowers(prev => prev - 1);
    } else {
      await supabase
        .from('user_follows')
        .insert({
          follower_id: currentUser.id,
          following_id: userId
        });
      
      setIsFollowing(true);
      setFollowers(prev => prev + 1);
    }
  };

  const incrementView = async (videoId: string) => {
    try {
      const currentVideo = videos.find(v => v.id === videoId);
      const newViews = (currentVideo?.views || 0) + 1;

      const { error } = await supabase
        .from('printing_videos')
        .update({ views: newViews })
        .eq('id', videoId);

      if (error) {
        console.error('Error updating views:', error);
        return;
      }

      setVideos(prev => prev.map(v => 
        v.id === videoId ? { ...v, views: newViews } : v
      ));
    } catch (err) {
      console.error('Error incrementing view:', err);
    }
  };

  const copyProfileLink = () => {
    const link = `${window.location.origin}/marketplace/user/${userId}`;
    navigator.clipboard.writeText(link);
    alert('Profile link copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-3 border-purple-600 border-t-pink-600 animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-black">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!username) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-black mb-4">Creator Not Found</p>
          <Link href="/marketplace">
            <button className="text-purple-400 hover:text-pink-400 underline font-bold transition">Back to Feed</button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Header */}
      <header className="border-b border-white/10 bg-black sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
            <span className="font-bold text-xs">Back</span>
          </button>
          <h1 className="text-lg font-black text-white">Creator Profile</h1>
          <button 
            onClick={copyProfileLink}
            className="text-gray-400 hover:text-white transition"
            title="Copy profile link"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* Profile Hero Section */}
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mb-4">
            {/* Profile Card */}
            <div className="md:col-span-2">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  {/* Profile Picture */}
                  <div className="relative group">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden border-3 border-black">
                      {profileImage ? (
                        <img 
                          src={profileImage} 
                          alt={username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
                          <User className="w-10 h-10 text-white/80" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Creator Info */}
                  <div className="flex-1">
                    <div className="mb-3">
                      <h1 className="text-2xl sm:text-3xl font-black mb-1 text-white">@{username}</h1>
                      {bio && (
                        <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">{bio}</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {isOwnProfile ? (
                        <Link href="/marketplace/profile">
                          <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-5 py-2 rounded-full font-bold text-sm transition hover:scale-105">
                            ✏️ Edit
                          </button>
                        </Link>
                      ) : (
                        <>
                          <button
                            onClick={toggleFollow}
                            className={`px-5 py-2 rounded-full font-bold text-sm transition ${
                              isFollowing
                                ? 'bg-white/10 border border-white/30 hover:bg-white/20'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg'
                            }`}
                          >
                            {isFollowing ? '✓ Following' : '+ Follow'}
                          </button>
                          <button 
                            onClick={copyProfileLink}
                            className="bg-white/10 border border-white/30 hover:bg-white/20 px-5 py-2 rounded-full font-bold text-sm transition flex items-center gap-2"
                          >
                            <Share2 className="w-3 h-3" />
                            Share
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <h3 className="text-sm font-black mb-4 text-purple-200">Stats</h3>
              
              <div className="space-y-3">
                {/* Videos */}
                <div className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Video className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-gray-300 font-semibold text-sm">Videos</span>
                    </div>
                    <p className="text-lg font-black text-blue-400">{videos.length}</p>
                  </div>
                </div>

                {/* Followers */}
                <div className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                        <Heart className="w-4 h-4 text-pink-400" />
                      </div>
                      <span className="text-gray-300 font-semibold text-sm">Followers</span>
                    </div>
                    <p className="text-lg font-black text-pink-400">{followers}</p>
                  </div>
                </div>

                {/* Following */}
                <div className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="text-gray-300 font-semibold text-sm">Following</span>
                    </div>
                    <p className="text-lg font-black text-purple-400">{following}</p>
                  </div>
                </div>

                {/* Total Views */}
                <div className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Eye className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="text-gray-300 font-semibold text-sm">Views</span>
                    </div>
                    <p className="text-lg font-black text-green-400">{totalViews}</p>
                  </div>
                </div>

                {/* Total Likes */}
                <div className="bg-white/5 rounded-xl p-3 hover:bg-white/10 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <Flame className="w-4 h-4 text-red-400" />
                      </div>
                      <span className="text-gray-300 font-semibold text-sm">Likes</span>
                    </div>
                    <p className="text-lg font-black text-red-400">{totalLikes}</p>
                  </div>
                </div>

                {/* Engagement Rate */}
                {totalViews > 0 && (
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                          <Star className="w-4 h-4 text-yellow-400" />
                        </div>
                        <span className="text-gray-300 font-semibold text-sm">Engagement</span>
                      </div>
                      <p className="text-lg font-black text-yellow-400">{((totalLikes / totalViews) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Videos Section */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                <Video className="w-4 h-4 text-white" />
              </div>
              Videos
            </h2>
            <span className="text-gray-400 text-sm font-bold">({videos.length})</span>
          </div>

          {videos.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-12">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="aspect-[9/16] rounded-lg overflow-hidden relative group cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 border border-white/10 hover:border-purple-500/50"
                >
                  {/* Video */}
                  <video
                    ref={(el) => {
                      if (el) videoRefs.current[video.id] = el;
                    }}
                    src={video.video_url}
                    className="w-full h-full object-cover bg-black"
                    onEnded={() => incrementView(video.id)}
                    onLoadedMetadata={() => {
                      const videoEl = videoRefs.current[video.id];
                      if (videoEl && videoEl.paused) {
                        const playPromise = videoEl.play();
                        if (playPromise !== undefined) {
                          playPromise.catch(err => {
                            if (err.name !== 'AbortError') console.log('Auto-play error:', err);
                          });
                        }
                      }
                    }}
                    muted
                    loop
                    playsInline
                  />

                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="text-center">
                          <Flame className="w-3 h-3 text-red-400 mx-auto" />
                          <span className="font-bold text-xs text-red-400">{video.likes || 0}</span>
                        </div>
                        <div className="text-center">
                          <Eye className="w-3 h-3 text-green-400 mx-auto" />
                          <span className="font-bold text-xs text-green-400">{video.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                <Video className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-lg font-black mb-1 text-gray-400">No Videos Yet</p>
              <p className="text-xs text-gray-500 mb-4">No uploads yet</p>
              {isOwnProfile && (
                <Link href="/marketplace/upload">
                  <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-4 rounded-full font-bold transition transform hover:scale-105 shadow-lg">
                    🎥 Upload Your First Video
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
