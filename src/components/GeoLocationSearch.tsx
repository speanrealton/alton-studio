'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Navigation, Loader2, Search, Sliders, Star, Zap, TrendingUp, Filter, X, Clock, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function GeoLocationSearch() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [printers, setPrinters] = useState([]);
  const [rankedPrinters, setRankedPrinters] = useState([]);
  const [radius, setRadius] = useState(50); // km
  const [searching, setSearching] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [sortBy, setSortBy] = useState('distance'); // distance, rating, price
  const [showFilters, setShowFilters] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const getCurrentLocation = () => {
    setLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            fromDevice: true
          });
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enable location services.');
          setLoading(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location) {
      searchNearbyPrinters();
    }
  }, [location, radius, selectedCategories, minRating, maxPrice]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateRelevanceScore = (printer) => {
    let score = 100;

    // Distance scoring (40% weight) - closer is better
    const distanceScore = Math.max(0, 100 - (printer.distance / radius) * 100);
    score += distanceScore * 0.4;

    // Rating scoring (30% weight) - higher is better
    const ratingScore = (printer.rating || 0) * 10;
    score += ratingScore * 0.3;

    // Category match scoring (20% weight)
    if (selectedCategories.length > 0 && printer.printer_services) {
      const matchingServices = printer.printer_services.filter(s => 
        selectedCategories.includes(s.category)
      ).length;
      const categoryScore = (matchingServices / selectedCategories.length) * 100;
      score += categoryScore * 0.2;
    } else {
      score += 100 * 0.2;
    }

    // Online status bonus (10% weight)
    if (printer.online_status) {
      score += 100 * 0.1;
    }

    // Verified status bonus
    if (printer.verified) {
      score += 15;
    }

    return Math.min(100, score);
  };

  const searchNearbyPrinters = async () => {
    if (!location) return;

    setSearching(true);

    try {
      // Fetch all approved printers with services and ratings
      const { data, error } = await supabase
        .from('printers')
        .select(`
          *,
          printer_services(id, service_name, category, starting_price, currency),
          printer_ratings(rating)
        `)
        .eq('status', 'approved');

      if (!error && data) {
        // Get city/country from location for filtering
        const locationResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`
        );
        const locationData = await locationResponse.json();
        
        const searchCity = (locationData.address?.city || locationData.address?.town || '').toLowerCase();
        const searchCountry = (locationData.address?.country || '').toLowerCase();

        console.log('Search criteria:', { searchCity, searchCountry });

        let printersWithDistance = data
          .map(printer => {
            // Calculate average rating
            const avgRating = printer.printer_ratings && printer.printer_ratings.length > 0
              ? printer.printer_ratings.reduce((sum, r) => sum + r.rating, 0) / printer.printer_ratings.length
              : 0;

            // Get min price
            const minPrice = printer.printer_services && printer.printer_services.length > 0
              ? Math.min(...printer.printer_services.map(s => s.starting_price || 999999))
              : 0;

            // Calculate distance if printer has coordinates
            let distance = Infinity;
            if (printer.latitude && printer.longitude) {
              distance = calculateDistance(
                location.latitude,
                location.longitude,
                printer.latitude,
                printer.longitude
              );
            }

            return {
              ...printer,
              distance: distance,
              rating: avgRating,
              minPrice: minPrice,
              printerCity: (printer.city || '').toLowerCase(),
              printerCountry: (printer.country || '').toLowerCase()
            };
          })
          .filter(printer => {
            // Filter by country first
            if (!searchCountry || !printer.printerCountry.includes(searchCountry)) {
              return false;
            }
            
            // Filter by city if available
            if (searchCity && !printer.printerCity.includes(searchCity)) {
              return false;
            }
            
            // Filter by rating
            if (printer.rating < minRating) return false;
            
            // Filter by price
            if (printer.minPrice > maxPrice) return false;
            
            // Filter by categories if selected
            if (selectedCategories.length > 0) {
              const hasCategory = printer.printer_services?.some(s => 
                selectedCategories.includes(s.category)
              );
              return hasCategory;
            }
            
            return true;
          });

        // Calculate relevance scores
        const printersWithScore = printersWithDistance.map(printer => ({
          ...printer,
          relevanceScore: calculateRelevanceScore(printer)
        }));

        // Sort by selected criteria
        let sorted = [...printersWithScore];
        switch(sortBy) {
          case 'rating':
            sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
          case 'price':
            sorted.sort((a, b) => a.minPrice - b.minPrice);
            break;
          case 'relevance':
            sorted.sort((a, b) => b.relevanceScore - a.relevanceScore);
            break;
          default: // distance
            sorted.sort((a, b) => {
              if (a.distance === Infinity && b.distance === Infinity) return 0;
              if (a.distance === Infinity) return 1;
              if (b.distance === Infinity) return -1;
              return a.distance - b.distance;
            });
        }

        setPrinters(printersWithDistance);
        setRankedPrinters(sorted);
      }
    } catch (err) {
      console.error('Search error:', err);
    }

    setSearching(false);
  };

  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setLocation({
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          address: data[0].display_name
        });
        setAddressInput('');
        setSuggestions([]);
        setShowSuggestions(false);
      } else {
        alert('Location not found');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Unable to find location');
    }
  };

  const handleAddressInput = async (e) => {
    const value = e.target.value;
    setAddressInput(value);

    if (value.length > 3) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`
        );
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const displayPrinters = sortBy === 'relevance' ? rankedPrinters : rankedPrinters;

  return (
    <div className="w-full bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section - Compact */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Find Printers Near You
              </h2>
              <p className="text-xs text-gray-400">Search by location</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Left Sidebar - Compact */}
          <div className="md:col-span-1 space-y-3">
            {/* Location Search Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              {/* Current Location Button */}
              <button
                onClick={getCurrentLocation}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-2 rounded-lg font-bold transition disabled:opacity-50 flex items-center justify-center gap-2 text-xs mb-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Getting...
                  </>
                ) : (
                  <>
                    <Navigation className="w-3 h-3" />
                    My Location
                  </>
                )}
              </button>

              {/* Address Input */}
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search address..."
                  value={addressInput}
                  onChange={handleAddressInput}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && addressInput) {
                      geocodeAddress(addressInput);
                    }
                  }}
                  className="w-full pl-8 pr-3 py-2 bg-white/10 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />

                {/* Autocomplete Suggestions */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-white/10 rounded-lg overflow-hidden z-50 shadow-xl max-h-40 overflow-y-auto"
                    >
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => geocodeAddress(suggestion.display_name)}
                          className="w-full px-3 py-2 text-left hover:bg-white/10 transition border-b border-white/5 last:border-b-0"
                        >
                          <p className="text-xs font-medium text-white">{suggestion.name}</p>
                          <p className="text-[10px] text-gray-500 line-clamp-1">{suggestion.display_name.split(',').slice(-2).join(',')}</p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Location Status */}
              {location && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 flex items-center gap-2 text-xs"
                >
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-[10px]">Location Set</p>
                    <p className="text-green-400 text-[10px] truncate">{location.address || `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`}</p>
                  </div>
                  <button
                    onClick={() => {
                      setLocation(null);
                      setRankedPrinters([]);
                      setAddressInput('');
                    }}
                    className="text-green-400 hover:text-green-300 transition flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </div>

            {/* Filters Card - Compact */}
            {location && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 space-y-2"
              >
                <h3 className="text-xs font-bold text-white">Filters</h3>

                {/* Sort */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 block mb-1">Sort</label>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { value: 'distance', label: 'Distance', icon: MapPin },
                      { value: 'rating', label: 'Rating', icon: Star },
                      { value: 'price', label: 'Price', icon: DollarSign },
                      { value: 'relevance', label: 'Relevance', icon: Zap }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition flex items-center justify-center gap-0.5 ${
                          sortBy === option.value
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <option.icon className="w-3 h-3" />
                        <span className="hidden sm:inline">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-semibold text-gray-400">Min Rating</label>
                    <span className="text-xs font-bold text-yellow-400">{minRating.toFixed(1)}★</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={minRating}
                    onChange={(e) => setMinRating(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded appearance-none cursor-pointer accent-yellow-500"
                  />
                </div>

                {/* Price */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-semibold text-gray-400">Max Price</label>
                    <span className="text-xs font-bold text-green-400">${maxPrice}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="50"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded appearance-none cursor-pointer accent-green-500"
                  />
                </div>

                {/* Categories */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 block mb-1">Services</label>
                  <div className="grid grid-cols-4 gap-1">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          if (selectedCategories.includes(cat.id)) {
                            setSelectedCategories(selectedCategories.filter(c => c !== cat.id));
                          } else {
                            setSelectedCategories([...selectedCategories, cat.id]);
                          }
                        }}
                        className={`px-1.5 py-1 rounded text-sm transition flex items-center justify-center ${
                          selectedCategories.includes(cat.id)
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                        }`}
                        title={cat.label}
                      >
                        <span>{cat.icon}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Side - Results Compact */}
          <div className="md:col-span-3">
            {!location ? (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6 text-center"
              >
                <MapPin className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-white font-semibold mb-2">Start Your Search</p>
                <p className="text-xs text-gray-400">Use your location or search for an address</p>
              </motion.div>
            ) : searching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400 mr-2" />
                <p className="text-xs text-gray-400">Finding printers...</p>
              </div>
            ) : rankedPrinters.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6 text-center"
              >
                <MapPin className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <p className="text-sm text-white font-semibold mb-1">No Printers Found</p>
                <p className="text-xs text-gray-400 mb-3">Try adjusting your filters</p>
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    setMinRating(0);
                    setMaxPrice(1000);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-xs font-bold transition"
                >
                  Reset
                </button>
              </motion.div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {/* Results Header */}
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Found {rankedPrinters.length} printers</span>
                  <span className="text-purple-400">{printers.length} total</span>
                </div>

                {/* Results Grid */}
                {rankedPrinters.map((printer, idx) => (
                  <motion.div
                    key={printer.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white/5 border border-white/10 hover:border-purple-500/50 rounded-lg overflow-hidden transition p-3"
                  >
                    <div className="flex items-start gap-3">
                      {/* Logo */}
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center overflow-hidden">
                          {printer.logo_url ? (
                            <img src={printer.logo_url} alt={printer.company_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-bold text-sm">
                              {printer.company_name.charAt(0)}
                            </span>
                          )}
                        </div>
                        {sortBy === 'relevance' && (
                          <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center font-bold text-white text-[10px]">
                            {idx + 1}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-white truncate">{printer.company_name}</h4>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-purple-400" />
                                {printer.city}, {printer.country}
                              </span>
                              {printer.online_status && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-bold">
                                  <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                                  Online
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="flex items-center gap-0.5 justify-end">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="font-bold text-white text-sm">{(printer.rating || 0).toFixed(1)}</span>
                            </div>
                            {sortBy === 'relevance' && (
                              <div className="text-[10px] text-purple-400 font-bold">
                                {Math.round(printer.relevanceScore)}% match
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Services */}
                        {printer.printer_services && printer.printer_services.length > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="text-[10px] text-gray-400 line-clamp-1">
                              {printer.printer_services.slice(0, 2).map((s, i) => s.service_name).join(', ')}
                              {printer.printer_services.length > 2 && ` +${printer.printer_services.length - 2}`}
                            </div>
                            <span className="text-xs text-green-400 font-bold">from ${printer.minPrice}</span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => window.location.href = `/print?printer=${printer.id}`}
                            className="flex-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-xs transition"
                          >
                            View
                          </button>
                          <button
                            onClick={() => {
                              window.open(
                                `https://www.google.com/maps/search/${printer.company_name}+${printer.city}+${printer.country}`,
                                '_blank'
                              );
                            }}
                            className="flex-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg font-bold text-xs transition flex items-center justify-center gap-1"
                          >
                            <Navigation className="w-3 h-3" />
                            Map
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}