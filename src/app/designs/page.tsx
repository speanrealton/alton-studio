'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { storage } from '@/lib/storage';
import { 
  Trash2, Edit3, Download, Calendar, Clock, FileText, 
  Loader2, Search, MoreVertical, Copy, FolderOpen,
  Sparkles, Plus, Eye, Grid3x3, List, SortAsc, Filter,
  X, Share2, Home, LayoutTemplate, User, Menu, LogOut,
  ArrowRight, Mail, Presentation, Heart, Video, Pencil,
  Grid3X3, Upload, MoreHorizontal, Image as ImgIcon
} from 'lucide-react';

// Navigation items from home page
const nav = [
  { icon: Plus, label: 'Create', href: '/studio' },
  { icon: Home, label: 'Home', href: '/home' },
  { icon: FolderOpen, label: 'Projects', href: '/designs' },
  { icon: LayoutTemplate, label: 'Templates', href: '/templates' },
  { icon: Sparkles, label: 'Alton Magic', href: '/professional-design' },
];

const navItems = [
  { label: 'Studio', href: '/studio' },
  { label: 'Alton Feed', href: '/marketplace' },
  { label: 'Community', href: '/community' },
  { label: 'Alton Designs', href: '/alton-designs' },
  { label: 'Print', href: '/print' }
];

