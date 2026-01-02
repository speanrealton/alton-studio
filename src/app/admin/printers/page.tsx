'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Clock, Eye, Mail, Phone, Globe, MapPin, Loader2, Search, Filter, AlertCircle, Menu, X, Download, BarChart3, Copy, AlertTriangle, SortAsc } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [printers, setPrinters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrinter, setSelectedPrinter] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all'); // Default to all to show both new and old
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [processing, setProcessing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  
  // AI Features
  const [printerScores, setPrinterScores] = useState<{ [key: string]: number }>({});
  const [aiAnalysisRunning, setAiAnalysisRunning] = useState(false);
  
  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // New Features
  const [selectedPrinters, setSelectedPrinters] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'score'>('date');
  const [printerNotes, setPrinterNotes] = useState<{ [key: string]: string }>({});
  const [duplicatePrinters, setDuplicatePrinters] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    checkAdminAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }

      // Check if user is admin in user_roles table
      const { data: adminRoles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
        setAdminLoading(false);
        return;
      }

      if (!adminRoles || adminRoles.length === 0) {
        setIsAdmin(false);
        setAdminLoading(false);
        return;
      }

      setIsAdmin(true);
      setAdminLoading(false);
    } catch (err) {
      console.error('Error checking admin access:', err);
      setIsAdmin(false);
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (!adminLoading && !isAdmin) return;
    if (!adminLoading && isAdmin) {
      fetchPrinters();
      fetchStats();
    }

    // Real-time subscription for printer_submissions
    const submissionsChannel = supabase
      .channel('admin-printer-submissions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'printer_submissions' 
      }, () => {
        console.log('[REALTIME] printer_submissions changed');
        fetchPrinters();
        fetchStats();
      })
      .subscribe();

    // Real-time subscription for printers table
    const printersChannel = supabase
      .channel('admin-printers-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'printers' 
      }, () => {
        console.log('[REALTIME] printers table changed');
        fetchPrinters();
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(submissionsChannel);
      supabase.removeChannel(printersChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchQuery, adminLoading, isAdmin]);

  // Update stats whenever printers data changes
  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printers]);

  const fetchPrinters = async () => {
    setLoading(true);
    try {
      console.log('Fetching printers with filter:', statusFilter);

      // Always fetch ALL submissions with portfolio images
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('printer_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });
      
      if (submissionsError) {
        console.error('Error fetching printer submissions:', submissionsError);
      }

      console.log('Submissions fetched:', submissionsData?.length || 0);

      // Always fetch ALL approved printers from printers table with portfolio
      const { data: approvedData, error: approvedError } = await supabase
        .from('printers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (approvedError) {
        console.error('Error fetching approved printers:', approvedError);
      }

      console.log('Approved printers fetched:', approvedData?.length || 0);

      // Combine both lists
      const allPrinters = [...(submissionsData || []), ...(approvedData || [])];
      
      // Remove duplicates by ID
      const uniquePrinters = Array.from(
        new Map(allPrinters.map((item: any) => [item.id, item])).values()
      );

      // Fetch portfolio images for all printers
      const printerIds = uniquePrinters.map((p: any) => p.id).filter(Boolean);
      if (printerIds.length > 0) {
        const { data: portfolioData, error: portfolioError } = await supabase
          .from('printer_portfolio')
          .select('*')
          .in('printer_id', printerIds);
        
        if (!portfolioError && portfolioData) {
          // Map portfolio images to printers
          const portfolioMap = new Map();
          portfolioData.forEach((port: any) => {
            if (!portfolioMap.has(port.printer_id)) {
              portfolioMap.set(port.printer_id, []);
            }
            portfolioMap.get(port.printer_id).push(port);
          });
          
          // Add portfolio to each printer
          uniquePrinters.forEach((printer: any) => {
            printer.printer_portfolio = portfolioMap.get(printer.id) || [];
          });
        }
      }

      console.log('Total unique printers:', uniquePrinters.length);
      console.log('Status breakdown:', {
        pending: uniquePrinters.filter(p => p.status === 'pending').length,
        approved: uniquePrinters.filter(p => p.status === 'approved').length,
        rejected: uniquePrinters.filter(p => p.status === 'rejected').length
      });
      console.log('Sample printer statuses:', uniquePrinters.slice(0, 3).map(p => ({ id: p.id, status: p.status, company_name: p.company_name })));

      // Now apply filters on the combined list
      let filtered = uniquePrinters;

      // Filter by status
      if (statusFilter !== 'all') {
        console.log('Applying status filter:', statusFilter);
        filtered = filtered.filter((p: any) => p.status === statusFilter);
        console.log('After status filter:', filtered.length);
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((p: any) =>
          (p.company_name?.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query) ||
          p.city?.toLowerCase().includes(query) ||
          p.contact_name?.toLowerCase().includes(query))
        );
      }

      console.log('Printers after filtering:', filtered.length);
      setPrinters(filtered);
    } catch (err) {
      console.error('Unexpected error fetching printers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = () => {
    // Use the printers state which already has both submissions and approved printers combined
    console.log('[STATS] Calculating from printers state:', printers.length);
    
    const pending = printers.filter(p => p.status === 'pending').length;
    const approved = printers.filter(p => p.status === 'approved').length;
    const rejected = printers.filter(p => p.status === 'rejected').length;
    const total = printers.length;

    console.log('[STATS]', { pending, approved, rejected, total });

    setStats({
      pending,
      approved,
      rejected,
      total
    });
  };

  // AI Scoring Function for Printers
  const calculatePrinterScore = (printer: any): number => {
    let score = 0;
    
    // Portfolio completeness (30 points)
    if (printer.printer_portfolio && printer.printer_portfolio.length > 0) {
      score += Math.min(printer.printer_portfolio.length * 5, 30);
    }
    
    // Contact information (20 points)
    if (printer.email) score += 10;
    if (printer.phone) score += 5;
    if (printer.website) score += 5;
    
    // Location info (15 points)
    if (printer.city && printer.country) score += 15;
    
    // Company details (15 points)
    if (printer.company_name && printer.company_name.length > 5) score += 10;
    if (printer.contact_person) score += 5;
    
    // Description quality (20 points)
    if (printer.description && printer.description.length > 100) score += 20;
    else if (printer.description && printer.description.length > 50) score += 10;
    
    return Math.min(score, 100);
  };

  // AI Analysis Handler
  const handleAnalyzePrinters = async () => {
    try {
      setAiAnalysisRunning(true);
      
      // Simulate real-time processing with small delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const scores: { [key: string]: number } = {};
      printers.forEach(printer => {
        scores[printer.id] = calculatePrinterScore(printer);
      });
      setPrinterScores(scores);
      setAiAnalysisRunning(false);
    } catch (error) {
      console.error('Error during analysis:', error);
      setAiAnalysisRunning(false);
    }
  };

  const updatePrinterStatus = async (printerId: string, newStatus: string): Promise<void> => {
    setProcessing(true);
    try {
      console.log('[UPDATE] === STARTING UPDATE ===');
      console.log('[UPDATE] Calling API endpoint for printerId:', printerId, 'Status:', newStatus);

      // Call backend API which uses service role to bypass RLS
      const response = await fetch('/api/admin/update-printer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          printerId,
          newStatus,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('[UPDATE] ✅ API Success! Refreshing data...');
        setSelectedPrinter(null);
        await fetchPrinters();
        await fetchStats();
        alert(`Printer successfully marked as ${newStatus}`);
      } else {
        console.error('[UPDATE] ❌ API Error:', result.error);
        alert(`Error updating printer: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('[UPDATE] ❌ Exception:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  // NEW FEATURES

  // Export to CSV
  const exportToCSV = (data: any[], filename: string) => {
    const headers = ['Company Name', 'Email', 'Phone', 'City', 'Country', 'Status', 'Created At', 'AI Score', 'Notes'];
    const rows = data.map(p => [
      p.company_name,
      p.email,
      p.phone,
      p.city,
      p.country,
      p.status,
      new Date(p.created_at).toLocaleDateString(),
      printerScores[p.id] ? Math.round(printerScores[p.id]) : 'N/A',
      printerNotes[p.id] || ''
    ]);

    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Bulk approve/reject
  const handleBulkApprove = async () => {
    if (selectedPrinters.size === 0) {
      alert('Select at least one printer');
      return;
    }

    setProcessing(true);
    try {
      for (const id of selectedPrinters) {
        await supabase
          .from('printer_submissions')
          .update({ status: 'approved' })
          .eq('id', id);
      }
      setSelectedPrinters(new Set());
      await fetchPrinters();
      await fetchStats();
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedPrinters.size === 0) {
      alert('Select at least one printer');
      return;
    }

    setProcessing(true);
    try {
      for (const id of selectedPrinters) {
        await supabase
          .from('printer_submissions')
          .update({ status: 'rejected' })
          .eq('id', id);
      }
      setSelectedPrinters(new Set());
      await fetchPrinters();
      await fetchStats();
    } finally {
      setProcessing(false);
    }
  };

  // Duplicate detection
  const detectDuplicates = () => {
    const duplicates: { [key: string]: string[] } = {};
    
    printers.forEach(p1 => {
      printers.forEach(p2 => {
        if (p1.id !== p2.id) {
          const similarity = calculateSimilarity(p1, p2);
          if (similarity > 0.7) {
            if (!duplicates[p1.id]) duplicates[p1.id] = [];
            if (!duplicates[p1.id].includes(p2.id)) {
              duplicates[p1.id].push(p2.id);
            }
          }
        }
      });
    });

    setDuplicatePrinters(duplicates);
  };

  const calculateSimilarity = (p1: any, p2: any): number => {
    let score = 0;
    const maxScore = 3;

    // Similar company names
    if (p1.company_name?.toLowerCase().includes(p2.company_name?.toLowerCase() || '')) score += 1;
    if (p1.city === p2.city && p1.country === p2.country) score += 1;
    if (p1.email?.split('@')[0] === p2.email?.split('@')[0]) score += 1;

    return score / maxScore;
  };

  // Update admin notes
  const updatePrinterNote = async (printerId: string, note: string) => {
    setPrinterNotes(prev => ({
      ...prev,
      [printerId]: note
    }));
  };

  // Generate statistics
  const generateStats = () => {
    const approved = printers.filter(p => p.status === 'approved').length;
    const pending = printers.filter(p => p.status === 'pending').length;
    const rejected = printers.filter(p => p.status === 'rejected').length;
    const avgScore = Object.values(printerScores).length > 0 
      ? Math.round(Object.values(printerScores).reduce((a: number, b: number) => a + b, 0) / Object.values(printerScores).length)
      : 0;

    return { approved, pending, rejected, avgScore, total: printers.length };
  };

  // Sort printers
  const sortedPrinters = [...printers].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === 'name') {
      return a.company_name.localeCompare(b.company_name);
    } else if (sortBy === 'score') {
      return (printerScores[b.id] || 0) - (printerScores[a.id] || 0);
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-purple-900/20 border-b border-purple-500/20">
        <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Printers</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: sidebarOpen ? 256 : 0,
          opacity: sidebarOpen ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
        className="hidden md:flex md:w-64 bg-gradient-to-br from-purple-900/10 to-black border-r border-purple-500/20 flex-col overflow-hidden"
      >
        <div className="p-3 flex-1 overflow-y-auto">
          {/* Sidebar Header */}
          <div className="mb-4">
            <h2 className="text-xs font-bold text-purple-300 uppercase tracking-wider">Dashboard</h2>
          </div>

          {/* Quick Stats */}
          <div className="space-y-2 mb-4">
            <div className="bg-yellow-500/10 rounded px-3 py-2.5 border border-yellow-500/20">
              <p className="text-xs text-gray-400 mb-1">Pending</p>
              <p className="text-lg font-black text-yellow-400">{stats.pending}</p>
            </div>
            <div className="bg-green-500/10 rounded px-3 py-2.5 border border-green-500/20">
              <p className="text-xs text-gray-400 mb-1">Approved</p>
              <p className="text-lg font-black text-green-400">{stats.approved}</p>
            </div>
            <div className="bg-red-500/10 rounded px-3 py-2.5 border border-red-500/20">
              <p className="text-xs text-gray-400 mb-1">Rejected</p>
              <p className="text-lg font-black text-red-400">{stats.rejected}</p>
            </div>
            <div className="bg-purple-500/10 rounded px-3 py-2.5 border border-purple-500/20">
              <p className="text-xs text-gray-400 mb-1">Total</p>
              <p className="text-lg font-black text-purple-400">{stats.total}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-1.5 pt-3 border-t border-gray-700/50">
            <p className="text-xs text-gray-400 font-semibold px-2">Actions</p>
            
            <button
              onClick={handleAnalyzePrinters}
              disabled={aiAnalysisRunning}
              className={`w-full px-2 py-1.5 rounded text-xs transition text-left font-medium ${
                aiAnalysisRunning
                  ? 'bg-purple-600/30 border border-purple-500/40 text-purple-300 opacity-70 cursor-not-allowed'
                  : 'bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300'
              }`}
            >
              {aiAnalysisRunning ? (
                <>
                  <span className="inline-block animate-spin mr-1 text-xs">⚙️</span>
                  Analyzing...
                </>
              ) : (
                '🤖 AI Analysis'
              )}
            </button>

            <button
              onClick={() => exportToCSV(printers, 'all-printers')}
              className="w-full px-2 py-1.5 rounded text-xs transition text-left font-medium bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 flex items-center gap-1"
              title="Export all printers to CSV"
            >
              <Download className="w-3 h-3" /> All Data
            </button>

            <button
              onClick={() => exportToCSV(printers.filter(p => p.status === 'approved'), 'approved-printers')}
              className="w-full px-2 py-1.5 rounded text-xs transition text-left font-medium bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-300 flex items-center gap-1"
              title="Export approved printers"
            >
              <Download className="w-3 h-3" /> Approved
            </button>

            <button
              onClick={detectDuplicates}
              className="w-full px-2 py-1.5 rounded text-xs transition text-left font-medium bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-300 flex items-center gap-1"
              title="Detect duplicate printers"
            >
              <Copy className="w-3 h-3" /> Duplicates
            </button>

            {selectedPrinters.size > 0 && (
              <>
                <button
                  onClick={handleBulkApprove}
                  disabled={processing}
                  className="w-full px-2 py-1.5 rounded text-xs transition text-left font-medium bg-green-600/40 hover:bg-green-600/50 border border-green-500/40 text-green-300"
                >
                  ✓ Approve ({selectedPrinters.size})
                </button>
                <button
                  onClick={handleBulkReject}
                  disabled={processing}
                  className="w-full px-2 py-1.5 rounded text-xs transition text-left font-medium bg-red-600/40 hover:bg-red-600/50 border border-red-500/40 text-red-300"
                >
                  ✕ Reject ({selectedPrinters.size})
                </button>
              </>
            )}
          </div>

          {/* Filter Presets */}
          <div className="space-y-1 pt-3 border-t border-gray-700/50">
            <p className="text-xs text-gray-400 font-semibold px-2">Filters</p>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`w-full px-2 py-1 rounded text-xs transition text-left ${statusFilter === 'approved' ? 'bg-green-500/20 border border-green-500/40 text-green-300' : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-700/50'}`}
            >
              ✓ Approved
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`w-full px-2 py-1 rounded text-xs transition text-left ${statusFilter === 'pending' ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-300' : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-700/50'}`}
            >
              ⏳ Pending
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`w-full px-2 py-1 rounded text-xs transition text-left ${statusFilter === 'rejected' ? 'bg-red-500/20 border border-red-500/40 text-red-300' : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-700/50'}`}
            >
              ✕ Rejected
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`w-full px-2 py-1 rounded text-xs transition text-left ${statusFilter === 'all' ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300' : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-700/50'}`}
            >
              All
            </button>
          </div>

          {/* AI Scores Section */}
          {Object.keys(printerScores).length > 0 && (
            <div className="space-y-1 pt-3 border-t border-gray-700/50">
              <p className="text-xs text-green-400 font-semibold px-2">✓ AI Active</p>
              <p className="text-xs text-gray-500 px-2">{Object.keys(printerScores).length} printers analyzed</p>
            </div>
          )}

          {/* Sorting Options */}
          <div className="space-y-1 pt-3 border-t border-gray-700/50">
            <p className="text-xs text-gray-400 font-semibold px-2">Sort By</p>
            <button
              onClick={() => setSortBy('date')}
              className={`w-full px-2 py-1 rounded text-xs transition text-left flex items-center gap-1 ${sortBy === 'date' ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300' : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-700/50'}`}
            >
              <Clock className="w-3 h-3" /> Date
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`w-full px-2 py-1 rounded text-xs transition text-left flex items-center gap-1 ${sortBy === 'name' ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300' : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-700/50'}`}
            >
              <SortAsc className="w-3 h-3" /> Name
            </button>
            <button
              onClick={() => setSortBy('score')}
              className={`w-full px-2 py-1 rounded text-xs transition text-left flex items-center gap-1 ${sortBy === 'score' ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300' : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-700/50'}`}
            >
              <BarChart3 className="w-3 h-3" /> Score
            </button>
          </div>

          {/* Statistics */}
          <div className="space-y-1 pt-3 border-t border-gray-700/50">
            <p className="text-xs text-gray-400 font-semibold px-2">Stats</p>
            <div className="px-2 py-2 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded border border-purple-500/20 text-xs">
              <p className="text-gray-300">Avg Score: <span className="font-bold text-purple-300">{generateStats().avgScore}%</span></p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-0 flex flex-col">
        {/* Header */}
        <header className="border-b border-purple-500/20 bg-purple-900/10 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <h1 className="hidden md:block text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Printer Management</h1>
              </div>
            </div>
          </div>
        </header>
      
      {/* Admin Loading State */}
      {adminLoading && (
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
        </div>
      )}

      {/* Access Denied State */}
      {!adminLoading && !isAdmin && (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-gray-400 mb-6">You do not have permission to access this page.</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold transition"
            >
              Go Home
            </button>
          </div>
        </div>
      )}

      {/* Admin Content */}
      {!adminLoading && isAdmin && (
        <>
        {/* Search & Filter Bar */}
        <div className="px-3 md:px-4 py-2 space-y-2 border-b border-purple-500/20 bg-black/50">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-purple-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, email..."
              className="w-full pl-8 pr-2 py-1.5 bg-white/5 border border-purple-500/20 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-1 rounded text-xs transition ${statusFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2 py-1 rounded text-xs transition ${statusFilter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-2 py-1 rounded text-xs transition ${statusFilter === 'approved' ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-2 py-1 rounded text-xs transition ${statusFilter === 'rejected' ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
          </div>
        )}

        {/* Printers List */}
        {!loading && (
          <div className="px-2 md:px-4 py-3 flex-1 overflow-y-auto">
            {printers.length === 0 ? (
              <div className="text-center py-8">
                <Filter className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-gray-400">No printers found</h3>
                <p className="text-xs text-gray-500">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
                {sortedPrinters.map((printer: any) => (
                  <motion.div
                    key={printer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedPrinter(printer)}
                    className="bg-white/5 hover:bg-white/10 border border-purple-500/20 hover:border-purple-500/40 rounded px-2.5 py-2 transition group text-xs relative cursor-pointer active:scale-95"
                  >
                    {/* Checkbox for Bulk Actions */}
                    <input
                      type="checkbox"
                      checked={selectedPrinters.has(printer.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        const newSelected = new Set(selectedPrinters);
                        if (newSelected.has(printer.id)) {
                          newSelected.delete(printer.id);
                        } else {
                          newSelected.add(printer.id);
                        }
                        setSelectedPrinters(newSelected);
                      }}
                      className="absolute top-2 left-2 w-4 h-4 cursor-pointer"
                      title="Select for bulk actions"
                    />

                    {/* Duplicate Badge */}
                    {duplicatePrinters[printer.id] && (
                      <div className="absolute top-2 right-2 bg-orange-500 rounded-full p-1" title="Potential duplicate">
                        <AlertTriangle className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {/* Company Name with padding for checkbox */}
                    <h3 className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition mb-1 pl-5">{printer.company_name}</h3>
                    
                    {/* Location + Status */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-xs text-gray-500 truncate flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        {printer.city}
                      </span>
                      <span className={`shrink-0 px-1 py-0.5 rounded text-xs font-bold whitespace-nowrap ${
                        printer.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        printer.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {printer.status === 'pending' ? '⏳' : printer.status === 'approved' ? '✓' : '✕'}
                      </span>
                    </div>

                    {/* Email */}
                    {printer.email && (
                      <div className="text-xs text-gray-500 truncate flex items-center gap-0.5 mb-1.5">
                        <Mail className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{printer.email}</span>
                      </div>
                    )}

                    {/* Portfolio Thumbs */}
                    {printer.printer_portfolio && printer.printer_portfolio.length > 0 && (
                      <div className="flex gap-1 mb-1.5">
                        {printer.printer_portfolio.slice(0, 2).map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="w-6 h-6 rounded bg-white/10 border border-white/10 shrink-0 overflow-hidden"
                          >
                            {item.image_url ? (
                              <img src={item.image_url} alt="portfolio" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs">📄</div>
                            )}
                          </div>
                        ))}
                        {printer.printer_portfolio.length > 2 && (
                          <div className="w-6 h-6 rounded bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0">
                            +{printer.printer_portfolio.length - 2}
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Score + Actions */}
                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-white/5">
                      {printerScores[printer.id] !== undefined && (
                        <span className={`text-xs font-bold px-1 py-0.5 rounded whitespace-nowrap ${
                          printerScores[printer.id] >= 75 ? 'bg-green-500/20 text-green-300' :
                          printerScores[printer.id] >= 50 ? 'bg-blue-500/20 text-blue-300' :
                          'bg-orange-500/20 text-orange-300'
                        }`}>
                          🤖 {Math.round(printerScores[printer.id])}%
                        </span>
                      )}
                      
                      {/* Notes Indicator */}
                      {printerNotes[printer.id] && (
                        <div title={printerNotes[printer.id]} className="text-xs bg-yellow-500/20 text-yellow-300 px-1 py-0.5 rounded">
                          📝
                        </div>
                      )}
                      
                      {/* Mini Actions */}
                      <div className="flex gap-0.5">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedPrinter(printer);
                          }}
                          className="p-1 bg-purple-600/60 hover:bg-purple-600 rounded transition shrink-0"
                          title="View Details"
                        >
                          <Eye className="w-2.5 h-2.5" />
                        </button>

                        {printer.status === 'pending' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                updatePrinterStatus(printer.id, 'approved');
                              }}
                              disabled={processing}
                              className="p-1 bg-green-600/60 hover:bg-green-600 rounded transition disabled:opacity-50 shrink-0"
                              title="Approve"
                            >
                              <CheckCircle className="w-2.5 h-2.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                updatePrinterStatus(printer.id, 'rejected');
                              }}
                              disabled={processing}
                              className="p-1 bg-red-600/60 hover:bg-red-600 rounded transition disabled:opacity-50 shrink-0"
                              title="Reject"
                            >
                              <XCircle className="w-2.5 h-2.5" />
                            </button>
                          </>
                        )}

                        {printer.website && (
                          <a
                            href={printer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 bg-white/10 hover:bg-white/20 rounded transition flex-shrink-0"
                            title="Website"
                          >
                            <Globe className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
        </div>
        )}
        </>
      )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPrinter && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedPrinter(null);
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-4 md:inset-10 bg-zinc-950 border border-purple-500/30 rounded-3xl z-50 overflow-y-auto p-8"
            >
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-white mb-2">{selectedPrinter.company_name}</h2>
                    <p className="text-gray-400">Application Review</p>
                    {/* Debug Info */}
                    <p className="text-xs text-gray-500 mt-2">
                      Status: {selectedPrinter.status} | Has portfolio_urls: {selectedPrinter.portfolio_urls?.length > 0 ? 'Yes' : 'No'} | Has printer_portfolio: {selectedPrinter.printer_portfolio?.length > 0 ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedPrinter(null);
                    }}
                    type="button"
                    className="p-2 hover:bg-white/10 rounded-lg transition cursor-pointer active:scale-95"
                    title="Close modal"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* Full Details */}
                <div className="space-y-8">
                  {/* Contact Info */}
                  <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="text-sm text-gray-400">Email</p>
                          <p className="text-white font-medium">{selectedPrinter.email}</p>
                        </div>
                      </div>
                      {selectedPrinter.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-purple-400" />
                          <div>
                            <p className="text-sm text-gray-400">Phone</p>
                            <p className="text-white font-medium">{selectedPrinter.phone}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="text-sm text-gray-400">Location</p>
                          <p className="text-white font-medium">{selectedPrinter.city}, {selectedPrinter.country}</p>
                        </div>
                      </div>
                      {selectedPrinter.website && (
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-purple-400" />
                          <div>
                            <p className="text-sm text-gray-400">Website</p>
                            <a href={selectedPrinter.website} target="_blank" rel="noopener noreferrer" className="text-purple-400 font-medium hover:underline">
                              Visit Site
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* About */}
                  <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">About Company</h3>
                    <p className="text-gray-300 leading-relaxed">{selectedPrinter.about}</p>
                  </div>

                  {/* Services */}
                  {selectedPrinter.printer_services?.length > 0 && (
                    <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Services Offered</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedPrinter.printer_services.map((service: any) => (
                          <div key={service.id} className="bg-white/5 border border-purple-500/10 rounded-xl p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-white">{service.service_name}</h4>
                              <span className="text-purple-400 font-bold text-sm">
                                ${service.starting_price}+
                              </span>
                            </div>
                            <span className="text-xs text-gray-400 px-2 py-1 bg-white/5 rounded">
                              {service.category}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Portfolio */}
                  {(selectedPrinter.printer_portfolio?.length > 0 || selectedPrinter.portfolio_urls?.length > 0) && (
                    <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4">
                        Portfolio ({(selectedPrinter.printer_portfolio?.length || 0) + (selectedPrinter.portfolio_urls?.length || 0)} images)
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Portfolio from printer_portfolio table */}
                        {selectedPrinter.printer_portfolio?.map((item: any) => (
                          <img
                            key={item.id}
                            src={item.image_url}
                            alt="Portfolio"
                            className="aspect-square rounded-xl object-cover hover:scale-105 transition-transform"
                          />
                        ))}
                        
                        {/* Portfolio from portfolio_urls array */}
                        {selectedPrinter.portfolio_urls?.map((url: string, idx: number) => (
                          <img
                            key={`url-${idx}`}
                            src={url}
                            alt={`Portfolio ${idx + 1}`}
                            className="aspect-square rounded-xl object-cover hover:scale-105 transition-transform"
                            onError={(e) => {
                              console.error('Failed to load image:', url);
                              (e.target as HTMLImageElement).src = '/placeholder-image.png';
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {!selectedPrinter.printer_portfolio?.length && !selectedPrinter.portfolio_urls?.length && (
                    <div className="bg-white/5 border border-yellow-500/20 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-yellow-300 mb-2">📸 No Portfolio</h3>
                      <p className="text-gray-400">This printer has not submitted any portfolio images yet.</p>
                    </div>
                  )}

                  {/* Admin Notes */}
                  <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      📝 Admin Notes
                    </h3>
                    <textarea
                      value={printerNotes[selectedPrinter.id] || ''}
                      onChange={(e) => updatePrinterNote(selectedPrinter.id, e.target.value)}
                      placeholder="Add internal notes about this printer..."
                      className="w-full bg-white/5 border border-purple-500/30 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-24"
                      title="Admin notes"
                    />
                    <p className="text-xs text-gray-400 mt-2">Only visible to admins</p>
                  </div>

                  {/* Duplicate Alert */}
                  {duplicatePrinters[selectedPrinter.id] && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-orange-300 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Potential Duplicates Detected
                      </h3>
                      <p className="text-sm text-gray-300 mb-3">This printer may be a duplicate of:</p>
                      <div className="space-y-2">
                        {duplicatePrinters[selectedPrinter.id].map(dupId => {
                          const dupPrinter = printers.find(p => p.id === dupId);
                          return (
                            <button
                              key={dupId}
                              onClick={() => setSelectedPrinter(dupPrinter)}
                              className="w-full text-left px-4 py-2 bg-white/5 hover:bg-orange-500/20 rounded-lg text-sm text-orange-300 hover:text-orange-200 transition"
                            >
                              {dupPrinter?.company_name} ({dupPrinter?.city})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selectedPrinter.status === 'pending' && (
                    <div className="flex gap-4">
                      <button
                        onClick={() => updatePrinterStatus(selectedPrinter.id, 'approved')}
                        disabled={processing}
                        className="flex-1 bg-green-600 hover:bg-green-700 py-4 rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-6 h-6" />
                            Approve Printer
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => updatePrinterStatus(selectedPrinter.id, 'rejected')}
                        disabled={processing}
                        className="flex-1 bg-red-600 hover:bg-red-700 py-4 rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                      >
                        <XCircle className="w-6 h-6" />
                        Reject Application
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}