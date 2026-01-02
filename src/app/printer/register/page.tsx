'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Building, MapPin, Mail, Phone, Globe, Upload, Plus, X, CheckCircle, Loader2, FileText, Image as ImgIcon, FileImage } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const serviceCategories = [
  { id: 'tshirt', label: 'T-Shirt Printing' },
  { id: 'business-card', label: 'Business Cards' },
  { id: 'poster', label: 'Posters & Banners' },
  { id: 'canvas', label: 'Canvas Prints' },
  { id: 'packaging', label: 'Packaging' },
  { id: 'promotional', label: 'Promotional Items' },
  { id: 'large-format', label: 'Large Format' },
  { id: '3d-printing', label: '3D Printing' }
];

export default function PrinterRegistration() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    country: '',
    city: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    about: '',
    yearsInBusiness: '',
    logo: '',
    banner: '',
    services: [],
    portfolio: [] as string[],
    ecoCertified: false,
    isoCertified: false
  });

  const [services, setServices] = useState([
    { category: '', name: '', description: '', startingPrice: '', turnaroundDays: '' }
  ]);

  // Check if user is logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        alert('Please sign in to register as a printer');
        router.push('/auth');
      } else {
        setUser(user);
      }
    });
  }, [router]);

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleServiceChange = (index: number, field: string, value: any) => {
    const newServices = [...services];
    (newServices[index] as any)[field] = value;
    setServices(newServices);
  };

  const addService = () => {
    setServices([...services, { category: '', name: '', description: '', startingPrice: '', turnaroundDays: '' }]);
  };

  const removeService = (index: any) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: any, type: string) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${type}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('printer-assets')
      .upload(filePath, file);

    if (uploadError) {
      alert('Error uploading file: ' + uploadError.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('printer-assets')
      .getPublicUrl(filePath);

    if (type === 'logos') {
      setFormData(prev => ({ ...prev, logo: publicUrl }));
    } else if (type === 'banners') {
      setFormData(prev => ({ ...prev, banner: publicUrl }));
    } else if (type === 'portfolio') {
      setFormData(prev => ({ ...prev, portfolio: [...prev.portfolio, publicUrl] }));
    }
  };

  const removePortfolioImage = (index: any) => {
    setFormData(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create printer profile
      const { data: printer, error: printerError } = await supabase
        .from('printers')
        .insert({
          user_id: user.id,
          company_name: formData.companyName,
          slug: formData.companyName.toLowerCase().replace(/\s+/g, '-'),
          logo_url: formData.logo,
          banner_url: formData.banner,
          country: formData.country,
          city: formData.city,
          address: formData.address,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          about: formData.about,
          years_in_business: parseInt(formData.yearsInBusiness),
          eco_certified: formData.ecoCertified,
          iso_certified: formData.isoCertified,
          status: 'pending'
        })
        .select()
        .single();

      if (printerError) throw printerError;

      // Add services
      const serviceInserts = services
        .filter(s => s.category && s.name)
        .map(s => ({
          printer_id: printer.id,
          service_name: s.name,
          category: s.category,
          description: s.description,
          starting_price: parseFloat(s.startingPrice),
          turnaround_days: parseInt(s.turnaroundDays)
        }));

      if (serviceInserts.length > 0) {
        const { error: servicesError } = await supabase
          .from('printer_services')
          .insert(serviceInserts);
        
        if (servicesError) throw servicesError;
      }

      // Add portfolio images
      if (formData.portfolio.length > 0) {
        const portfolioInserts = formData.portfolio.map(url => ({
          printer_id: printer.id,
          image_url: url
        }));

        const { error: portfolioError } = await supabase
          .from('printer_portfolio')
          .insert(portfolioInserts);
        
        if (portfolioError) throw portfolioError;
      }

      setSubmitted(true);
    } catch (error: any) {
      alert('Error submitting registration: ' + (error?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-12 text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Application Submitted!
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Thank you for applying to join our print network. Our team will review your application and get back to you within 2-3 business days.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/print">
              <button className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-purple-500/30 rounded-xl font-bold transition">
                Browse Network
              </button>
            </Link>
            <Link href="/">
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold transition">
                Go Home
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white">
      
      {/* Header */}
      <div className="border-b border-white/5 bg-black/40 backdrop-blur-2xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo2.svg" alt="Logo" className="w-12 h-12 hover:scale-110 transition duration-300" />
            <span className="text-lg font-bold text-white">Join Alton Today</span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-400 font-medium">Step {step} of 3</span>
            <div className="w-40 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Left Side - Animated Particles */}
          <div className="hidden lg:flex flex-col items-center justify-center relative h-full min-h-96">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Single Rotating Particle */}
              <motion.div
                key={Math.floor(step / 1)}
                animate={{ 
                  y: [0, -20, 0]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-12"
              >
                <span 
                  className="text-10xl filter drop-shadow-lg drop-shadow-2xl inline-block"
                  style={{ 
                    fontSize: '160px'
                  }}
                >
                  {step === 1 ? '📄' : step === 2 ? '🖨️' : '🎨'}
                </span>
              </motion.div>
            </div>
          </div>

          {/* Form Container */}
          <div className="lg:col-span-3">
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Step 1: Company Info */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-400" />
                Company Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Acme Printing Co."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-sm transition duration-300"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      name="country"
                      required
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="United States"
                      className="w-full px-4 py-3 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="New York"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-sm transition duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-sm transition duration-300"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="contact@company.com"
                        className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-sm transition duration-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2">
                      Phone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 123-4567"
                        className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-sm transition duration-300"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://yourcompany.com"
                      className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-sm transition duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Years in Business *
                  </label>
                  <input
                    type="number"
                    name="yearsInBusiness"
                    required
                    min="0"
                    value={formData.yearsInBusiness}
                    onChange={handleInputChange}
                    placeholder="5"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-sm transition duration-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    About Your Company *
                  </label>
                  <textarea
                    name="about"
                    required
                    rows={3}
                    value={formData.about}
                    onChange={handleInputChange}
                    placeholder="Tell us about your company, capabilities, and what makes you unique..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-sm transition duration-300 resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="ecoCertified"
                      checked={formData.ecoCertified}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-white/10 bg-white/5 text-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                    <span className="text-sm text-gray-300">We are eco-certified (sustainable practices)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isoCertified"
                      checked={formData.isoCertified}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded border-white/10 bg-white/5 text-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    />
                    <span className="text-sm text-gray-300">We are ISO certified</span>
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-3 rounded-lg font-semibold text-sm transition duration-300 shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50"
              >
                Continue to Services
              </button>
            </motion.div>
          )}

          {/* Step 2: Services */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Services Offered
              </h2>

              <div className="space-y-4">
                {services.map((service, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-bold text-white">Service {index + 1}</h3>
                      {services.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeService(index)}
                          className="p-1 hover:bg-red-500/20 rounded transition text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-2">
                          Category *
                        </label>
                        <select
                          value={service.category}
                          onChange={(e) => handleServiceChange(index, 'category', e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-sm transition duration-300"
                        >
                          <option value="">Select category</option>
                          {serviceCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-2">
                          Service Name *
                        </label>
                        <input
                          type="text"
                          value={service.name}
                          onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                          required
                          placeholder="e.g., Premium T-Shirt Print"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-sm transition duration-300"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-2">
                          Starting Price (USD) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={service.startingPrice}
                          onChange={(e) => handleServiceChange(index, 'startingPrice', e.target.value)}
                          required
                          placeholder="9.99"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-sm transition duration-300"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-2">
                          Turnaround (days) *
                        </label>
                        <input
                          type="number"
                          value={service.turnaroundDays}
                          onChange={(e) => handleServiceChange(index, 'turnaroundDays', e.target.value)}
                          required
                          placeholder="3"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-sm transition duration-300"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          value={service.description}
                          onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                          placeholder="Describe this service..."
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 text-sm transition duration-300 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addService}
                  className="w-full py-2 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-lg font-medium transition flex items-center justify-center gap-2 text-gray-300 hover:text-white text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Service
                </button>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg font-semibold transition text-sm duration-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-3 rounded-lg font-semibold transition text-sm duration-300 shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50"
                >
                  Continue to Media
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Media */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Hero Section */}
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-2">
                  Welcome to the Community
                </h1>
                <p className="text-gray-300 text-sm md:text-base">
                  Complete your profile with branding and portfolio showcase
                </p>
              </div>

              {/* Form Container - Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Branding */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <ImgIcon className="w-6 h-6 text-purple-400" />
                      Branding
                    </h3>

                    {/* Logo Upload */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                        Company Logo
                      </label>
                      <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-white/40 hover:bg-white/5 transition-all duration-300">
                        {formData.logo ? (
                          <div className="relative">
                            <img src={formData.logo} alt="Logo" className="max-h-32 mx-auto rounded-lg" />
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                              className="absolute top-0 right-0 p-2 bg-red-500/80 hover:bg-red-600 rounded-full transition-colors duration-300"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <Upload className="w-10 h-10 text-purple-400/60 mx-auto mb-2" />
                            <p className="text-white/80 font-medium text-sm mb-1">Upload Logo</p>
                            <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'logos')}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Banner Upload */}
                    <div className="mt-6">
                      <label className="block text-xs font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                        Company Banner
                      </label>
                      <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-white/40 hover:bg-white/5 transition-all duration-300">
                        {formData.banner ? (
                          <div className="relative">
                            <img src={formData.banner} alt="Banner" className="max-h-40 mx-auto rounded-lg" />
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, banner: '' }))}
                              className="absolute top-0 right-0 p-2 bg-red-500/80 hover:bg-red-600 rounded-full transition-colors duration-300"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer">
                            <Upload className="w-10 h-10 text-purple-400/60 mx-auto mb-2" />
                            <p className="text-white/80 font-medium text-sm mb-1">Upload Banner</p>
                            <p className="text-xs text-gray-400">Recommended: 1920x400px</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, 'banners')}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Portfolio */}
                <div>
                  <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <FileImage className="w-6 h-6 text-pink-400" />
                      Portfolio
                    </h3>

                    <label className="block text-xs font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                      Portfolio Images (Add at least 3)
                    </label>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {formData.portfolio.map((url, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 group">
                          <img src={url} alt={`Portfolio ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <button
                            type="button"
                            onClick={() => removePortfolioImage(index)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 rounded-full transition-colors duration-300 opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                      {formData.portfolio.length < 8 && (
                        <label className="aspect-square border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all duration-300">
                          <Upload className="w-8 h-8 text-purple-400/60 mb-2" />
                          <span className="text-xs text-gray-400">Add</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'portfolio')}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      Showcase your best work. High-quality images help attract more customers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-lg font-medium text-sm transition-all duration-300 text-white"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || formData.portfolio.length < 3}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-3 rounded-lg font-medium text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>

              {formData.portfolio.length < 3 && (
                <p className="text-center text-sm text-yellow-400">
                  Please add at least 3 portfolio images to continue
                </p>
              )}
            </motion.div>
          )}
        </form>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🌍</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Global Reach</h3>
            <p className="text-sm text-gray-400">Connect with designers from 190+ countries</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Grow Your Business</h3>
            <p className="text-sm text-gray-400">Access thousands of potential customers</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Verified Badge</h3>
            <p className="text-sm text-gray-400">Stand out with our trusted verification</p>
          </div>
        </div>

        {/* Requirements */}
        <div className="mt-12 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">Requirements to Join</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium">Business Registration</p>
                <p className="text-sm text-gray-400">Valid business license or registration</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium">Quality Assurance</p>
                <p className="text-sm text-gray-400">Commitment to high-quality printing</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium">Customer Service</p>
                <p className="text-sm text-gray-400">Responsive communication with clients</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-medium">Portfolio</p>
                <p className="text-sm text-gray-400">At least 3 examples of your work</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}