export default function DesignsPage() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('modified');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [designToDelete, setDesignToDelete] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [currentUser, setCurrentUser] = useState({ email: 'demo@alton.com' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadDesigns();
    
    const interval = setInterval(() => {
      loadDesigns();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadDesigns = async () => {
    try {
      const result = await storage.get('user-designs', false);
      if (result && result.value) {
        const parsedDesigns = JSON.parse(result.value);
        setDesigns(parsedDesigns);
      } else {
        setDesigns([]);
      }
    } catch (error) {
      console.log('No designs found yet');
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteDesign = async (designName) => {
    try {
      const filtered = designs.filter(d => d.name !== designName);
      await storage.set('user-designs', JSON.stringify(filtered), false);
      setDesigns(filtered);
      setShowDeleteModal(false);
      setDesignToDelete(null);
    } catch (error) {
      console.error('Failed to delete design:', error);
      alert('Failed to delete design. Please try again.');
    }
  };

  const duplicateDesign = async (design) => {
    try {
      const newDesign = {
        ...design,
        id: Date.now().toString(),
        name: `${design.name} (Copy)`,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };
      const updated = [...designs, newDesign];
      await storage.set('user-designs', JSON.stringify(updated), false);
      setDesigns(updated);
    } catch (error) {
      console.error('Failed to duplicate design:', error);
      alert('Failed to duplicate design. Please try again.');
    }
  };

  const downloadDesign = (design) => {
    if (design.thumbnail) {
      const link = document.createElement('a');
      link.download = `${design.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = design.thumbnail;
      link.click();
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    console.log('Signed out');
  };

  const filteredDesigns = designs
    .filter(design => design.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'modified') {
        return new Date(b.lastModified) - new Date(a.lastModified);
      } else if (sortBy === 'created') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto text-purple-500 animate-spin mb-4" />
          <p className="text-white text-lg">Loading your designs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      
      {/* Navigation - MATCHING home/page.tsx */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/90 border-b border-purple-500/10"
      >
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo.svg" alt="Alton" className="w-32 h-8 hover:scale-105 transition" />
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="text-gray-400 hover:text-white transition">
                {item.label}
              </Link>
            ))}
            <Link href="/home" className="text-purple-400 hover:text-purple-300 transition font-bold">
              More...
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <Link href="/settings" className="hidden md:block">
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 text-purple-400 rounded-full hover:bg-purple-600/30 transition">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Account</span>
                </button>
              </Link>
            ) : (
              <Link href="/auth" className="hidden md:block">
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-2 rounded-full font-semibold transition">
                  Sign In
                </button>
              </Link>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu - MATCHING home/page.tsx */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
              />

              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed left-0 top-0 h-screen w-80 bg-zinc-950 border-r border-purple-500/20 z-50 md:hidden overflow-y-auto flex flex-col"
                style={{ height: '100vh', minHeight: '100vh' }}
              >
                <div className="p-6 border-b border-purple-500/20">
                  <div className="flex items-center justify-between mb-6">
                    <img src="/logo.svg" alt="Alton" className="w-24 h-7" />
                    <button 
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 hover:bg-white/10 rounded-lg transition"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {currentUser ? (
                    <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3 p-4 bg-purple-600/20 rounded-xl hover:bg-purple-600/30 transition">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xl border-2 border-white/20">
                          {currentUser.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold truncate">
                            {currentUser.email?.split('@')[0]}
                          </p>
                          <p className="text-purple-400 text-sm">View Profile</p>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-xl text-center hover:from-purple-700 hover:to-pink-700 transition">
                        <p className="text-white font-bold">Sign In to Continue</p>
                      </div>
                    </Link>
                  )}
                </div>

                <div className="flex-1 p-6 space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Navigation</p>
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-4 px-5 py-4 text-gray-300 hover:text-white hover:bg-purple-600/20 rounded-xl transition group"
                    >
                      <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                      <span className="font-semibold text-lg">{item.label}</span>
                    </Link>
                  ))}
                  <Link
                    href="/home"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 px-5 py-4 text-gray-300 hover:text-white hover:bg-purple-600/20 rounded-xl transition group"
                  >
                    <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                    <span className="font-semibold text-lg">More</span>
                  </Link>
                </div>

                <div className="p-6 border-t border-purple-500/20">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Quick Actions</p>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Link href="/studio" onClick={() => setMobileMenuOpen(false)}>
                      <div className="bg-white/5 border border-purple-500/20 rounded-xl p-5 hover:bg-white/10 transition text-center">
                        <Sparkles className="w-7 h-7 text-purple-400 mx-auto mb-2" />
                        <p className="text-white text-sm font-semibold">Studio</p>
                      </div>
                    </Link>
                    <Link href="/marketplace" onClick={() => setMobileMenuOpen(false)}>
                      <div className="bg-white/5 border border-purple-500/20 rounded-xl p-5 hover:bg-white/10 transition text-center">
                        <Search className="w-7 h-7 text-pink-400 mx-auto mb-2" />
                        <p className="text-white text-sm font-semibold">Feed</p>
                      </div>
                    </Link>
                    <Link href="/print" onClick={() => setMobileMenuOpen(false)}>
                      <div className="bg-white/5 border border-purple-500/20 rounded-xl p-5 hover:bg-white/10 transition text-center">
                        <FileText className="w-7 h-7 text-rose-400 mx-auto mb-2" />
                        <p className="text-white text-sm font-semibold">Print</p>
                      </div>
                    </Link>
                    <Link href="/community" onClick={() => setMobileMenuOpen(false)}>
                      <div className="bg-white/5 border border-purple-500/20 rounded-xl p-5 hover:bg-white/10 transition text-center">
                        <User className="w-7 h-7 text-cyan-400 mx-auto mb-2" />
                        <p className="text-white text-sm font-semibold">Community</p>
                      </div>
                    </Link>
                  </div>

                  {currentUser && (
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-red-600/20 border border-red-500/50 text-red-400 px-6 py-4 rounded-xl font-bold hover:bg-red-600/30 transition flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 pt-20">
        
        {/* Left Sidebar - MATCHING home/page.tsx */}
        <div className="hidden lg:flex w-20 bg-zinc-950 border-r border-purple-900/30 flex-col items-center py-8 gap-8 fixed left-0 top-20 bottom-0">
          <Link href="/home">
            <img
              src="/logo2.svg"
              alt="Alton Studio"
              className="w-10 h-10 rounded-lg hover:scale-110 transition"
            />
          </Link>

          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.href === '/designs';
            return (
              <Link key={item.label} href={item.href} className="group relative">
                <div className={`p-3 rounded-xl transition ${active ? 'bg-purple-900/40 text-purple-400' : 'hover:bg-purple-900/20'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="absolute left-full ml-4 px-3 py-1 bg-zinc-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                  {item.label}
                </span>
              </Link>
            );
          })}

          <div className="mt-auto">
            {currentUser ? (
              <Link href="/settings">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg hover:scale-110 transition cursor-pointer border-2 border-white/20">
                  {currentUser.email?.charAt(0).toUpperCase()}
                </div>
              </Link>
            ) : (
              <Link href="/auth">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition cursor-pointer border-2 border-purple-500/50">
                  <User className="w-6 h-6" />
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-20">
          {/* Header */}
          <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-20 z-40">
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                    <FolderOpen className="w-10 h-10 text-purple-500" />
                    My Designs
                  </h1>
                  <p className="text-gray-400">
                    {designs.length} {designs.length === 1 ? 'design' : 'designs'} saved
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Link href="/templates">
                    <button className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all shadow-lg shadow-purple-500/25">
                      <Plus className="w-5 h-5 text-white" />
                      <span className="font-bold text-white">Create New</span>
                    </button>
                  </Link>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search designs..."
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="modified">Last Modified</option>
                    <option value="created">Date Created</option>
                    <option value="name">Name</option>
                  </select>

                  <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded transition-colors ${
                        viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Grid3x3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded transition-colors ${
                        viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-7xl mx-auto px-6 py-8">
            {filteredDesigns.length === 0 ? (
              <div className="text-center py-20">
                {searchQuery ? (
                  <>
                    <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">No designs found</h3>
                    <p className="text-gray-400 mb-6">Try a different search term</p>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">No designs yet</h3>
                    <p className="text-gray-400 mb-6">Create your first design to get started</p>
                    <Link href="/templates">
                      <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all shadow-lg shadow-purple-500/25">
                        <Plus className="w-5 h-5 text-white" />
                        <span className="font-bold text-white">Create Design</span>
                      </button>
                    </Link>
                  </>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDesigns.map((design) => (
                  <div
                    key={design.id}
                    className="group relative bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-500/20"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[4/3] bg-gray-900 overflow-hidden">
                      {design.thumbnail ? (
                        <img
                          src={design.thumbnail}
                          alt={design.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-16 h-16 text-gray-700" />
                        </div>
                      )}
                      
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Link href={`/studio?edit=${encodeURIComponent(design.name)}`}>
                          <button className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors" title="Edit">
                            <Edit3 className="w-5 h-5 text-white" />
                          </button>
                        </Link>
                        <button
                          onClick={() => downloadDesign(design)}
                          className="p-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-5 h-5 text-white" />
                        </button>
                        <button
                          onClick={() => duplicateDesign(design)}
                          className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-bold text-lg truncate flex-1">{design.name}</h3>
                        <button
                          onClick={() => setActiveMenu(activeMenu === design.id ? null : design.id)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>{design.pages?.length || 1} page{(design.pages?.length || 1) > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(design.lastModified)}</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        {design.size || 'Custom'}
                      </div>

                      {/* Dropdown Menu */}
                      {activeMenu === design.id && (
                        <div className="absolute right-4 top-[280px] bg-black/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl z-10 py-2 min-w-[160px]">
                          <Link href={`/studio?edit=${encodeURIComponent(design.name)}`}>
                            <button className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 transition-colors w-full">
                              <Edit3 className="w-4 h-4" />
                              Edit
                            </button>
                          </Link>
                          <button
                            onClick={() => duplicateDesign(design)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <button
                            onClick={() => downloadDesign(design)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                          <div className="border-t border-white/10 my-2" />
                          <button
                            onClick={() => {
                              setDesignToDelete(design);
                              setShowDeleteModal(true);
                              setActiveMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDesigns.map((design) => (
                  <div
                    key={design.id}
                    className="group bg-white/5 rounded-xl border border-white/10 p-4 hover:border-purple-500/50 transition-all hover:shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      {/* Thumbnail */}
                      <div className="w-24 h-24 rounded-lg bg-gray-900 overflow-hidden flex-shrink-0">
                        {design.thumbnail ? (
                          <img src={design.thumbnail} alt={design.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gray-700" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-lg mb-1 truncate">{design.name}</h3>
                        <div className="flex items-center gap-6 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span>{design.pages?.length || 1} page{(design.pages?.length || 1) > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(design.lastModified)}</span>
                          </div>
                          <div>
                            <span>{design.size || 'Custom'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Link href={`/studio?edit=${encodeURIComponent(design.name)}`}>
                          <button className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors" title="Edit">
                            <Edit3 className="w-4 h-4 text-white" />
                          </button>
                        </Link>
                        <button
                          onClick={() => downloadDesign(design)}
                          className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => duplicateDesign(design)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => {
                            setDesignToDelete(design);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - MATCHING home/page.tsx */}
      <footer className="py-16 px-5 border-t border-purple-500/10">
        <div className="max-w-7xl mx-auto text-center space-y-10">
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-gray-400">
            <Link href="/studio" className="hover:text-white transition">AI Studio</Link>
            <Link href="/marketplace" className="hover:text-white transition">Alton Feed</Link>
            <Link href="/alton-designs" className="hover:text-white transition">Alton Designs</Link>
            <Link href="/print" className="hover:text-white transition">Print Network</Link>
            <Link href="/jobs" className="hover:text-white transition">Creator Jobs</Link>
            <Link href="/community" className="hover:text-white transition">Community</Link>
            <Link href="/contributor/apply" className="hover:text-white transition font-bold text-purple-400">Upload Your Content</Link>
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-sm text-gray-500">
            <span>© 2025 Alton Studio. All rights reserved.</span>
            <Link href="/privacy" className="hover:text-purple-400 transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-purple-400 transition">Terms & Conditions</Link>
          </div>
        </div>
      </footer>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && designToDelete && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Delete Design?</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete <span className="text-white font-medium">"{designToDelete.name}"</span>? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-medium text-white transition-all border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteDesign(designToDelete.name)}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-white transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {activeMenu && (
        <div 
          className="fixed inset-0 z-[5]" 
          onClick={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}