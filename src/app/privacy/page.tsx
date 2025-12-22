"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Sun, Moon, Printer, ChevronDown, Search, Shield, Lock, Eye, Database, Users, Bell, FileText, Mail, ExternalLink, Check, Globe } from "lucide-react";

export default function PrivacyPolicy() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [dark, setDark] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
      
      const sections = document.querySelectorAll('[data-section]');
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= 200) {
          setActiveSection(section.getAttribute('data-section') || '');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggle = (key: string) =>
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  const expandAll = () => {
    const allOpen: Record<string, boolean> = {};
    sections.forEach(s => allOpen[s.id] = true);
    setOpenSections(allOpen);
  };

  const collapseAll = () => setOpenSections({});

  const sections = [
    {
      id: "info-collect",
      title: "1. Information We Collect",
      icon: Database,
      short: "We only collect what's necessary to operate Alton Studio.",
      body: `We collect information that is required for creating accounts, providing services, processing transactions, and improving the platform. This includes: \n\n• Account details such as your name, email, username, and profile information. \n• Content you upload, including designs, videos, messages and comments. \n• Payment and payout information processed securely by third-party providers (e.g., Stripe). We never store full payment card numbers. \n• Technical information such as IP address, device identifiers, cookies, browser type, time zone, usage logs and interactions with platform features. \n• Optional information you choose to share, such as social profile links or bio information.`,
      tags: ["data", "collection", "information", "personal"]
    },
    {
      id: "use-data",
      title: "2. How We Use Your Data",
      icon: Eye,
      short: "To operate your account, process payments, and improve platform performance.",
      body: `We use your information to: \n\n• Create and maintain your Alton Studio account. \n• Display your content publicly (when you choose to publish it). \n• Process sales, deliver payouts, detect fraud and ensure financial accuracy. \n• Send service-related communications such as payment notifications, account alerts, or updates to our terms. \n• Personalize your experience—such as recommended creators or tools. \n• Train and improve features such as AI-powered previews or content recommendation systems. \n• Maintain security, prevent abuse and enforce our Terms & Conditions.`,
      tags: ["usage", "data use", "processing"]
    },
    {
      id: "never-sell",
      title: "3. We Never Sell Your Data",
      icon: Shield,
      short: "Your creativity and data are never sold to advertisers.",
      body: `We do not sell your personal data to any third parties—period. We also do not allow third-party advertisers to access your personal information. We only share minimal data when required by essential service providers (such as payment processors or analytics tools), and only for operational purposes.`,
      tags: ["data sale", "privacy", "protection"]
    },
    {
      id: "sharing",
      title: "4. When We Share Your Data",
      icon: Users,
      short: "Only with trusted providers and only when necessary.",
      body: `We may share information with: \n\n• Payment processors (e.g., Stripe) to complete transactions. \n• Cloud storage and hosting providers to serve your content. \n• Analytics tools to understand feature performance. \n• Security vendors to detect fraud or abuse. \n• Legal authorities when required by law, subpoenas, or to protect user safety. \n\nAll partners are required to meet strict confidentiality and data-protection standards.`,
      tags: ["sharing", "third party", "partners"]
    },
    {
      id: "security",
      title: "5. Security",
      icon: Lock,
      short: "We use strong encryption and industry-standard protections.",
      body: `We implement strict security measures, including encryption in transit and at rest, secure authentication, role-based access controls, and continuous monitoring. Content and personal information are stored using Supabase and other industry-standard infrastructure providers. \n\nDespite best efforts, no platform can guarantee 100% security. You are responsible for safeguarding your login credentials.`,
      tags: ["security", "encryption", "protection", "safety"]
    },
    {
      id: "cookies",
      title: "6. Cookies & Tracking",
      icon: Globe,
      short: "We use cookies to improve functionality and performance.",
      body: `Cookies and similar technologies allow us to remember your preferences, keep you logged in, understand usage patterns, and improve site performance. You may disable cookies in your browser settings, but some features may not work properly.`,
      tags: ["cookies", "tracking", "analytics"]
    },
    {
      id: "your-rights",
      title: "7. Your Rights",
      icon: FileText,
      short: "Access, download, delete or update your personal information.",
      body: `Depending on your location, you may have rights such as: \n\n• Requesting a copy of the data we store about you. \n• Requesting correction or deletion of your personal information. \n• Opting out of marketing emails or non-essential communications. \n• Porting your data to another service. \n\nTo exercise these rights, email legal@alton.studio.`,
      tags: ["rights", "gdpr", "data rights", "access"]
    },
    {
      id: "children",
      title: "8. Children's Privacy",
      icon: Shield,
      short: "Alton Studio is not designed for children under 13.",
      body: `We do not knowingly collect data from children under 13 (or the minimum age in your region). If we discover such data has been collected, we will delete it promptly.`,
      tags: ["children", "minors", "coppa"]
    },
    {
      id: "changes",
      title: "9. Changes to This Policy",
      icon: Bell,
      short: "We notify you of material updates.",
      body: `We may update this Privacy Policy to reflect new features, legal requirements, or improvements. If changes are significant, we will notify you via email or in-app alerts. The latest version will always be available on this page.`,
      tags: ["updates", "changes", "notifications"]
    },
  ];

  const filteredSections = sections.filter(s => 
    searchQuery === "" || 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.short.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={dark ? "min-h-screen bg-black text-white" : "min-h-screen bg-white text-zinc-900"}>
      <div className="flex">
        {/* Enhanced Sidebar */}
        <aside className={`hidden lg:block w-80 border-r ${dark ? 'bg-black/50 border-purple-500/10 backdrop-blur-xl' : 'bg-white/80 border-purple-200 backdrop-blur-xl'} p-8 space-y-6 sticky top-0 h-screen overflow-y-auto`}>
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-semibold">Home</span>
            </a>
            <button
              aria-label="Toggle color theme"
              onClick={() => setDark((d) => !d)}
              className={`p-2 rounded-lg ${dark ? 'bg-zinc-900/50 hover:bg-zinc-900/70' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Legal Center</h2>
              <p className={`text-xs mt-1 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Platform policies & guidelines</p>
            </div>
            
            <nav className="space-y-1">
              <a href="/privacy" className={`block px-3 py-2 rounded-lg text-sm font-bold ${dark ? 'bg-purple-600/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                Privacy Policy
              </a>
              <a href="/terms" className={`block px-3 py-2 rounded-lg text-sm ${dark ? 'text-gray-400 hover:bg-zinc-900/50 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} transition-colors`}>
                Terms & Conditions
              </a>
              <a href="/cookies" className={`block px-3 py-2 rounded-lg text-sm ${dark ? 'text-gray-400 hover:bg-zinc-900/50 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} transition-colors`}>
                Cookie Policy
              </a>
            </nav>

            <div className={`pt-4 border-t ${dark ? 'border-zinc-800/60' : 'border-gray-200'}`}>
              <h3 className={`text-xs uppercase tracking-wider font-semibold mb-3 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Quick Navigation</h3>
              <nav className="space-y-1">
                {sections.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a 
                      key={s.id} 
                      href={`#${s.id}`} 
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeSection === s.id 
                          ? dark ? 'bg-purple-600/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                          : dark ? 'text-gray-400 hover:bg-zinc-900/50 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{s.title}</span>
                    </a>
                  );
                })}
              </nav>
            </div>

            <div className={`pt-4 border-t ${dark ? 'border-zinc-800/60' : 'border-gray-200'} space-y-2`}>
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium text-sm transition-all shadow-lg shadow-purple-500/20"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>
              <a 
                href="mailto:legal@alton.studio" 
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  dark ? 'bg-zinc-900/50 hover:bg-zinc-900/70 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Mail className="w-4 h-4" />
                Contact Legal Team
              </a>
            </div>
          </div>
        </aside>

        {/* Enhanced Main Content */}
        <main className="flex-1 max-w-5xl mx-auto p-6 lg:p-12">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <a href="/" className="flex items-center gap-2 text-purple-400">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-semibold">Back</span>
            </a>
            <button
              onClick={() => setDark((d) => !d)}
              className={`p-2 rounded-lg ${dark ? 'bg-zinc-900/50' : 'bg-gray-100'}`}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Hero Header */}
          <header className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/20 text-purple-300 text-xs font-semibold mb-4">
              <Shield className="w-3 h-3" />
              Privacy Document
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent leading-tight">
              Privacy Policy
            </h1>
            <p className={`text-lg ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
              Last updated: <span className="font-semibold">November 2025</span>
            </p>
          </header>

          {/* Key Principles */}
          <section className="mb-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Check className="w-6 h-6 text-purple-400" />
              Our Privacy Principles
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className={`p-3 rounded-lg ${dark ? 'bg-purple-600/10' : 'bg-purple-100'} w-fit mb-3`}>
                  <Shield className={`w-6 h-6 ${dark ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <h4 className="font-bold mb-2">Never Sold</h4>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-700'}`}>We never sell your personal data to third parties</p>
              </div>
              <div>
                <div className={`p-3 rounded-lg ${dark ? 'bg-pink-600/10' : 'bg-pink-100'} w-fit mb-3`}>
                  <Lock className={`w-6 h-6 ${dark ? 'text-pink-400' : 'text-pink-600'}`} />
                </div>
                <h4 className="font-bold mb-2">Encrypted</h4>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-700'}`}>Industry-standard encryption protects your data</p>
              </div>
              <div>
                <div className={`p-3 rounded-lg ${dark ? 'bg-purple-600/10' : 'bg-purple-100'} w-fit mb-3`}>
                  <FileText className={`w-6 h-6 ${dark ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <h4 className="font-bold mb-2">Your Control</h4>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-700'}`}>Request access, correction, or deletion anytime</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-purple-500/10">
              <button 
                onClick={() => navigator.clipboard?.writeText(window.location.href)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dark ? 'hover:bg-white/5' : 'hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Copy Link
              </button>
              <a 
                href="mailto:legal@alton.studio"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium transition-all"
              >
                Contact Legal Team
              </a>
            </div>
          </section>

          {/* Search & Controls */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${dark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search privacy policy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 rounded-xl text-sm ${
                  dark 
                    ? 'bg-zinc-900/50 border border-zinc-800 focus:border-purple-500 text-white placeholder-gray-500' 
                    : 'bg-white border border-gray-200 focus:border-purple-400 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all`}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                {filteredSections.length} of {sections.length} sections
              </div>
              <div className="flex gap-2">
                <button
                  onClick={expandAll}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    dark ? 'bg-zinc-900/50 hover:bg-zinc-900/70 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    dark ? 'bg-zinc-900/50 hover:bg-zinc-900/70 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Collapse All
                </button>
              </div>
            </div>
          </div>

          {/* Quick Summary */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-3">Quick Summary</h2>
            <p className={dark ? 'text-gray-400' : 'text-gray-700'}>
              We collect only the data needed to run your account, never sell your information, and use industry-standard security. You may request data deletion or access at any time.
            </p>
          </section>

          {/* Dynamic Sections */}
          <article className="space-y-4">
            {filteredSections.map((s) => {
              const Icon = s.icon;
              return (
                <section 
                  id={s.id} 
                  key={s.id} 
                  data-section={s.id}
                  className={`pb-8 mb-8 border-b ${dark ? 'border-white/5' : 'border-gray-200'} transition-all`}
                >
                  <button
                    onClick={() => toggle(s.id)}
                    aria-expanded={!!openSections[s.id]}
                    className="w-full pb-6 flex items-start justify-between gap-4 text-left transition-colors group"
                  >
                    <div className="flex gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${dark ? 'bg-purple-600/10' : 'bg-purple-100'} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-5 h-5 ${dark ? 'text-purple-400' : 'text-purple-600'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                        <p className={`text-sm font-semibold ${dark ? 'text-purple-400' : 'text-purple-600'}`}>{s.short}</p>
                      </div>
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
                        openSections[s.id] ? "rotate-180" : "rotate-0"
                      } ${dark ? 'text-gray-500' : 'text-gray-600'}`} 
                    />
                  </button>

                  <div className={`transition-all duration-300 ${openSections[s.id] ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
                    <div className="pl-16 pt-2">
                      <p className={`whitespace-pre-line leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-700'}`}>
                        {s.body}
                      </p>
                    </div>
                  </div>
                </section>
              );
            })}
          </article>

          {/* Contact Section */}
          <section className={`mt-12 pt-12 border-t ${dark ? 'border-white/5' : 'border-gray-200'}`}>
            <h3 className="text-2xl font-bold mb-4">Questions About Your Privacy?</h3>
            <p className={`mb-8 ${dark ? 'text-gray-400' : 'text-gray-700'}`}>
              If you have privacy questions or want to exercise your rights, contact our legal team.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <a 
                href="mailto:legal@alton.studio"
                className={`flex items-center gap-4 p-6 rounded-xl transition-all ${
                  dark ? 'hover:bg-white/5' : 'hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`p-3 rounded-lg ${dark ? 'bg-purple-600/10' : 'bg-purple-100'}`}>
                  <Mail className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="font-semibold mb-1">Legal Team</div>
                  <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>legal@alton.studio</div>
                </div>
              </a>
              <a 
                href="/help/privacy"
                className={`flex items-center gap-4 p-6 rounded-xl transition-all ${
                  dark ? 'hover:bg-white/5' : 'hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`p-3 rounded-lg ${dark ? 'bg-purple-600/10' : 'bg-purple-100'}`}>
                  <ExternalLink className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="font-semibold mb-1">Privacy Help Center</div>
                  <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Learn about data rights</div>
                </div>
              </a>
            </div>
            <div className={`mt-8 p-6 rounded-xl ${dark ? 'bg-purple-600/5' : 'bg-purple-50'}`}>
              <h4 className="font-semibold mb-2">Response Time</h4>
              <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-700'}`}>
                We typically respond to privacy inquiries within 1-3 business days. For data access or deletion requests, we aim to complete them within 30 days as required by law.
              </p>
            </div>
          </section>

          {/* Footer */}
          <footer className={`mt-12 pt-8 border-t ${dark ? 'border-zinc-800' : 'border-gray-200'} text-center`}>
            <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
              © {new Date().getFullYear()} Alton Studio. All rights reserved.
            </p>
          </footer>
        </main>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 p-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30 transition-all z-50"
          aria-label="Scroll to top"
        >
          <ArrowLeft className="w-5 h-5 rotate-90" />
        </button>
      )}
    </div>
  );
}