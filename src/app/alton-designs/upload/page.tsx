// src/app/alton-designs/upload/page.tsx — ALTON DESIGNS UPLOAD PAGE
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Upload, Image as ImageIcon, FileUp, X, 
  AlertCircle, Loader2, Check, Tag, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

type Category = {
  name: string;
  slug: string;
};

const fileTypeOptions = [
  { value: 'psd', label: 'PSD (Photoshop)', accept: '.psd' },
  { value: 'ai', label: 'AI (Illustrator)', accept: '.ai' },
  { value: 'figma', label: 'Figma Link', accept: '' },
  { value: 'png', label: 'PNG', accept: '.png' },
  { value: 'svg', label: 'SVG', accept: '.svg' },
];

export default function UploadDesign() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    category: '',
    file_type: 'psd',
    tags: '',
  });

  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designFileName, setDesignFileName] = useState<string>('');
  const [figmaLink, setFigmaLink] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth?redirect=/alton-designs/upload');
        return;
      }
      setUserId(user.id);
      
      // Fetch categories
      const { data } = await supabase
        .from('marketplace_categories')
        .select('name, slug')
        .order('name');
      
      setCategories(data || []);
      if (data && data.length > 0) {
        setForm(prev => ({ ...prev, category: data[0].name }));
      }
      
      setInitialLoading(false);
    };
    checkAuth();
  }, [router]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setForm({ ...form, title, slug: generateSlug(title) });
  };

  const handlePreviewUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Preview image must be less than 10MB');
      return;
    }

    setPreviewFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleDesignFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setError('Design file must be less than 100MB');
      return;
    }

    setDesignFile(file);
    setDesignFileName(file.name);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.slug || !form.category) {
      setError('Please fill in all required fields');
      return;
    }

    if (!previewFile) {
      setError('Please upload a preview image');
      return;
    }

    if (form.file_type === 'figma' && !figmaLink.trim()) {
      setError('Please provide a Figma link');
      return;
    }

    if (form.file_type !== 'figma' && !designFile) {
      setError('Please upload your design file');
      return;
    }

    if (!userId) {
      setError('You must be logged in');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload preview image
      const previewPath = `${userId}/${Date.now()}-preview.jpg`;
      const { data: previewData, error: previewError } = await supabase.storage
        .from('marketplace-previews')
        .upload(previewPath, previewFile, {
          contentType: previewFile.type,
          upsert: false
        });

      if (previewError) throw new Error(`Preview upload failed: ${previewError.message}`);

      const previewPublicUrl = supabase.storage
        .from('marketplace-previews')
        .getPublicUrl(previewData.path).data.publicUrl;

      // Upload design file or use Figma link
      let fileUrl = '';
      let fileSize = 0;

      if (form.file_type === 'figma') {
        fileUrl = figmaLink.trim();
        fileSize = 0;
      } else if (designFile) {
        const fileExt = designFile.name.split('.').pop();
        const filePath = `${userId}/${Date.now()}-design.${fileExt}`;
        
        const { data: fileData, error: fileError } = await supabase.storage
          .from('marketplace-files')
          .upload(filePath, designFile, {
            contentType: designFile.type,
            upsert: false
          });

        if (fileError) throw new Error(`File upload failed: ${fileError.message}`);

        fileUrl = supabase.storage
          .from('marketplace-files')
          .getPublicUrl(fileData.path).data.publicUrl;
        
        fileSize = designFile.size;
      }

      // Parse tags
      const tags = form.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      // Create design entry
      const { data: designData, error: insertError } = await supabase
        .from('marketplace_designs')
        .insert({
          user_id: userId,
          contributor_id: (window as any).contributorId, // Link to contributor
          title: form.title.trim(),
          slug: form.slug,
          description: form.description.trim() || null,
          preview_image_url: previewPublicUrl,
          file_url: fileUrl,
          file_type: form.file_type,
          file_size: fileSize,
          category: form.category,
          tags: tags,
          is_free: true,
          price: 0,
          status: 'published',
          download_count: 0,
          view_count: 0,
          like_count: 0,
        })
        .select()
        .single();

      if (insertError) throw new Error(`Failed to create design: ${insertError.message}`);

      // Update category count manually
      const { data: categoryData } = await supabase
        .from('marketplace_categories')
        .select('design_count')
        .eq('name', form.category)
        .single();

      if (categoryData) {
        await supabase
          .from('marketplace_categories')
          .update({ design_count: categoryData.design_count + 1 })
          .eq('name', form.category);
      }

      router.push(`/alton-designs/${form.slug}`);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload design');
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
        <Link href="/alton-designs" className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium text-sm">Back to Designs</span>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Publish Design
            </>
          )}
        </Button>
      </header>

      <main className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Design</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Share your work with the community</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-red-900 dark:text-red-200">Error</p>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Preview Image */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Preview Image *
            </label>
            <label className="block aspect-video border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-purple-500 transition overflow-hidden group">
              {previewUrl ? (
                <div className="relative w-full h-full">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <p className="text-white font-medium">Change Preview</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ImageIcon className="w-12 h-12 mb-3" />
                  <p className="text-sm font-medium">Click to upload preview</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handlePreviewUpload} className="hidden" />
            </label>
          </div>

          {/* Title & Slug */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Design Title *
              </label>
              <Input
                required
                placeholder="e.g. Modern Business Card Template"
                value={form.title}
                onChange={handleTitleChange}
                maxLength={100}
                className="bg-gray-50 dark:bg-gray-700"
              />
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                URL: <span className="font-mono text-purple-600">alton.app/alton-designs/{form.slug || 'your-slug'}</span>
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Description
            </label>
            <textarea
              placeholder="Describe your design, what it includes, how to use it..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              maxLength={1000}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-2 text-right">{form.description.length}/1000</p>
          </div>

          {/* Category & File Type */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {categories.map(cat => (
                  <option key={cat.slug} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                File Type *
              </label>
              <select
                value={form.file_type}
                onChange={(e) => setForm({ ...form, file_type: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {fileTypeOptions.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Design File Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Design File *
            </label>
            
            {form.file_type === 'figma' ? (
              <Input
                type="url"
                placeholder="https://www.figma.com/file/..."
                value={figmaLink}
                onChange={(e) => setFigmaLink(e.target.value)}
                className="bg-gray-50 dark:bg-gray-700"
              />
            ) : (
              <label className="block border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 cursor-pointer hover:border-purple-500 transition text-center">
                {designFileName ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileUp className="w-8 h-8 text-purple-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{designFileName}</p>
                      <p className="text-xs text-gray-500">Click to change file</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      Upload {form.file_type.toUpperCase()} File
                    </p>
                    <p className="text-xs text-gray-500">Max 100MB</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept={fileTypeOptions.find(t => t.value === form.file_type)?.accept}
                  onChange={handleDesignFileUpload} 
                  className="hidden" 
                />
              </label>
            )}
          </div>

          {/* Tags */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </label>
            <Input
              placeholder="business, modern, minimal (comma separated)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="bg-gray-50 dark:bg-gray-700"
            />
            <p className="text-xs text-gray-500 mt-2">Add tags to help people find your design</p>
          </div>

          {/* Tips */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
            <p className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-3">
              💡 Tips for Success
            </p>
            <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-2">
              <li>• Use high-quality preview images that showcase your design</li>
              <li>• Write clear descriptions explaining what's included</li>
              <li>• Add relevant tags to increase discoverability</li>
              <li>• Choose the correct category and file type</li>
            </ul>
          </div>
        </form>
      </main>
    </div>
  );
}