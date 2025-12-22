// src/app/alton-designs/page.tsx — FIXED VERSION
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { 
  Search, Download, Heart, Eye, Grid, TrendingUp, Clock, 
  Sparkles, ChevronDown, Star, Filter, Moon, Sun
} from 'lucide-react';
import { motion } from 'framer-motion';
import AuthButton from '@/components/AuthButton';

type Design = {
  id: string;
  slug: string;
  title: string;
  preview_image_url: string;
  file_type: string;
  download_count: number;
  like_count: number;
  view_count: number;
  category: string;
  tags: string[];
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
};

type Category = {
  slug: string;
  name: string;
  design_count: number;
};

const fileTypeColors: Record<string, string> = {
  psd: 'bg-blue-500',
  ai: 'bg-orange-500',
  figma: 'bg-purple-500',
  png: 'bg-green-500',
  svg: 'bg-pink-500',
};

export default function AltonDesignsBrowse() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [sortBy, setSortBy] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    fetchDesigns();
    fetchCategories();
  }, [selectedCategory, selectedFileType, sortBy, searchQuery]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('marketplace_categories')
      .select('*')
      .order('design_count', { ascending: false });
    
    setCategories(data || []);
  };

  const fetchDesigns = async () => {
    setLoading(true);
    
    try {
      // First fetch designs without profiles
      let query = supabase
        .from('marketplace_designs')
        .select('*')
        .eq('status', 'published');

      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory);
      }

      if (selectedFileType !== 'all') {
        query = query.eq('file_type', selectedFileType);
      }

      // Search - simplified to avoid complex operators
      if (searchQuery.trim()) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      if (sortBy === 'popular') {
        query = query.order('like_count', { ascending: false });
      } else if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'downloads') {
        query = query.order('download_count', { ascending: false });
      }

      const { data: designsData, error } = await query.limit(50);

      if (error) {
        console.error('Fetch designs error:', error);
        setDesigns([]);
        return;
      }

      if (designsData && designsData.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(designsData.map(d => d.user_id))];
        
        // Fetch profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        // Create a map of profiles
        const profilesMap = new Map(
          profilesData?.map(p => [p.id, p]) || []
        );

        // Combine data
        const designsWithProfiles = designsData.map(design => ({
          ...design,
          profiles: profilesMap.get(design.user_id) || {
            username: 'Anonymous',
            avatar_url: null
          }
        }));

        console.log('Fetched designs:', designsWithProfiles.length, designsWithProfiles);
        setDesigns(designsWithProfiles);
      } else {
        setDesigns([]);
      }
    } catch (err) {
      console.error('Error in fetchDesigns:', err);
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col">
      
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-center text-sm">
        <p className="font-medium">
          🎨 Join <Link href="/contributor/apply" className="underline font-bold">Alton Stock Contributors</Link> and earn money from your designs!
        </p>
      </div>

      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo2.svg" alt="Alton Designs" width={48} height={48} />
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Alton Designs</h1>
              <p className="text-xs text-gray-500">Premium Design Resources</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
            <Link href="/contributor/apply">
              <Button size="sm" variant="outline" className="hidden md:flex">
                Become a Contributor
              </Button>
            </Link>
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Hero Search */}
      <section className="bg-gradient-to-b from-purple-50 to-white dark:from-gray-800 dark:to-gray-900 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4"
          >
            Discover Premium <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Design Resources</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-400 mb-8"
          >
            Free high-quality designs from talented creators worldwide
          </motion.p>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative max-w-2xl mx-auto"
          >
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Search thousands of free designs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-lg focus:outline-none focus:border-purple-500 shadow-lg"
            />
          </motion.div>

          {/* Quick Stats */}
          <div className="flex justify-center gap-8 mt-8 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>{designs.length}+ Designs</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>100% Free</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-green-600" />
              <span>Instant Download</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4">
          
          {/* Categories with Smooth Carousel */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedCategory === 'All'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedCategory('AI')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedCategory === 'AI'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              AI Generated
            </button>
            {categories.slice(0, 8).map(cat => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedCategory === cat.name
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* File Types & Sort */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              {['all', 'psd', 'ai', 'figma', 'png', 'svg'].map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedFileType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                    selectedFileType === type
                      ? `${fileTypeColors[type] || 'bg-purple-600'} text-white`
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type === 'all' ? 'All' : type}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="popular">Most Popular</option>
              <option value="recent">Most Recent</option>
              <option value="downloads">Most Downloaded</option>
            </select>
          </div>
        </div>
      </section>

      {/* Designs Grid */}
      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading amazing designs...</p>
            </div>
          </div>
        ) : designs.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="w-20 h-20 mx-auto text-purple-400 mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {searchQuery ? 'No results found' : 'Be the First!'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {searchQuery 
                ? 'Try different keywords or browse all categories'
                : 'Share your designs with thousands of creators worldwide'}
            </p>
            <Link href="/contributor/apply">
              <Button className="bg-purple-600 hover:bg-purple-700 px-8 py-6 text-lg">
                Become a Contributor
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Results Info */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-bold text-gray-900 dark:text-white">{designs.length}</span> designs available
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {designs.map((design, index) => (
                <Link key={design.id} href={`/alton-designs/${design.slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <Image
                        src={design.preview_image_url}
                        alt={design.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        unoptimized
                      />
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="flex items-center justify-between text-white text-xs">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {design.view_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="w-3 h-3" />
                              {design.download_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {design.like_count}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* File Type Badge */}
                      <div className={`absolute top-3 left-3 ${fileTypeColors[design.file_type]} text-white px-2 py-1 rounded text-xs font-bold uppercase`}>
                        {design.file_type}
                      </div>

                      {/* Free Badge */}
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                        FREE
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2 group-hover:text-purple-600 transition">
                        {design.title}
                      </h3>

                      {/* Creator */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs text-white font-bold overflow-hidden flex-shrink-0">
                          {design.profiles?.avatar_url ? (
                            <img src={design.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            design.profiles?.username?.[0]?.toUpperCase() || '?'
                          )}
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {design.profiles?.username || 'Anonymous'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-400 dark:text-gray-500 py-12 px-4 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src="/logo2.svg" alt="Alton Designs" width={32} height={32} />
                <h3 className="text-lg font-bold text-white">Alton Designs</h3>
              </div>
              <p className="text-sm">Premium design resources from talented creators worldwide.</p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Explore</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/alton-designs" className="hover:text-white transition">Browse Designs</Link></li>
                <li><Link href="/contributor/apply" className="hover:text-white transition">Become Creator</Link></li>
                <li><Link href="/help" className="hover:text-white transition">Help Center</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:support@altonstudio.com" className="hover:text-white transition">Email Support</a></li>
                <li><a href="https://twitter.com" className="hover:text-white transition">Twitter</a></li>
                <li><a href="https://instagram.com" className="hover:text-white transition">Instagram</a></li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
              <p>&copy; 2025 Alton Studio. All rights reserved.</p>
              <div className="flex gap-4">
                <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
              </div>
              <Link href="/contributor/apply">
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg px-6 py-2 font-bold">
                  Become a Contributor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}