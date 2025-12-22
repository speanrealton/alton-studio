// src/app/marketplace/profile/page.tsx  ← USER PROFILE - COMPLETE
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Edit2, LogOut, Heart, Video, Users, Flame } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [myVideos, setMyVideos] = useState<any[]>([]);
  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [totalLikesReceived, setTotalLikesReceived] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'videos' | 'liked'>('videos');
  const router = useRouter();

  useEffect(() => {
    loadProfile();

    // Real-time subscription for profile updates
    const channel = supabase
      .channel('profile-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'printing_videos' }, () => {
        console.log('Videos updated, refreshing profile');
        loadProfile();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_follows' }, () => {
        console.log('Follows updated, refreshing profile');
        loadProfile();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_likes' }, () => {
        console.log('Likes updated, refreshing profile');
        loadProfile();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/auth');
      return;
    }

    setUser(user);
    setUsername(user.user_metadata?.username || user.email?.split('@')[0] || '');
    setEmail(user.email || '');
    setBio(user.user_metadata?.bio || '');
    setProfilePicture(user.user_metadata?.profile_picture || null);

    // Load user's videos
    const { data: videos } = await supabase
      .from('printing_videos')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });
    
    setMyVideos(videos || []);

    // Calculate total likes received
    const totalLikes = videos?.reduce((sum, v) => sum + (v.likes || 0), 0) || 0;
    setTotalLikesReceived(totalLikes);

    // Calculate total views
    const totalViews = videos?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;
    setTotalViews(totalViews);

    // Load liked videos
    const { data: allVideos } = await supabase
      .from('printing_videos')
      .select('*');
    
    // Get user's likes from video_likes table
    const { data: userLikesData } = await supabase
      .from('video_likes')
      .select('video_id')
      .eq('user_id', user.id);

    const userLikedVideoIds = new Set(userLikesData?.map(l => l.video_id) || []);
    setUserLikes(userLikedVideoIds);
    
    const liked = allVideos?.filter(v => userLikedVideoIds.has(v.id)) || [];
    setLikedVideos(liked);

    // Load followers/following count
    const { data: followersData } = await supabase
      .from('user_follows')
      .select('*')
      .eq('following_id', user.id);
    
    const { data: followingData } = await supabase
      .from('user_follows')
      .select('*')
      .eq('follower_id', user.id);

    setFollowers(followersData?.length || 0);
    setFollowing(followingData?.length || 0);
    
    setLoading(false);
  };

  const updateProfile = async () => {
    if (!user) return;

    setLoading(true);
    setMessage('');

    try {
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          username,
          bio,
          profile_picture: profilePicture
        }
      });

      if (error) throw error;

      setMessage('✓ Profile updated!');
      setEditing(false);
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadProfilePicture = async (file: File) => {
    if (!user) return;

    setUploadingPicture(true);
    setMessage('');

    try {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Image must be less than 2MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setProfilePicture(publicUrl);

      // Update user metadata
      await supabase.auth.updateUser({
        data: {
          profile_picture: publicUrl
        }
      });

      setMessage('✓ Profile picture updated!');
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    } finally {
      setUploadingPicture(false);
    }
  };

  const removeProfilePicture = async () => {
    if (!user || !profilePicture) return;

    try {
      setProfilePicture(null);
      
      await supabase.auth.updateUser({
        data: {
          profile_picture: null
        }
      });

      setMessage('✓ Profile picture removed!');
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-4xl font-black animate-pulse">Loading...</div>
      </div>
    );
  }

  const displayVideos = activeTab === 'videos' ? myVideos : likedVideos;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <div className="border-b border-white/10 bg-black/80 backdrop-blur-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/marketplace" className="text-xl font-black">
            ← Back
          </Link>
          <h1 className="text-2xl font-black">Profile</h1>
          <button onClick={logout} className="text-red-400 flex items-center gap-2">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* PROFILE HEADER */}
        <div className="flex items-start gap-8 mb-12">
          {/* PROFILE PICTURE */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden border-4 border-white/20">
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-white" />
              )}
            </div>

            {/* UPLOAD/REMOVE BUTTONS */}
            <div className="absolute -bottom-2 -right-2 flex gap-2">
              <label className="bg-gradient-to-r from-purple-600 to-pink-600 p-2.5 rounded-full cursor-pointer hover:scale-110 transition shadow-xl">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadProfilePicture(file);
                  }}
                  className="hidden"
                  disabled={uploadingPicture}
                />
                <Edit2 className="w-4 h-4 text-white" />
              </label>

              {profilePicture && (
                <button
                  onClick={removeProfilePicture}
                  className="bg-red-500 p-2.5 rounded-full hover:scale-110 transition shadow-xl"
                  title="Remove picture"
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {uploadingPicture && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                <div className="text-white text-xs font-bold">Uploading...</div>
              </div>
            )}
          </div>

          <div className="flex-1">
            {editing ? (
              <div className="space-y-4">
                <input
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                />
                <input
                  placeholder="Email"
                  value={email}
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/50"
                />
                <textarea
                  placeholder="Bio"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white h-24"
                />
                <div className="flex gap-3">
                  <button
                    onClick={updateProfile}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 rounded-full font-bold"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="bg-white/10 px-8 py-3 rounded-full font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-3xl font-black">{username}</h2>
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-400 mb-4">{email}</p>
                {bio && <p className="text-white mb-4">{bio}</p>}

                {/* STATS */}
                <div className="flex gap-8">
                  <div className="text-center">
                    <p className="text-2xl font-black">{myVideos.length}</p>
                    <p className="text-sm text-gray-400">Videos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black">{followers}</p>
                    <p className="text-sm text-gray-400">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black">{following}</p>
                    <p className="text-sm text-gray-400">Following</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-red-500">{totalLikesReceived}</p>
                    <p className="text-sm text-gray-400">Likes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-blue-500">{totalViews.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Views</p>
                  </div>
                </div>
              </>
            )}

            {message && (
              <div className={`mt-4 text-sm font-bold ${message.includes('✓') ? 'text-green-400' : 'text-red-400'}`}>
                {message}
              </div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="border-b border-white/10 mb-8">
          <div className="flex gap-8">
            <button 
              onClick={() => setActiveTab('videos')}
              className={`pb-4 border-b-2 font-bold flex items-center gap-2 transition ${
                activeTab === 'videos' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Video className="w-5 h-5" /> My Videos ({myVideos.length})
            </button>
            <button 
              onClick={() => setActiveTab('liked')}
              className={`pb-4 border-b-2 font-bold flex items-center gap-2 transition ${
                activeTab === 'liked' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Heart className="w-5 h-5" /> Liked ({likedVideos.length})
            </button>
          </div>
        </div>

        {/* VIDEOS GRID */}
        {displayVideos.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {displayVideos.map((video) => {
              const isLikedByCurrentUser = userLikes.has(video.id);
              
              return (
                <Link key={video.id} href="/marketplace">
                  <div className="aspect-[9/16] bg-zinc-900 rounded-xl overflow-hidden relative group cursor-pointer">
                    <video
                      src={video.video_url}
                      className="w-full h-full object-cover"
                    />
                    {/* Liked indicator */}
                    {isLikedByCurrentUser && (
                      <div className="absolute top-2 right-2 bg-orange-500 rounded-full p-1.5">
                        <Flame className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <div className="text-center">
                        <Flame className={`w-8 h-8 mx-auto mb-2 ${isLikedByCurrentUser ? 'text-orange-500' : ''}`} />
                        <p className="font-bold">{video.likes || 0}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            {activeTab === 'videos' ? (
              <>
                <Video className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-2xl font-black mb-2">No videos yet</p>
                <p className="text-gray-400 mb-6">Start creating content!</p>
                <Link href="/marketplace/upload">
                  <button className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-full font-bold">
                    Upload Your First Video
                  </button>
                </Link>
              </>
            ) : (
              <>
                <Heart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-2xl font-black mb-2">No liked videos</p>
                <p className="text-gray-400 mb-6">Start liking videos you love!</p>
                <Link href="/marketplace">
                  <button className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-full font-bold">
                    Explore Videos
                  </button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}