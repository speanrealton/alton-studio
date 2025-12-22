// src/app/community/explore/page.tsx — PROFESSIONAL REDESIGN
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Search, Users, Plus, TrendingUp, Lock, Grid, List, Filter, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

type Circle = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  cover_image: string | null;
  member_count: number;
  category: string;
  is_private: boolean;
};

const categories = [
  'All', 'Printing & Merch', 'Book Design', 'Anime & Manga',
  'Fashion', 'Christian Creators', '3D Printing', 'Digital Art'
];

export default function Explore() {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchCircles = async () => {
      setLoading(true);
      let query = supabase
        .from('circles')
        .select('*')
        .order('member_count', { ascending: false });

      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory);
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data } = await query;
      setCircles(data || []);
      setLoading(false);
    };

    fetchCircles();
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="h-16 flex items-center justify-between">
            <Link href="/community" className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium text-sm">Back</span>
            </Link>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="pb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search circles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="pb-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-4 lg:p-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-sm text-gray-500">Loading circles...</p>
          </div>
        ) : circles.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">No circles found</p>
            <Link href="/community/circle/create">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" /> Create Circle
              </Button>
            </Link>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {circles.map((circle) => (
              <Link key={circle.id} href={`/community/circle/${circle.slug}`}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition cursor-pointer"
                >
                  {/* Cover */}
                  {circle.cover_image ? (
                    <div className="h-32 relative bg-gradient-to-br from-purple-600 to-pink-600">
                      <Image src={circle.cover_image} alt="" fill className="object-cover opacity-80" />
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                      <div className="text-5xl">{circle.icon || <Users className="w-12 h-12 text-white" />}</div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow overflow-hidden">
                        {circle.icon ? (
                          circle.icon.startsWith('http') ? (
                            <Image src={circle.icon} alt="" width={48} height={48} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">{circle.icon}</span>
                          )
                        ) : (
                          <Users className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">
                          {circle.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-3 h-3 text-purple-600" />
                          <span className="text-purple-600 font-semibold">{circle.member_count.toLocaleString()}</span>
                          <span className="text-gray-500">members</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {circle.description || 'Join this community'}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                        {circle.category}
                      </span>
                      {circle.is_private && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Lock className="w-3 h-3" />
                          <span>Private</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <Link href="/community/circle/create">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg"
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
      </Link>
    </div>
  );
}