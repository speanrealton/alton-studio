'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Eye, MessageCircle, Star, DollarSign, Users, Calendar, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AnalyticsDashboard({ printerId }) {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, all
  const [analytics, setAnalytics] = useState({
    views: { total: 0, trend: 0 },
    quotes: { total: 0, trend: 0 },
    conversions: { total: 0, rate: 0 },
    rating: { average: 0, count: 0 },
    revenue: { total: 0, trend: 0 },
    engagement: { messages: 0, favorites: 0 }
  });
  const [viewsChart, setViewsChart] = useState([]);
  const [quotesChart, setQuotesChart] = useState([]);

  useEffect(() => {
    fetchAnalytics();

    // Real-time updates
    const channel = supabase
      .channel(`analytics-${printerId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'printer_views'
      }, () => fetchAnalytics())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'quote_requests'
      }, () => fetchAnalytics())
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [printerId, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);

    const now = new Date();
    const startDate = getStartDate(timeRange);

    // Fetch views
    const { data: views } = await supabase
      .from('printer_views')
      .select('*')
      .eq('printer_id', printerId)
      .gte('created_at', startDate.toISOString());

    // Fetch quote requests
    const { data: quotes } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('printer_id', printerId)
      .gte('created_at', startDate.toISOString());

    // Fetch reviews
    const { data: reviews } = await supabase
      .from('printer_reviews')
      .select('rating')
      .eq('printer_id', printerId);

    // Fetch conversations
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('printer_id', printerId);

    // Fetch favorites
    const { data: favorites } = await supabase
      .from('printer_favorites')
      .select('id')
      .eq('printer_id', printerId);

    // Calculate analytics
    const totalViews = views?.length || 0;
    const totalQuotes = quotes?.length || 0;
    const acceptedQuotes = quotes?.filter(q => q.status === 'accepted').length || 0;
    const conversionRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;

    const avgRating = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Calculate trends (compare with previous period)
    const previousStartDate = getPreviousStartDate(timeRange);
    const { data: previousViews } = await supabase
      .from('printer_views')
      .select('id')
      .eq('printer_id', printerId)
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    const { data: previousQuotes } = await supabase
      .from('quote_requests')
      .select('id')
      .eq('printer_id', printerId)
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    const viewsTrend = calculateTrend(totalViews, previousViews?.length || 0);
    const quotesTrend = calculateTrend(totalQuotes, previousQuotes?.length || 0);

    setAnalytics({
      views: { total: totalViews, trend: viewsTrend },
      quotes: { total: totalQuotes, trend: quotesTrend },
      conversions: { total: acceptedQuotes, rate: conversionRate },
      rating: { average: avgRating, count: reviews?.length || 0 },
      revenue: { total: 0, trend: 0 }, // Would be calculated from completed orders
      engagement: {
        messages: conversations?.length || 0,
        favorites: favorites?.length || 0
      }
    });

    // Generate chart data
    generateChartData(views, quotes, startDate);

    setLoading(false);
  };

  const getStartDate = (range) => {
    const now = new Date();
    switch (range) {
      case '7d':
        return new Date(now.setDate(now.getDate() - 7));
      case '30d':
        return new Date(now.setDate(now.getDate() - 30));
      case '90d':
        return new Date(now.setDate(now.getDate() - 90));
      default:
        return new Date(0); // All time
    }
  };

  const getPreviousStartDate = (range) => {
    const now = new Date();
    switch (range) {
      case '7d':
        return new Date(now.setDate(now.getDate() - 14));
      case '30d':
        return new Date(now.setDate(now.getDate() - 60));
      case '90d':
        return new Date(now.setDate(now.getDate() - 180));
      default:
        return new Date(0);
    }
  };

  const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const generateChartData = (views, quotes, startDate) => {
    const days = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
    const viewsData = Array(days).fill(0);
    const quotesData = Array(days).fill(0);

    views?.forEach(view => {
      const dayIndex = Math.floor((new Date(view.created_at) - startDate) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < days) {
        viewsData[dayIndex]++;
      }
    });

    quotes?.forEach(quote => {
      const dayIndex = Math.floor((new Date(quote.created_at) - startDate) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < days) {
        quotesData[dayIndex]++;
      }
    });

    setViewsChart(viewsData);
    setQuotesChart(quotesData);
  };

  const StatCard = ({ icon: Icon, label, value, trend, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${color} border border-white/10 rounded-2xl p-6`}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8 text-white" />
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
            trend >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {trend >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="text-4xl font-black text-white mb-2">{value}</div>
      <div className="text-sm text-white/80 font-medium">{label}</div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Analytics Dashboard
        </h2>

        {/* Time Range Selector */}
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' },
            { value: 'all', label: 'All Time' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeRange === option.value
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Eye}
          label="Profile Views"
          value={analytics.views.total.toLocaleString()}
          trend={analytics.views.trend}
          color="from-blue-900/30 to-blue-800/30"
        />
        <StatCard
          icon={MessageCircle}
          label="Quote Requests"
          value={analytics.quotes.total.toLocaleString()}
          trend={analytics.quotes.trend}
          color="from-purple-900/30 to-purple-800/30"
        />
        <StatCard
          icon={TrendingUp}
          label="Conversion Rate"
          value={`${analytics.conversions.rate.toFixed(1)}%`}
          color="from-green-900/30 to-green-800/30"
        />
        <StatCard
          icon={Star}
          label="Average Rating"
          value={analytics.rating.average.toFixed(1)}
          color="from-yellow-900/30 to-yellow-800/30"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Chart */}
        <div className="bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-400" />
            Profile Views Over Time
          </h3>
          <div className="h-48 flex items-end gap-2">
            {viewsChart.map((count, index) => {
              const maxCount = Math.max(...viewsChart, 1);
              const height = (count / maxCount) * 100;
              return (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-purple-600 to-pink-600 rounded-t-lg relative group hover:opacity-80 transition"
                  style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0px' }}
                >
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    {count} views
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quotes Chart */}
        <div className="bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-pink-400" />
            Quote Requests Over Time
          </h3>
          <div className="h-48 flex items-end gap-2">
            {quotesChart.map((count, index) => {
              const maxCount = Math.max(...quotesChart, 1);
              const height = (count / maxCount) * 100;
              return (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-pink-600 to-rose-600 rounded-t-lg relative group hover:opacity-80 transition"
                  style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0px' }}
                >
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    {count} quotes
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Engagement Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-black text-purple-400 mb-2">
              {analytics.engagement.messages}
            </div>
            <p className="text-sm text-gray-400">Active Conversations</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-pink-400 mb-2">
              {analytics.engagement.favorites}
            </div>
            <p className="text-sm text-gray-400">Favorites</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-rose-400 mb-2">
              {analytics.rating.count}
            </div>
            <p className="text-sm text-gray-400">Total Reviews</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black text-green-400 mb-2">
              {analytics.conversions.total}
            </div>
            <p className="text-sm text-gray-400">Completed Orders</p>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Insights & Recommendations
        </h3>
        <ul className="space-y-3">
          {analytics.views.trend > 10 && (
            <li className="text-green-400 flex items-start gap-2">
              <ArrowUp className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Great! Your profile views are up {analytics.views.trend.toFixed(0)}% this period.</span>
            </li>
          )}
          {analytics.conversions.rate < 20 && analytics.quotes.total > 5 && (
            <li className="text-yellow-400 flex items-start gap-2">
              <TrendingUp className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Conversion rate could be improved. Try responding faster to quote requests.</span>
            </li>
          )}
          {analytics.rating.average < 4.0 && analytics.rating.count > 3 && (
            <li className="text-red-400 flex items-start gap-2">
              <Star className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Your rating needs attention. Focus on customer satisfaction and quality.</span>
            </li>
          )}
          {analytics.engagement.messages === 0 && (
            <li className="text-blue-400 flex items-start gap-2">
              <MessageCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Enable instant messaging to engage with potential customers faster.</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}