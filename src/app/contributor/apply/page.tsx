// src/app/contributor/apply/page.tsx — WITH FILE UPLOAD
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Check, Sparkles, TrendingUp, DollarSign, 
  Users, Award, AlertCircle, Loader2, Upload, X, FileImage
} from 'lucide-react';
import { motion } from 'framer-motion';

const benefits = [
  { icon: DollarSign, title: 'Earn Money', desc: 'Get paid when people download your designs' },
  { icon: Users, title: 'Global Reach', desc: 'Millions of users worldwide' },
  { icon: TrendingUp, title: 'Grow Portfolio', desc: 'Showcase your work to the world' },
  { icon: Award, title: 'Recognition', desc: 'Build your reputation as a creator' },
];

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/svg+xml',
  'application/postscript', // .ai, .eps
  'application/pdf',
  'image/vnd.adobe.photoshop', // .psd
  'application/x-photoshop',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.svg', '.ai', '.eps', '.pdf', '.psd'];

type UploadedFile = {
  name: string;
  url: string;
  type: string;
  size: number;
};

export default function ContributorApply() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    country: '',
    portfolio_url: '',
    experience_level: 'intermediate',
    design_categories: [] as string[],
    why_join: '',
  });

  const categories = [
    'Branding', 'Print Design', 'Social Media', 'Web Design', 
    'Illustrations', 'Mockups', 'Presentation', 'Merch Design'
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth?redirect=/contributor/apply');
        return;
      }
      
      setUserId(user.id);
      setForm(prev => ({ ...prev, email: user.email || '' }));

      // Check if already applied
      const { data: application } = await supabase
        .from('contributor_applications')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (application) {
        setHasApplied(true);
      }

      // Check if already approved
      const { data: contributor } = await supabase
        .from('contributors')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (contributor?.status === 'approved') {
        router.push('/contributor/dashboard');
      }
    };

    checkAuth();
  }, [router]);

  const handleCategoryToggle = (category: string) => {
    setForm(prev => ({
      ...prev,
      design_categories: prev.design_categories.includes(category)
        ? prev.design_categories.filter(c => c !== category)
        : [...prev.design_categories, category]
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if already have 5 files
    if (uploadedFiles.length >= 5) {
      setError('Maximum 5 sample files allowed');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const file = files[0];
      
      // Validate file type
      const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
        throw new Error(`File type not allowed. Please upload: ${ALLOWED_EXTENSIONS.join(', ')}`);
      }

      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        throw new Error('File size must be less than 20MB');
      }

      // Upload to Supabase Storage
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      const { data, error: uploadError } = await supabase.storage
        .from('contributor-samples')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('contributor-samples')
        .getPublicUrl(fileName);

      // Add to uploaded files
      setUploadedFiles(prev => [...prev, {
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size
      }]);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const removeFile = async (index: number) => {
    const file = uploadedFiles[index];
    
    try {
      // Extract file path from URL
      const urlParts = file.url.split('/contributor-samples/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage
          .from('contributor-samples')
          .remove([filePath]);
      }
      
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error('Error removing file:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.full_name || !form.email) {
      setError('Please fill in all required fields');
      return;
    }

    if (form.design_categories.length === 0) {
      setError('Please select at least one design category');
      return;
    }

    if (uploadedFiles.length < 2) {
      setError('Please upload at least 2 sample files');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('contributor_applications')
        .insert({
          user_id: userId,
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          country: form.country.trim() || null,
          portfolio_url: form.portfolio_url.trim() || null,
          experience_level: form.experience_level,
          design_categories: form.design_categories,
          sample_works: uploadedFiles.map(f => f.url),
          sample_files: uploadedFiles,
          why_join: form.why_join.trim() || null,
          status: 'pending'
        });

      if (insertError) throw new Error(insertError.message);

      router.push('/contributor/apply/success');
    } catch (err: any) {
      console.error('Application error:', err);
      setError(err.message || 'Failed to submit application');
      setLoading(false);
    }
  };

  if (hasApplied) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Application Submitted
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We're reviewing your application. You'll hear from us within 2-3 business days.
          </p>
          <Link href="/alton-designs">
            <Button className="w-full">Browse Designs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <Link href="/alton-designs" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Become a Contributor
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 lg:px-6 py-12">
        
        {/* Hero */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Join <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Alton Stock Contributors
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Share your designs with millions of users worldwide and earn money doing what you love
            </p>
          </motion.div>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center"
            >
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                <benefit.icon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Application Form */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Application Form
          </h2>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Full Name *
                </label>
                <Input
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Email *
                </label>
                <Input
                  required
                  type="email"
                  value={form.email}
                  readOnly
                  className="bg-gray-100 dark:bg-gray-700"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Country
                </label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="Uganda"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Portfolio URL
                </label>
                <Input
                  type="url"
                  value={form.portfolio_url}
                  onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Experience Level *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['beginner', 'intermediate', 'professional'].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setForm({ ...form, experience_level: level })}
                    className={`py-3 px-4 rounded-lg border-2 font-medium capitalize transition ${
                      form.experience_level === level
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-600'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Design Categories */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Design Categories * (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryToggle(cat)}
                    className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition ${
                      form.design_categories.includes(cat)
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-600'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Sample Works - FILE UPLOAD */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Sample Works * (Upload 2-5 files)
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Accepted formats: JPG, PNG, SVG, AI, EPS, PSD, PDF (Max 20MB each)
              </p>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2 mb-4">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileImage className="w-5 h-5 text-purple-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="ml-3 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {uploadedFiles.length < 5 && (
                <label className="block">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".jpg,.jpeg,.png,.svg,.ai,.eps,.pdf,.psd"
                    disabled={uploading}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition">
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          Click to upload sample work
                        </p>
                        <p className="text-xs text-gray-500">
                          {uploadedFiles.length}/5 files uploaded
                        </p>
                      </>
                    )}
                  </div>
                </label>
              )}
            </div>

            {/* Why Join */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Why do you want to join Alton Stock Contributors?
              </label>
              <textarea
                value={form.why_join}
                onChange={(e) => setForm({ ...form, why_join: e.target.value })}
                rows={4}
                placeholder="Tell us why you're excited to join..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || uploading}
              className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}