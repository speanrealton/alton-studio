// src/app/community/circle/[slug]/page.tsx — FIXED VERSION
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { 
  Users, Lock, Globe, MessageCircle, Plus, ArrowLeft, Share2, 
  Bell, BellOff, Settings, MoreHorizontal, Heart, Bookmark, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import AuthButton from '@/components/AuthButton';

type Circle = {
  id: string;
  name: string;
  slug: string;
  description: string;
  cover_image: string | null;
  icon: string | null;
  member_count: number;
  is_private: boolean;
  category: string;
  creator_id: string;
};

type Post = {
  id: string;
  content: string;
  media_urls: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: { username: string; avatar_url: string | null };
};

export default function CirclePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  
  const [circle, setCircle] = useState<Circle | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCircle = useCallback(async () => {
    try {
      const { data: circleData, error: circleError } = await supabase
        .from('circles')
        .select('*')
        .eq('slug', slug)
        .single();

      if (circleError || !circleData) {
        console.error('Circle fetch error:', circleError);
        setError('Circle not found');
        setLoading(false);
        return;
      }

      setCircle(circleData);

      // Check if user is member
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: memberData } = await supabase
          .from('circle_members')
          .select('user_id')
          .eq('circle_id', circleData.id)
          .eq('user_id', user.id)
          .single();
        setIsMember(!!memberData);
      }

      // Fetch posts
      const { data: postData, error: postError } = await supabase
        .from('community_posts')
        .select('*, profiles(username, avatar_url)')
        .eq('circle_id', circleData.id)
        .order('created_at', { ascending: false });

      if (postError) {
        console.error('Posts fetch error:', postError);
      }

      setPosts(postData || []);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load circle');
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    
    fetchCircle();

    // Real-time subscriptions
    const postsChannel = supabase
      .channel(`circle-posts-${slug}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'community_posts' },
        () => fetchCircle()
      )
      .subscribe();

    const membersChannel = supabase
      .channel(`circle-members-${slug}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'circle_members' },
        () => fetchCircle()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(membersChannel);
    };
  }, [slug, fetchCircle]);

  const handleJoin = async () => {
    if (!circle) return;

    if (!userId) {
      router.push(`/auth?redirect=/community/circle/${slug}`);
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const { error: joinError } = await supabase.from('circle_members').insert({
        circle_id: circle.id,
        user_id: userId,
        role: 'member'
      });

      if (joinError) {
        console.error('Join error:', joinError);
        throw new Error('Failed to join circle');
      }

      setIsMember(true);
      setCircle({ ...circle, member_count: circle.member_count + 1 });

      // Update member count in database
      await supabase
        .from('circles')
        .update({ member_count: circle.member_count + 1 })
        .eq('id', circle.id);

      // Create notification for circle creator
      await supabase.from('notifications').insert({
        user_id: circle.creator_id,
        type: 'circle_join',
        title: 'New Member',
        message: `Someone joined ${circle.name}`,
        link: `/community/circle/${circle.slug}`,
        read: false
      });
    } catch (err: any) {
      console.error('Join error:', err);
      setError(err.message || 'Failed to join circle');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!circle || !userId) return;

    setIsJoining(true);
    setError(null);

    try {
      const { error: leaveError } = await supabase
        .from('circle_members')
        .delete()
        .eq('circle_id', circle.id)
        .eq('user_id', userId);

      if (leaveError) {
        console.error('Leave error:', leaveError);
        throw new Error('Failed to leave circle');
      }

      setIsMember(false);
      setCircle({ ...circle, member_count: Math.max(0, circle.member_count - 1) });

      // Update member count in database
      await supabase
        .from('circles')
        .update({ member_count: Math.max(0, circle.member_count - 1) })
        .eq('id', circle.id);
    } catch (err: any) {
      console.error('Leave error:', err);
      setError(err.message || 'Failed to leave circle');
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading circle...</p>
        </div>
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'Circle not found'}</p>
          <Link href="/community">
            <Button>Back to Community</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* Header */}
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
        <Link href="/community" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium text-sm">Back</span>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            <Share2 className="w-4 h-4" />
          </Button>
          <AuthButton />
        </div>
      </header>

      {/* Cover Section */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-purple-600 to-pink-600">
        {circle.cover_image && (
          <Image 
            src={circle.cover_image} 
            alt={circle.name} 
            fill 
            className="object-cover" 
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Circle Info */}
      <div className="max-w-5xl mx-auto px-4 lg:px-6">
        <div className="relative -mt-16 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            {/* Icon */}
            <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-2xl border-4 border-white dark:border-gray-900 flex items-center justify-center overflow-hidden shadow-xl">
              {circle.icon ? (
                circle.icon.startsWith('http') ? (
                  <Image 
                    src={circle.icon} 
                    alt="" 
                    width={128} 
                    height={128} 
                    className="w-full h-full object-cover" 
                    unoptimized
                  />
                ) : (
                  <span className="text-5xl">{circle.icon}</span>
                )
              ) : (
                <Users className="w-16 h-16 text-purple-600" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {circle.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {circle.member_count.toLocaleString()} members
                </span>
                <span className="flex items-center gap-1">
                  {circle.is_private ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                  {circle.is_private ? 'Private' : 'Public'}
                </span>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                  {circle.category}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {userId === circle.creator_id && (
                <Link href={`/community/circle/${slug}/edit`}>
                  <Button variant="outline" className="text-sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Circle
                  </Button>
                </Link>
              )}
              {isMember ? (
                <>
                  <Button
                    onClick={handleLeave}
                    disabled={isJoining}
                    variant="outline"
                    className="text-sm"
                  >
                    <BellOff className="w-4 h-4 mr-2" />
                    {isJoining ? 'Leaving...' : 'Leave'}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="bg-purple-600 hover:bg-purple-700 text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isJoining ? 'Joining...' : 'Join Circle'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Description */}
        {circle.description && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-3">About</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {circle.description}
            </p>
          </div>
        )}

        {/* Posts Feed */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Posts</h2>
            {isMember && (
              <Link href={`/community/post/create?circle=${circle.slug}`}>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" /> New Post
                </Button>
              </Link>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <MessageCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">No posts yet</p>
              {isMember && <p className="text-sm text-gray-500">Be the first to post!</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                >
                  {/* Post Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold overflow-hidden">
                        {post.profiles.avatar_url ? (
                          <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          post.profiles.username[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">
                          @{post.profiles.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Post Content */}
                  <div className="px-4 pb-3">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                      {post.content}
                    </p>
                  </div>

                  {/* Post Media */}
                  {post.media_urls?.[0] && (
                    <div className="relative">
                      {post.media_urls[0].endsWith('.mp4') ? (
                        <video src={post.media_urls[0]} controls className="w-full" />
                      ) : (
                        <img src={post.media_urls[0]} alt="" className="w-full object-cover max-h-96" />
                      )}
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-red-600">
                        <Heart className="w-4 h-4 mr-1.5" />
                        <span className="text-xs">{post.likes_count}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400 hover:text-purple-600">
                        <MessageCircle className="w-4 h-4 mr-1.5" />
                        <span className="text-xs">{post.comments_count}</span>
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                        <Bookmark className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      {isMember && (
        <Link href={`/community/post/create?circle=${circle.slug}`}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg z-40"
          >
            <Plus className="w-6 h-6 text-white" />
          </motion.button>
        </Link>
      )}
    </div>
  );
}