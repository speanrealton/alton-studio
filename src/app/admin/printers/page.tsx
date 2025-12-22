'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Clock, Eye, Mail, Phone, Globe, MapPin, Star, TrendingUp, Users, Building, Loader2, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const [printers, setPrinters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrinter, setSelectedPrinter] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPrinters();
    fetchStats();

    // Real-time subscription
    const subscription = supabase
      .channel('admin-printers')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'printers' 
      }, () => {
        fetchPrinters();
        fetchStats();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [statusFilter, searchQuery]);

  const fetchPrinters = async () => {
    setLoading(true);
    let query = supabase
      .from('printers')
      .select(`
        *,
        printer_services(id, service_name, category, starting_price),
        printer_portfolio(id, image_url)
      `)
      .eq('status', statusFilter)
      .order('created_at', { ascending: false });

    if (searchQuery) {
      query = query.or(`company_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;
    
    if (!error && data) {
      setPrinters(data);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    const { data } = await supabase
      .from('printers')
      .select('status');

    if (data) {
      setStats({
        pending: data.filter(p => p.status === 'pending').length,
        approved: data.filter(p => p.status === 'approved').length,
        rejected: data.filter(p => p.status === 'rejected').length,
        total: data.length
      });
    }
  };

  const updatePrinterStatus = async (printerId: string, newStatus: string): Promise<void> => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('printers')
        .update({ status: newStatus })
        .eq('id', printerId);

      if (!error) {
        setSelectedPrinter(null);
        await fetchPrinters();
        await fetchStats();
        alert(`Printer ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully!`);
      } else {
        alert('Error updating status: ' + error.message);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      
      {/* Header */}
      <div className="border-b border-purple-500/10 bg-black/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="px-3 py-1.5 bg-purple-600/20 text-purple-400 rounded-full font-medium">
                Admin Panel
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 border border-yellow-500/30 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <Clock className="w-8 h-8 text-yellow-400" />
              <span className="text-3xl font-black text-yellow-400">{stats.pending}</span>
            </div>
            <p className="text-gray-300 font-medium">Pending Review</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-500/30 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <span className="text-3xl font-black text-green-400">{stats.approved}</span>
            </div>
            <p className="text-gray-300 font-medium">Approved</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-red-900/20 to-red-800/20 border border-red-500/30 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <XCircle className="w-8 h-8 text-red-400" />
              <span className="text-3xl font-black text-red-400">{stats.rejected}</span>
            </div>
            <p className="text-gray-300 font-medium">Rejected</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <Building className="w-8 h-8 text-purple-400" />
              <span className="text-3xl font-black text-purple-400">{stats.total}</span>
            </div>
            <p className="text-gray-300 font-medium">Total Printers</p>
          </motion.div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by company, email, or city..."
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-6 py-3 rounded-xl font-medium transition ${
                  statusFilter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-6 py-3 rounded-xl font-medium transition ${
                  statusFilter === 'approved'
                    ? 'bg-green-600 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-6 py-3 rounded-xl font-medium transition ${
                  statusFilter === 'rejected'
                    ? 'bg-red-600 text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                }`}
              >
                Rejected
              </button>
            </div>
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
          <div className="space-y-4">
            {printers.map(printer => (
              <motion.div
                key={printer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Company Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{printer.company_name}</h3>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{printer.city}, {printer.country}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span>{printer.email}</span>
                          </div>
                          {printer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              <span>{printer.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                        printer.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        printer.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {printer.status.charAt(0).toUpperCase() + printer.status.slice(1)}
                      </span>
                    </div>

                    {/* About */}
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{printer.about}</p>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-full">
                        {printer.years_in_business} years in business
                      </span>
                      {printer.eco_certified && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                          Eco-Certified
                        </span>
                      )}
                      {printer.iso_certified && (
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">
                          ISO Certified
                        </span>
                      )}
                      {printer.printer_services && (
                        <span className="px-3 py-1 bg-pink-500/20 text-pink-400 text-xs font-semibold rounded-full">
                          {printer.printer_services.length} services
                        </span>
                      )}
                    </div>

                    {/* Portfolio Preview */}
                    {printer.printer_portfolio?.length > 0 && (
                      <div className="flex gap-2 mb-4">
                        {printer.printer_portfolio.slice(0, 4).map((item, index) => (
                          <img 
                            key={item.id}
                            src={item.image_url}
                            alt={`Portfolio ${index + 1}`}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        ))}
                        {printer.printer_portfolio.length > 4 && (
                          <div className="w-20 h-20 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold text-gray-400">
                            +{printer.printer_portfolio.length - 4}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Applied Date */}
                    <p className="text-xs text-gray-500">
                      Applied: {new Date(printer.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 md:w-48">
                    <button
                      onClick={() => setSelectedPrinter(printer)}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold transition flex items-center justify-center gap-2"
                    >
                      <Eye className="w-5 h-5" />
                      View Details
                    </button>

                    {printer.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updatePrinterStatus(printer.id, 'approved')}
                          disabled={processing}
                          className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Approve
                        </button>
                        <button
                          onClick={() => updatePrinterStatus(printer.id, 'rejected')}
                          disabled={processing}
                          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-5 h-5" />
                          Reject
                        </button>
                      </>
                    )}

                    {printer.website && (
                      <a
                        href={printer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition flex items-center justify-center gap-2 text-sm"
                      >
                        <Globe className="w-4 h-4" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {printers.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Filter className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No printers found</h3>
                <p className="text-gray-400">Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
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
              onClick={() => setSelectedPrinter(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
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
                  </div>
                  <button
                    onClick={() => setSelectedPrinter(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
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
                        {selectedPrinter.printer_services.map(service => (
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
                  {selectedPrinter.printer_portfolio?.length > 0 && (
                    <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Portfolio ({selectedPrinter.printer_portfolio.length} images)</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedPrinter.printer_portfolio.map(item => (
                          <img
                            key={item.id}
                            src={item.image_url}
                            alt="Portfolio"
                            className="aspect-square rounded-xl object-cover hover:scale-105 transition-transform"
                          />
                        ))}
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