'use client';

import { useState, useEffect } from 'react';
import { Download, Loader2, AlertCircle, Sparkles, Check, Sun, Moon, Monitor, Plus, Home, FolderOpen, LayoutTemplate, User, Menu, X, LogOut, ArrowRight, Mail, Presentation, Heart, Video, FileText, Pencil, Grid3X3, Upload, MoreHorizontal, Search, Image as ImgIcon } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type DesignCategory = 'business_card' | 'letterhead' | 'logo' | 'social_media' | 'flyer' | 'email' | 'invoice' | 'resume' | 'poster' | 'product_label';

const designConfig: Record<DesignCategory, {
  title: string;
  icon: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
}> = {
  business_card: {
    title: 'Business Card',
    icon: '💼',
    description: 'Professional business cards with contact info',
    requiredFields: ['companyName', 'tagline', 'industry'],
    optionalFields: ['ownerName', 'ownerTitle', 'phone', 'email', 'address', 'website', 'image']
  },
  logo: {
    title: 'Logo',
    icon: '🎨',
    description: 'Custom logo design for your brand',
    requiredFields: ['companyName', 'tagline', 'industry'],
    optionalFields: ['image']
  },
  social_media: {
    title: 'Social Media',
    icon: '📱',
    description: 'Eye-catching social media graphics',
    requiredFields: ['companyName', 'tagline'],
    optionalFields: ['industry', 'image']
  },
  flyer: {
    title: 'Flyer',
    icon: '📄',
    description: 'Promotional flyer with headline & description',
    requiredFields: ['companyName', 'tagline'],
    optionalFields: ['industry', 'image']
  },
  letterhead: {
    title: 'Letterhead',
    icon: '📧',
    description: 'Professional letterhead with contact details',
    requiredFields: ['companyName', 'tagline', 'industry'],
    optionalFields: ['ownerName', 'ownerTitle', 'phone', 'email', 'address', 'website', 'image']
  },
  email: {
    title: 'Email Template',
    icon: '✉️',
    description: 'Professional email template design',
    requiredFields: ['companyName', 'tagline'],
    optionalFields: ['industry', 'image']
  },
  invoice: {
    title: 'Invoice',
    icon: '🧾',
    description: 'Professional invoice template',
    requiredFields: ['companyName', 'industry'],
    optionalFields: ['tagline', 'image']
  },
  resume: {
    title: 'Resume',
    icon: '📋',
    description: 'Professional resume/CV design',
    requiredFields: ['companyName', 'industry'],
    optionalFields: ['tagline', 'image']
  },
  poster: {
    title: 'Poster',
    icon: '🖼️',
    description: 'Eye-catching poster design',
    requiredFields: ['companyName', 'tagline'],
    optionalFields: ['industry', 'image']
  },
  product_label: {
    title: 'Product Label',
    icon: '🏷️',
    description: 'Professional product packaging label',
    requiredFields: ['companyName', 'tagline'],
    optionalFields: ['industry', 'image']
  }
};

