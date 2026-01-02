'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Globe,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Search,
  Filter,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Zap,
  Download,
} from 'lucide-react';
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Content {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'restricted';
  author: string;
  created_at: string;
  updated_at: string;
  views: number;
  featured: boolean;
}

const ContentManagementPage = () => {
  const [content, setContent] = useState<Content[]>([]);
  const [filteredContent, setFilteredContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [newContent, setNewContent] = useState({
    title: '',
    description: '',
    category: 'news',
    visibility: 'public',
  });

  useEffect(() => {
    fetchContent();
    const unsubscribe = subscribeToChanges();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    filterContentList();
  }, [content, searchQuery, filterStatus, filterCategory]);

  const fetchContent = async () => {
    try {
      // Fetch published content and draft content
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setContent(data || []);
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as any).message);
      } else if (error) {
        errorMessage = JSON.stringify(error);
      }
      console.error('Error fetching content:', errorMessage, error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const contentChannel = supabase
      .channel('executive-content-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content' }, () => {
        fetchContent();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(contentChannel);
    };
  };

  const filterContentList = () => {
    let filtered = content;

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((c) => c.status === filterStatus);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter((c) => c.category === filterCategory);
    }

    setFilteredContent(filtered);
  };

  const publishContent = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('content')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('id', contentId);

      if (error) throw error;
      fetchContent();
    } catch (error) {
      console.error('Error publishing content:', error);
    }
  };

  const archiveContent = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('content')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', contentId);

      if (error) throw error;
      fetchContent();
    } catch (error) {
      console.error('Error archiving content:', error);
    }
  };

  const toggleFeatured = async (contentId: string, isFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('content')
        .update({ featured: !isFeatured, updated_at: new Date().toISOString() })
        .eq('id', contentId);

      if (error) throw error;
      fetchContent();
    } catch (error) {
      console.error('Error updating featured status:', error);
    }
  };

  const changeVisibility = async (contentId: string, newVisibility: string) => {
    try {
      const { error } = await supabase
        .from('content')
        .update({ visibility: newVisibility, updated_at: new Date().toISOString() })
        .eq('id', contentId);

      if (error) throw error;
      fetchContent();
    } catch (error) {
      console.error('Error changing visibility:', error);
    }
  };

  const deleteContent = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;
      fetchContent();
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const createContent = async () => {
    if (!newContent.title || !newContent.description) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('content')
        .insert([{
          title: newContent.title,
          description: newContent.description,
          category: newContent.category,
          visibility: newContent.visibility,
          status: 'draft',
          author: 'Executive',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          views: 0,
          featured: false,
        }]);

      if (error) throw error;
      setNewContent({ title: '', description: '', category: 'news', visibility: 'public' });
      setShowModal(false);
      fetchContent();
    } catch (error) {
      console.error('Error creating content:', error);
    }
  };

  const stats = {
    published: content.filter((c) => c.status === 'published').length,
    draft: content.filter((c) => c.status === 'draft').length,
    featured: content.filter((c) => c.featured && c.status === 'published').length,
    totalViews: content.reduce((sum, c) => sum + c.views, 0),
  };

  return (
    <AdminDashboardLayout userRole="executive">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white">Content Management</h2>
            <p className="text-sm text-gray-400 mt-1">
              Manage and publish content across the platform
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
          >
            <Plus size={18} />
            Create Content
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <p className="text-xs text-gray-400 uppercase font-semibold">Published</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{stats.published}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <p className="text-xs text-gray-400 uppercase font-semibold">Drafts</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.draft}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <p className="text-xs text-gray-400 uppercase font-semibold">Featured</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">{stats.featured}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <p className="text-xs text-gray-400 uppercase font-semibold">Total Views</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">{stats.totalViews}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 bg-slate-800/30 border border-slate-700 rounded-lg p-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-gray-500 text-sm"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
          >
            <option value="all">All Categories</option>
            <option value="news">News</option>
            <option value="updates">Updates</option>
            <option value="announcements">Announcements</option>
            <option value="features">Features</option>
          </select>
        </div>

        {/* Content List */}
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="h-12 w-12 mx-auto mb-4 rounded-full border-4 border-slate-700 border-t-cyan-500 animate-spin" />
              <p className="text-gray-400">Loading content...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContent.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-700 bg-slate-800/30 p-4 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <div>
                        <h3 className="text-base font-bold text-white">{item.title}</h3>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                      </div>
                      {item.featured && (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-900/30 text-purple-300 whitespace-nowrap">
                          Featured
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {item.author}
                      </span>
                      <span>•</span>
                      <span>{item.views} views</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
                    <select
                      value={item.status}
                      onChange={(e) => {
                        if (e.target.value === 'published') publishContent(item.id);
                        else if (e.target.value === 'archived') archiveContent(item.id);
                      }}
                      className="px-2 py-1 rounded text-xs bg-slate-700/50 border border-slate-600 text-white cursor-pointer"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>

                    <select
                      value={item.visibility}
                      onChange={(e) => changeVisibility(item.id, e.target.value)}
                      className="px-2 py-1 rounded text-xs bg-slate-700/50 border border-slate-600 text-white cursor-pointer"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="restricted">Restricted</option>
                    </select>

                    <button
                      onClick={() => toggleFeatured(item.id, item.featured)}
                      className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                        item.featured
                          ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50'
                          : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700'
                      }`}
                    >
                      {item.featured ? 'Unfeature' : 'Feature'}
                    </button>

                    <button
                      onClick={() => deleteContent(item.id)}
                      className="px-2 py-1 rounded text-xs text-red-400 hover:bg-red-900/20 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredContent.length === 0 && (
              <div className="text-center py-12">
                <Globe size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No content found</p>
              </div>
            )}
          </div>
        )}

        {/* Create Content Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Create New Content</h3>

              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  placeholder="Title"
                  value={newContent.title}
                  onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-gray-500 text-sm"
                />

                <textarea
                  placeholder="Description"
                  value={newContent.description}
                  onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-gray-500 text-sm"
                />

                <select
                  value={newContent.category}
                  onChange={(e) => setNewContent({ ...newContent, category: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
                >
                  <option value="news">News</option>
                  <option value="updates">Updates</option>
                  <option value="announcements">Announcements</option>
                  <option value="features">Features</option>
                </select>

                <select
                  value={newContent.visibility}
                  onChange={(e) => setNewContent({ ...newContent, visibility: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white text-sm"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="restricted">Restricted</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700/50 text-white hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createContent}
                  className="flex-1 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default ContentManagementPage;
