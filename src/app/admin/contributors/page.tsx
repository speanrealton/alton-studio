// src/app/admin/contributors/page.tsx — MODERN ADMIN CONTRIBUTORS MANAGEMENT
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { 
  CheckCircle, XCircle, Clock, Eye, Download, ExternalLink,
  Filter, Search, User, Mail, Globe, Award, FileImage, Loader2,
  ArrowLeft, Sparkles, Send, Zap, Star, TrendingUp, Sun, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Application = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  country: string | null;
  portfolio_url: string | null;
  experience_level: string;
  design_categories: string[];
  sample_works: string[];
  sample_files: any;
  why_join: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export default function AdminContributorsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('adminDarkMode');
    setDarkMode(saved === 'true');
    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchApplications();
      subscribeToApplications();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterApplications();
  }, [applications, statusFilter, searchQuery]);

  const checkAdminAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/auth');
      return;
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      router.push('/'); // Redirect non-admins silently
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('adminDarkMode', newDarkMode.toString());
  };

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from('contributor_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return;
    }

    setApplications(data || []);
  };

  const subscribeToApplications = () => {
    const channel = supabase
      .channel('contributor_applications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contributor_applications'
        },
        (payload) => {
          console.log('Realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setApplications(prev => [payload.new as Application, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setApplications(prev => 
              prev.map(app => app.id === payload.new.id ? payload.new as Application : app)
            );
          } else if (payload.eventType === 'DELETE') {
            setApplications(prev => prev.filter(app => app.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filterApplications = () => {
    let filtered = applications;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.full_name.toLowerCase().includes(query) ||
        app.email.toLowerCase().includes(query) ||
        app.design_categories.some(cat => cat.toLowerCase().includes(query))
      );
    }

    setFilteredApps(filtered);
  };

  const sendEmail = async (email: string, displayName: string, status: string, notes: string | null) => {
    setSendingEmail(true);
    try {
      console.log('Sending email to:', email, 'Status:', status);
      
      const response = await fetch('/api/send-approval-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          displayName,
          status,
          reviewNotes: notes
        })
      });

      const data = await response.json();
      console.log('Email API Response:', response.status, data);

      if (!response.ok) {
        console.error('Email API Error Details:', data);
        throw new Error(data.error || 'Failed to send email');
      }

      console.log('✅ Email sent successfully!');
      return true;
    } catch (err) {
      console.error('Email error:', err);
      return false;
    } finally {
      setSendingEmail(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApp) return;

    setActionLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update application status
      const { error: updateError } = await supabase
        .from('contributor_applications')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          review_notes: reviewNotes.trim() || null,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedApp.id);

      if (updateError) throw updateError;

      // Check if contributor profile already exists
      const { data: existingContributor } = await supabase
        .from('contributors')
        .select('id')
        .eq('user_id', selectedApp.user_id)
        .single();

      if (existingContributor) {
        // Update existing contributor profile
        const { error: updateContributorError } = await supabase
          .from('contributors')
          .update({
            status: 'approved',
            approved_date: new Date().toISOString(),
            display_name: selectedApp.full_name,
            portfolio_url: selectedApp.portfolio_url,
          })
          .eq('user_id', selectedApp.user_id);

        if (updateContributorError) throw updateContributorError;
      } else {
        // Create new contributor profile
        const { error: contributorError } = await supabase
          .from('contributors')
          .insert({
            user_id: selectedApp.user_id,
            status: 'approved',
            approved_date: new Date().toISOString(),
            display_name: selectedApp.full_name,
            portfolio_url: selectedApp.portfolio_url,
          });

        if (contributorError) throw contributorError;
      }

      // Send email notification
      const emailSent = await sendEmail(
        selectedApp.email,
        selectedApp.full_name,
        'approved',
        reviewNotes || null
      );

      if (!emailSent) {
        alert('✅ Contributor approved! ⚠️ But email failed to send. Please notify the user manually.');
      } else {
        alert('✅ Contributor approved successfully and email sent!');
      }

      // Close modal
      setSelectedApp(null);
      setReviewNotes('');
    } catch (err: any) {
      console.error('Error approving:', err);
      alert(err.message || 'Failed to approve application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    if (!reviewNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('contributor_applications')
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          review_notes: reviewNotes.trim(),
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedApp.id);

      if (error) throw error;

      // Send email notification
      const emailSent = await sendEmail(
        selectedApp.email,
        selectedApp.full_name,
        'rejected',
        reviewNotes
      );

      if (!emailSent) {
        alert('✅ Application rejected. ⚠️ But email failed to send. Please notify the user manually.');
      } else {
        alert('✅ Application rejected and email sent.');
      }

      setSelectedApp(null);
      setReviewNotes('');
    } catch (err: any) {
      console.error('Error rejecting:', err);
      alert(err.message || 'Failed to reject application');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <img 
          src="/logo2.svg" 
          alt="Loading" 
          className="w-32 h-32 animate-pulse drop-shadow-lg"
          style={{
            filter: 'drop-shadow(0 0 30px rgba(168, 85, 247, 0.8))',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        />
        <style>{`
          @keyframes glow {
            0%, 100% { filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.6)); }
            50% { filter: drop-shadow(0 0 40px rgba(168, 85, 247, 1)); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const stats = {
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950' : 'bg-gradient-to-br from-gray-50 via-white to-purple-50'}`}>
      
      {/* Header */}
      <header className={`relative overflow-hidden border-b transition-colors duration-300 ${darkMode ? 'border-purple-500/20' : 'border-purple-200'}`}>
        <div className={`absolute inset-0 ${darkMode ? 'bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10' : 'bg-gradient-to-r from-purple-100/50 via-pink-100/50 to-purple-100/50'}`}></div>
        <div className="relative max-w-[1800px] mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-75"></div>
                <img src="/logo2.svg" alt="Logo" className="relative w-12 h-12 rounded-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Contributor Hub
                </h1>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage and review design contributor applications</p>
              </div>
            </div>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-3 rounded-lg transition ${darkMode ? 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50' : 'bg-white hover:bg-gray-100 border border-gray-300'}`}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <Sun className="w-6 h-6 text-yellow-400" />
              ) : (
                <Moon className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gradient-to-br rounded-xl p-4 border transition ${darkMode ? 'from-yellow-500/10 to-orange-500/10 border-yellow-500/20' : 'from-yellow-100 to-orange-50 border-yellow-200'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending Review</p>
                  <p className={`text-3xl font-black ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{stats.pending}</p>
                </div>
                <Clock className={`w-10 h-10 ${darkMode ? 'text-yellow-500/50' : 'text-yellow-500/60'}`} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`bg-gradient-to-br rounded-xl p-4 border transition ${darkMode ? 'from-green-500/10 to-emerald-500/10 border-green-500/20' : 'from-green-100 to-emerald-50 border-green-200'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Approved</p>
                  <p className={`text-3xl font-black ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.approved}</p>
                </div>
                <CheckCircle className={`w-10 h-10 ${darkMode ? 'text-green-500/50' : 'text-green-500/60'}`} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`bg-gradient-to-br rounded-xl p-4 border transition ${darkMode ? 'from-red-500/10 to-pink-500/10 border-red-500/20' : 'from-red-100 to-pink-50 border-red-200'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rejected</p>
                  <p className={`text-3xl font-black ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{stats.rejected}</p>
                </div>
                <XCircle className={`w-10 h-10 ${darkMode ? 'text-red-500/50' : 'text-red-500/60'}`} />
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search by name, email, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition ${darkMode ? 'bg-gray-800/50 border border-gray-700/50 text-gray-100 placeholder-gray-500' : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500'}`}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
            {['all', 'pending', 'approved', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-3 rounded-lg text-sm font-semibold capitalize whitespace-nowrap transition ${
                  statusFilter === status
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                    : darkMode ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Applications List */}
      <main className="max-w-[1800px] mx-auto px-6 pb-12">
        {filteredApps.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 mx-auto ${darkMode ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-gray-100 border border-gray-300'}`}>
              <Clock className={`w-10 h-10 ${darkMode ? 'text-gray-600' : 'text-gray-500'}`} />
            </div>
            <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              No applications found
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {statusFilter !== 'all' 
                ? `No ${statusFilter} applications at the moment`
                : 'No applications match your search'
              }
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredApps.map((app, idx) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`group rounded-xl p-6 transition ${darkMode ? 'bg-gray-800/50 border border-gray-700/50 hover:border-purple-500/50 hover:bg-gray-800/60' : 'bg-white border border-gray-200 hover:border-purple-400 hover:bg-purple-50'}`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  
                  {/* Left: Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <img src="/logo2.svg" alt="Logo" className="w-12 h-12 rounded-full" />
                          <div>
                            <h3 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                              {app.full_name}
                            </h3>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Applied {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className={`flex flex-wrap items-center gap-3 text-xs mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-400'}`}>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-purple-400" />
                            {app.email}
                          </span>
                          {app.country && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3.5 h-3.5 text-blue-400" />
                              {app.country}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-yellow-400" />
                            {app.experience_level}
                          </span>
                        </div>

                        {/* Categories */}
                        <div className="flex flex-wrap gap-2">
                          {app.design_categories.slice(0, 3).map((cat, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 rounded-lg text-xs font-medium border border-purple-500/30"
                            >
                              {cat}
                            </span>
                          ))}
                          {app.design_categories.length > 3 && (
                            <span className="px-2.5 py-1 text-gray-400 text-xs font-medium">
                              +{app.design_categories.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 whitespace-nowrap ${
                        app.status === 'pending' 
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                          : app.status === 'approved'
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {app.status === 'pending' && <Clock className="w-3 h-3" />}
                        {app.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                        {app.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {app.status}
                      </span>
                    </div>
                  </div>

                  {/* Right: Samples & Action */}
                  <div className="flex items-center gap-4 lg:gap-6">
                    {/* Sample Preview */}
                    {app.sample_files?.length > 0 && (
                      <div className="flex gap-2">
                        {app.sample_files.slice(0, 2).map((file: any, idx: number) => (
                          <div
                            key={idx}
                            className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700/50 border border-gray-600/50 flex items-center justify-center"
                          >
                            {file.type?.startsWith('image/') ? (
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FileImage className="w-6 h-6 text-gray-500" />
                            )}
                          </div>
                        ))}
                        {app.sample_files.length > 2 && (
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-purple-300">+{app.sample_files.length - 2}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      onClick={() => {
                        setSelectedApp(app);
                        setReviewNotes(app.review_notes || '');
                      }}
                      size="sm"
                      className={`font-semibold shadow-lg ${
                        app.status === 'pending'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-purple-500/50'
                          : app.status === 'approved'
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-green-500/30'
                          : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-red-500/30'
                      }`}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {app.status === 'pending' ? 'Review' : app.status === 'approved' ? 'View Approved' : 'View Rejected'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border shadow-2xl ${darkMode ? 'bg-gray-800 border-gray-700/50 shadow-purple-500/20' : 'bg-white border-gray-200'}`}
            >
              {/* Modal Header */}
              <div className={`sticky top-0 border-b p-6 z-10 backdrop-blur ${darkMode ? 'bg-gray-800/95 border-gray-700/50' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <img src="/logo2.svg" alt="Logo" className="w-12 h-12 rounded-lg" />
                      <div>
                        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {selectedApp.full_name}
                        </h2>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {selectedApp.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedApp(null)}
                    className="p-2 hover:bg-gray-700/50 rounded-lg transition"
                  >
                    <XCircle className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                
                {/* Info Grid */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/30 border border-gray-600/50' : 'bg-gray-100 border border-gray-200'}`}>
                    <p className={`text-xs mb-2 flex items-center gap-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <Globe className="w-3.5 h-3.5" /> Country
                    </p>
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedApp.country || 'Not provided'}
                    </p>
                  </div>
                  <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/30 border border-gray-600/50' : 'bg-gray-100 border border-gray-200'}`}>
                    <p className={`text-xs mb-2 flex items-center gap-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <Star className="w-3.5 h-3.5" /> Experience
                    </p>
                    <p className={`font-semibold capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedApp.experience_level}
                    </p>
                  </div>
                  <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/30 border border-gray-600/50' : 'bg-gray-100 border border-gray-200'}`}>
                    <p className={`text-xs mb-2 flex items-center gap-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <Award className="w-3.5 h-3.5" /> Status
                    </p>
                    <span className={`text-sm font-bold capitalize ${
                      selectedApp.status === 'pending' ? (darkMode ? 'text-yellow-300' : 'text-yellow-600') :
                      selectedApp.status === 'approved' ? (darkMode ? 'text-green-300' : 'text-green-600') : (darkMode ? 'text-red-300' : 'text-red-600')
                    }`}>
                      {selectedApp.status}
                    </span>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <p className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Design Expertise</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.design_categories.map((cat, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${darkMode ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-700 border-purple-200'}`}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Portfolio */}
                {selectedApp.portfolio_url && (
                  <div>
                    <p className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Portfolio</p>
                    <a
                      href={selectedApp.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition border ${darkMode ? 'bg-gray-700/30 hover:bg-gray-700/50 border-gray-600/50 text-purple-400 hover:text-purple-300' : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-purple-600 hover:text-purple-700'}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Portfolio
                    </a>
                  </div>
                )}

                {/* Why Join */}
                {selectedApp.why_join && (
                  <div>
                    <p className={`text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Motivation</p>
                    <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-700/30 border border-gray-600/50' : 'bg-gray-100 border border-gray-200'}`}>
                      <p className={`leading-relaxed text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedApp.why_join}
                      </p>
                    </div>
                  </div>
                )}

                {/* Sample Works */}
                <div>
                  <p className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Sample Works ({selectedApp.sample_files?.length || 0})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedApp.sample_files?.map((file: any, idx: number) => (
                      <a
                        key={idx}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-purple-400 transition"
                      >
                        {file.type?.startsWith('image/') ? (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        ) : (
                          <div className={`w-full h-full flex flex-col items-center justify-center p-4 ${darkMode ? 'bg-gray-700/30' : 'bg-gray-100'}`}>
                            <FileImage className={`w-10 h-10 mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            <p className={`text-xs text-center truncate w-full ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {file.name}
                            </p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <Download className="w-8 h-8 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Email Status */}
                {sendingEmail && (
                  <div className={`p-4 rounded-xl flex items-center gap-3 border ${darkMode ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'}`}>
                    <Send className={`w-5 h-5 animate-pulse ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <p className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                      Sending email notification...
                    </p>
                  </div>
                )}

                {/* Review Notes */}
                <div>
                  <p className={`text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedApp.status === 'pending' ? 'Review Notes' : 'Previous Notes'}
                  </p>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                    placeholder={selectedApp.status === 'pending' ? 'Add notes (required for rejection)...' : ''}
                    disabled={selectedApp.status !== 'pending'}
                    className={`w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition disabled:opacity-50 ${darkMode ? 'bg-gray-700/30 border border-gray-600/50 text-white placeholder-gray-400' : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  />
                </div>

                {/* Actions */}
                {selectedApp.status === 'pending' && (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleApprove}
                      disabled={actionLoading || sendingEmail}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-6 font-semibold shadow-lg shadow-green-500/30"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5 mr-2" />
                      )}
                      Approve & Send Email
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={actionLoading || sendingEmail || !reviewNotes.trim()}
                      className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white py-6 font-semibold shadow-lg shadow-red-500/30 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-5 h-5 mr-2" />
                      )}
                      Reject & Send Email
                    </Button>
                  </div>
                )}

                {/* Already Reviewed */}
                {selectedApp.status !== 'pending' && (
                  <div>
                    <div className={`p-4 rounded-xl border mb-4 ${
                      selectedApp.status === 'approved'
                        ? darkMode ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
                        : darkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
                    }`}>
                      <p className={`text-sm font-bold mb-1 ${
                        selectedApp.status === 'approved' 
                          ? darkMode ? 'text-green-300' : 'text-green-700' 
                          : darkMode ? 'text-red-300' : 'text-red-700'
                      }`}>
                        {selectedApp.status === 'approved' ? '✓ Approved' : '✕ Rejected'} on {' '}
                        {selectedApp.reviewed_at && new Date(selectedApp.reviewed_at).toLocaleDateString()}
                      </p>
                      {selectedApp.review_notes && (
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {selectedApp.review_notes}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => setSelectedApp(null)}
                      className={`w-full py-6 font-semibold ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}
                    >
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}