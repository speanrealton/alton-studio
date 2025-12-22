'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: { username: string; avatar_url: string | null };
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { username: string; avatar_url: string | null };
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);

          // Check if post is liked
          const { data: likeData } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .single();
          setIsLiked(!!likeData);

          // Check if post is saved
          const { data: saveData } = await supabase
            .from('saved_posts')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .single();
          setIsSaved(!!saveData);
        }

        // Fetch post with fallback if profile join fails
        let postData = null;
        const { data: postWithProfile, error: postError } = await supabase
          .from('community_posts')
          .select(`*, profiles(username, avatar_url)`)
          .eq('id', postId)
          .single();

        if (postError) {
          console.error('Error fetching post with profile:', postError);
          // Fallback: fetch post without profile
          const { data: postOnly } = await supabase
            .from('community_posts')
            .select('*')
            .eq('id', postId)
            .single();
          postData = postOnly;
        } else {
          postData = postWithProfile;
        }
        
        setPost(postData);

        // Fetch comments with fallback - use separate queries for better reliability
        try {
          const { data: commentsOnly, error: commentsError } = await supabase
            .from('post_comments')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

          if (commentsError) {
            console.error('Error fetching comments:', commentsError);
            setComments([]);
          } else if (commentsOnly && commentsOnly.length > 0) {
            // Fetch profiles separately for all comment authors
            const userIds = [...new Set(commentsOnly.map(c => c.user_id))];
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .in('id', userIds);

            if (profilesError) {
              console.error('Error fetching profiles:', {
                message: profilesError.message,
                code: profilesError.code,
                details: profilesError.details
              });
              // Still show comments even if profiles fail
              setComments(commentsOnly.map(comment => ({
                ...comment,
                profiles: { username: 'Unknown User', avatar_url: null }
              })) as Comment[]);
            } else {
              // Create a map of profiles by user_id
              const profilesMap = new Map();
              profilesData?.forEach(p => {
                profilesMap.set(p.id, p);
              });

              // Attach profiles to comments
              const commentsWithProfiles = commentsOnly.map(comment => ({
                ...comment,
                profiles: profilesMap.get(comment.user_id) || { username: 'Unknown User', avatar_url: null }
              }));

              setComments(commentsWithProfiles as Comment[]);
            }
          } else {
            setComments([]);
          }
        } catch (err) {
          console.error('Unexpected error fetching comments:', err);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error in fetchPost:', error);
        setLoading(false);
      }
    };

    fetchPost();

    // Subscribe to real-time like updates
    const likesChannel = supabase.channel(`post_likes_${postId}`).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'post_likes', filter: `post_id=eq.${postId}` },
      async () => {
        // Recalculate like count
        const { count: likesCount } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);
        setPost(post ? { ...post, likes_count: likesCount || 0 } : null);
      }
    ).subscribe();

    // Subscribe to real-time comment updates
    const commentsChannel = supabase.channel(`post_comments_${postId}`).on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'post_comments', filter: `post_id=eq.${postId}` },
      async () => {
        // Fetch updated comments
        const { data: commentsData } = await supabase
          .from('post_comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });
        
        if (commentsData && commentsData.length > 0) {
          // Fetch profiles for all comment authors
          const userIds = [...new Set(commentsData.map(c => c.user_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds);

          // Create a map of profiles by user_id
          const profilesMap = new Map();
          profilesData?.forEach(p => {
            profilesMap.set(p.id, p);
          });

          // Attach profiles to comments
          const commentsWithProfiles = commentsData.map(comment => ({
            ...comment,
            profiles: profilesMap.get(comment.user_id) || { username: 'Unknown User', avatar_url: null }
          }));

          setComments(commentsWithProfiles as Comment[]);
        } else {
          setComments([]);
        }

        // Recalculate comment count
        const { count: commentsCount } = await supabase
          .from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);
        setPost(post ? { ...post, comments_count: commentsCount || 0 } : null);
      }
    ).subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [postId, comments]);

  const handleLike = async () => {
    if (!userId) {
      window.location.href = '/auth';
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
        setIsLiked(false);
        setPost(post ? { ...post, likes_count: Math.max(0, post.likes_count - 1) } : null);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: userId });
        setIsLiked(true);
        setPost(post ? { ...post, likes_count: post.likes_count + 1 } : null);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleSave = async () => {
    if (!userId) {
      window.location.href = '/auth';
      return;
    }

    try {
      if (isSaved) {
        await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
        setIsSaved(false);
      } else {
        await supabase
          .from('saved_posts')
          .insert({ post_id: postId, user_id: userId });
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !commentText.trim()) return;

    setSubmittingComment(true);
    try {
      // Insert comment
      const { data: insertResult, error: insertError } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: userId,
          content: commentText
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Error inserting comment - details:', {
          error: insertError,
          message: insertError?.message,
          details: (insertError as any)?.details,
          hint: (insertError as any)?.hint
        });
        alert(`Failed to post comment: ${insertError?.message || 'Unknown error'}`);
        return;
      }

      if (!insertResult) {
        console.error('No result returned from insert');
        alert('Failed to post comment: No result');
        return;
      }

      // Fetch the full comment with profile data - use separate queries for reliability
      const { data: newCommentOnly, error: fetchError } = await supabase
        .from('post_comments')
        .select('*')
        .eq('id', insertResult.id)
        .single();

      console.log('Fetched comment:', newCommentOnly, 'Error:', fetchError);

      if (fetchError || !newCommentOnly) {
        console.error('Error fetching comment:', fetchError);
        alert(`Failed to fetch comment: ${fetchError?.message || 'Unknown error'}`);
        return;
      }

      // Fetch the user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .single();

      console.log('Fetched profile:', profileData, 'Error:', profileError);

      if (profileError) {
        console.error('Error fetching profile for new comment:', profileError);
      }

      const commentWithProfile = {
        ...newCommentOnly,
        profiles: profileData || { username: 'Unknown User', avatar_url: null }
      };

      console.log('Comment with profile:', commentWithProfile);

      // Use functional update to ensure we have the latest comments array
      setComments(prevComments => [...prevComments, commentWithProfile as Comment]);
      setCommentText('');
      const { count: commentsCount } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
      setPost(post ? { ...post, comments_count: commentsCount || 0 } : null);
    } catch (error) {
      console.error('Error in handleComment:', error);
      alert(`Error posting comment: ${(error as Error)?.message || 'Unknown error'}`);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Post by @${post?.profiles?.username}`,
        text: post?.content,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Post Not Found</h1>
        <Link href="/community" className="text-purple-600 dark:text-purple-400 hover:underline">
          Back to Community
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 bg-white dark:bg-gray-800/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/community" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Post Details</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Post */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          {/* Author */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
              {post.profiles?.avatar_url ? (
                <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                post.profiles?.username?.[0]?.toUpperCase()
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">@{post.profiles?.username}</p>
              <p className="text-xs text-gray-500">
                {new Date(post.created_at).toLocaleDateString()} {new Date(post.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-gray-900 dark:text-gray-100 text-lg mb-4">{post.content}</p>

            {/* Media */}
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                {post.media_urls.map((url, idx) => (
                  <img key={idx} src={url} alt="" className="rounded-lg w-full h-48 object-cover" />
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isLiked ? 'text-red-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">{post.likes_count}</span>
              </button>

              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{post.comments_count}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isSaved ? 'text-purple-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Comments ({comments.length})</h2>

          {/* Comment Form */}
          {userId && (
            <form onSubmit={handleComment} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0" />
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || submittingComment}
                  className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition text-sm font-medium"
                >
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                  {comment.profiles?.avatar_url ? (
                    <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    comment.profiles?.username?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">@{comment.profiles?.username}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{comment.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(comment.created_at).toLocaleDateString()} {new Date(comment.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
