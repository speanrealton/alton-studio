// src/app/community/post/create/page.tsx — FIXED VERSION
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { 
  X, Image as ImageIcon, Video, ArrowLeft, Loader2, 
  AlertCircle, ChevronDown, Globe 
} from 'lucide-react';
import { motion } from 'framer-motion';
import AuthButton from '@/components/AuthButton';

type Circle = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

export default function CreatePost() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const circleSlug = searchParams?.get('circle');

  const [content, setContent] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [showCirclePicker, setShowCirclePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndCircles = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth?redirect=/community/post/create');
        return;
      }
      
      setUserId(user.id);

      // Fetch user's circles
      const { data, error: fetchError } = await supabase
        .from('circle_members')
        .select('circles(id, name, slug, icon)')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Error fetching circles:', fetchError);
        setError('Failed to load your circles');
        setInitialLoading(false);
        return;
      }

      const userCircles = (data || []).flatMap((m: any) => m.circles || []).filter(Boolean) as Circle[] || [];
      setCircles(userCircles);

      // If circle slug provided, select that circle
      if (circleSlug && userCircles.length > 0) {
        const circle = userCircles.find(c => c.slug === circleSlug);
        if (circle) {
          setSelectedCircle(circle);
        }
      } else if (userCircles.length > 0) {
        setSelectedCircle(userCircles[0]);
      }

      setInitialLoading(false);
    };

    fetchUserAndCircles();
  }, [router, circleSlug]);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum size is 50MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload an image or video');
      return;
    }

    setMediaFile(file);
    setError(null);
    
    const reader = new FileReader();
    reader.onloadend = () => setMediaPreview(reader.result as string);
    reader.onerror = () => setError('Failed to read file');
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaPreview(null);
    setMediaFile(null);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile) {
      setError('Please add content or media to your post');
      return;
    }

    if (!userId) {
      setError('You must be logged in to post');
      router.push('/auth');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let mediaUrl = null;

      // Upload media if exists
      if (mediaFile) {
        const fileExt = mediaFile.type.startsWith('video') ? 'mp4' : 'jpg';
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('community-media')
          .upload(fileName, mediaFile, { 
            contentType: mediaFile.type,
            upsert: false 
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        if (uploadData?.path) {
          const { data: urlData } = supabase.storage
            .from('community-media')
            .getPublicUrl(uploadData.path);
          mediaUrl = urlData.publicUrl;
        }
      }

      // Create post
      const { error: insertError } = await supabase.from('community_posts').insert({
        content: content.trim(),
        media_urls: mediaUrl ? [mediaUrl] : [],
        circle_id: selectedCircle?.id || null,
        user_id: userId,
        post_type: 'post',
        likes_count: 0,
        comments_count: 0,
      });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`Failed to create post: ${insertError.message}`);
      }

      // Redirect based on where post was created
      if (selectedCircle) {
        router.push(`/community/circle/${selectedCircle.slug}`);
      } else {
        router.push('/community');
      }
    } catch (err: any) {
      console.error('Post creation error:', err);
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
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
          <span className="font-medium text-sm">Cancel</span>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={loading || (!content.trim() && !mediaFile)}
          className="bg-purple-600 hover:bg-purple-700 text-sm disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Posting...
            </>
          ) : (
            'Post'
          )}
        </Button>
      </header>

      <main className="max-w-2xl mx-auto p-4 lg:p-6">
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Post</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Share your thoughts with the community</p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-red-900 dark:text-red-200">Error</p>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4 text-red-600" />
            </button>
          </motion.div>
        )}

        {/* Circle Picker */}
        {circles.length > 0 && (
          <div className="mb-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <button
              onClick={() => setShowCirclePicker(!showCirclePicker)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg overflow-hidden">
                  {selectedCircle?.icon ? (
                    selectedCircle.icon.startsWith('http') ? (
                      <img src={selectedCircle.icon} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{selectedCircle.icon}</span>
                    )
                  ) : (
                    <Globe className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Posting to</p>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    {selectedCircle?.name || 'Public Feed'}
                  </p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition ${showCirclePicker ? 'rotate-180' : ''}`} />
            </button>

            {showCirclePicker && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                {circles.map(circle => (
                  <button
                    key={circle.id}
                    onClick={() => { 
                      setSelectedCircle(circle); 
                      setShowCirclePicker(false); 
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm overflow-hidden">
                      {circle.icon ? (
                        circle.icon.startsWith('http') ? (
                          <img src={circle.icon} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{circle.icon}</span>
                        )
                      ) : (
                        circle.name[0]
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{circle.name}</span>
                  </button>
                ))}
                <button
                  onClick={() => { 
                    setSelectedCircle(null); 
                    setShowCirclePicker(false); 
                  }}
                  className="w-full px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3"
                >
                  <Globe className="w-5 h-5" />
                  Public Feed
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content Input */}
        <div className="mb-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <textarea
            placeholder="What's on your mind? Share your designs, ask questions, or start a discussion..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            rows={8}
            className="w-full bg-transparent border-0 focus:outline-none text-sm text-gray-900 dark:text-white resize-none placeholder:text-gray-400"
            autoFocus
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">{content.length}/1000</p>
            {content.length >= 900 && (
              <p className="text-xs text-orange-600">{1000 - content.length} characters left</p>
            )}
          </div>
        </div>

        {/* Media Preview */}
        {mediaPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden relative"
          >
            {mediaFile?.type.startsWith('video') ? (
              <video src={mediaPreview} controls className="w-full max-h-96" />
            ) : (
              <img src={mediaPreview} alt="Preview" className="w-full max-h-96 object-contain bg-gray-100 dark:bg-gray-900" />
            )}
            <button
              onClick={removeMedia}
              className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center hover:bg-black transition"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </motion.div>
        )}

        {/* Upload Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <label className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition group">
            <ImageIcon className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Add Photo</span>
            <span className="text-xs text-gray-500 mt-1">JPG, PNG, GIF</span>
            <input 
              type="file" 
              accept="image/jpeg,image/png,image/gif,image/webp" 
              onChange={handleMediaUpload} 
              className="hidden" 
            />
          </label>

          <label className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition group">
            <Video className="w-8 h-8 text-pink-600 mb-2 group-hover:scale-110 transition" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Add Video</span>
            <span className="text-xs text-gray-500 mt-1">MP4, MOV (max 50MB)</span>
            <input 
              type="file" 
              accept="video/mp4,video/quicktime" 
              onChange={handleMediaUpload} 
              className="hidden" 
            />
          </label>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <p className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-2">Tips for great posts:</p>
          <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
            <li>• Be clear and specific about what you're sharing</li>
            <li>• Add images or videos to make your post more engaging</li>
            <li>• Use proper grammar and formatting</li>
            <li>• Be respectful and follow community guidelines</li>
          </ul>
        </div>
      </main>
    </div>
  );
}