export default function ProfessionalDesignPage() {
  const [category, setCategory] = useState<DesignCategory>('business_card');
  const [companyName, setCompanyName] = useState('');
  const [tagline, setTagline] = useState('');
  const [industry, setIndustry] = useState('');
  const [colorPrimary, setColorPrimary] = useState('#0066CC');
  const [colorSecondary, setColorSecondary] = useState('#003D99');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpg'>('png');
  
  const [ownerName, setOwnerName] = useState('');
  const [ownerTitle, setOwnerTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser] = useState<any>({ email: 'demo@alton.com' });

  const config = designConfig[category];

  const navItems = [
    { label: 'Studio', href: '/studio' },
    { label: 'Alton Feed', href: '/marketplace' },
    { label: 'Community', href: '/community' },
    { label: 'Alton Designs', href: '/alton-designs' },
    { label: 'Print', href: '/print' }
  ];

const nav = [
  { icon: Plus, label: 'Create', href: '/studio' },
  { icon: Home, label: 'Home', href: '/home' },
  { icon: FolderOpen, label: 'Projects', href: '/designs' },
  { icon: LayoutTemplate, label: 'Templates', href: '/templates' },
  { icon: Sparkles, label: 'Alton Magic', href: '/professional-design' },
];

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageBase64(event.target?.result as string);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    const missing: string[] = [];
    if (config.requiredFields.includes('companyName') && !companyName) missing.push('Company Name');
    if (config.requiredFields.includes('tagline') && !tagline) missing.push('Tagline');
    if (config.requiredFields.includes('industry') && !industry) missing.push('Industry');

    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(', ')}`);
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedImage(null);

    try {
      const response = await fetch('/api/procedural-design/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          companyName,
          tagline,
          industry,
          colorPrimary,
          colorSecondary,
          imageBase64,
          ownerName,
          ownerTitle,
          phone,
          email,
          address,
          website,
          format: category === 'social_media' ? 'instagram' : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await response.json();
      setGeneratedImage(data.image_url);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const convertSvgToFormat = async (svgData: string, format: 'png' | 'jpg'): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        // Extract SVG string
        let svgString = svgData;
        if (svgString.startsWith('data:image/svg+xml,')) {
          svgString = decodeURIComponent(svgString.replace('data:image/svg+xml,', ''));
        }

        // Create a temporary container
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.innerHTML = svgString;
        document.body.appendChild(container);

        const svgElement = container.querySelector('svg');
        if (!svgElement) {
          document.body.removeChild(container);
          reject(new Error('No SVG element found'));
          return;
        }

        // Get SVG dimensions
        const bbox = svgElement.getBBox?.() || { width: 800, height: 800 };
        const width = 3000;
        const height = 3000;

        // Set SVG size
        svgElement.setAttribute('width', width.toString());
        svgElement.setAttribute('height', height.toString());

        // Serialize the SVG
        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(svgElement);

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: format === 'png' });

        if (!ctx) {
          document.body.removeChild(container);
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Fill background for JPG
        if (format === 'jpg') {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);
        }

        // Create image from SVG with proper encoding
        const img = new Image();

        img.onload = () => {
          try {
            ctx.drawImage(img, 0, 0, width, height);
            document.body.removeChild(container);

            // Convert to blob
            const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
            const quality = format === 'jpg' ? 0.95 : 1.0;

            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error(`Failed to create ${format.toUpperCase()} blob`));
              }
            }, mimeType, quality);
          } catch (err) {
            document.body.removeChild(container);
            reject(new Error(`Failed to draw image: ${err}`));
          }
        };

        img.onerror = (err) => {
          console.error('Image load error:', err);
          document.body.removeChild(container);
          
          // Try alternative method: use foreignObject
          try {
            const canvas2 = document.createElement('canvas');
            canvas2.width = width;
            canvas2.height = height;
            const ctx2 = canvas2.getContext('2d', { alpha: format === 'png' });

            if (!ctx2) {
              reject(new Error('Could not get canvas context'));
              return;
            }

            // Fill background
            if (format === 'jpg') {
              ctx2.fillStyle = 'white';
              ctx2.fillRect(0, 0, width, height);
            }

            // Try using html2canvas alternative - draw SVG directly
            const DOMURL = window.URL || window.webkitURL;
            const svg2 = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
            const url = DOMURL.createObjectURL(svg2);

            const img2 = new Image();
            img2.onload = () => {
              ctx2.drawImage(img2, 0, 0, width, height);
              DOMURL.revokeObjectURL(url);

              const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
              const quality = format === 'jpg' ? 0.95 : 1.0;

              canvas2.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to create blob'));
              }, mimeType, quality);
            };

            img2.onerror = () => {
              DOMURL.revokeObjectURL(url);
              reject(new Error('Failed to load SVG. Try generating the design again.'));
            };

            img2.src = url;
          } catch (fallbackErr) {
            reject(new Error('All conversion methods failed. Please try regenerating the design.'));
          }
        };

        // Use Data URL with proper encoding
        const encodedSvg = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
        img.src = encodedSvg;

      } catch (err) {
        console.error('Conversion error:', err);
        reject(err);
      }
    });
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      const filename = `${companyName.replace(/\s+/g, '-') || 'design'}-${category}`;
      
      if (generatedImage.startsWith('data:image/svg')) {
        setError(`Converting to ${downloadFormat.toUpperCase()}...`);
        
        try {
          const blob = await convertSvgToFormat(generatedImage, downloadFormat);
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}.${downloadFormat}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          setTimeout(() => URL.revokeObjectURL(url), 100);
          setError('');
        } catch (conversionError) {
          console.error('Conversion failed:', conversionError);
          setError(`Failed to convert to ${downloadFormat.toUpperCase()}. The design might contain unsupported elements. Please try regenerating.`);
        }
      } else {
        const a = document.createElement('a');
        a.href = generatedImage;
        a.download = `${filename}.${downloadFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Download error:', err);
      setError('Download failed. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100'
    }`} style={{ fontFamily: "'Poppins', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 right-20 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse ${
          isDarkMode ? 'bg-blue-600' : 'bg-blue-400'
        }`}></div>
        <div className={`absolute bottom-20 left-20 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse ${
          isDarkMode ? 'bg-purple-600' : 'bg-purple-400'
        }`} style={{ animationDelay: '2s' }}></div>
        <div className={`absolute top-1/2 left-1/2 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse ${
          isDarkMode ? 'bg-pink-600' : 'bg-pink-400'
        }`} style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Navigation - Matching home page */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b ${
          isDarkMode ? 'bg-black/90 border-purple-500/10' : 'bg-white/90 border-slate-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo.svg" alt="Alton" className="w-32 h-8 hover:scale-105 transition" />
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className={`transition ${
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
              }`}>
                {item.label}
              </Link>
            ))}
            <Link href="/home" className={`transition font-bold ${
              isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
            }`}>
              More...
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <div className={`flex items-center gap-2 p-1.5 rounded-xl border ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setTheme('light')}
                className={`p-2.5 rounded-lg transition-all ${
                  theme === 'light'
                    ? 'bg-white shadow-md text-blue-600'
                    : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Light Mode"
              >
                <Sun size={20} />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-2.5 rounded-lg transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-700 shadow-md text-blue-400'
                    : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Dark Mode"
              >
                <Moon size={20} />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`p-2.5 rounded-lg transition-all ${
                  theme === 'system'
                    ? isDarkMode ? 'bg-slate-700 shadow-md text-blue-400' : 'bg-white shadow-md text-blue-600'
                    : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="System Default"
              >
                <Monitor size={20} />
              </button>
            </div>

            {currentUser ? (
              <Link href="/settings" className="hidden md:block">
                <button className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${
                  isDarkMode 
                    ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30'
                    : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                }`}>
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Account</span>
                </button>
              </Link>
            ) : (
              <Link href="/auth" className="hidden md:block">
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-2 rounded-full font-semibold transition text-white">
                  Sign In
                </button>
              </Link>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
              />

              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={`fixed left-0 top-0 h-screen w-80 border-r z-50 md:hidden overflow-y-auto flex flex-col ${
                  isDarkMode ? 'bg-zinc-950 border-purple-500/20' : 'bg-white border-slate-200'
                }`}
              >
                <div className={`p-6 border-b ${isDarkMode ? 'border-purple-500/20' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <img src="/logo.svg" alt="Alton" className="w-24 h-7" />
                    <button 
                      onClick={() => setMobileMenuOpen(false)}
                      className={`p-2 rounded-lg transition ${
                        isDarkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                      }`}
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {currentUser ? (
                    <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                      <div className={`flex items-center gap-3 p-4 rounded-xl transition ${
                        isDarkMode 
                          ? 'bg-purple-600/20 hover:bg-purple-600/30'
                          : 'bg-purple-50 hover:bg-purple-100'
                      }`}>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xl border-2 border-white/20">
                          {currentUser.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
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

                <div className="flex-1 p-6 space-y-3">
                  <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>Navigation</p>
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-5 py-4 rounded-xl transition group ${
                        isDarkMode 
                          ? 'text-gray-300 hover:text-white hover:bg-purple-600/20'
                          : 'text-gray-700 hover:text-black hover:bg-purple-50'
                      }`}
                    >
                      <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                      <span className="font-semibold text-lg">{item.label}</span>
                    </Link>
                  ))}
                </div>

                <div className={`p-6 border-t ${isDarkMode ? 'border-purple-500/20' : 'border-slate-200'}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>Quick Actions</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/studio" onClick={() => setMobileMenuOpen(false)}>
                      <div className={`rounded-xl p-5 transition text-center ${
                        isDarkMode 
                          ? 'bg-white/5 border border-purple-500/20 hover:bg-white/10'
                          : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                      }`}>
                        <Sparkles className="w-7 h-7 text-purple-400 mx-auto mb-2" />
                        <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Studio</p>
                      </div>
                    </Link>
                    <Link href="/marketplace" onClick={() => setMobileMenuOpen(false)}>
                      <div className={`rounded-xl p-5 transition text-center ${
                        isDarkMode 
                          ? 'bg-white/5 border border-purple-500/20 hover:bg-white/10'
                          : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                      }`}>
                        <Search className="w-7 h-7 text-pink-400 mx-auto mb-2" />
                        <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Feed</p>
                      </div>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.nav>
{/* Sidebar */}
<div className={`hidden lg:flex w-20 border-r flex-col items-center py-8 gap-8 fixed left-0 top-20 bottom-0 ${
  isDarkMode ? 'bg-zinc-950 border-purple-900/30' : 'bg-white border-slate-200'
}`} style={{ zIndex: 100 }}>
  <Link href="/home" className="block">
    <img
      src="/logo2.svg"
      alt="Alton Studio"
      className="w-10 h-10 rounded-lg hover:scale-110 transition cursor-pointer"
    />
  </Link>

  {nav.map((item) => {
    const Icon = item.icon;
    const active = item.href === '/professional-design';
    return (
      <Link 
        key={item.label} 
        href={item.href} 
        className={`group relative p-3 rounded-xl transition block ${
          active 
            ? isDarkMode ? 'bg-purple-900/40 text-purple-400' : 'bg-purple-100 text-purple-600'
            : isDarkMode ? 'hover:bg-purple-900/20 text-gray-400' : 'hover:bg-slate-100 text-gray-600'
        }`}
      >
        <Icon className="w-6 h-6" />
        <span className={`absolute left-full ml-4 px-3 py-1 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none ${
          isDarkMode ? 'bg-zinc-800 text-white' : 'bg-slate-800 text-white'
        }`}>
          {item.label}
        </span>
      </Link>
    );
  })}

  <div className="mt-auto">
    {currentUser ? (
      <Link href="/settings" className="block">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg hover:scale-110 transition cursor-pointer border-2 border-white/20">
          {currentUser.email?.charAt(0).toUpperCase()}
        </div>
      </Link>
    ) : (
      <Link href="/auth" className="block">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition cursor-pointer border-2 ${
          isDarkMode 
            ? 'bg-white/10 border-purple-500/50 hover:bg-white/20'
            : 'bg-slate-100 border-slate-300 hover:bg-slate-200'
        }`}>
          <User className="w-6 h-6" />
        </div>
      </Link>
    )}
  </div>
