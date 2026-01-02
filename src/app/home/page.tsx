// Complete home/page.tsx with navbar and footer matching app/page.tsx
'use client';

import Link from 'next/link';
import { Plus, Home, FolderOpen, LayoutTemplate, Sparkles, Search, Mail, Presentation, Heart, Video, FileText, Pencil, Grid3X3, Upload, MoreHorizontal, User, Menu, X, LogOut, ArrowRight, Image as ImgIcon } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const nav = [
  { icon: Plus, label: 'Create', href: '/studio' },
  { icon: Home, label: 'Home', href: '/home' },
  { icon: FolderOpen, label: 'Projects', href: '/designs' },
  { icon: LayoutTemplate, label: 'Templates', href: '/templates' },
  { icon: Sparkles, label: 'Alton Magic', href: '/professional-design' },
];

const categories = [
  { icon: Mail, label: 'Email', href: '/studio?type=email' },
  { icon: Presentation, label: 'Presentation', href: '/studio?type=presentation' },
  { icon: Heart, label: 'Social media', href: '/studio?type=social' },
  { icon: Video, label: 'Video', href: '/studio?type=video' },
  { icon: FileText, label: 'Doc', href: '/studio?type=doc' },
  { icon: Pencil, label: 'Whiteboard', href: '/studio?type=whiteboard' },
  { icon: Grid3X3, label: 'Sheet', href: '/studio?type=sheet' },
  { icon: ImgIcon, label: 'Photo editor', href: '/studio?type=photo' },
  { icon: Upload, label: 'Upload', href: '/marketplace/upload' },
  { icon: MoreHorizontal, label: 'More', href: '/templates' },
];

const allTemplates = [
  { name: 'Business Card', image: '/image11.jpg' },
  { name: 'Instagram Post', image: '/image12.jpg' },
  { name: 'Flyer', image: '/image13.jpg' },
  { name: 'Poster', image: '/image14.jpg' },
  { name: 'Logo', image: '/image15.jpg' },
  { name: 'YouTube Thumbnail', image: '/image16.jpg' },
  { name: 'Resume', image: '/image17.jpg' },
  { name: 'Invitation', image: '/image18.jpg' },
  { name: 'Social Media Kit', image: '/image19.jpg' },
  { name: 'Presentation', image: '/image20.jpg' },
  { name: 'Brochure', image: '/image21.jpg' },
  { name: 'Menu', image: '/image22.jpg' },
  { name: 'Certificate', image: '/image23.jpg' },
  { name: 'Invoice', image: '/image24.jpg' },
  { name: 'T-Shirt Design', image: '/image25.jpg' },
  { name: 'Book Cover', image: '/image26.jpg' },
  { name: 'Album Cover', image: '/image27.jpg' },
  { name: 'Wedding Card', image: '/image28.jpg' }
];

const navItems = [
  { label: 'Studio', href: '/studio' },
  { label: 'Alton Feed', href: '/marketplace' },
  { label: 'Community', href: '/community' },
  { label: 'Alton Designs', href: '/alton-designs' },
  { label: 'Print', href: '/print' }
];

export default function HomeDashboard() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<any>({ email: 'demo@alton.com' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let pos = 0;
    const step = () => {
      pos += 0.6;
      if (pos >= el.scrollWidth / 2) pos = 0;
      el.scrollLeft = pos;
      requestAnimationFrame(step);
    };
    const animation = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animation);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    console.log('Signed out');
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      
      {/* Navigation - MATCHING app/page.tsx */}
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

        {/* Mobile Menu - MATCHING app/page.tsx FULL HEIGHT SIDEBAR */}
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

      {/* Main Content Area */}
      <div className="flex flex-1 pt-20">
        
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
            const active = item.href === '/home';
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

        <div className="flex-1 lg:ml-20 flex flex-col items-center overflow-y-auto py-10 px-6">
          <div className="w-full max-w-5xl">

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-center mb-12 bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent"
            >
              Discover our latest launches
            </motion.h1>

            <div className="flex justify-center gap-4 mb-10 flex-wrap">
              <Link href="/designs">
                <button className="px-6 py-2.5 bg-purple-900/40 text-purple-300 rounded-full text-sm font-medium hover:bg-purple-900/60 transition">
                  Your designs
                </button>
              </Link>
              <Link href="/templates">
                <button className="px-6 py-2.5 bg-white/10 border border-purple-500/30 rounded-full text-sm font-medium hover:bg-white/20 transition">
                  Templates
                </button>
              </Link>
              <Link href="/marketplace">
                <button className="px-6 py-2.5 bg-white/10 border border-purple-500/30 rounded-full text-sm font-medium hover:bg-white/20 transition">
                  Alton Feed
                </button>
              </Link>
              <Link href="/professional-design">
                <button className="px-6 py-2.5 bg-white/10 border border-purple-500/30 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-white/20 transition">
                  <Sparkles className="w-4 h-4" /> Alton Magic
                </button>
              </Link>
            </div>

            <div className="relative max-w-2xl mx-auto mb-12">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search designs, folders and uploads"
                className="w-full pl-14 pr-6 py-4 bg-white/5 border border-purple-500/20 rounded-full placeholder-gray-500 focus:outline-none focus:border-purple-400 transition text-white"
              />
            </div>

            <div className="flex justify-center gap-8 flex-wrap mb-16">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link key={cat.label} href={cat.href}>
                    <button className="flex flex-col items-center gap-3 group">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center group-hover:scale-110 transition shadow-lg">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-xs text-gray-400 group-hover:text-white transition">{cat.label}</span>
                    </button>
                  </Link>
                );
              })}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

              <div ref={scrollRef} className="flex gap-8 overflow-x-hidden">
                {[...allTemplates, ...allTemplates].map((template, idx) => (
                  <Link key={`${template.name}-${idx}`} href="/studio" className="flex-shrink-0 w-64 group">
                    <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl overflow-hidden group-hover:border-purple-600 transition shadow-xl">
                      <div className="h-44 relative overflow-hidden">
                        <img 
                          src={template.image} 
                          alt={template.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.style.background = 'linear-gradient(to bottom right, rgba(147, 51, 234, 0.2), rgba(236, 72, 153, 0.2))';
                              const placeholder = document.createElement('div');
                              placeholder.className = 'w-48 h-36 bg-white/10 border-2 border-dashed border-purple-500/50 rounded-xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
                              parent.appendChild(placeholder);
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-center py-4 text-sm font-medium text-gray-300 group-hover:text-white transition">
                        {template.name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer - MATCHING app/page.tsx */}
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