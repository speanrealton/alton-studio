// src/app/community/circle/create/page.tsx — FIXED VERSION
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Upload, Image as ImageIcon, Globe, Lock, Check, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function CreateCircle() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<Blob | null>(null);
  const [iconFile, setIconFile] = useState<Blob | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'Printing & Merch',
    is_private: false,
  });

  const categories = [
    'Printing & Merch', 'Book Design', 'Anime & Manga', 'Fashion',
    'Christian Creators', '3D Printing', 'Signage & Billboards',
    'Digital Art', 'Photography', 'General'
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth?redirect=/community/circle/create');
        return;
      }
      setUserId(user.id);
      setInitialLoading(false);
    };
    checkAuth();
  }, [router]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm({ ...form, name, slug: generateSlug(name) });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const resized = await resizeImage(file, 1920, 1080);
      setCoverFile(resized);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(resized);
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

    if (!form.slug) {
      setError('Invalid circle name - cannot generate URL');
      return;
    }

    if (!userId) {
      setError('You must be logged in');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let coverUrl = null;
      let iconUrl = null;

      // Upload cover
      if (coverFile) {
        const coverFileName = `${userId}/${Date.now()}-cover.jpg`;
        const { data, error: uploadError } = await supabase.storage
          .from('circle-covers')
          .upload(coverFileName, coverFile, { 
            contentType: 'image/jpeg',
            upsert: true 
          });
        
        if (uploadError) {
          console.error('Cover upload error:', uploadError);
          throw new Error(`Cover upload failed: ${uploadError.message}`);
        }
        
        if (data?.path) {
          coverUrl = supabase.storage.from('circle-covers').getPublicUrl(data.path).data.publicUrl;
        }
      }

      // Upload icon
      if (iconFile) {
        const iconFileName = `${userId}/${Date.now()}-icon.jpg`;
        const { data, error: uploadError } = await supabase.storage
          .from('circle-icons')
          .upload(iconFileName, iconFile, { 
            contentType: 'image/jpeg',
            upsert: true 
          });
        
        if (uploadError) {
          console.error('Icon upload error:', uploadError);
          throw new Error(`Icon upload failed: ${uploadError.message}`);
        }
        
        if (data?.path) {
          iconUrl = supabase.storage.from('circle-icons').getPublicUrl(data.path).data.publicUrl;
        }
      }

      // Create circle and get the ID back
      const { data: circleData, error: insertError } = await supabase
        .from('circles')
        .insert({
          name: form.name.trim(),
          slug: form.slug,
          description: form.description.trim() || null,
          cover_image: coverUrl,
          icon: iconUrl,
          category: form.category,
          is_private: form.is_private,
          creator_id: userId,
          member_count: 1,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Circle creation error:', insertError);
        throw new Error(`Failed to create circle: ${insertError.message}`);
      }

      if (!circleData) {
        throw new Error('Circle created but no data returned');
      }

      // Insert creator as admin member
      const { error: memberError } = await supabase
        .from('circle_members')
        .insert({
          circle_id: circleData.id,
          user_id: userId,
          role: 'admin'
        });

      if (memberError) {
        console.error('Member insertion error:', memberError);
        // Don't throw - circle was created successfully
      }

      // Redirect to the circle page
      router.push(`/community/circle/${form.slug}`);
    } catch (err: any) {
      console.error('Creation error:', err);
      setError(err.message || 'Failed to create circle');
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
        <Link href="/community" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
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
              Creating...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Create Circle
            </>
          )}
        </Button>
      </header>

      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create a Circle</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Build your community and connect with creators</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-red-900 dark:text-red-200">Error</p>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Cover Image */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Cover Image (Optional)
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
                    onChange={handleNameChange}
                    maxLength={50}
                    className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  />
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    URL: <span className="font-mono text-purple-600 dark:text-purple-400">alton.app/c/{form.slug || 'your-slug'}</span>
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

          {/* Privacy */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {form.is_private ? (
                  <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    {form.is_private ? 'Private Circle' : 'Public Circle'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {form.is_private ? 'Only approved members' : 'Anyone can join'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_private: !form.is_private })}
                className={`relative w-12 h-6 rounded-full transition ${
                  form.is_private ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <motion.div
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow"
                  animate={{ x: form.is_private ? 26 : 2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}