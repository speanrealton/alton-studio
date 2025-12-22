'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, MapPin, Star, BadgeCheck, Leaf, Clock, DollarSign, Heart, 
  MessageCircle, Filter, Grid3x3, List, Sparkles, Phone, Mail, Globe, 
  X, Send, Loader2, Menu, ArrowRight, Users, Palette, Printer as PrinterIcon, 
  Zap, LogOut, TrendingUp, Award, Shield, ChevronDown, SlidersHorizontal,
  Building2, Package, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

import ChatSystem from '@/components/ChatSystem';
import GeoLocationSearch from '@/components/GeoLocationSearch';

const categories = [
  { id: 'tshirt', label: 'T-Shirts', icon: '👕' },
  { id: 'business-card', label: 'Business Cards', icon: '💼' },
  { id: 'poster', label: 'Posters', icon: '🎨' },
  { id: 'canvas', label: 'Canvas', icon: '🖼️' },
  { id: 'packaging', label: 'Packaging', icon: '📦' },
  { id: 'promotional', label: 'Promotional', icon: '🎁' },
  { id: 'large-format', label: 'Large Format', icon: '📐' },
  { id: '3d-printing', label: '3D Print', icon: '🔮' }
];

export default function PrintNetwork() {
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);
  const [countries, setCountries] = useState([]);
  const [stats, setStats] = useState({ total: 0, countries: 0, prints: 0 });
  const [quoteForm, setQuoteForm] = useState({ show: false, printerId: null });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQuotesModal, setShowQuotesModal] = useState(false);
  const [quoteConversations, setQuoteConversations] = useState([]);
  const [selectedQuoteConv, setSelectedQuoteConv] = useState(null);
  const [quoteMessages, setQuoteMessages] = useState([]);
  const [newQuoteMessage, setNewQuoteMessage] = useState('');
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingForm, setRatingForm] = useState({ rating: 5, title: '', review: '' });
  const [printerRatings, setPrinterRatings] = useState({});
  const [userRatings, setUserRatings] = useState({});

  const navItems = [
    { label: 'Studio', href: '/studio' },
    { label: 'Alton Feed', href: '/marketplace' },
    { label: 'Community', href: '/community' },
    { label: 'Alton Designs', href: '/alton-designs' },
    { label: 'Print', href: '/print' }
  ];

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  useEffect(() => {
    fetchPrinters();
    const subscription = supabase
      .channel('printers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'printers' }, () => {
        fetchPrinters();
      })
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, [searchQuery, selectedCountry, selectedCategory, minRating, verifiedOnly]);

  useEffect(() => {
    if (user) { fetchFavorites(); }
  }, [user]);

  useEffect(() => {
    if (selectedPrinter) {
      fetchPrinterRatings(selectedPrinter.id);
      
      // Real-time subscription for ratings
      const ratingsChannel = supabase
        .channel(`printer-ratings-${selectedPrinter.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'printer_ratings',
          filter: `printer_id=eq.${selectedPrinter.id}`
        }, (payload) => {
          console.log('Rating update:', payload);
          fetchPrinterRatings(selectedPrinter.id);
        })
        .subscribe();
      
      return () => {
        ratingsChannel.unsubscribe();
      };
    }
  }, [selectedPrinter]);

  // Fetch received quotes for logged-in user
  useEffect(() => {
    if (user) {
      fetchQuoteConversations();
      
      // Real-time subscription for quote updates
      const quotesSubscription = supabase
        .channel('user-quotes-updates')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'quote_requests',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          console.log('Quote updated:', payload);
          fetchQuoteConversations();
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'quote_requests',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          console.log('New quote request:', payload);
          fetchQuoteConversations();
        })
        .subscribe((status) => {
          console.log('Quote subscription status:', status);
        });

      // Notifications: keep unread count in sync for requester
      const loadNotifications = async () => {
        try {
          const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('read', false)
            .order('created_at', { ascending: false });
          setNotificationsCount((data && data.length) || 0);
        } catch (err) {
          console.error('Failed to load notifications:', err);
        }
      };

      loadNotifications();

      const notificationsChannel = supabase
        .channel('user-notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          console.log('Notification change:', payload);
          loadNotifications();
        })
        .subscribe();

      // Also poll every 30 seconds to catch any missed updates
      const pollInterval = setInterval(() => {
        fetchQuoteConversations();
        loadNotifications();
      }, 30000);

      return () => {
        quotesSubscription.unsubscribe();
        notificationsChannel.unsubscribe();
        clearInterval(pollInterval);
      };
    }
  }, [user]);

  const fetchPrinters = async () => {
    setLoading(true);
    let query = supabase
      .from('printers')
      .select(`*, printer_services(id, service_name, category, starting_price, currency), portfolio_images(id, image_url, title)`)
      .eq('status', 'approved');

    if (searchQuery) {
      query = query.or(`company_name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,country.ilike.%${searchQuery}%`);
    }
    if (selectedCountry) { query = query.eq('country', selectedCountry); }
    if (minRating > 0) { query = query.gte('rating', minRating); }
    if (verifiedOnly) { query = query.eq('verified', true); }

    const { data, error } = await query.order('rating', { ascending: false });

    if (!error && data) {
      let filtered = data;
      if (selectedCategory) {
        filtered = data.filter(p => p.printer_services?.some(s => s.category === selectedCategory));
      }
      setPrinters(filtered);
      const uniqueCountries = new Set(data.map(p => p.country));
      setCountries([...uniqueCountries].sort());
      setStats({ total: data.length, countries: uniqueCountries.size, prints: Math.floor(Math.random() * 50000000) + 10000000 });
      
      // Fetch ratings for all printers
      filtered.forEach(printer => {
        if (printer.id) fetchPrinterRatings(printer.id);
      });
    }
    setLoading(false);
  };

  const fetchFavorites = async () => {
    const { data } = await supabase.from('printer_favorites').select('printer_id').eq('user_id', user.id);
    if (data) { setFavorites(data.map(f => f.printer_id)); }
  };

  const fetchPrinterRatings = async (printerId) => {
    const { data } = await supabase
      .from('printer_ratings')
      .select('*')
      .eq('printer_id', printerId)
      .order('created_at', { ascending: false });
    
    if (data) {
      setPrinterRatings(prev => ({ ...prev, [printerId]: data }));
      
      // Calculate average rating
      const avg = data.length > 0 ? (data.reduce((sum, r) => sum + r.rating, 0) / data.length).toFixed(1) : 0;
      
      // Update printer's rating and review count in real-time
      setPrinters(prev => prev.map(p => p.id === printerId ? { ...p, rating: parseFloat(avg), review_count: data.length } : p));
      
      // Check if user has already rated
      if (user) {
        const userRating = data.find(r => r.user_id === user.id);
        setUserRatings(prev => ({ ...prev, [printerId]: userRating }));
      }
      
      return { average: avg, count: data.length, reviews: data };
    }
    return { average: 0, count: 0, reviews: [] };
  };

  const submitRating = async (printerId) => {
    if (!user) {
      alert('Please sign in to rate');
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('printer_ratings')
        .select('id')
        .eq('printer_id', printerId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Update existing rating
        const { error } = await supabase
          .from('printer_ratings')
          .update({
            rating: ratingForm.rating,
            title: ratingForm.title,
            review_text: ratingForm.review,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new rating
        const { error } = await supabase
          .from('printer_ratings')
          .insert({
            user_id: user.id,
            printer_id: printerId,
            rating: ratingForm.rating,
            title: ratingForm.title,
            review_text: ratingForm.review
          });

        if (error) throw error;
      }

      // Refresh ratings
      await fetchPrinterRatings(printerId);
      setShowRatingModal(false);
      setRatingForm({ rating: 5, title: '', review: '' });
      alert('Thank you for your rating!');
    } catch (err) {
      console.error('Error submitting rating:', err);
      alert('Failed to submit rating. Please try again.');
    }
  };

  const fetchQuoteConversations = async () => {
    if (!user) return;
    
    setLoadingQuotes(true);
    console.log('Fetching quote conversations for user:', user.id);
    
    const { data, error } = await supabase
      .from('quote_requests')
      .select(`
        id,
        description,
        service_type,
        quantity,
        status,
        created_at,
        updated_at,
        printers(id, company_name, city, country, logo_url, email, phone)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quote conversations:', error);
    } else {
      console.log('Fetched quote conversations:', data);
      setQuoteConversations(data || []);
    }
    setLoadingQuotes(false);
  };

  const fetchQuoteMessages = async (quoteId) => {
    const { data } = await supabase
      .from('quote_messages')
      .select('*')
      .eq('quote_request_id', quoteId)
      .order('created_at', { ascending: true });

    if (data) {
      setQuoteMessages(data);
    }
  };

  // Subscribe to real-time quote message updates
  useEffect(() => {
    if (!selectedQuoteConv?.id) return;

    // Initial fetch
    fetchQuoteMessages(selectedQuoteConv.id);

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`quote-messages-${selectedQuoteConv.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'quote_messages',
        filter: `quote_request_id=eq.${selectedQuoteConv.id}`
      }, (payload) => {
        console.log('New quote message from printer:', payload.new);
        setQuoteMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      messagesChannel.unsubscribe();
    };
  }, [selectedQuoteConv?.id]);

  const sendQuoteMessage = async (quoteId) => {
    if (!newQuoteMessage.trim() || !user) return;

    try {
      const { error } = await supabase.from('quote_messages').insert({
        quote_request_id: quoteId,
        sender_id: user.id,
        sender_type: 'client',
        message: newQuoteMessage.trim()
      });

      if (error) {
        console.error('Supabase error details:', { 
          message: error.message, 
          code: error.code,
          status: error.status,
          fullError: error 
        });
        alert(`Failed to send message: ${error.message || 'Unknown error'}`);
      } else {
        setNewQuoteMessage('');
        await fetchQuoteMessages(quoteId);
        fetchQuoteConversations();
      }
    } catch (err) {
      console.error('Exception sending message:', err);
      alert('Failed to send message. Please try again.');
    }
  };

  const toggleFavorite = async (printerId) => {
    if (!user) { alert('Please sign in to save favorites'); return; }
    const isFavorite = favorites.includes(printerId);
    if (isFavorite) {
      await supabase.from('printer_favorites').delete().eq('user_id', user.id).eq('printer_id', printerId);
      setFavorites(favorites.filter(f => f !== printerId));
    } else {
      await supabase.from('printer_favorites').insert({ user_id: user.id, printer_id: printerId });
      setFavorites([...favorites, printerId]);
    }
  };

  const submitQuoteRequest = async (e) => {
    e.preventDefault();
    if (!user) { alert('Please sign in to request quotes'); return; }
    const formData = new FormData(e.target);
    
    const { data: quoteData, error: quoteError } = await supabase.from('quote_requests').insert({
      printer_id: quoteForm.printerId,
      user_id: user.id,
      service_type: formData.get('service_type'),
      quantity: parseInt(formData.get('quantity')),
      description: formData.get('description')
    }).select().single();

    if (!quoteError && quoteData) {
      // Create initial quote message from client
      await supabase.from('quote_messages').insert({
        quote_request_id: quoteData.id,
        sender_id: user.id,
        sender_type: 'client',
        message: `Quote Request: ${formData.get('description')}`
      });

      setQuoteForm({ show: false, printerId: null });
      alert('Quote request sent! You can now chat with the printer about your request.');
      fetchQuoteConversations();
    }
  };

  const handleNearbyPrinters = (nearbyPrinters) => {
    if (nearbyPrinters && nearbyPrinters.length > 0) {
      setPrinters(nearbyPrinters);
      alert(`Found ${nearbyPrinters.length} printers near you!`);
    } else {
      alert('No nearby printers found. Showing all printers.');
      fetchPrinters();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <ChatSystem />

      {/* Compact Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/90 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/logo.svg" alt="Alton" width={100} height={26} />
          </Link>
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="text-gray-400 hover:text-white transition">{item.label}</Link>
            ))}
            <Link href="/home" className="text-purple-400 hover:text-purple-300 transition font-semibold">More</Link>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {/* Quote Notifications Button */}
                <button
                  onClick={() => setShowQuotesModal(true)}
                  className="relative p-2 hover:bg-white/10 rounded-lg transition"
                >
                  <MessageCircle className="w-5 h-5 text-gray-400 hover:text-white" />
                  {(() => {
                    const pendingCount = quoteConversations.filter(q => q.status === 'pending').length;
                    const totalBadge = Math.max(pendingCount, notificationsCount);
                    return totalBadge > 0 ? (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs font-bold flex items-center justify-center">
                        {totalBadge}
                      </span>
                    ) : null;
                  })()}
                </button>
                <Link href="/settings">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-105 transition">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                </Link>
                <button onClick={handleSignOut} className="hidden lg:flex items-center gap-1 px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition text-xs font-medium">
                  <LogOut className="w-3 h-3" />Sign Out
                </button>
              </div>
            ) : (
              <Link href="/auth"><button className="hidden lg:block px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-sm">Sign In</button></Link>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden" />
              <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed left-0 top-0 h-screen w-72 bg-zinc-950 border-r border-white/10 z-50 lg:hidden overflow-y-auto">
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <Image src="/logo.svg" alt="Alton" width={80} height={22} />
                    <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
                  </div>
                  {user ? (
                    <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-2 p-3 bg-purple-600/20 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold">{user.email?.charAt(0).toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{user.email?.split('@')[0]}</p>
                          <p className="text-xs text-purple-400">View Profile</p>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-lg text-center text-sm font-semibold">Sign In</div>
                    </Link>
                  )}
                </div>
                <div className="p-4 space-y-1">
                  {navItems.map((item) => (
                    <Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg">
                      <ArrowRight className="w-4 h-4 text-purple-400" /><span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
                {user && (
                  <div className="p-4 border-t border-white/10">
                    <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="w-full bg-red-600/20 text-red-400 px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
                      <LogOut className="w-4 h-4" />Sign Out
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>

      {/* Compact Hero */}
      <div className="relative bg-gradient-to-br from-purple-950/20 via-black to-pink-950/20 border-b border-white/5 pt-16">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-600/10 border border-purple-500/20 rounded-full text-purple-300 text-xs font-semibold mb-4">
              <TrendingUp className="w-3 h-3" />Trusted Globally
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-3">
              Find <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Premium</span> Print Services
            </h1>
            <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto mb-6">
              Connect with {stats.total}+ verified printing companies across {stats.countries}+ countries
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <GeoLocationSearch onLocationFound={handleNearbyPrinters} />
              <Link href="#printers"><button className="px-5 py-2.5 bg-white/10 border border-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold flex items-center gap-2"><Search className="w-4 h-4" />Browse All</button></Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8" id="printers">
        
        {/* Compact Search Bar */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search companies, cities, countries..." className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
            </div>
            <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer">
              <option value="">All Countries</option>
              {countries.map(country => (<option key={country} value={country}>{country}</option>))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400'}`}><Grid3x3 className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-lg transition ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400'}`}><List className="w-4 h-4" /></button>
              <button onClick={() => setShowFilters(!showFilters)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-2 text-sm font-medium"><SlidersHorizontal className="w-4 h-4" /><span className="hidden sm:inline">Filters</span></button>
            </div>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 pt-4 border-t border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Min Rating</label>
                    <div className="flex gap-2">
                      {[0, 3, 4, 4.5].map(rating => (
                        <button key={rating} onClick={() => setMinRating(rating)} className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition ${minRating === rating ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400'}`}>
                          {rating === 0 ? 'Any' : `${rating}+`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Verification</label>
                    <button onClick={() => setVerifiedOnly(!verifiedOnly)} className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 ${verifiedOnly ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400'}`}>
                      <BadgeCheck className="w-3 h-3" />Verified Only
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2">Category</label>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white cursor-pointer">
                      <option value="">All Services</option>
                      {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Compact Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          <button onClick={() => setSelectedCategory('')} className={`px-4 py-2 rounded-lg whitespace-nowrap text-xs font-semibold transition ${selectedCategory === '' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-4 py-2 rounded-lg whitespace-nowrap text-xs font-semibold flex items-center gap-2 transition ${selectedCategory === cat.id ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
              <span>{cat.icon}</span><span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-purple-400 mb-3" />
            <p className="text-gray-400 text-sm">Loading printers...</p>
          </div>
        )}

        {/* Printers Grid - COMPACT CARDS */}
        {!loading && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'}>
            {printers.map((printer, index) => (
              <motion.div key={printer.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className={`bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 transition group ${viewMode === 'list' ? 'flex' : ''}`}>
                
                {/* Image */}
                <div className={`relative overflow-hidden bg-gradient-to-br from-purple-900/20 to-pink-900/20 ${viewMode === 'list' ? 'w-32 flex-shrink-0' : 'h-40'}`}>
                  {printer.portfolio_images?.[0] ? (
                    <img src={printer.portfolio_images[0].image_url} alt={printer.company_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><PrinterIcon className="w-8 h-8 text-purple-400/30" /></div>
                  )}
                  {printer.online_status && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />Online
                    </div>
                  )}
                  <button onClick={() => toggleFavorite(printer.id)} className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition">
                    <Heart className={`w-3.5 h-3.5 ${favorites.includes(printer.id) ? 'fill-pink-500 text-pink-500' : 'text-white'}`} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-3 flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white truncate group-hover:text-purple-400 transition">{printer.company_name}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <MapPin className="w-3 h-3 text-purple-400 flex-shrink-0" />
                        <span className="truncate">{printer.city}, {printer.country}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 rounded">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-bold text-white">{printer.rating?.toFixed(1) || 'New'}</span>
                    </div>
                    <span className="text-xs text-gray-500">({printer.review_count})</span>
                    {printer.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {printer.eco_certified && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded flex items-center gap-1">
                        <Leaf className="w-2.5 h-2.5" />Eco
                      </span>
                    )}
                    {printer.iso_certified && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded">ISO</span>
                    )}
                    {printer.printer_services?.[0] && (
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded">
                        ${printer.printer_services[0].starting_price}+
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setSelectedPrinter(printer)} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3" />View
                    </button>
                    <button onClick={() => { setSelectedPrinter(printer); setShowRatingModal(true); }} className="px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition" title="Rate this printer">
                      <Star className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setQuoteForm({ show: true, printerId: printer.id })} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition">
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && printers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No printers found</h3>
            <p className="text-gray-400 mb-4 text-sm">Try adjusting your filters</p>
            <button onClick={() => { setSearchQuery(''); setSelectedCountry(''); setSelectedCategory(''); setMinRating(0); setVerifiedOnly(false); fetchPrinters(); }} className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold text-sm">
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Printer Detail Modal */}
      <AnimatePresence>
        {selectedPrinter && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPrinter(null)} className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-4 md:inset-10 bg-zinc-950 border border-white/10 rounded-2xl z-50 overflow-hidden flex flex-col">
              <div className="relative h-48 bg-gradient-to-br from-purple-900/20 to-pink-900/20">
                {selectedPrinter.banner_url ? (
                  <img src={selectedPrinter.banner_url} alt={selectedPrinter.company_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Sparkles className="w-16 h-16 text-purple-400/20" /></div>
                )}
                <button onClick={() => setSelectedPrinter(null)} className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70"><X className="w-4 h-4" /></button>
                <div className="absolute bottom-0 left-6 transform translate-y-1/2">
                  <div className="w-20 h-20 bg-zinc-900 border-4 border-zinc-950 rounded-xl flex items-center justify-center overflow-hidden">
                    {selectedPrinter.logo_url ? (
                      <img src={selectedPrinter.logo_url} alt={selectedPrinter.company_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black text-purple-400">{selectedPrinter.company_name.charAt(0)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="pt-8">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-black text-white mb-2">{selectedPrinter.company_name}</h2>
                        <div className="flex items-center gap-4 text-gray-400 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-purple-400" />
                            <span>{selectedPrinter.city}, {selectedPrinter.country}</span>
                          </div>
                          {selectedPrinter.years_in_business && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-purple-400" />
                              <span>{selectedPrinter.years_in_business} years</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-lg font-bold text-white">{selectedPrinter.rating?.toFixed(1) || '0.0'}</span>
                          </div>
                          <div className="text-xs text-gray-400">{selectedPrinter.review_count || 0} reviews</div>
                        </div>
                        {selectedPrinter.verified && <BadgeCheck className="w-6 h-6 text-blue-400" />}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedPrinter.online_status && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />Online Now
                        </span>
                      )}
                      {selectedPrinter.eco_certified && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg flex items-center gap-1.5">
                          <Leaf className="w-3.5 h-3.5" />Eco-Certified
                        </span>
                      )}
                      {selectedPrinter.iso_certified && (
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg">ISO Certified</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 mb-6 text-sm">
                      {selectedPrinter.email && (
                        <a href={`mailto:${selectedPrinter.email}`} className="flex items-center gap-2 text-purple-400 hover:text-purple-300">
                          <Mail className="w-3.5 h-3.5" /><span>{selectedPrinter.email}</span>
                        </a>
                      )}
                      {selectedPrinter.phone && (
                        <a href={`tel:${selectedPrinter.phone}`} className="flex items-center gap-2 text-purple-400 hover:text-purple-300">
                          <Phone className="w-3.5 h-3.5" /><span>{selectedPrinter.phone}</span>
                        </a>
                      )}
                      {selectedPrinter.website && (
                        <a href={selectedPrinter.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-purple-400 hover:text-purple-300">
                          <Globe className="w-3.5 h-3.5" /><span>Website</span>
                        </a>
                      )}
                    </div>

                    {selectedPrinter.about && (
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-white mb-2">About</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{selectedPrinter.about}</p>
                      </div>
                    )}

                    {selectedPrinter.printer_services?.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-white mb-3">Services</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedPrinter.printer_services.map(service => (
                            <div key={service.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-white text-sm">{service.service_name}</h4>
                                <span className="text-purple-400 font-bold text-sm">${service.starting_price}+</span>
                              </div>
                              {service.description && <p className="text-xs text-gray-400">{service.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedPrinter.portfolio_images?.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-white mb-3">Portfolio</h3>
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                          {selectedPrinter.portfolio_images.map(item => (
                            <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 group">
                              <img src={item.image_url} alt={item.title || 'Portfolio'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reviews Section */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Client Reviews</h3>
                        <button onClick={() => setShowRatingModal(true)} className="text-xs bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 px-3 py-1 rounded-lg transition">
                          + Add Review
                        </button>
                      </div>

                      {printerRatings[selectedPrinter.id]?.length > 0 ? (
                        <div className="space-y-3">
                          {printerRatings[selectedPrinter.id]?.slice(0, 5).map(review => (
                            <div key={review.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                                  ))}
                                </div>
                                <span className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                              </div>
                              {review.title && <h4 className="text-sm font-semibold text-white mb-1">{review.title}</h4>}
                              {review.review_text && <p className="text-xs text-gray-300 leading-relaxed">{review.review_text}</p>}
                            </div>
                          ))}
                          {printerRatings[selectedPrinter.id]?.length > 5 && (
                            <p className="text-xs text-gray-400 text-center py-2">+{printerRatings[selectedPrinter.id]?.length - 5} more reviews</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-white/5 rounded-lg border border-white/10">
                          <Star className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">No reviews yet. Be the first to rate!</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => { setQuoteForm({ show: true, printerId: selectedPrinter.id }); setSelectedPrinter(null); }} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                        <MessageCircle className="w-4 h-4" />Request Quote
                      </button>
                      <button onClick={() => { setShowRatingModal(true); }} className="px-4 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition" title="Rate this printer">
                        <Star className="w-5 h-5" />
                      </button>
                      <button onClick={() => toggleFavorite(selectedPrinter.id)} className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition">
                        <Heart className={`w-5 h-5 ${favorites.includes(selectedPrinter.id) ? 'fill-pink-500 text-pink-500' : 'text-white'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quote Request Modal */}
      <AnimatePresence>
        {quoteForm.show && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setQuoteForm({ show: false, printerId: null })} className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-zinc-950 border border-white/10 rounded-2xl z-50 p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Request Quote</h2>
                <button onClick={() => setQuoteForm({ show: false, printerId: null })} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={submitQuoteRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Service Type</label>
                  <select name="service_type" required className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-500" style={{ colorScheme: 'dark' }}>
                    <option value="" className="bg-zinc-950 text-white">Select service</option>
                    {categories.map(cat => (<option key={cat.id} value={cat.id} className="bg-zinc-950 text-white">{cat.icon} {cat.label}</option>))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Quantity</label>
                  <input type="number" name="quantity" min="1" required placeholder="e.g., 100" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">Description</label>
                  <textarea name="description" required rows={4} placeholder="Project details, materials, deadline..." className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none" />
                </div>

                <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />Send Request
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quote Conversations Modal */}
      <AnimatePresence>
        {showQuotesModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQuotesModal(false)} className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-4 md:inset-10 bg-zinc-950 border border-white/10 rounded-2xl z-50 overflow-hidden flex flex-col md:flex-row h-[90vh]">
              
              {/* Conversations List */}
              <div className="md:w-80 border-r border-white/10 flex flex-col bg-black/20">
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-white">Quote Requests</h2>
                    <button onClick={() => setShowQuotesModal(false)} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition md:hidden">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    {quoteConversations.filter(q => q.status === 'pending').length} awaiting • 
                    {' '}{quoteConversations.filter(q => q.status !== 'pending').length} responded
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {loadingQuotes ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-2" />
                      <p className="text-xs text-gray-400">Loading...</p>
                    </div>
                  ) : quoteConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <MessageCircle className="w-8 h-8 text-gray-600 mb-2" />
                      <p className="text-sm font-semibold text-white">No quote requests yet</p>
                      <p className="text-xs text-gray-400 mt-1">Request quotes from printers to start chatting</p>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {quoteConversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => {
                            setSelectedQuoteConv(conv);
                            fetchQuoteMessages(conv.id);
                          }}
                          className={`w-full text-left p-3 rounded-lg transition ${
                            selectedQuoteConv?.id === conv.id
                              ? 'bg-purple-600/20 border border-purple-500/50'
                              : 'hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {conv.printers?.logo_url ? (
                                <img src={conv.printers.logo_url} alt={conv.printers.company_name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs font-bold text-white">{conv.printers?.company_name?.charAt(0)}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">{conv.printers?.company_name}</h4>
                              <p className="text-[10px] text-gray-400 truncate">{conv.service_type}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                  conv.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                  conv.status === 'quoted' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {conv.status === 'pending' ? 'Waiting' : conv.status === 'quoted' ? 'Quoted' : conv.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Chat View */}
              <div className="flex-1 flex flex-col">
                {selectedQuoteConv ? (
                  <>
                    <div className="p-4 border-b border-white/10 bg-black/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center overflow-hidden">
                          {selectedQuoteConv.printers?.logo_url ? (
                            <img src={selectedQuoteConv.printers.logo_url} alt={selectedQuoteConv.printers.company_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-white">{selectedQuoteConv.printers?.company_name?.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">{selectedQuoteConv.printers?.company_name}</h3>
                          <p className="text-xs text-gray-400">{selectedQuoteConv.printers?.city}, {selectedQuoteConv.printers?.country}</p>
                        </div>
                      </div>
                      <button onClick={() => setShowQuotesModal(false)} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition hidden md:flex">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                        <p className="text-xs text-gray-400 mb-2 font-semibold">YOUR REQUEST</p>
                        <p className="text-sm font-semibold text-white mb-2">{selectedQuoteConv.service_type}</p>
                        <p className="text-sm text-gray-300 leading-relaxed mb-3">{selectedQuoteConv.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Qty: {selectedQuoteConv.quantity}</span>
                          <span>Status: <span className={`${
                            selectedQuoteConv.status === 'pending' ? 'text-yellow-400' :
                            selectedQuoteConv.status === 'quoted' ? 'text-blue-400' : 'text-gray-400'
                          }`}>{selectedQuoteConv.status}</span></span>
                        </div>
                      </div>

                      {quoteMessages.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-400">No messages yet. Start a conversation!</p>
                        </div>
                      ) : (
                        quoteMessages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs ${
                              msg.sender_type === 'client'
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                                : 'bg-white/10 border border-white/20'
                            } rounded-2xl px-4 py-2.5`}>
                              <p className="text-white text-sm leading-relaxed">{msg.message}</p>
                              <span className="text-[10px] text-white/60 mt-1 block">
                                {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-4 border-t border-white/10 bg-black/20">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newQuoteMessage}
                          onChange={(e) => setNewQuoteMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendQuoteMessage(selectedQuoteConv.id)}
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <button
                          onClick={() => sendQuoteMessage(selectedQuoteConv.id)}
                          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <MessageCircle className="w-12 h-12 text-gray-600 mb-3" />
                    <p className="text-gray-400 text-sm">Select a quote request to chat</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && selectedPrinter && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRatingModal(false)} className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-zinc-950 border border-white/10 rounded-2xl z-50 p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Rate {selectedPrinter.company_name}</h2>
                <button onClick={() => setShowRatingModal(false)} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Your Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setRatingForm({ ...ratingForm, rating: star })}
                        className="transition transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= ratingForm.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{ratingForm.rating} out of 5 stars</p>
                </div>

                {/* Review Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Review Title (Optional)</label>
                  <input
                    type="text"
                    value={ratingForm.title}
                    onChange={(e) => setRatingForm({ ...ratingForm, title: e.target.value })}
                    placeholder="e.g., Great quality and fast delivery"
                    maxLength={50}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Your Review (Optional)</label>
                  <textarea
                    value={ratingForm.review}
                    onChange={(e) => setRatingForm({ ...ratingForm, review: e.target.value })}
                    placeholder="Share your experience with this printer..."
                    maxLength={500}
                    rows={4}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{ratingForm.review.length}/500</p>
                </div>

                {/* Submit Button */}
                <button
                  onClick={() => submitRating(selectedPrinter.id)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 mt-6"
                >
                  <Star className="w-4 h-4" />
                  Submit Rating
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* How It Works */}
      <div className="max-w-7xl mx-auto px-4 py-16 border-t border-white/5">
        <h2 className="text-3xl font-black text-center mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">How It Works</h2>
        <p className="text-center text-gray-400 text-sm mb-10 max-w-xl mx-auto">Three simple steps to connect with top printing services</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-black">1</div>
            <h3 className="text-lg font-bold text-white mb-2">Find</h3>
            <p className="text-gray-400 text-sm">Search by location and service type</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} viewport={{ once: true }} className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-black">2</div>
            <h3 className="text-lg font-bold text-white mb-2">Quote</h3>
            <p className="text-gray-400 text-sm">Get competitive quotes instantly</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} viewport={{ once: true }} className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-xl font-black">3</div>
            <h3 className="text-lg font-bold text-white mb-2">Print</h3>
            <p className="text-gray-400 text-sm">Bring your designs to life</p>
          </motion.div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-white/10 rounded-2xl p-10 text-center">
          <h2 className="text-3xl font-black text-white mb-3">Are You a Printing Company?</h2>
          <p className="text-gray-300 mb-6 text-sm">Join our network and reach designers globally</p>
          {user ? (
            <Link href="/printer/dashboard">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition">
                Go to Dashboard
              </button>
            </Link>
          ) : (
            <Link href="/printer/register">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition">
                Register Your Business
              </button>
            </Link>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/5 bg-gradient-to-b from-black to-purple-950/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <div className="flex justify-center mb-4">
              <Image src="/logo.svg" alt="Alton" width={100} height={26} className="opacity-80" />
            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-gray-400">
              <Link href="/studio" className="hover:text-white transition">AI Studio</Link>
              <Link href="/marketplace" className="hover:text-white transition">Alton Feed</Link>
              <Link href="/alton-designs" className="hover:text-white transition">Designs</Link>
              <Link href="/print" className="hover:text-white transition">Print</Link>
              <Link href="/jobs" className="hover:text-white transition">Jobs</Link>
              <Link href="/community" className="hover:text-white transition">Community</Link>
              <Link href="/contributor/apply" className="hover:text-white transition text-purple-400 font-semibold">Upload Content</Link>
            </div>

            <div className="border-t border-white/5 max-w-3xl mx-auto" />

            <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-xs text-gray-500">
              <span>© 2025 Alton Studio. All rights reserved.</span>
              <Link href="/privacy" className="hover:text-purple-400 transition">Privacy</Link>
              <Link href="/terms" className="hover:text-purple-400 transition">Terms</Link>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <a href="#" className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition border border-white/10">
                <span className="text-sm">𝕏</span>
              </a>
              <a href="#" className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition border border-white/10">
                <span className="text-sm font-semibold">in</span>
              </a>
              <a href="#" className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition border border-white/10">
                <span className="text-sm font-semibold">IG</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}