</div>
      <div className="relative z-10">
        {/* Main Content Area with Sidebar */}
        <div className="flex flex-col min-h-screen pt-20">
          {/* Main Content */}
          <main className="flex-1 lg:ml-20">
            <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Design Type Selection */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                Choose Your Design Type
              </h2>
              <p className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                Select from our professional templates tailored for every need
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {(Object.entries(designConfig) as [DesignCategory, typeof designConfig[DesignCategory]][]).map(([cat, info]) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setError('');
                  }}
                  className={`group relative p-6 rounded-2xl transition-all duration-300 ${
                    category === cat
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-2xl shadow-blue-500/50 scale-105'
                      : isDarkMode 
                        ? 'bg-slate-800 hover:bg-slate-700 text-white shadow-md hover:shadow-xl border border-slate-700'
                        : 'bg-white hover:bg-slate-50 text-slate-700 shadow-md hover:shadow-xl border border-slate-200'
                  }`}
                >
                  <div className="text-3xl mb-3">{info.icon}</div>
                  <div className="font-semibold text-sm mb-1">{info.title}</div>
                  <div className={`text-xs leading-relaxed ${
                    category === cat 
                      ? 'text-blue-100' 
                      : isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {info.description}
                  </div>
                  {category === cat && (
                    <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                      <Check size={16} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Main Form Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Selection Card */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{config.icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{config.title}</h3>
                    <p className="text-blue-100">{config.description}</p>
                  </div>
                </div>
              </div>

              {/* Required Fields */}
              {(config.requiredFields.includes('companyName') || config.requiredFields.includes('tagline') || config.requiredFields.includes('industry')) && (
                <div className={`rounded-2xl p-8 shadow-lg border ${
                  isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      Required Information
                    </h3>
                  </div>
                  
                  <div className="space-y-5">
                    {config.requiredFields.includes('companyName') && (
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}>Company Name *</label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Enter your company name"
                          className={`w-full px-4 py-3.5 rounded-xl border-2 focus:outline-none transition-all ${
                            isDarkMode
                              ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                              : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white'
                          }`}
                        />
                      </div>
                    )}

                    {config.requiredFields.includes('tagline') && (
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}>Tagline / Slogan *</label>
                        <input
                          type="text"
                          value={tagline}
                          onChange={(e) => setTagline(e.target.value)}
                          placeholder="Your brand's tagline"
                          className={`w-full px-4 py-3.5 rounded-xl border-2 focus:outline-none transition-all ${
                            isDarkMode
                              ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                              : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white'
                          }`}
                        />
                      </div>
                    )}

                    {config.requiredFields.includes('industry') && (
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}>Industry *</label>
                        <select
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          className={`w-full px-4 py-3.5 rounded-xl border-2 focus:outline-none transition-all ${
                            isDarkMode
                              ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500'
                              : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'
                          }`}
                        >
                          <option value="">Select your industry...</option>
                          <option value="Tech">Technology</option>
                          <option value="Finance">Finance</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="E-commerce">E-commerce</option>
                          <option value="Real Estate">Real Estate</option>
                          <option value="Education">Education</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Fitness">Fitness & Wellness</option>
                          <option value="Fashion">Fashion & Beauty</option>
                          <option value="Food">Food & Beverage</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Optional Contact Details */}
              {(config.optionalFields.includes('ownerName') || config.optionalFields.includes('phone')) && (
                <div className={`rounded-2xl p-8 shadow-lg border ${
                  isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-6 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      Contact Details (Optional)
                    </h3>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-5">
                    {config.optionalFields.includes('ownerName') && (
                      <>
                        <div>
                          <label className={`block text-sm font-semibold mb-2 ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}>Full Name</label>
                          <input
                            type="text"
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                            placeholder="John Doe"
                            className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
                              isDarkMode
                                ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-purple-500'
                                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white'
                            }`}
                          />
                        </div>

                        <div>
                          <label className={`block text-sm font-semibold mb-2 ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}>Job Title</label>
                          <input
                            type="text"
                            value={ownerTitle}
                            onChange={(e) => setOwnerTitle(e.target.value)}
                            placeholder="CEO, Manager, etc."
                            className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
                              isDarkMode
                                ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-purple-500'
                                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white'
                            }`}
                          />
                        </div>
                      </>
                    )}

                    {config.optionalFields.includes('phone') && (
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}>Phone</label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
                            isDarkMode
                              ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-purple-500'
                              : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white'
                          }`}
                        />
                      </div>
                    )}

                    {config.optionalFields.includes('email') && (
                      <div>
                        <label className={`block text-sm font-semibold mb-2 ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}>Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="hello@company.com"
                          className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
                            isDarkMode
                              ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-purple-500'
                              : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white'
                          }`}
                        />
                      </div>
                    )}

                    {config.optionalFields.includes('address') && (
                      <div className="md:col-span-2">
                        <label className={`block text-sm font-semibold mb-2 ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}>Address</label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="123 Main St, City, Country"
                          className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
                            isDarkMode
                              ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-purple-500'
                              : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white'
                          }`}
                        />
                      </div>
                    )}

                    {config.optionalFields.includes('website') && (
                      <div className="md:col-span-2">
                        <label className={`block text-sm font-semibold mb-2 ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}>Website</label>
                        <input
                          type="text"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="www.yourcompany.com"
                          className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all ${
                            isDarkMode
                              ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-purple-500'
                              : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Colors & Image */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Colors */}
                <div className={`rounded-2xl p-8 shadow-lg border ${
                  isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-6 bg-gradient-to-b from-pink-600 to-orange-600 rounded-full"></div>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Brand Colors</h3>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <label className={`block text-sm font-semibold mb-3 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}>Primary Color</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={colorPrimary}
                          onChange={(e) => setColorPrimary(e.target.value)}
                          className={`w-16 h-16 rounded-xl cursor-pointer border-4 shadow-md ${
                            isDarkMode ? 'border-slate-700' : 'border-slate-200'
                          }`}
                        />
                        <div>
                          <div className={`font-mono font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                            {colorPrimary}
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Main brand color
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-3 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}>Secondary Color</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={colorSecondary}
                          onChange={(e) => setColorSecondary(e.target.value)}
                          className={`w-16 h-16 rounded-xl cursor-pointer border-4 shadow-md ${
                            isDarkMode ? 'border-slate-700' : 'border-slate-200'
                          }`}
                        />
                        <div>
                          <div className={`font-mono font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                            {colorSecondary}
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            Accent color
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                <div className={`rounded-2xl p-8 shadow-lg border ${
                  isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-6 bg-gradient-to-b from-green-600 to-teal-600 rounded-full"></div>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Brand Image</h3>
                  </div>
                  
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    isDarkMode
                      ? 'border-slate-600 hover:border-blue-500 hover:bg-slate-700/50'
                      : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/50'
                  }`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer block">
                      <div className="text-4xl mb-3">📤</div>
                      <div className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>
                        Click to upload
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        PNG, JPG, GIF (Max 5MB)
                      </div>
                    </label>
                    {imageBase64 && (
                      <div className="mt-4 flex items-center justify-center gap-2 text-green-600 font-semibold">
                        <Check size={20} />
                        Image uploaded successfully
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex gap-3 text-red-700">
                  <AlertCircle size={22} className="shrink-0 mt-0.5" />
                  <div className="font-medium">{error}</div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold py-5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/50 hover:shadow-purple-500/50 disabled:shadow-none text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    Generating Your Design...
                  </>
                ) : (
                  <>
                    <Sparkles size={24} />
                    Generate Design
                  </>
                )}
              </button>
            </div>

            {/* Right Column - Preview */}
            <div className="lg:col-span-1">
              <div className={`rounded-2xl p-8 shadow-2xl border sticky top-24 ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              }`}>
                <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${
                  isDarkMode ? 'text-white' : 'text-slate-800'
                }`}>
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
                  Live Preview
                </h3>
                
                <div className={`rounded-xl border-2 overflow-hidden aspect-square flex items-center justify-center ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-700'
                    : 'bg-gradient-to-br from-slate-100 to-slate-200 border-slate-300'
                }`}>
                  {loading && (
                    <div className="text-center">
                      <Loader2 className={`w-12 h-12 animate-spin mx-auto mb-4 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                      <p className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Creating magic...
                      </p>
                    </div>
                  )}

                  {generatedImage && !loading && (
                    <div className="w-full h-full p-6 flex items-center justify-center">
                      {generatedImage.startsWith('data:image/svg') ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: decodeURIComponent(generatedImage.replace('data:image/svg+xml,', ''))
                          }}
                          className="w-full h-full flex items-center justify-center"
                        />
                      ) : (
                        <img
                          src={generatedImage}
                          alt="Generated design"
                          className="max-w-full max-h-full object-contain"
                        />
                      )}
                    </div>
                  )}

                  {!generatedImage && !loading && (
                    <div className="text-center p-8">
                      <div className="text-6xl mb-4">🎨</div>
                      <p className={`font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        No design yet
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        Fill the form and generate
                      </p>
                    </div>
                  )}
                </div>

                {generatedImage && (
                  <div className="mt-6 space-y-4">
                    {/* Format Selector */}
                    <div>
                      <label className={`block text-sm font-semibold mb-3 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        Download Format
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setDownloadFormat('png')}
                          className={`py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                            downloadFormat === 'png'
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                              : isDarkMode
                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          PNG
                        </button>
                        <button
                          onClick={() => setDownloadFormat('jpg')}
                          className={`py-3 px-4 rounded-lg font-semibold text-sm transition-all ${
                            downloadFormat === 'jpg'
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                              : isDarkMode
                                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          JPG
                        </button>
                      </div>
                    </div>

                    {/* Download Button */}
                    <button
                      onClick={handleDownload}
                      className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
                    >
                      <Download size={20} />
                      Download as {downloadFormat.toUpperCase()}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <div className={`rounded-2xl p-8 shadow-lg border hover:shadow-xl transition-all duration-300 ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-lg">
                ⚡
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                Instant Generation
              </h3>
              <p className={`leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Get professional designs instantly with no API latency. Create stunning visuals in seconds.
              </p>
            </div>

            <div className={`rounded-2xl p-8 shadow-lg border hover:shadow-xl transition-all duration-300 ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-lg">
                🎨
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                Smart Forms
              </h3>
              <p className={`leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Dynamic form fields that adapt based on your selected design type for the perfect output.
              </p>
            </div>

            <div className={`rounded-2xl p-8 shadow-lg border hover:shadow-xl transition-all duration-300 ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-lg">
                📥
              </div>
              <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                Image Downloads
              </h3>
              <p className={`leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Download in PNG or JPG format. High-quality 3000x3000px exports perfect for any use.
              </p>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="mt-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 shadow-2xl">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold text-white mb-2">10+</div>
                <div className="text-blue-100 font-medium">Design Types</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-white mb-2">3000px</div>
                <div className="text-purple-100 font-medium">High Resolution</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-white mb-2">∞</div>
                <div className="text-pink-100 font-medium">Unlimited Designs</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-white mb-2">&lt;5s</div>
                <div className="text-orange-100 font-medium">Generation Time</div>
              </div>
            </div>
          </div>
        </div>
          </main>
        <footer className={`py-16 px-5 border-t ${
          isDarkMode ? 'border-purple-500/10' : 'border-slate-200'
        }`}>
          <div className="max-w-7xl mx-auto text-center space-y-10">
            
            <div className={`flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <Link href="/studio" className={`transition ${
                isDarkMode ? 'hover:text-white' : 'hover:text-black'
              }`}>AI Studio</Link>
              <Link href="/marketplace" className={`transition ${
                isDarkMode ? 'hover:text-white' : 'hover:text-black'
              }`}>Alton Feed</Link>
              <Link href="/alton-designs" className={`transition ${
                isDarkMode ? 'hover:text-white' : 'hover:text-black'
              }`}>Alton Designs</Link>
              <Link href="/print" className={`transition ${
                isDarkMode ? 'hover:text-white' : 'hover:text-black'
              }`}>Print Network</Link>
              <Link href="/community" className={`transition ${
                isDarkMode ? 'hover:text-white' : 'hover:text-black'
              }`}>Community</Link>
              <Link href="/contributor/apply" className={`font-bold text-purple-400 transition ${
                isDarkMode ? 'hover:text-purple-300' : 'hover:text-purple-600'
              }`}>Upload Your Content</Link>
            </div>

                        
            <div className={`flex flex-col md:flex-row justify-center items-center gap-6 text-sm ${
              isDarkMode ? 'text-gray-500' : 'text-gray-500'
            }`}>
              <span>© 2025 Alton Studio. All rights reserved.</span>
              <Link href="/privacy" className="hover:text-purple-400 transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-purple-400 transition">Terms & Conditions</Link>
            </div>
          </div>
          </footer>
        </div>
      </div>
    </div>
  );
}