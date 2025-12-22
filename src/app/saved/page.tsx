// src/app/saved/page.tsx — SAVED POSTS PAGE
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { 
  Bookmark, ArrowLeft, Heart, MessageCircle, Share2, 
  MoreHorizontal, Clock, Trash2, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthButton from '@/components/AuthButton';

type SavedPost = {
  id: string;
  created_at: string;
  community_posts: {
    id: string;
    content: string;
    media_urls: string[];
    likes_count: number;
    comments_count: number;
    created_at: string;
    profiles: {
      username: string;
      avatar_url: string | null;
    };
  };
};

export default function SavedPage() {
  const router = useRouter();
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      setUserId(user.id);

      const { data } = await supabase
        .from('saved_posts')
        .select(`
          *,
          community_posts (
            *,
            profiles (username, avatar_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setSavedPosts(data || []);
      setLoading(false);
    };

    fetchSavedPosts();

    // Real-time subscription
    const channel = supabase
      .channel('saved-posts')
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'saved_posts',
          filter: `user_id=eq.${userId}`
        },
        () => fetchSavedPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, userId]);

  const unsavePost = async (id: string) => {
    await supabase
      .from('saved_posts')
      .delete()
      .eq('id', id);

    setSavedPosts(savedPosts.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* Header */}
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6">
        <Link href="/community" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium text-sm">Back</span>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <AuthButton />
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <Bookmark className="w-6 h-6 text-purple-600" />
            Saved Posts
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {savedPosts.length} saved post{savedPosts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading saved posts...</p>
          </div>
        ) : savedPosts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Bookmark className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">No saved posts yet</p>
            <p className="text-sm text-gray-500">Save posts you want to see later</p>
            <Link href="/community">
              <Button className="mt-4 bg-purple-600 hover:bg-purple-700">
                Explore Community
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {savedPosts.map((saved, index) => {
                const post = saved.community_posts;
                return (
                  <motion.div
                    key={saved.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition"
                  >
                    {/* Post Header */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold overflow-hidden">
                          {post.profiles.avatar_url ? (
                            <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : post.profiles.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">
                            @{post.profiles.username}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Saved {new Date(saved.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
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
                        <Button
                          onClick={() => unsavePost(saved.id)}
                          variant="ghost"
                          size="sm"
                          className="text-purple-600 dark:text-purple-400"
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => unsavePost(saved.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}