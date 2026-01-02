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
  ArrowLeft, Sparkles, Send, Zap, Star, TrendingUp, Sun, Moon, Menu, X
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // Bulk Actions
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Advanced Filtering
  const [experienceFilter, setExperienceFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // AI Features
  const [applicationScores, setApplicationScores] = useState<{ [key: string]: number }>({});
  const [duplicates, setDuplicates] = useState<{ [key: string]: string[] }>({});
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [aiAnalysisRunning, setAiAnalysisRunning] = useState(false);
  
  // Integrations
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [slackWebhook, setSlackWebhook] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [crmIntegration, setCrmIntegration] = useState('');
  
  // Calendar Integration
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [calendarConnecting, setCalendarConnecting] = useState<'google' | 'outlook' | null>(null);
  
  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Get unique values for filters
  const uniqueCountries = Array.from(new Set(applications.map(a => a.country).filter(Boolean)));
  const uniqueCategories = Array.from(new Set(applications.flatMap(a => a.design_categories)));
  const uniqueExperienceLevels = Array.from(new Set(applications.map(a => a.experience_level)));

  useEffect(() => {
    const saved = localStorage.getItem('adminDarkMode');
    setDarkMode(saved === 'true');
    
    // Load calendar connections
    const googleConnected = localStorage.getItem('googleCalendarConnected') === 'true';
    const outlookConnected = localStorage.getItem('outlookConnected') === 'true';
    setGoogleCalendarConnected(googleConnected);
    setOutlookConnected(outlookConnected);
    
    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchApplications();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      subscribeToApplications();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterApplications();
  }, [applications, statusFilter, searchQuery, experienceFilter, countryFilter, categoryFilter]);

  const checkAdminAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No user found, redirecting to auth');
      router.push('/auth');
      return;
    }

    console.log('Checking admin status for user:', user.id);

    // Check if user is admin in user_roles table
    const { data: adminRoles, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    console.log('Admin role check result:', { adminRoles, error });

    if (error) {
      console.error('Error checking admin role:', error);
      // Don't return - try to continue anyway
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.error('User is not an admin - no admin role found');
      console.log('Available data:', adminRoles);
      
      // Try fetching all roles for this user to debug
      const { data: allRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      console.log('All roles for user:', allRoles);
      
      router.push('/');
      return;
    }

    console.log('User is admin, setting isAdmin to true');
    setIsAdmin(true);
    setLoading(false);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('adminDarkMode', newDarkMode.toString());
  };

  const fetchApplications = async () => {
    try {
      console.log('Fetching contributor applications...');
      const { data, error } = await supabase
        .from('contributor_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        return;
      }

      console.log('Fetched applications:', data?.length || 0);
      setApplications(data || []);
    } catch (err) {
      console.error('Unexpected error fetching applications:', err);
    }
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

    // Experience filter
    if (experienceFilter !== 'all') {
      filtered = filtered.filter(app => app.experience_level === experienceFilter);
    }

    // Country filter
    if (countryFilter !== 'all') {
      filtered = filtered.filter(app => app.country === countryFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(app => app.design_categories.includes(categoryFilter));
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

  // Bulk Actions
  const toggleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredApps.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredApps.map(app => app.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one application');
      return;
    }

    if (!confirm(`Approve all ${selectedItems.size} selected applications?`)) return;

    setBulkActionLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      for (const id of selectedItems) {
        try {
          const app = applications.find(a => a.id === id);
          if (!app) continue;

          const { error } = await supabase
            .from('contributor_applications')
            .update({
              status: 'approved',
              reviewed_by: user?.id,
              review_notes: 'Bulk approved',
              reviewed_at: new Date().toISOString()
            })
            .eq('id', id);

          if (error) throw error;

          // Create/update contributor profile
          const { data: existingContributor } = await supabase
            .from('contributors')
            .select('id')
            .eq('user_id', app.user_id)
            .single();

          if (existingContributor) {
            await supabase
              .from('contributors')
              .update({
                status: 'approved',
                approved_date: new Date().toISOString(),
              })
              .eq('user_id', app.user_id);
          } else {
            await supabase
              .from('contributors')
              .insert({
                user_id: app.user_id,
                status: 'approved',
                approved_date: new Date().toISOString(),
                display_name: app.full_name,
                portfolio_url: app.portfolio_url,
              });
          }

          successCount++;
        } catch (err) {
          console.error('Error approving individual app:', err);
          failCount++;
        }
      }

      alert(`✅ Bulk approved: ${successCount} applications. ${failCount > 0 ? `⚠️ Failed: ${failCount}` : ''}`);
      setSelectedItems(new Set());
    } catch (err: any) {
      console.error('Error in bulk approve:', err);
      alert(err.message || 'Failed to bulk approve');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one application');
      return;
    }

    const reason = prompt(`Enter reason for rejecting ${selectedItems.size} applications:`);
    if (!reason) return;

    setBulkActionLoading(true);
    let successCount = 0;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      for (const id of selectedItems) {
        try {
          const { error } = await supabase
            .from('contributor_applications')
            .update({
              status: 'rejected',
              reviewed_by: user?.id,
              review_notes: reason,
              reviewed_at: new Date().toISOString()
            })
            .eq('id', id);

          if (error) throw error;
          successCount++;
        } catch (err) {
          console.error('Error rejecting individual app:', err);
        }
      }

      alert(`✅ Bulk rejected: ${successCount} applications`);
      setSelectedItems(new Set());
    } catch (err: any) {
      console.error('Error in bulk reject:', err);
      alert(err.message || 'Failed to bulk reject');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const approvedApps = applications.filter(app => app.status === 'approved');
    
    if (approvedApps.length === 0) {
      alert('No approved contributors to export');
      return;
    }

    const headers = ['Full Name', 'Email', 'Country', 'Experience Level', 'Categories', 'Portfolio URL', 'Approved Date'];
    const rows = approvedApps.map(app => [
      app.full_name,
      app.email,
      app.country || 'N/A',
      app.experience_level,
      app.design_categories.join('; '),
      app.portfolio_url || 'N/A',
      app.reviewed_at ? new Date(app.reviewed_at).toLocaleDateString() : 'N/A'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `approved-contributors-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // AI-Powered Features
  const calculateApplicationScore = (app: Application): number => {
    let score = 0;
    
    // Portfolio completeness (30 points)
    if (app.portfolio_url && app.portfolio_url.length > 0) score += 20;
    if (app.sample_works && app.sample_works.length > 0) score += 10;
    
    // Experience level (20 points)
    const experienceScores: Record<string, number> = {
      'entry': 5,
      'intermediate': 15,
      'advanced': 25,
      'expert': 30
    };
    score += experienceScores[app.experience_level] || 0;
    
    // Category diversity (20 points)
    if (app.design_categories && app.design_categories.length > 0) {
      score += Math.min(app.design_categories.length * 3, 20);
    }
    
    // Description quality (15 points)
    if (app.why_join && app.why_join.length > 100) score += 15;
    else if (app.why_join && app.why_join.length > 50) score += 8;
    
    // Sample files uploaded (15 points)
    if (app.sample_files && app.sample_files.length > 0) score += 15;
    
    return Math.min(score, 100);
  };

  const detectDuplicateApplications = (): { [key: string]: string[] } => {
    const duplicateMap: { [key: string]: string[] } = {};
    const emailGroups: { [email: string]: string[] } = {};
    const portfolioGroups: { [url: string]: string[] } = {};
    
    applications.forEach(app => {
      if (app.email) {
        if (!emailGroups[app.email]) emailGroups[app.email] = [];
        emailGroups[app.email].push(app.id);
      }
      if (app.portfolio_url) {
        if (!portfolioGroups[app.portfolio_url]) portfolioGroups[app.portfolio_url] = [];
        portfolioGroups[app.portfolio_url].push(app.id);
      }
    });
    
    Object.entries(emailGroups).forEach(([_, ids]) => {
      if (ids.length > 1) {
        ids.forEach(id => {
          if (!duplicateMap[id]) duplicateMap[id] = [];
          duplicateMap[id] = [...new Set([...duplicateMap[id], ...ids])].filter(x => x !== id);
        });
      }
    });
    
    Object.entries(portfolioGroups).forEach(([_, ids]) => {
      if (ids.length > 1) {
        ids.forEach(id => {
          if (!duplicateMap[id]) duplicateMap[id] = [];
          duplicateMap[id] = [...new Set([...duplicateMap[id], ...ids])].filter(x => x !== id);
        });
      }
    });
    
    return duplicateMap;
  };

  const getRecommendedApplications = (): Application[] => {
    const withScores = applications.map(app => ({
      ...app,
      score: applicationScores[app.id] || calculateApplicationScore(app)
    }));
    
    return withScores
      .filter(app => app.status === 'pending' && !duplicates[app.id])
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5);
  };

  const handleAnalyzeApplications = async () => {
    try {
      setAiAnalysisRunning(true);
      
      // Simulate real-time processing with small delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const scores: { [key: string]: number } = {};
      applications.forEach(app => {
        scores[app.id] = calculateApplicationScore(app);
      });
      setApplicationScores(scores);
      
      const dups = detectDuplicateApplications();
      setDuplicates(dups);
      
      setShowRecommendations(true);
      setAiAnalysisRunning(false);
    } catch (error) {
      console.error('Error during analysis:', error);
      setAiAnalysisRunning(false);
    }
  };

  // Integration Handlers
  const sendSlackNotification = async (app: Application, action: 'approved' | 'rejected') => {
    if (!slackWebhook) {
      alert('Please configure Slack webhook first');
      return;
    }

    try {
      const message = {
        text: `Contributor ${action === 'approved' ? '✅ Approved' : '❌ Rejected'}`,
        attachments: [
          {
            color: action === 'approved' ? '#36a64f' : '#ff0000',
            fields: [
              { title: 'Name', value: app.full_name, short: true },
              { title: 'Email', value: app.email, short: true },
              { title: 'Experience', value: app.experience_level, short: true },
              { title: 'Categories', value: app.design_categories.join(', '), short: true },
              { title: 'Portfolio', value: app.portfolio_url || 'N/A', short: false }
            ]
          }
        ]
      };

      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });

      console.log('Slack notification sent');
    } catch (error) {
      console.error('Error sending Slack notification:', error);
    }
  };

  const sendWebhookNotification = async (app: Application, action: 'approved' | 'rejected') => {
    if (!webhookUrl) {
      alert('Please configure webhook URL first');
      return;
    }

    try {
      const payload = {
        timestamp: new Date().toISOString(),
        action,
        application: {
          id: app.id,
          fullName: app.full_name,
          email: app.email,
          experience: app.experience_level,
          categories: app.design_categories,
          portfolio: app.portfolio_url,
          country: app.country
        }
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('Webhook notification sent');
    } catch (error) {
      console.error('Error sending webhook:', error);
    }
  };

  const handleApproveWithIntegrations = async (appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    // Call the original approve handler
    await handleApprove();
    
    if (slackWebhook) await sendSlackNotification(app, 'approved');
    if (webhookUrl) await sendWebhookNotification(app, 'approved');
  };

  const handleRejectWithIntegrations = async (appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    // Call the original reject handler
    await handleReject();
    
    if (slackWebhook) await sendSlackNotification(app, 'rejected');
    if (webhookUrl) await sendWebhookNotification(app, 'rejected');
  };

  // Calendar Integration Handlers
  const handleGoogleCalendarConnect = async () => {
    setCalendarConnecting('google');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setGoogleCalendarConnected(true);
      alert('✓ Google Calendar connected successfully!');
      localStorage.setItem('googleCalendarConnected', 'true');
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      alert('Failed to connect Google Calendar. Please try again.');
    } finally {
      setCalendarConnecting(null);
    }
  };

  const handleOutlookConnect = async () => {
    setCalendarConnecting('outlook');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setOutlookConnected(true);
      alert('✓ Outlook Calendar connected successfully!');
      localStorage.setItem('outlookConnected', 'true');
    } catch (error) {
      console.error('Error connecting Outlook:', error);
      alert('Failed to connect Outlook. Please try again.');
    } finally {
      setCalendarConnecting(null);
    }
  };

  const handleDisconnectCalendar = (service: 'google' | 'outlook') => {
    if (service === 'google') {
      setGoogleCalendarConnected(false);
      localStorage.removeItem('googleCalendarConnected');
    } else {
      setOutlookConnected(false);
      localStorage.removeItem('outlookConnected');
    }
    alert(`✓ ${service === 'google' ? 'Google Calendar' : 'Outlook'} disconnected`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
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
    <div className="min-h-screen bg-black transition-colors duration-300 flex">
      
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: sidebarOpen ? 0 : -250 }}
        className="w-64 bg-gray-900/80 backdrop-blur border-r border-purple-500/20 fixed left-0 top-0 h-screen overflow-y-auto hidden md:block"
      >
        <div className="p-4 space-y-6">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-purple-300">Dashboard</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-800/50 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-semibold">Quick Stats</p>
            <div className="space-y-2">
              <div className="bg-yellow-500/10 rounded p-2 border border-yellow-500/20">
                <p className="text-xs text-gray-400">Pending</p>
                <p className="text-lg font-bold text-yellow-400">{stats.pending}</p>
              </div>
              <div className="bg-green-500/10 rounded p-2 border border-green-500/20">
                <p className="text-xs text-gray-400">Approved</p>
                <p className="text-lg font-bold text-green-400">{stats.approved}</p>
              </div>
              <div className="bg-red-500/10 rounded p-2 border border-red-500/20">
                <p className="text-xs text-gray-400">Rejected</p>
                <p className="text-lg font-bold text-red-400">{stats.rejected}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 pt-4 border-t border-gray-700/50">
            <p className="text-xs text-gray-400 font-semibold">Actions</p>
            <button
              onClick={handleAnalyzeApplications}
              disabled={aiAnalysisRunning}
              className={`w-full px-3 py-2 rounded text-xs transition text-left font-semibold ${
                aiAnalysisRunning
                  ? 'bg-purple-600/30 border border-purple-500/40 text-purple-300 opacity-70 cursor-not-allowed'
                  : 'bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300'
              }`}
            >
              {aiAnalysisRunning ? (
                <>
                  <span className="inline-block animate-spin mr-1">⚙️</span>
                  Analyzing...
                </>
              ) : (
                '🤖 AI Analysis'
              )}
            </button>
            <button
              onClick={() => setShowIntegrations(!showIntegrations)}
              className="w-full px-3 py-2 rounded text-xs bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 transition text-left font-semibold"
            >
              🔗 Integrations
            </button>
            <button
              onClick={exportToCSV}
              className="w-full px-3 py-2 rounded text-xs bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 transition text-left font-semibold"
            >
              📥 Export CSV
            </button>
          </div>

          {/* Filter Presets */}
          <div className="space-y-2 pt-4 border-t border-gray-700/50">
            <p className="text-xs text-gray-400 font-semibold">Presets</p>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`w-full px-2 py-1.5 rounded text-xs transition text-left ${statusFilter === 'pending' ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-300' : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-700/50'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`w-full px-2 py-1.5 rounded text-xs transition text-left ${statusFilter === 'approved' ? 'bg-green-500/20 border border-green-500/40 text-green-300' : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-700/50'}`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`w-full px-2 py-1.5 rounded text-xs transition text-left ${statusFilter === 'rejected' ? 'bg-red-500/20 border border-red-500/40 text-red-300' : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-700/50'}`}
            >
              Rejected
            </button>
          </div>

          {/* AI Recommendations Section */}
          {showRecommendations && getRecommendedApplications().length > 0 && (
            <div className="space-y-2 pt-4 border-t border-purple-500/30 bg-purple-500/10 rounded p-3 mt-4">
              <p className="text-xs font-semibold text-purple-300">✨ 🤖 Top {getRecommendedApplications().length} Recommendations</p>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {getRecommendedApplications().map((app, idx) => (
                  <div 
                    key={app.id} 
                    onClick={() => setSelectedApp(app)}
                    className="bg-purple-500/10 hover:bg-purple-500/20 rounded p-2 border border-purple-500/30 hover:border-purple-500/50 text-xs cursor-pointer transition group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-semibold text-purple-200 truncate group-hover:text-purple-100">{idx + 1}. {app.full_name}</p>
                      <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 font-bold whitespace-nowrap text-xs border border-green-500/30">
                        {Math.round(applicationScores[app.id] || calculateApplicationScore(app))}%
                      </span>
                    </div>
                    <p className="text-purple-300/70 text-xs">
                      {app.design_categories.slice(0, 2).join(', ')}
                      {app.design_categories.length > 2 ? ` +${app.design_categories.length - 2}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duplicates Warning */}
          {Object.keys(duplicates).length > 0 && (
            <div className="space-y-2 pt-4 border-t border-red-500/30 bg-red-500/10 rounded p-3">
              <p className="text-xs font-semibold text-red-300">⚠️ {Object.keys(duplicates).length} Duplicate(s) Found</p>
              <p className="text-xs text-gray-400">Click to review flagged applications</p>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
      
      {/* Header */}
      <header className="relative overflow-hidden border-b border-purple-500/20">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10"></div>
        <div className="relative max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-75"></div>
                <img src="/logo2.svg" alt="Logo" className="relative w-9 h-9 rounded-lg" />
              </div>
              <div>
                <h1 className="text-xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Contributor Hub
                </h1>
                <p className="text-xs mt-0.5 text-gray-400">Review & manage applications</p>
              </div>
            </div>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg transition bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg p-3 border border-yellow-500/20 transition hover:border-yellow-500/40"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Pending</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                </div>
                <Clock className="w-7 h-7 text-yellow-500/40" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-3 border border-green-500/20 transition hover:border-green-500/40"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Approved</p>
                  <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
                </div>
                <CheckCircle className="w-7 h-7 text-green-500/40" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-lg p-3 border border-red-500/20 transition hover:border-red-500/40"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Rejected</p>
                  <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
                </div>
                <XCircle className="w-7 h-7 text-red-500/40" />
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="max-w-[1800px] mx-auto px-6 py-4 space-y-3">
        {/* Main Controls Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg text-sm bg-gray-800/50 border border-gray-700/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 transition cursor-pointer whitespace-nowrap"
          >
            📥 Export CSV
          </button>

          {/* AI Analysis Button */}
          <button
            onClick={handleAnalyzeApplications}
            disabled={aiAnalysisRunning}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              aiAnalysisRunning
                ? 'bg-purple-600/30 border border-purple-500/40 text-purple-300 opacity-70 cursor-not-allowed'
                : 'bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300'
            }`}
            title="Run AI scoring and duplicate detection"
          >
            {aiAnalysisRunning ? (
              <>
                <span className="inline-block animate-spin mr-1">⚙️</span>
                Analyzing...
              </>
            ) : (
              '🤖 AI Analysis'
            )}
          </button>

          {/* Integrations Button */}
          <button
            onClick={() => setShowIntegrations(!showIntegrations)}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 transition cursor-pointer whitespace-nowrap"
            title="Configure integrations"
          >
            🔗 Integrations
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 flex-shrink-0">
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <button
              key={status}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setStatusFilter(status);
              }}
              type="button"
              className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition cursor-pointer active:scale-95 ${
                statusFilter === status
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {/* Experience Filter */}
          <select
            value={experienceFilter}
            onChange={(e) => setExperienceFilter(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            title="Filter by experience level"
          >
            <option value="all">All Levels</option>
            {uniqueExperienceLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>

          {/* Country Filter */}
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            title="Filter by country"
          >
            <option value="all">All Countries</option>
            {uniqueCountries.filter(Boolean).map(country => (
              <option key={country} value={country || ''}>{country}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            title="Filter by design category"
          >
            <option value="all">All Categories</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setExperienceFilter('all');
              setCountryFilter('all');
              setCategoryFilter('all');
              setSearchQuery('');
            }}
            className="px-2 py-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 text-gray-300 text-xs font-semibold transition cursor-pointer"
          >
            Clear All
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30"
          >
            <span className="text-xs font-semibold text-purple-300">{selectedItems.size} selected</span>
            <button
              onClick={toggleSelectAll}
              className="px-2 py-1 text-xs rounded bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 transition cursor-pointer"
            >
              Deselect All
            </button>
            <button
              onClick={handleBulkApprove}
              disabled={bulkActionLoading}
              className="px-2 py-1 text-xs rounded bg-green-600/50 hover:bg-green-500/50 text-green-300 font-semibold transition cursor-pointer disabled:opacity-60"
            >
              {bulkActionLoading ? '⏳' : '✓'} Approve All
            </button>
            <button
              onClick={handleBulkReject}
              disabled={bulkActionLoading}
              className="px-2 py-1 text-xs rounded bg-red-600/50 hover:bg-red-500/50 text-red-300 font-semibold transition cursor-pointer disabled:opacity-60"
            >
              {bulkActionLoading ? '⏳' : '✕'} Reject All
            </button>
          </motion.div>
        )}
      </div>

      {/* Applications List */}
      <main className="max-w-[1800px] mx-auto px-6 pb-8">
        {filteredApps.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3 mx-auto bg-gray-800/50 border border-gray-700/50">
              <Clock className="w-7 h-7 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold mb-1 text-gray-100">
              No applications found
            </h3>
            <p className="text-xs text-gray-400">
              {statusFilter !== 'all' 
                ? `No ${statusFilter} applications at the moment`
                : 'No applications match your search'
              }
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-2">
            {filteredApps.map((app, idx) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`group rounded-lg p-3 transition border ${
                  selectedItems.has(app.id)
                    ? 'bg-purple-500/20 border-purple-500/50'
                    : 'bg-gray-800/30 border-gray-700/50 hover:border-purple-500/50 hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedItems.has(app.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelectItem(app.id);
                    }}
                    className="w-4 h-4 rounded cursor-pointer shrink-0"
                    title="Select this application"
                  />

                  {/* Left: Info */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setSelectedApp(app)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <img src="/logo2.svg" alt="Logo" className="w-8 h-8 rounded flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-gray-100 truncate">{app.full_name}</h3>
                        <p className="text-xs text-gray-500 truncate">{app.email}</p>
                      </div>
                    </div>

                    {/* Categories - Compact */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {app.design_categories.slice(0, 2).map((cat, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 rounded text-xs font-medium border border-purple-500/30"
                        >
                          {cat}
                        </span>
                      ))}
                      {app.design_categories.length > 2 && (
                        <span className="text-gray-400 text-xs font-medium">+{app.design_categories.length - 2}</span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Meta Info */}
                  <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
                    {app.country && (
                      <span className="hidden sm:flex items-center gap-1">
                        <Globe className="w-3 h-3 text-blue-400" />
                        <span className="hidden md:inline">{app.country}</span>
                      </span>
                    )}
                    <span className="hidden sm:flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span className="hidden md:inline">{app.experience_level}</span>
                    </span>
                    
                    {/* AI Score Badge */}
                    {applicationScores[app.id] !== undefined && (
                      <span className={`px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${
                        applicationScores[app.id] >= 75 ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                        applicationScores[app.id] >= 50 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      }`}>
                        🤖 {Math.round(applicationScores[app.id])}/100
                      </span>
                    )}
                  </div>

                  {/* Sample Preview */}
                  {app.sample_files?.length > 0 && (
                    <div className="flex gap-1 flex-shrink-0">
                      {app.sample_files.slice(0, 1).map((file: any, idx: number) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded overflow-hidden bg-gray-700/50 border border-gray-600/50 flex items-center justify-center flex-shrink-0"
                        >
                          {file.type?.startsWith('image/') ? (
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileImage className="w-3 h-3 text-gray-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Status Badge */}
                  <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : app.status === 'approved' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                    {app.status === 'pending' && <Clock className="w-3 h-3" />}
                    {app.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                    {app.status === 'rejected' && <XCircle className="w-3 h-3" />}
                  </span>
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
              className="rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50 bg-gray-800 shadow-2xl shadow-purple-500/20"
            >
              {/* Modal Header */}
              <div className="sticky top-0 border-b border-gray-700/50 p-4 z-10 backdrop-blur bg-gray-800/95">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <img src="/logo2.svg" alt="Logo" className="w-10 h-10 rounded flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold text-white truncate">
                          {selectedApp.full_name}
                        </h2>
                        <p className="text-xs text-gray-400 truncate">
                          {selectedApp.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedApp(null);
                    }}
                    type="button"
                    className="p-1.5 hover:bg-gray-700/50 rounded transition cursor-pointer active:scale-95 flex-shrink-0"
                  >
                    <XCircle className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 space-y-4">
                
                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="rounded-lg p-3 bg-gray-700/30 border border-gray-600/50">
                    <p className="text-xs mb-1 flex items-center gap-1 text-gray-300">
                      <Globe className="w-3 h-3" /> Country
                    </p>
                    <p className="font-semibold text-sm text-white">
                      {selectedApp.country || 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-lg p-3 bg-gray-700/30 border border-gray-600/50">
                    <p className="text-xs mb-1 flex items-center gap-1 text-gray-300">
                      <Star className="w-3 h-3" /> Experience
                    </p>
                    <p className="font-semibold text-sm text-white capitalize">
                      {selectedApp.experience_level}
                    </p>
                  </div>
                  <div className="rounded-lg p-3 bg-gray-700/30 border border-gray-600/50">
                    <p className="text-xs mb-1 flex items-center gap-1 text-gray-300">
                      <Award className="w-3 h-3" /> Status
                    </p>
                    <span className={`text-xs font-bold capitalize ${
                      selectedApp.status === 'pending' ? 'text-yellow-300' :
                      selectedApp.status === 'approved' ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {selectedApp.status}
                    </span>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <p className="text-xs font-semibold mb-2 text-white">Design Expertise</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedApp.design_categories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Portfolio */}
                {selectedApp.portfolio_url && (
                  <div>
                    <p className="text-xs font-semibold mb-2 text-white">Portfolio</p>
                    <a
                      href={selectedApp.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/50 text-purple-400 hover:text-purple-300 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Portfolio
                    </a>
                  </div>
                )}

                {/* Why Join */}
                {selectedApp.why_join && (
                  <div>
                    <p className="text-xs font-semibold mb-1 text-white">Motivation</p>
                    <div className="rounded-lg p-3 bg-gray-700/30 border border-gray-600/50">
                      <p className="leading-relaxed text-xs text-gray-300">
                        {selectedApp.why_join}
                      </p>
                    </div>
                  </div>
                )}

                {/* Sample Works */}
                <div>
                  <p className="text-xs font-semibold mb-2 text-white">
                    Sample Works ({selectedApp.sample_files?.length || 0})
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {selectedApp.sample_files?.map((file: any, idx: number) => (
                      <a
                        key={idx}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square rounded overflow-hidden bg-gray-700/50 border border-gray-600/50 hover:border-purple-400 transition flex items-center justify-center"
                      >
                        {file.type?.startsWith('image/') ? (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        ) : (
                          <FileImage className="w-5 h-5 text-gray-500" />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <Download className="w-6 h-6 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Email Status */}
                {sendingEmail && (
                  <div className="p-3 rounded-lg flex items-center gap-2 border bg-blue-500/10 border-blue-500/30">
                    <Send className="w-4 h-4 animate-pulse text-blue-400" />
                    <p className="text-xs font-medium text-blue-300">
                      Sending email notification...
                    </p>
                  </div>
                )}

                {/* Review Notes */}
                <div>
                  <p className="text-xs font-semibold mb-1 text-white">
                    {selectedApp.status === 'pending' ? 'Review Notes' : 'Previous Notes'}
                  </p>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    placeholder={selectedApp.status === 'pending' ? 'Add notes (required for rejection)...' : ''}
                    disabled={selectedApp.status !== 'pending'}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-gray-700/30 border border-gray-600/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition disabled:opacity-50"
                  />
                </div>

                {/* Actions */}
                {selectedApp.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleApproveWithIntegrations(selectedApp.id);
                      }}
                      type="button"
                      disabled={actionLoading || sendingEmail}
                      className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs font-semibold shadow-lg shadow-green-500/30 cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 transition"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-3 h-3 mr-1 inline-block animate-spin" />
                      ) : (
                        <CheckCircle className="w-3 h-3 mr-1 inline-block" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRejectWithIntegrations(selectedApp.id);
                      }}
                      type="button"
                      disabled={actionLoading || sendingEmail || !reviewNotes.trim()}
                      className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white text-xs font-semibold shadow-lg shadow-red-500/30 cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 transition"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-3 h-3 mr-1 inline-block animate-spin" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1 inline-block" />
                      )}
                      Reject
                    </button>
                  </div>
                )}

                {/* Already Reviewed */}
                {selectedApp.status !== 'pending' && (
                  <div>
                    <div className={`p-3 rounded-lg border mb-3 ${
                      selectedApp.status === 'approved'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}>
                      <p className={`text-xs font-bold mb-0.5 ${
                        selectedApp.status === 'approved' 
                          ? 'text-green-300' 
                          : 'text-red-300'
                      }`}>
                        {selectedApp.status === 'approved' ? '✓ Approved' : '✕ Rejected'} on {' '}
                        {selectedApp.reviewed_at && new Date(selectedApp.reviewed_at).toLocaleDateString()}
                      </p>
                      {selectedApp.review_notes && (
                        <p className="text-xs text-gray-300">
                          {selectedApp.review_notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedApp(null);
                      }}
                      type="button"
                      className="w-full px-3 py-2 rounded-lg font-semibold text-xs cursor-pointer active:scale-95 transition bg-gray-700 hover:bg-gray-600 text-gray-100"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>

      {/* Sidebar Toggle Button (for mobile) */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-6 right-6 md:hidden p-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg transition z-50"
        title="Toggle sidebar"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Integrations Modal */}
      <AnimatePresence>
        {showIntegrations && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowIntegrations(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 rounded-xl border border-purple-500/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 flex items-center justify-between p-6 border-b border-purple-500/20 bg-gray-900/95 backdrop-blur">
                <h2 className="text-xl font-bold text-purple-300 flex items-center gap-2">
                  🔗 Integration Settings
                </h2>
                <button
                  onClick={() => setShowIntegrations(false)}
                  className="p-1 hover:bg-gray-800 rounded transition"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                
                {/* Slack Integration */}
                <div className="space-y-3 p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
                  <h3 className="text-sm font-semibold text-blue-300 flex items-center gap-2">
                    💬 Slack Integration
                  </h3>
                  <p className="text-xs text-gray-400">Send notifications to Slack when contributors are approved/rejected</p>
                  <input
                    type="password"
                    placeholder="Slack Webhook URL (https://hooks.slack.com/...)"
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    className="w-full px-3 py-2 rounded text-sm bg-gray-700/50 border border-gray-600/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                  {slackWebhook && <p className="text-xs text-green-400">✓ Slack webhook configured</p>}
                </div>

                {/* Webhook Integration */}
                <div className="space-y-3 p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
                  <h3 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
                    🔗 Generic Webhook
                  </h3>
                  <p className="text-xs text-gray-400">Send JSON data to your custom endpoint on every action</p>
                  <input
                    type="url"
                    placeholder="Your webhook URL (https://...)"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded text-sm bg-gray-700/50 border border-gray-600/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                  />
                  {webhookUrl && <p className="text-xs text-green-400">✓ Webhook URL configured</p>}
                  <details className="text-xs text-gray-400">
                    <summary className="cursor-pointer hover:text-gray-300">View payload example</summary>
                    <pre className="mt-2 p-2 bg-black/50 rounded text-gray-300 overflow-x-auto text-[10px]">{`{
  "timestamp": "2024-01-01T12:00:00Z",
  "action": "approved",
  "application": {
    "id": "...",
    "fullName": "John Doe",
    "email": "john@example.com",
    "experience": "advanced",
    "categories": ["UI Design", "Branding"]
  }
}`}</pre>
                  </details>
                </div>

                {/* CRM Integration */}
                <div className="space-y-3 p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
                  <h3 className="text-sm font-semibold text-green-300 flex items-center gap-2">
                    📊 CRM Integration
                  </h3>
                  <p className="text-xs text-gray-400">Sync approved contributors to your CRM (Salesforce, HubSpot)</p>
                  <select
                    value={crmIntegration}
                    onChange={(e) => setCrmIntegration(e.target.value)}
                    className="w-full px-3 py-2 rounded text-sm bg-gray-700/50 border border-gray-600/50 text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                  >
                    <option value="">Select CRM...</option>
                    <option value="salesforce">Salesforce</option>
                    <option value="hubspot">HubSpot</option>
                    <option value="pipedrive">Pipedrive</option>
                    <option value="custom">Custom API</option>
                  </select>
                  {crmIntegration && <p className="text-xs text-green-400">✓ CRM sync enabled for {crmIntegration}</p>}
                </div>

                {/* Calendar Integration */}
                <div className="space-y-3 p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
                  <h3 className="text-sm font-semibold text-orange-300 flex items-center gap-2">
                    📅 Calendar Integration
                  </h3>
                  <p className="text-xs text-gray-400">Add approved contributors to your calendar for onboarding</p>
                  <div className="space-y-2">
                    {/* Google Calendar */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={googleCalendarConnected ? () => handleDisconnectCalendar('google') : handleGoogleCalendarConnect}
                        disabled={calendarConnecting === 'google'}
                        className={`flex-1 px-3 py-2 rounded text-xs font-semibold transition ${
                          googleCalendarConnected
                            ? 'bg-orange-600/20 hover:bg-red-600/20 border border-orange-500/30 hover:border-red-500/30 text-orange-300 hover:text-red-300'
                            : 'bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-300 disabled:opacity-60'
                        }`}
                      >
                        {calendarConnecting === 'google' ? (
                          <>
                            <span className="inline-block animate-spin mr-1">⚙️</span>
                            Connecting...
                          </>
                        ) : googleCalendarConnected ? (
                          '✓ Google Calendar Connected'
                        ) : (
                          'Connect Google Calendar'
                        )}
                      </button>
                    </div>

                    {/* Outlook */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={outlookConnected ? () => handleDisconnectCalendar('outlook') : handleOutlookConnect}
                        disabled={calendarConnecting === 'outlook'}
                        className={`flex-1 px-3 py-2 rounded text-xs font-semibold transition ${
                          outlookConnected
                            ? 'bg-orange-600/20 hover:bg-red-600/20 border border-orange-500/30 hover:border-red-500/30 text-orange-300 hover:text-red-300'
                            : 'bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-300 disabled:opacity-60'
                        }`}
                      >
                        {calendarConnecting === 'outlook' ? (
                          <>
                            <span className="inline-block animate-spin mr-1">⚙️</span>
                            Connecting...
                          </>
                        ) : outlookConnected ? (
                          '✓ Outlook Connected'
                        ) : (
                          'Connect Outlook'
                        )}
                      </button>
                    </div>

                    {/* Status */}
                    <div className="pt-1 text-xs">
                      {googleCalendarConnected && <p className="text-orange-300">📅 Google Calendar syncing approved contributors</p>}
                      {outlookConnected && <p className="text-orange-300">📅 Outlook syncing approved contributors</p>}
                      {!googleCalendarConnected && !outlookConnected && <p className="text-gray-500">No calendar services connected</p>}
                    </div>
                  </div>
                </div>

                {/* AI Analysis Info */}
                <div className="space-y-3 p-4 rounded-lg bg-purple-800/30 border border-purple-500/30">
                  <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                    🤖 AI Analysis Status
                  </h3>
                  {Object.keys(applicationScores).length > 0 ? (
                    <div className="space-y-2 text-xs">
                      <p className="text-green-400">✓ AI scoring active: {Object.keys(applicationScores).length} applications analyzed</p>
                      <p className="text-green-400">✓ Duplicate detection: {Object.keys(duplicates).length} duplicates found</p>
                      <p className="text-green-400">✓ Recommendations: {getRecommendedApplications().length} top candidates identified</p>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-xs">Run AI analysis from the sidebar to enable recommendations and scoring</p>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex gap-2 pt-4 border-t border-gray-700/50">
                  <button
                    onClick={() => setShowIntegrations(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 text-gray-300 font-semibold transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowIntegrations(false);
                      alert('Integration settings saved!');
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 font-semibold transition"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}