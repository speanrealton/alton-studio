// src/app/templates/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Loader2, Sparkles, Layers, Plus, Home, FolderOpen, LayoutTemplate, User, Menu, X, LogOut, ArrowRight, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const defaultAssets = [
  'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1200&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=1200&fit=crop',
];

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

export default function Templates() {
  const [activeTab, setActiveTab] = useState<'custom' | 'freepik'>('custom');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [defaultTemplates, setDefaultTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCustom, setLoadingCustom] = useState(true);
  const [loadingDefault, setLoadingDefault] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentUser, setCurrentUser] = useState<any>({ email: 'demo@alton.com' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load custom templates
  useEffect(() => {
    const loadCustomTemplates = async () => {
      try {
        console.log('Fetching custom templates...');
        const res = await fetch('/api/custom-templates');
        console.log('Response status:', res.status);
        const data = await res.json();
        console.log('Templates loaded:', data.templates?.length);
        
        const localTemplate = {
          id: 'bc-01',
          name: 'Minimal White',
          category: 'Business Card',
          thumbnail: '/image1.jpg',
          data: {
            width: 1050,
            height: 600,
            background: '#ffffff',
            layers: [
              { id: 'name', type: 'text', content: 'John Doe', x: 80, y: 180, fontSize: 56, fontFamily: 'Poppins', fontWeight: '600', color: '#111111' },
              { id: 'role', type: 'text', content: 'Business Consultant', x: 80, y: 250, fontSize: 28, fontFamily: 'Poppins', color: '#666666' },
              { id: 'line', type: 'shape', shape: 'rectangle', x: 80, y: 300, width: 120, height: 6, fill: '#111111' },
              { id: 'contact', type: 'text', content: '+256 700 000000  |  john@email.com', x: 80, y: 360, fontSize: 26, fontFamily: 'Poppins', color: '#333333' },
            ]
          }
        };

        const templates = data.templates || [];
        const exists = templates.find((t: any) => t.id === localTemplate.id);
        if (!exists) {
          setCustomTemplates([localTemplate, ...templates]);
        } else {
          setCustomTemplates(templates);
        }
      } catch (err) {
        console.error('Failed to load custom templates:', err);
        setCustomTemplates([{
          id: 'bc-01',
          name: 'Minimal White',
          category: 'Business Card',
          thumbnail: '/image1.jpg',
          data: {
            width: 1050,
            height: 600,
            background: '#ffffff',
            layers: [
              { id: 'name', type: 'text', content: 'John Doe', x: 80, y: 180, fontSize: 56, fontFamily: 'Poppins', fontWeight: '600', color: '#111111' },
              { id: 'role', type: 'text', content: 'Business Consultant', x: 80, y: 250, fontSize: 28, fontFamily: 'Poppins', color: '#666666' },
              { id: 'line', type: 'shape', shape: 'rectangle', x: 80, y: 300, width: 120, height: 6, fill: '#111111' },
              { id: 'contact', type: 'text', content: '+256 700 000000  |  john@email.com', x: 80, y: 360, fontSize: 26, fontFamily: 'Poppins', color: '#333333' },
            ]
          }
        }]);
      } finally {
        setLoadingCustom(false);
      }
    };

    loadCustomTemplates();
  }, []);

  // Load Freepik templates
  useEffect(() => {
    if (activeTab === 'freepik' && defaultTemplates.length === 0) {
      loadFreepikTemplates();
    }
  }, [activeTab]);

  const loadFreepikTemplates = async () => {
    setLoadingDefault(true);
    try {
      const categories = ['business card', 'poster', 'logo', 'flyer'];
      const allTemplates: any[] = [];

      for (const category of categories) {
        const res = await fetch('/api/freepik-search', {
          method: 'POST',
          body: JSON.stringify({ query: category }),
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            allTemplates.push(...data.results);
          }
        }
      }

      setDefaultTemplates(allTemplates.slice(0, 100));
    } catch (err) {
      console.error('Failed to load Freepik templates:', err);
      setDefaultTemplates(defaultAssets.map(p => ({ preview: p })));
    } finally {
      setLoadingDefault(false);
    }
  };

  const search = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/freepik-search', {
        method: 'POST',
        body: JSON.stringify({ query: query.trim() }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      }

      if (data.results && data.results.length > 0) {
        setResults(data.results);
      } else {
        setResults([]);
        if (!data.error) {
          setError('No results found. Try different keywords.');
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const openInStudio = (url: string) => {
    window.open(`/studio?bg=${encodeURIComponent(url)}`, '_blank');
  };

  const openCustomTemplate = (template: any) => {
    window.open(`/studio?templateId=${template.id}`, '_blank');
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    console.log('Signed out');
  };

  const categories = ['All', ...new Set(customTemplates.map(t => t.category))];
  const filteredCustomTemplates = selectedCategory === 'All' 
    ? customTemplates 
    : customTemplates.filter(t => t.category === selectedCategory);

  const displayTemplates = results.length > 0 ? results : defaultTemplates;

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

        {/* Mobile Menu */}
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
        
        {/* Sidebar */}
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
            const active = item.href === '/templates';
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
          <div className="text-center py-16 px-6">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
              Choose Your Starting Point
            </h1>
            <p className="text-lg text-gray-400">Fully editable templates or inspiration from Freepik</p>
          </div>

          {/* Tabs */}
          <div className="max-w-4xl mx-auto px-6 mb-8">
            <div className="flex gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
              <button
                onClick={() => setActiveTab('custom')}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all ${
                  activeTab === 'custom'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/25'
                    : 'hover:bg-white/5'
                }`}
              >
                <Layers className="w-5 h-5" />
                <span>Editable Templates</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                  Fully Editable
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab('freepik')}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-bold transition-all ${
                  activeTab === 'freepik'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/25'
                    : 'hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                <span>Freepik Inspiration</span>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                  Background Only
                </span>
              </button>
            </div>
          </div>

          {/* Custom Templates View */}
          {activeTab === 'custom' && (
            <>
              {/* Category Filter */}
              <div className="max-w-7xl mx-auto px-6 mb-8">
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-6 py-2.5 rounded-full font-medium whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {loadingCustom ? (
                <div className="text-center py-20">
                  <Loader2 className="w-12 h-12 mx-auto text-purple-500 animate-spin" />
                  <p className="text-purple-400 mt-4">Loading templates...</p>
                </div>
              ) : (
                <div className="px-6 pb-20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {filteredCustomTemplates.map((template, i) => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => openCustomTemplate(template)}
                        className="group relative cursor-pointer rounded-2xl overflow-hidden shadow-2xl border border-white/10 hover:border-purple-500/50 transition-all hover:scale-105 bg-white/5"
                      >
                        <div className="relative aspect-[4/3] bg-gradient-to-br from-purple-900/20 to-pink-900/20">
                          <Image
                            src={template.thumbnail}
                            alt={template.name}
                            fill
                            className="object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-lg mb-1">{template.name}</h3>
                          <p className="text-sm text-gray-400">{template.category}</p>
                          <div className="mt-3 flex items-center gap-2">
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                              Fully Editable
                            </span>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                          <span className="text-sm font-bold text-white">Use Template →</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Freepik Templates View */}
          {activeTab === 'freepik' && (
            <>
              <div className="max-w-2xl mx-auto px-6 mb-16">
                <div className="relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-purple-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && search()}
                    placeholder="business card, poster, logo, pattern..."
                    className="w-full pl-16 pr-6 py-6 bg-white/5 border border-white/10 rounded-full text-lg placeholder-gray-500 focus:outline-none focus:border-purple-400"
                  />
                </div>
                {error && (
                  <p className="text-yellow-500 text-sm mt-3 text-center">{error}</p>
                )}
                <p className="text-sm text-gray-500 text-center mt-3">
                  Note: These are reference images only. You can use them as backgrounds and add your own content on top.
                </p>
              </div>

              {(loading || loadingDefault) && (
                <div className="text-center py-20">
                  <Loader2 className="w-12 h-12 mx-auto text-purple-500 animate-spin" />
                  <p className="text-purple-400 mt-4">
                    {loading ? 'Searching templates...' : 'Loading 100+ templates...'}
                  </p>
                </div>
              )}

              {!loading && !loadingDefault && (
                <div className="px-6 pb-20">
                  {results.length === 0 && defaultTemplates.length > 0 && (
                    <h2 className="text-2xl font-bold text-center mb-8 text-gray-300">
                      Featured Inspiration
                    </h2>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 max-w-7xl mx-auto">
                    {displayTemplates.map((asset, i) => (
                      <motion.div
                        key={asset.id || i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        whileHover={{ y: -8 }}
                        onClick={() => openInStudio(asset.preview)}
                        className="group relative cursor-pointer rounded-2xl overflow-hidden shadow-2xl"
                      >
                        <Image
                          src={asset.preview}
                          alt="Template"
                          width={600}
                          height={600}
                          className="w-full aspect-square object-cover transition-transform group-hover:scale-110"
                          placeholder="blur"
                          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                          <span className="text-xs font-bold text-white">Use as Background</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
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
    </div>
  );
}