// src/app/alton-designs/[slug]/page.tsx — FIXED DOWNLOAD TRACKING
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Download, Heart, Eye, Share2, Flag, ExternalLink,
  Calendar, FileType, Tag, Sparkles, ImageIcon, Edit, Trash2,
  CheckCircle, Copy, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

type Design = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  preview_image_url: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: string;
  tags: string[];
  is_free: boolean;
  price: number;
  download_count: number;
  like_count: number;
  view_count: number;
  created_at: string;
  user_id: string;
  contributor_id?: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
};

const fileTypeColors: Record<string, string> = {
  psd: 'bg-blue-500 text-white',
  ai: 'bg-orange-500 text-white',
  figma: 'bg-purple-500 text-white',
  png: 'bg-green-500 text-white',
  svg: 'bg-pink-500 text-white',
};

const fileTypeIcons: Record<string, string> = {
  psd: '📄',
  ai: '🎨',
  figma: '🎯',
  png: '🖼️',
  svg: '📊',
};

export default function DesignDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUser !== undefined) {
      fetchDesign();
    }
  }, [slug, currentUser]);

  useEffect(() => {
    if (design) {
      const cleanup = subscribeToRealtimeUpdates();
      return cleanup;
    }
  }, [design?.id]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchDesign = async () => {
    setLoading(true);

    // Fetch design
    const { data: designData, error: designError } = await supabase
      .from('marketplace_designs')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (designError || !designData) {
      console.error('Design not found:', designError);
      router.push('/alton-designs');
      return;
    }

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', designData.user_id)
      .single();

    const design = {
      ...designData,
      profiles: profileData || { username: 'Unknown', avatar_url: null }
    };

    setDesign(design);
    
    // Check if current user is owner
    if (currentUser && currentUser.id === design.user_id) {
      setIsOwner(true);
    }

    // Check if user has already liked
    if (currentUser) {
      const { data: likeData } = await supabase
        .from('design_likes')
        .select('id')
        .eq('design_id', design.id)
        .eq('user_id', currentUser.id)
        .single();
      
      if (likeData) {
        setLiked(true);
      }
    }
    
    // Increment view count - using direct update first, then check for RPC
    try {
      // Try RPC function first (if it exists)
      const { error: rpcError } = await supabase.rpc('increment_view_count', { 
        design_id_param: design.id 
      });

      if (rpcError) {
        console.log('RPC not available, using direct update for view count');
        // Fallback to direct update
        await supabase
          .from('marketplace_designs')
          .update({ 
            view_count: design.view_count + 1 
          })
          .eq('id', design.id);
      }
    } catch (err) {
      console.log('View count update method not working, will reflect on next page load');
    }

    setLoading(false);
  };

  const subscribeToRealtimeUpdates = () => {
    if (!design) return () => {};

    console.log('Setting up real-time subscription for design:', design.id);
    setRealtimeStatus('connecting');

    const designChannel = supabase
      .channel(`design_detail_${design.id}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'marketplace_designs',
          filter: `id=eq.${design.id}`
        },
        (payload) => {
          console.log('✅ Real-time update received:', payload);
          const updatedDesign = payload.new as any;
          
          // Merge the update with existing design data
          setDesign(prev => {
            if (!prev) return null;
            return {
              ...prev,
              download_count: updatedDesign.download_count,
              like_count: updatedDesign.like_count,
              view_count: updatedDesign.view_count,
              ...updatedDesign
            };
          });
        }
      )
      .subscribe((status, err) => {
        console.log('Subscription status:', status, err);
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
          console.log('✅ Successfully subscribed to design updates');
        } else if (status === 'CLOSED') {
          setRealtimeStatus('disconnected');
          console.log('❌ Subscription closed');
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('disconnected');
          console.error('❌ Channel error:', err);
        }
      });

    return () => {
      console.log('Cleaning up design subscription');
      supabase.removeChannel(designChannel);
    };
  };

  const handleDownload = async () => {
    if (!design) return;

    setDownloading(true);

    try {
      // METHOD 1: Try using RPC function (recommended, most reliable)
      const { error: rpcError } = await supabase.rpc('increment_download_count', { 
        design_id_param: design.id 
      });

      if (rpcError) {
        console.log('RPC function not available, trying alternative methods...');
        
        // METHOD 2: Try inserting into design_downloads table (if it exists)
        const { error: insertError } = await supabase
          .from('design_downloads')
          .insert({
            design_id: design.id,
            user_id: currentUser?.id || null
          });

        if (insertError) {
          console.log('design_downloads table not available, using direct update...');
          
          // METHOD 3: Direct update as fallback
          const { error: updateError } = await supabase
            .from('marketplace_designs')
            .update({ 
              download_count: design.download_count + 1 
            })
            .eq('id', design.id);

          if (updateError) {
            console.error('All download tracking methods failed:', updateError);
            // Continue with download anyway
          } else {
            console.log('✅ Download count updated via direct update');
            // Update local state immediately
            setDesign(prev => prev ? { ...prev, download_count: prev.download_count + 1 } : null);
          }
        } else {
          console.log('✅ Download recorded in design_downloads table (trigger should update count)');
        }
      } else {
        console.log('✅ Download count incremented via RPC function');
      }

      // Download the file
      if (design.file_type === 'figma') {
        window.open(design.file_url, '_blank');
      } else {
        const response = await fetch(design.file_url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${design.slug}.${design.file_type}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download. Please try again.');
    }

    setDownloading(false);
  };

  const handleLike = async () => {
    if (!design || !currentUser) {
      alert('Please login to like designs');
      return;
    }

    try {
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from('design_likes')
          .delete()
          .eq('design_id', design.id)
          .eq('user_id', currentUser.id);

        if (error) throw error;
        
        setLiked(false);
        console.log('✅ Design unliked (trigger should update count)');
      } else {
        // Like
        const { error } = await supabase
          .from('design_likes')
          .insert({
            design_id: design.id,
            user_id: currentUser.id
          });

        if (error) {
          if (error.code === '23505') {
            // Already liked
            setLiked(true);
          } else {
            throw error;
          }
        } else {
          setLiked(true);
          console.log('✅ Design liked (trigger should update count)');
        }
      }
    } catch (error) {
      console.error('Like error:', error);
      alert('Failed to update like. Please try again.');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this design?')) return;

    try {
      const { error } = await supabase
        .from('marketplace_designs')
        .delete()
        .eq('id', design?.id);

      if (error) throw error;

      alert('Design deleted successfully');
      router.push('/contributor/dashboard');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete design');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading design...</p>
        </div>
      </div>
    );
  }

  if (!design) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* Header */}
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 backdrop-blur-lg bg-white/80 dark:bg-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-full flex items-center justify-between">
          <Link href="/alton-designs" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium text-sm">Back to Designs</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Real-time Status Indicator */}
            <div className={`px-2 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 ${
              realtimeStatus === 'connected' ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
              realtimeStatus === 'connecting' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400' :
              'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
            }`}>
              <Activity className={`w-2.5 h-2.5 ${realtimeStatus === 'connected' ? 'animate-pulse' : ''}`} />
              {realtimeStatus === 'connected' ? 'Live' : realtimeStatus === 'connecting' ? 'Connecting' : 'Offline'}
            </div>

            {isOwner && (
              <>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleShare}>
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Share
                </>
              )}
            </Button>
            {!isOwner && (
              <Button variant="ghost" size="sm">
                <Flag className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column - Preview */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Preview Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
                <Image
                  src={design.preview_image_url}
                  alt={design.title}
                  fill
                  className="object-contain p-4"
                  unoptimized
                />
              </div>

              {/* Action Bar with Real-time Stats */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 transition">
                    <ImageIcon className="w-4 h-4" />
                    View Full Size
                  </button>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <motion.span 
                    key={`view-${design.view_count}`}
                    initial={{ scale: 1.2, color: '#9333ea' }}
                    animate={{ scale: 1, color: '#6b7280' }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    {design.view_count}
                  </motion.span>
                  <motion.span 
                    key={`download-${design.download_count}`}
                    initial={{ scale: 1.2, color: '#16a34a' }}
                    animate={{ scale: 1, color: '#6b7280' }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    {design.download_count}
                  </motion.span>
                  <motion.span 
                    key={`like-${design.like_count}`}
                    initial={{ scale: 1.2, color: '#dc2626' }}
                    animate={{ scale: 1, color: '#6b7280' }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-1"
                  >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                    {design.like_count}
                  </motion.span>
                </div>
              </div>
            </motion.div>

            {/* Description */}
            {design.description && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  About This Design
                </h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {design.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {design.tags && design.tags.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-600" />
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {design.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Info & Download */}
          <div className="space-y-6">
            
            {/* Main Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6 sticky top-24 shadow-lg">
              
              {/* Title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {design.title}
                </h1>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${fileTypeColors[design.file_type]} flex items-center gap-1.5 shadow-sm`}>
                    <span>{fileTypeIcons[design.file_type]}</span>
                    {design.file_type}
                  </span>
                  <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold">
                    {design.category}
                  </span>
                </div>
              </div>

              {/* Price Badge */}
              <div className="py-6 border-y border-gray-200 dark:border-gray-700 text-center">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                  <span className="text-2xl font-bold text-white">FREE</span>
                </div>
              </div>

              {/* Download Button */}
              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full bg-purple-600 hover:bg-purple-700 h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {downloading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    {design.file_type === 'figma' ? 'Open in Figma' : 'Download Now'}
                  </>
                )}
              </Button>

              {/* Like Button */}
              <Button
                onClick={handleLike}
                variant="outline"
                className="w-full h-12 border-2"
              >
                <Heart className={`w-5 h-5 mr-2 transition ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                {liked ? 'Liked' : 'Like this design'}
              </Button>

              {/* File Details */}
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <FileType className="w-4 h-4" />
                    File Format
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white uppercase">
                    .{design.file_type}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    File Size
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatFileSize(design.file_size)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Published
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDate(design.created_at)}
                  </span>
                </div>
              </div>

              {/* Creator */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">Designed by</p>
                <Link 
                  href={`/profile/${design.profiles.username}`}
                  className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition border border-purple-100 dark:border-purple-800"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg text-white font-bold overflow-hidden ring-2 ring-white dark:ring-gray-800 shadow-md">
                    {design.profiles.avatar_url ? (
                      <img src={design.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      design.profiles.username[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {design.profiles.username}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                      View Profile →
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}