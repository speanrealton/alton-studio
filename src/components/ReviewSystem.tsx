'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, ThumbsUp, User, Check, X, Upload, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReviewSystem({ printerId }) {
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ average: 0, total: 0, distribution: {} });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetchReviews();
    fetchStats();

    // Real-time subscription for new reviews
    const channel = supabase
      .channel(`reviews-${printerId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'printer_reviews',
        filter: `printer_id=eq.${printerId}`
      }, () => {
        fetchReviews();
        fetchStats();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [printerId]);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('printer_reviews')
      .select('*')
      .eq('printer_id', printerId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setReviews(data);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    const { data } = await supabase
      .from('printer_reviews')
      .select('rating')
      .eq('printer_id', printerId);

    if (data) {
      const total = data.length;
      const average = total > 0 ? data.reduce((sum, r) => sum + r.rating, 0) / total : 0;
      
      const distribution = {
        5: data.filter(r => r.rating === 5).length,
        4: data.filter(r => r.rating === 4).length,
        3: data.filter(r => r.rating === 3).length,
        2: data.filter(r => r.rating === 2).length,
        1: data.filter(r => r.rating === 1).length,
      };

      setStats({ average, total, distribution });
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `reviews/${fileName}`;

      const { error } = await supabase.storage
        .from('printer-assets')
        .upload(filePath, file);

      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('printer-assets')
          .getPublicUrl(filePath);
        return publicUrl;
      }
      return null;
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    setImages([...images, ...uploadedUrls.filter(Boolean)]);
  };

  const submitReview = async () => {
    if (!user) {
      alert('Please sign in to leave a review');
      return;
    }

    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from('printer_reviews')
      .insert({
        printer_id: printerId,
        user_id: user.id,
        rating,
        comment: comment.trim(),
        images: images.length > 0 ? images : null,
        verified_purchase: false // Set to true if user has completed order
      });

    if (!error) {
      setShowReviewForm(false);
      setRating(0);
      setComment('');
      setImages([]);
      alert('Review submitted successfully!');
    } else {
      alert('Error submitting review: ' + error.message);
    }
    setSubmitting(false);
  };

  const markHelpful = async (reviewId) => {
    if (!user) {
      alert('Please sign in to mark reviews as helpful');
      return;
    }

    const { error } = await supabase
      .from('printer_reviews')
      .update({ helpful_count: supabase.sql`helpful_count + 1` })
      .eq('id', reviewId);

    if (!error) {
      fetchReviews();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              {stats.average.toFixed(1)}
            </div>
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= Math.round(stats.average)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
            <p className="text-gray-400">{stats.total} reviews</p>
          </div>

          {/* Rating Distribution */}
          <div className="md:col-span-2 space-y-2">
            {[5, 4, 3, 2, 1].map(star => {
              const count = stats.distribution[star] || 0;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-12">{star} stars</span>
                  <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Write Review Button */}
        <button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-4 rounded-xl font-bold transition"
        >
          Write a Review
        </button>
      </div>

      {/* Review Form */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-8 overflow-hidden"
          >
            <h3 className="text-2xl font-bold text-white mb-6">Share Your Experience</h3>

            {/* Star Rating */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Your Rating *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-12 h-12 ${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Your Review
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                placeholder="Tell others about your experience with this printer..."
                className="w-full px-4 py-3 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* Images */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Add Photos (Optional)
              </label>
              <div className="grid grid-cols-5 gap-4">
                {images.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-white/5">
                    <img src={url} alt={`Review ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 p-1 bg-red-500 rounded-full hover:bg-red-600 transition"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label className="aspect-square border-2 border-dashed border-purple-500/30 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-white/5 transition">
                    <Upload className="w-6 h-6 text-purple-400 mb-1" />
                    <span className="text-xs text-gray-400">Add Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowReviewForm(false)}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={submitting || rating === 0}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-white">Customer Reviews</h3>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-12 text-center">
            <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 font-medium mb-2">No reviews yet</p>
            <p className="text-sm text-gray-500">Be the first to review this printer!</p>
          </div>
        ) : (
          reviews.map(review => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                {/* User Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-semibold">Anonymous User</h4>
                        {review.verified_purchase && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-gray-300 mb-4 leading-relaxed">{review.comment}</p>
                  )}

                  {/* Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto">
                      {review.images.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`Review image ${index + 1}`}
                          className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                        />
                      ))}
                    </div>
                  )}

                  {/* Helpful Button */}
                  <button
                    onClick={() => markHelpful(review.id)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-purple-400 transition"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>Helpful ({review.helpful_count || 0})</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}