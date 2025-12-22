// src/app/community/circle/[slug]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Upload, Image as ImageIcon, Check, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

type Circle = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  icon: string | null;
  category: string;
  is_private: boolean;
  creator_id: string;
};

const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to resize image'));
        }, 'image/jpeg', 0.9);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export default function EditCircle() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const [circle, setCircle] = useState<Circle | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'Printing & Merch',
  });

  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<Blob | null>(null);
  const [coverChanged, setCoverChanged] = useState(false);

  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<Blob | null>(null);
  const [iconChanged, setIconChanged] = useState(false);

  const categories = [
    'Printing & Merch', 'Book Design', 'Anime & Manga', 'Fashion',
    'Christian Creators', '3D Printing', 'Signage & Billboards',
    'Digital Art', 'Photography', 'General'
  ];

  useEffect(() => {
    const loadCircle = async () => {
      try {
        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push(`/auth?redirect=/community/circle/${slug}/edit`);
          return;
        }

        setUserId(user.id);

        // Fetch circle
        const { data: circleData, error: circleError } = await supabase
          .from('circles')
          .select('*')
          .eq('slug', slug)
          .single();

        if (circleError || !circleData) {
          setError('Circle not found');
          setInitialLoading(false);
          return;
        }

        // Check if user is owner
        if (circleData.creator_id !== user.id) {
          setError('You can only edit circles you created');
          setInitialLoading(false);
          return;
        }

        setCircle(circleData);
        setIsOwner(true);
        setForm({
          name: circleData.name,
          description: circleData.description || '',
          category: circleData.category,
        });
        setCoverPreview(circleData.cover_image);
        setIconPreview(circleData.icon);
        setInitialLoading(false);
      } catch (err) {
        console.error('Load error:', err);
        setError('Failed to load circle');
        setInitialLoading(false);
      }
    };

    loadCircle();
  }, [slug, router]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const resized = await resizeImage(file, 1920, 1080);
      setCoverFile(resized);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(resized);
      setCoverChanged(true);
      setError(null);
    } catch (err) {
      setError('Failed to process cover image');
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const resized = await resizeImage(file, 400, 400);
      setIconFile(resized);
      const reader = new FileReader();
      reader.onloadend = () => setIconPreview(reader.result as string);
      reader.readAsDataURL(resized);
      setIconChanged(true);
      setError(null);
    } catch (err) {
      setError('Failed to process icon');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError('Circle name is required');
      return;
    }

    if (!circle) {
      setError('Circle data not loaded');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let coverUrl = circle.cover_image;
      let iconUrl = circle.icon;

      // Upload new cover if changed
      if (coverChanged && coverFile) {
        const coverFileName = `${userId}/${Date.now()}-cover.jpg`;
        const { data, error: uploadError } = await supabase.storage
          .from('circle-covers')
          .upload(coverFileName, coverFile, { 
            contentType: 'image/jpeg',
            upsert: true 
          });
        
        if (uploadError) {
          throw new Error(`Cover upload failed: ${uploadError.message}`);
        }
        
        if (data?.path) {
          coverUrl = supabase.storage.from('circle-covers').getPublicUrl(data.path).data.publicUrl;
        }
      }

      // Upload new icon if changed
      if (iconChanged && iconFile) {
        const iconFileName = `${userId}/${Date.now()}-icon.jpg`;
        const { data, error: uploadError } = await supabase.storage
          .from('circle-icons')
          .upload(iconFileName, iconFile, { 
            contentType: 'image/jpeg',
            upsert: true 
          });
        
        if (uploadError) {
          throw new Error(`Icon upload failed: ${uploadError.message}`);
        }
        
        if (data?.path) {
          iconUrl = supabase.storage.from('circle-icons').getPublicUrl(data.path).data.publicUrl;
        }
      }

      // Update circle
      const { error: updateError } = await supabase
        .from('circles')
        .update({
          name: form.name.trim(),
          description: form.description.trim() || null,
          cover_image: coverUrl,
          icon: iconUrl,
          category: form.category,
        })
        .eq('id', circle.id);

      if (updateError) {
        throw new Error(`Update failed: ${updateError.message}`);
      }

      setSuccess('Circle updated successfully!');
      setTimeout(() => {
        router.push(`/community/circle/${slug}`);
      }, 2000);
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update circle');
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

  if (error && !isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
          <Link href="/community" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium text-sm">Back</span>
          </Link>
        </header>
        <main className="max-w-3xl mx-auto p-4 lg:p-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-red-900 dark:text-red-200">Error</p>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
        <Link href={`/community/circle/${slug}`} className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium text-sm">Back</span>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={loading || !form.name.trim()}
          className="bg-purple-600 hover:bg-purple-700 text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </header>

      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Edit Circle</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Update your circle details</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-red-900 dark:text-red-200">Error</p>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3"
          >
            <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-green-900 dark:text-green-200">Success</p>
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Cover Image */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Cover Image
            </label>
            <label className="block h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 dark:hover:border-purple-500 transition overflow-hidden group">
              {coverPreview ? (
                <div className="relative w-full h-full">
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <p className="text-white font-medium text-sm">Change Cover</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Upload className="w-8 h-8 mb-2" />
                  <p className="text-sm font-medium">Click to upload cover</p>
                  <p className="text-xs text-gray-400">Recommended: 1920x1080</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
            </label>
            {coverChanged && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">● Image changed - will be updated</p>
            )}
          </div>

          {/* Icon & Name */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Circle Icon
                </label>
                <label className="block w-24 h-24 mx-auto border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-purple-500 transition overflow-hidden group">
                  {iconPreview ? (
                    <img src={iconPreview} alt="Icon" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleIconUpload} className="hidden" />
                </label>
                <p className="text-xs text-center text-gray-500 mt-2">400x400px</p>
                {iconChanged && (
                  <p className="text-xs text-center text-orange-600 dark:text-orange-400 mt-1">● Changed</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Circle Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Alton's Printers Union"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    maxLength={50}
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    URL: <span className="font-mono text-purple-600 dark:text-purple-400">alton.app/c/{circle?.slug}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Description
            </label>
            <textarea
              placeholder="What is this circle about? Who should join?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              maxLength={500}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-2 text-right">{form.description.length}/500</p>
          </div>

          {/* Category */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat} className="bg-white dark:bg-gray-800">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> Changes to cover image and icon may take a few moments to appear everywhere due to caching.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
