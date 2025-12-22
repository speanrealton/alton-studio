// src/app/marketplace/upload/page.tsx  ← CLEAN & SIMPLE UPLOAD
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Video, X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function UploadPrintVideo() {
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [productSlug, setProductSlug] = useState('');
  const [description, setDescription] = useState('');
  const [shopLink, setShopLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleVideoSelect = (file: File | null) => {
    if (!file) {
      setVideo(null);
      setVideoPreview(null);
      setMessage('');
      return;
    }

    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage(`Video too large! Max 15MB. Your file: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      setVideo(null);
      setVideoPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);

    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    
    videoElement.onloadedmetadata = () => {
      window.URL.revokeObjectURL(videoElement.src);
      const duration = videoElement.duration;
      
      setVideoDuration(duration);
      
      if (duration > 60) {
        setMessage(`Video too long! Max 60 seconds. Your video: ${duration.toFixed(1)}s`);
        setVideo(null);
        setVideoPreview(null);
      } else {
        setVideo(file);
        setMessage('');
      }
    };

    videoElement.src = previewUrl;
  };

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideo(null);
    setVideoPreview(null);
    setMessage('');
    setVideoDuration(0);
  };

  const upload = async () => {
    if (!user || !video || !productSlug.trim()) {
      setMessage('Please fill all required fields');
      return;
    }

    setUploading(true);
    setMessage('');
    setSuccess(false);
    setUploadProgress(0);

    try {
      const fileExt = video.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from('prints')
        .upload(fileName, video, { cacheControl: '3600', upsert: false });

      clearInterval(progressInterval);
      setUploadProgress(95);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('prints').getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('printing_videos')
        .insert({
          video_url: publicUrl,
          creator_name: user.email?.split('@')[0] || 'creator',
          creator_username: user.user_metadata?.username || user.email?.split('@')[0] || 'creator',
          creator_profile_picture: user.user_metadata?.profile_picture || null,
          creator_id: user.id,
          tagged_product_slug: productSlug.trim().toLowerCase().replace(/ /g, '-'),
          description: description.trim() || null,
          shop_link: shopLink.trim() || null,
          likes: 0,
          liked_by: [],
          views: 0
        });

      if (dbError) throw dbError;

      setUploadProgress(100);
      setSuccess(true);
      setMessage('Video uploaded successfully!');
      
      setTimeout(() => router.push('/marketplace'), 2000);

    } catch (err: any) {
      setMessage('Error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Upload className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-6">Please log in to upload videos</p>
          <Link href="/auth">
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 rounded-full font-bold hover:scale-105 transition">
              Log In
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/95 backdrop-blur-lg sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/marketplace" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Feed</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black">Upload Video</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-8 p-4 bg-white/5 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden flex-shrink-0">
            {user.user_metadata?.profile_picture ? (
              <img src={user.user_metadata.profile_picture} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold">{user.email?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-400">Posting as</p>
            <p className="font-bold truncate">{user.user_metadata?.username || user.email?.split('@')[0]}</p>
          </div>
        </div>

        {/* Requirements Info */}
        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-purple-400" /> Video Requirements
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              Maximum <strong>60 seconds (1 minute)</strong>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              Maximum <strong>15MB</strong> file size
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              Portrait format <strong>(9:16)</strong> recommended
            </li>
          </ul>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Video Upload */}
          <div>
            {!videoPreview ? (
              <label className="block cursor-pointer group">
                <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-purple-500 hover:bg-white/5 transition aspect-[9/16] flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition">
                    <Upload className="w-10 h-10" />
                  </div>
                  <p className="text-xl font-bold mb-2">Select Video</p>
                  <p className="text-sm text-gray-400 mb-6">or drag and drop</p>
                  <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 rounded-full font-bold">
                    Browse Files
                  </div>
                </div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleVideoSelect(e.target.files?.[0] || null)}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-black border border-white/10">
                <video
                  src={videoPreview}
                  className="w-full aspect-[9/16] object-cover"
                  controls
                  loop
                />
                <button
                  onClick={removeVideo}
                  className="absolute top-3 right-3 bg-red-500 p-2 rounded-full hover:scale-110 transition z-10"
                  disabled={uploading}
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                {video && (
                  <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm px-3 py-2 rounded-full text-sm font-bold">
                    {videoDuration.toFixed(1)}s • {(video.size / (1024 * 1024)).toFixed(2)}MB
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Details Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-400">
                Description
              </label>
              <textarea
                placeholder="Tell people about your print..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={200}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none transition resize-none"
                disabled={uploading}
              />
              <p className="text-xs text-gray-500 mt-2">
                {description.length}/200 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-400">
                Product Slug *
              </label>
              <input
                placeholder="e.g. roland-bn20"
                value={productSlug}
                onChange={(e) => setProductSlug(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none transition"
                disabled={uploading}
              />
              <p className="text-xs text-gray-500 mt-2">
                Links your video to a product. Use lowercase and hyphens.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-400">
                Shop Link (Optional)
              </label>
              <input
                type="url"
                placeholder="https://example.com/product"
                value={shopLink}
                onChange={(e) => setShopLink(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none transition"
                disabled={uploading}
              />
              <p className="text-xs text-gray-500 mt-2">
                Add a link to your shop or product page. Viewers can click "Shop This Print" to visit it.
              </p>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500"></div>
                  <div>
                    <p className="font-bold">Uploading...</p>
                    <p className="text-sm text-gray-400">{uploadProgress}%</p>
                  </div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Message */}
            {message && (
              <div className={`border rounded-xl p-4 flex items-start gap-3 ${
                success 
                  ? 'bg-green-900/20 border-green-500/30 text-green-400' 
                  : 'bg-red-900/20 border-red-500/30 text-red-400'
              }`}>
                {success ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={upload}
              disabled={uploading || !video || !productSlug.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-4 rounded-xl text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Post Video
                </>
              )}
            </button>

            {success && (
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-3">Redirecting to feed...</p>
                <Link href="/marketplace">
                  <button className="text-purple-400 hover:text-purple-300 font-bold underline">
                    Go Now →
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}