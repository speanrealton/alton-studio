// src/app/page.tsx — COMPLETE FIXED VERSION WITH ALTON DESIGNS
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Palette, Sparkles, Printer, Globe, ArrowRight, Users, Zap, Menu, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import AuthButton from '@/components/AuthButton';
import AuthModal from '@/components/AuthModal';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Rotating Text Component
function RotatingText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const words = [
    { text: 'Monetize Your Art', colors: 'from-purple-400 via-pink-400 to-rose-400' },
    { text: 'Amplify Your Reach', colors: 'from-blue-400 via-cyan-400 to-teal-400' },
    { text: 'Scale Your Business', colors: 'from-emerald-400 via-green-400 to-lime-400' },
    { text: 'Grow Your Impact', colors: 'from-orange-400 via-red-400 to-pink-400' },
    { text: 'Build Your Empire', colors: 'from-indigo-400 via-purple-400 to-violet-400' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.span
      key={currentIndex}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5 }}
      className={`bg-gradient-to-r ${words[currentIndex].colors} bg-clip-text text-transparent`}
    >
      {words[currentIndex].text}
    </motion.span>
  );
}

// Robot with Floating Cards Component
function RobotWithCards() {
  const [currentCard, setCurrentCard] = useState(0);
  
  const cards = [
    { text: 'Transform your creativity into stunning designs with AI-powered tools', color: 'from-purple-400 via-pink-400 to-rose-400' },
    { text: 'Reach millions of customers globally and scale your business instantly', color: 'from-blue-400 via-cyan-400 to-teal-400' },
    { text: 'Print on-demand and ship worldwide with professional quality every time', color: 'from-emerald-400 via-green-400 to-lime-400' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % cards.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex items-center justify-center z-10 w-full h-full min-h-screen md:min-h-auto">
      {/* Floating Robot - Much Bigger */}
      <motion.div
        animate={{ y: [0, -30, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="absolute left-2/3 -translate-x-1/2 z-20"
      >
        <img
          src="/robot3.png"
          alt="Robot"
          className="w-72 h-[22rem] md:w-[22rem] md:h-[26rem] object-contain drop-shadow-2xl"
          style={{
            filter: 'drop-shadow(0 0 40px rgba(100, 200, 255, 0.6)) drop-shadow(0 0 20px rgba(138, 43, 226, 0.4))'
          }}
        />
      </motion.div>

      {/* Card on Top Right of Robot */}
      <motion.div
        key={currentCard}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5 }}
        className={`absolute right-6 md:right-12 top-20 md:top-32 z-10 w-40 md:w-48 px-4 py-3 rounded-lg shadow-lg text-white font-semibold text-xs md:text-sm bg-gradient-to-r ${cards[currentCard].color} flex items-center justify-center text-center`}
      >
        {cards[currentCard].text}
      </motion.div>
    </div>
  );
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [videos, setVideos] = useState<any[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentMockup, setCurrentMockup] = useState<'squeegee' | 'camera'>('squeegee');
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement }>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const designImages = [
    '/image1.jpg', '/image2.jpg', '/image3.jpg', '/image4.jpg', '/image5.jpg',
    '/image6.jpg', '/image7.jpg', '/image8.jpg', '/image9.jpg', '/image10.jpg'
  ];

  const features = [
    { icon: Sparkles, title: "AI-Powered Design", desc: "Create stunning visuals instantly" },
    { icon: Palette, title: "Global Reach", desc: "Connect with millions worldwide" },
    { icon: Printer, title: "On-Demand Printing", desc: "Print and ship anywhere" },
    { icon: Globe, title: "Work Remotely", desc: "Get hired by brands globally" },
    { icon: Zap, title: "Quick Apply", desc: "Apply to jobs in seconds" },
    { icon: Users, title: "Team Up", desc: "Collaborate with creators" },
    { icon: Sparkles, title: "Smart Templates", desc: "Access thousands of designs" },
    { icon: Palette, title: "Brand Assets", desc: "Manage your creative library" },
    { icon: Printer, title: "Quality Printing", desc: "Professional grade materials" },
    { icon: Globe, title: "Fast Delivery", desc: "Worldwide shipping included" },
    { icon: Zap, title: "Real-Time Preview", desc: "See changes instantly" },
    { icon: Users, title: "Creator Network", desc: "Join our community" },
    { icon: Sparkles, title: "Custom Orders", desc: "Personalized products available" },
    { icon: Palette, title: "Color Matching", desc: "Perfect color accuracy" },
    { icon: Printer, title: "Bulk Orders", desc: "Volume discounts available" },
    { icon: Globe, title: "Multi-Language", desc: "Support in your language" },
    { icon: Zap, title: "Quick Turnaround", desc: "Fast production times" },
    { icon: Users, title: "24/7 Support", desc: "We're here to help" },
  ];

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);
      
      setIsCheckingAuth(false);
    };

    checkAuth();

    // Load videos from marketplace
    const loadVideos = async () => {
      const { data } = await supabase
        .from('printing_videos')
        .select('id, video_url, creator_name, creator_username')
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (data) {
        setVideos(data);
      }
    };

    loadVideos();

    // Listen for auth state changes to close modal when user logs in
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
      if (event === 'SIGNED_IN') {
        setShowAuthModal(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Auto-switch mockups every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMockup(prev => prev === 'squeegee' ? 'camera' : 'squeegee');
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Track cursor position for character eye tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    router.push('/');
  };

  // Auto-rotate videos when one ends
  useEffect(() => {
    const currentVideo = videoRefs.current[currentVideoIndex];
    
    if (currentVideo) {
      const handleEnded = () => {
        setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
      };

      currentVideo.addEventListener('ended', handleEnded);
      
      return () => {
        currentVideo.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentVideoIndex, videos.length]);

  // Play current video
  useEffect(() => {
    Object.keys(videoRefs.current).forEach((key) => {
      const index = parseInt(key);
      const video = videoRefs.current[index];
      if (video) {
        if (index === currentVideoIndex) {
          video.play().catch(err => console.log('Play error:', err));
        } else {
          video.pause();
        }
      }
    });
  }, [currentVideoIndex]);

  // Auto-scroll features (LEFT TO RIGHT)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    let pos = 0;
    const scroll = () => {
      pos -= 0.5; // Negative value = LEFT to RIGHT movement
      if (pos <= -el.scrollWidth / 2) {
        pos = 0;
      }
      el.scrollLeft = Math.abs(pos);
      requestAnimationFrame(scroll);
    };
    
    const animation = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animation);
  }, []);

  // Handle CTA clicks - show auth modal if not logged in
  const handleCTAClick = async (e: React.MouseEvent, href: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      e.preventDefault();
      setShowAuthModal(true);
    }
  };

  const navItems = [
    { label: 'Studio', href: '/studio' },
    { label: 'Alton Feed', href: '/marketplace' },
    { label: 'Community', href: '/community' },
    { label: 'Alton Designs', href: '/alton-designs' },
    { label: 'Print', href: '/print' }
  ];

  return (
    <div className="bg-black text-white overflow-x-hidden">
      
      {/* Auth Modal Popup */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/90 border-b border-purple-500/10"
      >
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/logo.svg" alt="Alton" width={120} height={32} className="hover:scale-105 transition" />
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
            <AuthButton />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
              />

              {/* Sidebar - FULL HEIGHT */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed left-0 top-0 h-screen w-80 bg-zinc-950 border-r border-purple-500/20 z-50 md:hidden overflow-y-auto flex flex-col"
                style={{ height: '100vh', minHeight: '100vh' }}
              >
                {/* Header */}
                <div className="p-6 border-b border-purple-500/20">
                  <div className="flex items-center justify-between mb-6">
                    <Image src="/logo.svg" alt="Alton" width={100} height={28} />
                    <button 
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 hover:bg-white/10 rounded-lg transition"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* User Profile Section */}
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

                {/* Navigation Links */}
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

                {/* Quick Actions */}
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
                        <Globe className="w-7 h-7 text-pink-400 mx-auto mb-2" />
                        <p className="text-white text-sm font-semibold">Feed</p>
                      </div>
                    </Link>
                    <Link href="/print" onClick={() => setMobileMenuOpen(false)}>
                      <div className="bg-white/5 border border-purple-500/20 rounded-xl p-5 hover:bg-white/10 transition text-center">
                        <Printer className="w-7 h-7 text-rose-400 mx-auto mb-2" />
                        <p className="text-white text-sm font-semibold">Print</p>
                      </div>
                    </Link>
                    <Link href="/community" onClick={() => setMobileMenuOpen(false)}>
                      <div className="bg-white/5 border border-purple-500/20 rounded-xl p-5 hover:bg-white/10 transition text-center">
                        <Users className="w-7 h-7 text-cyan-400 mx-auto mb-2" />
                        <p className="text-white text-sm font-semibold">Community</p>
                      </div>
                    </Link>
                  </div>

                  {/* Sign Out Button (only if logged in) */}
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

      {/* Hero — PREMIUM PROFESSIONAL DESIGN */}
      <section className="relative min-h-screen flex items-center px-5 pt-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ rotate: -360 }} 
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ y: [0, 30, 0] }} 
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/2 w-72 h-72 bg-cyan-600/5 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-10 items-center relative z-10">

          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="space-y-8">
            <div className="space-y-3">
              <motion.div 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.2 }}
                className="inline-block"
              >
              </motion.div>
              
              <h1 className="text-3xl md:text-3xl lg:text-4xl font-black leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Design, Print &<br />
                <RotatingText /><br />
                <span className="text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text">
                  Globally
                </span>
              </h1>
            </div>

            <p className="text-sm md:text-base text-gray-400 max-w-lg leading-relaxed" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Join thousands of creative professionals turning their designs into successful businesses. From concept to market in minutes with Alton's AI-powered platform.
            </p>

            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-2 md:gap-3 pt-2"
            >
              <div className="bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-lg p-2 md:p-3 hover:bg-white/10 transition">
                <p className="text-lg md:text-xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">10K+</p>
                <p className="text-xs text-gray-400 mt-0.5">Creators</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-lg p-2 md:p-3 hover:bg-white/10 transition">
                <p className="text-lg md:text-xl font-bold text-transparent bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text">500K+</p>
                <p className="text-xs text-gray-400 mt-0.5">Designs</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-lg p-2 md:p-3 hover:bg-white/10 transition">
                <p className="text-lg md:text-xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text">100+</p>
                <p className="text-xs text-gray-400 mt-0.5">Countries</p>
              </div>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link href="/studio" onClick={(e) => handleCTAClick(e, '/studio')}>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-5 md:px-7 py-4 md:py-5 rounded-lg text-base font-semibold shadow-lg transition-all hover:shadow-purple-600/50 hover:scale-105" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Start Creating Now
                </Button>
              </Link>
              <Link href="/home" onClick={(e) => handleCTAClick(e, '/home')}>
                <Button className="bg-white/10 border border-purple-400/50 hover:bg-white/20 px-5 md:px-7 py-4 md:py-5 rounded-lg text-base font-semibold transition-all hover:border-purple-400" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Learn More <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Professional 3D Robot Assistant */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3 }} className="relative h-96 md:h-full flex items-center justify-center lg:col-span-2" style={{ perspective: '1200px' }}>
            {/* Growing color aura */}
            <motion.div
              className="absolute w-80 h-80 md:w-96 md:h-96 rounded-full blur-3xl opacity-40"
              style={{
                background: 'radial-gradient(circle, rgba(100, 200, 255, 0.8) 0%, rgba(138, 43, 226, 0.4) 50%, rgba(255, 20, 147, 0.2) 100%)',
              }}
              animate={{
                rotate: 360,
              }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            />

            {/* Secondary color layer */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                scale: [1.2, 0.9, 1.2],
              }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.2 }}
            >
              <div
                className="absolute w-72 h-72 md:w-80 md:h-80 rounded-full blur-2xl opacity-30"
                style={{
                  background: 'radial-gradient(circle, rgba(138, 43, 226, 0.6) 0%, rgba(100, 200, 255, 0.3) 50%, rgba(0, 255, 200, 0.1) 100%)',
                }}
              />
            </motion.div>

            {/* Robot with Floating Scrolling Cards */}
            <RobotWithCards />
          </motion.div>
        </div>
      </section>

      {/* Real-time Videos Section */}
      {videos.length > 0 && (
        <section className="py-20 px-5 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            className="max-w-6xl mx-auto text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Live From Our Community
            </h2>
            <p className="text-gray-400 text-lg">Watch what creators are printing right now</p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-3 gap-4 items-start perspective-1000">
              {/* Center Column - Main Video */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="col-start-2 z-20"
              >
                {videos[currentVideoIndex] && (
                  <div className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border-4 border-purple-500/50">
                    <video
                      ref={el => { if (el) videoRefs.current[currentVideoIndex] = el; }}
                      src={videos[currentVideoIndex].video_url}
                      className="w-full h-full object-cover"
                      loop={false}
                      muted
                      playsInline
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <p className="text-white font-bold text-sm">@{videos[currentVideoIndex].creator_username}</p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Left Column - Previous Video (Behind) */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="col-start-1 row-start-1 transform scale-75 opacity-60 blur-sm z-10 mt-20"
              >
                {videos[(currentVideoIndex + videos.length - 1) % videos.length] && (
                  <div className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-xl border-2 border-purple-500/30">
                    <video
                      src={videos[(currentVideoIndex + videos.length - 1) % videos.length].video_url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  </div>
                )}
              </motion.div>

              {/* Right Column - Next Video (Behind) */}
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="col-start-3 row-start-1 transform scale-75 opacity-60 blur-sm z-10 mt-20"
              >
                {videos[(currentVideoIndex + 1) % videos.length] && (
                  <div className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-xl border-2 border-purple-500/30">
                    <video
                      src={videos[(currentVideoIndex + 1) % videos.length].video_url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  </div>
                )}
              </motion.div>
            </div>

            {/* Video Counter */}
            <div className="flex justify-center gap-2 mt-8">
              {videos.slice(0, 6).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentVideoIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentVideoIndex 
                      ? 'w-8 bg-purple-500' 
                      : 'w-2 bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>

            {/* Explore Feed Button */}
            <div className="flex justify-center mt-10">
              <Link href="/marketplace">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-10 py-6 rounded-xl text-lg font-semibold shadow-2xl">
                  Explore Feed <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Floating Design Images */}
      <section className="py-20 px-5 relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 50 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          className="max-w-6xl mx-auto text-center mb-16 relative z-10"
        >
          <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Design Inspiration
          </h2>
          <p className="text-gray-400 text-lg">Beautiful designs from our talented creators</p>
        </motion.div>

        {/* Floating Images - BIGGER & FASTER */}
        <div className="relative h-[600px] md:h-[700px] max-w-7xl mx-auto">
          {designImages.map((img, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              animate={{
                y: [0, -30, 0],
                rotate: [0, 8, 0, -8, 0],
              }}
              transition={{
                delay: index * 0.08,
                duration: 3 + index * 0.5, // FASTER animation
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute"
              style={{
                left: `${(index * 11) % 90}%`,
                top: `${(index * 23) % 70}%`,
                zIndex: index % 3
              }}
            >
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/50 to-pink-500/50 rounded-2xl blur-xl group-hover:blur-2xl transition" />
                <img
                  src={img}
                  alt={`Design ${index + 1}`}
                  className="relative w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 object-cover rounded-2xl border-4 border-white/20 shadow-2xl group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    console.log(`Image load error for ${img}`);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Design Yours Now Button */}
        <div className="flex justify-center relative z-10 mt-8">
          <Link href="/alton-designs">
            <Button className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 px-10 py-6 rounded-xl text-lg font-semibold shadow-2xl">
              Explore Designs <Sparkles className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-5">
      </section>

      {/* Footer */}
      <footer className="py-16 px-5 border-t border-purple-500/10">
        <div className="max-w-7xl mx-auto text-center space-y-10">
          
          {/* Services */}
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

      {/* Scrolling Features - At the very bottom */}
      <section className="py-10 bg-gradient-to-b from-black to-purple-950/20 border-t border-purple-500/10 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Everything You Need to Succeed
          </h3>
        </motion.div>

        <div className="relative">
          {/* Left Fade */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black via-black to-transparent z-10 pointer-events-none" />
          
          {/* Right Fade */}
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black via-black to-transparent z-10 pointer-events-none" />

          {/* Scrolling Container - Left to Right */}
          <div 
            ref={scrollRef}
            className="flex gap-4 overflow-x-hidden py-3"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            
            {/* Features - Moving Left to Right */}
            {features.map((f, i) => (
              <div 
                key={`feature-${i}`}
                className="flex-shrink-0 bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-xl px-6 py-3 hover:border-purple-500/60 transition-all"
              >
                <div className="flex items-center gap-3">
                  <f.icon className="w-6 h-6 text-purple-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white">{f.title}</h4>
                    <p className="text-xs text-gray-400">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}