"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Sun, Moon, Printer, ChevronDown, Search, Cookie, Shield, Eye, Settings, BarChart, Globe, FileText, Mail, ExternalLink, Check, Trash2 } from "lucide-react";

export default function CookiePolicy() {
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
      id: "what-cookies",
      title: "1. What Are Cookies?",
      icon: Cookie,
      short: "Small text files that help websites remember your preferences.",
      body: `Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit a website. They help websites recognize your device and remember information about your visit, such as your preferred language, login status, and other settings.\n\nCookies make your browsing experience more efficient and personalized. They can be "session cookies" (which expire when you close your browser) or "persistent cookies" (which remain on your device for a set period or until you delete them).`,
      tags: ["cookies", "definition", "tracking", "browser"]
    },
    {
      id: "why-use",
      title: "2. Why We Use Cookies",
      icon: Eye,
      short: "To provide essential functionality and improve your experience.",
      body: `We use cookies for several important purposes:\n\n• Authentication: Keep you logged in to your Alton Studio account.\n• Security: Protect against fraud and unauthorized access.\n• Preferences: Remember your settings like theme (dark/light mode) and language.\n• Performance: Understand how you use the platform to fix bugs and improve features.\n• Analytics: Measure traffic patterns and popular content to make better product decisions.\n• Functionality: Enable features like shopping carts, content recommendations, and saved items.`,
      tags: ["usage", "functionality", "purpose"]
    },
    {
      id: "types",
      title: "3. Types of Cookies We Use",
      icon: Settings,
      short: "Essential, functional, analytics, and performance cookies.",
      body: `We use different categories of cookies:\n\n**Strictly Necessary Cookies**\nThese are essential for the website to function. They enable core functionality like security, authentication, and account access. You cannot opt out of these cookies.\n\nExamples: Session tokens, CSRF protection, load balancing\n\n**Functional Cookies**\nThese remember your preferences and choices to provide enhanced, personalized features.\n\nExamples: Theme preference, language selection, recently viewed items\n\n**Analytics Cookies**\nThese help us understand how visitors interact with our website by collecting and reporting information anonymously.\n\nExamples: Google Analytics, usage statistics, page view tracking\n\n**Performance Cookies**\nThese help us improve website speed and performance by understanding which pages are most popular and how users navigate the site.\n\nExamples: Load time tracking, error monitoring, A/B testing`,
      tags: ["types", "categories", "essential", "analytics"]
    },
    {
      id: "third-party",
      title: "4. Third-Party Cookies",
      icon: Globe,
      short: "Some cookies are set by trusted partners for specific services.",
      body: `In addition to our own cookies, we use cookies from trusted third-party services:\n\n• **Analytics Providers** (e.g., Google Analytics): Help us understand user behavior and improve the platform.\n• **Payment Processors** (e.g., Stripe): Enable secure payment transactions.\n• **Content Delivery Networks (CDNs)**: Deliver content faster by caching resources.\n• **Authentication Services**: Support social login options and account security.\n\nThese third parties have their own privacy policies and cookie practices. We recommend reviewing their policies for more information on how they use cookies.`,
      tags: ["third party", "partners", "external", "services"]
    },
    {
      id: "manage",
      title: "5. Managing Your Cookie Preferences",
      icon: Settings,
      short: "You have full control over cookie settings in your browser.",
      body: `You can control and manage cookies in several ways:\n\n**Browser Settings**\nMost browsers allow you to:\n• View and delete cookies\n• Block third-party cookies\n• Block cookies from specific websites\n• Block all cookies (note: this may break website functionality)\n• Delete all cookies when you close your browser\n\n**Browser-Specific Instructions:**\n• Chrome: Settings > Privacy and security > Cookies\n• Firefox: Settings > Privacy & Security > Cookies\n• Safari: Preferences > Privacy > Manage Website Data\n• Edge: Settings > Cookies and site permissions\n\n**Opt-Out Tools**\nFor analytics cookies, you can use:\n• Google Analytics Opt-out Browser Add-on\n• Network Advertising Initiative opt-out page\n• Your device's advertising ID settings`,
      tags: ["manage", "control", "browser", "opt-out", "settings"]
    },
    {
      id: "consent",
      title: "6. Cookie Consent",
      icon: Check,
      short: "We ask for your permission before using non-essential cookies.",
      body: `When you first visit Alton Studio, we display a cookie banner that explains our use of cookies. You can choose to:\n\n• Accept all cookies\n• Reject non-essential cookies\n• Customize your preferences by cookie category\n\nYou can change your cookie preferences at any time through the cookie settings link in the footer of our website. Your choices are stored in a cookie (ironically) so we can remember your preferences for future visits.`,
      tags: ["consent", "banner", "permission", "gdpr"]
    },
    {
      id: "data-retention",
      title: "7. How Long We Keep Cookies",
      icon: BarChart,
      short: "Different cookies have different lifespans based on their purpose.",
      body: `Cookie retention periods vary based on their type:\n\n**Session Cookies**: Deleted when you close your browser\n**Authentication Cookies**: Typically 30-90 days (or until you log out)\n**Preference Cookies**: Up to 1 year\n**Analytics Cookies**: Up to 2 years\n**Marketing Cookies**: Up to 1 year\n\nYou can delete cookies manually at any time through your browser settings. Some cookies will be recreated on your next visit if they're necessary for the site to function properly.`,
      tags: ["retention", "duration", "expiry", "lifetime"]
    },
    {
      id: "do-not-track",
      title: "8. Do Not Track Signals",
      icon: Shield,
      short: "We respect browser privacy signals where technically feasible.",
      body: `Some browsers offer "Do Not Track" (DNT) signals that request websites not to track your browsing. While we respect user privacy, there is no universal standard for how websites should respond to DNT signals.\n\nCurrently, we do not alter our data collection practices in response to DNT signals. However, you can still control cookies through your browser settings and our cookie preference center. We are monitoring the development of DNT standards and may update our approach as industry standards evolve.`,
      tags: ["do not track", "dnt", "privacy", "signals"]
    },
    {
      id: "changes",
      title: "9. Changes to This Policy",
      icon: FileText,
      short: "We'll notify you of significant updates to our cookie practices.",
      body: `We may update this Cookie Policy from time to time to reflect changes in technology, legal requirements, or our practices. When we make significant changes, we will:\n\n• Update the "Last updated" date at the top of this page\n• Notify you through a banner on our website\n• Send an email notification (for major changes)\n• Ask for renewed consent if required by law\n\nWe encourage you to review this policy periodically to stay informed about how we use cookies.`,
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
              <a href="/privacy" className={`block px-3 py-2 rounded-lg text-sm ${dark ? 'text-gray-400 hover:bg-zinc-900/50 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} transition-colors`}>
                Privacy Policy
              </a>
              <a href="/terms" className={`block px-3 py-2 rounded-lg text-sm ${dark ? 'text-gray-400 hover:bg-zinc-900/50 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} transition-colors`}>
                Terms & Conditions
              </a>
              <a href="/cookies" className={`block px-3 py-2 rounded-lg text-sm font-bold ${dark ? 'bg-purple-600/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
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
              <Cookie className="w-3 h-3" />
              Cookie Policy
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent leading-tight">
              Cookie Policy
            </h1>
            <p className={`text-lg ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
              Last updated: <span className="font-semibold">November 2025</span>
            </p>
          </header>

          {/* Cookie Management */}
          <section className="mb-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Settings className="w-6 h-6 text-purple-400" />
              Quick Cookie Controls
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className={`p-3 rounded-lg ${dark ? 'bg-purple-600/10' : 'bg-purple-100'} w-fit mb-3`}>
                  <Check className={`w-6 h-6 ${dark ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <h4 className="font-bold mb-2">Essential Only</h4>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-700'}`}>Only cookies required for basic functionality</p>
              </div>
              <div>
                <div className={`p-3 rounded-lg ${dark ? 'bg-pink-600/10' : 'bg-pink-100'} w-fit mb-3`}>
                  <Settings className={`w-6 h-6 ${dark ? 'text-pink-400' : 'text-pink-600'}`} />
                </div>
                <h4 className="font-bold mb-2">Customize</h4>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-700'}`}>Choose which cookie categories to enable</p>
              </div>
              <div>
                <div className={`p-3 rounded-lg ${dark ? 'bg-purple-600/10' : 'bg-purple-100'} w-fit mb-3`}>
                  <Trash2 className={`w-6 h-6 ${dark ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <h4 className="font-bold mb-2">Clear All</h4>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-700'}`}>Delete all cookies from your browser</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-purple-500/10">
              <button 
                onClick={() => {/* Cookie settings modal would open here */}}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium transition-all"
              >
                Manage Cookie Preferences
              </button>
              <button 
                onClick={() => navigator.clipboard?.writeText(window.location.href)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  dark ? 'hover:bg-white/5' : 'hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Copy Link
              </button>
            </div>
          </section>

          {/* Search & Controls */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${dark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search cookie policy..."
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
            <h2 className="text-2xl font-bold mb-3">What You Should Know</h2>
            <p className={dark ? 'text-gray-400' : 'text-gray-700'}>
              We use cookies to keep you logged in, remember your preferences, and understand how you use Alton Studio. You can control which cookies you accept through your browser settings or our cookie preference center.
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

          {/* Browser Instructions */}
          <section className={`mt-12 pt-12 border-t ${dark ? 'border-white/5' : 'border-gray-200'}`}>
            <h3 className="text-2xl font-bold mb-6">Managing Cookies in Your Browser</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className={`p-6 rounded-xl ${dark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-purple-400" />
                  Desktop Browsers
                </h4>
                <ul className={`space-y-2 text-sm ${dark ? 'text-gray-400' : 'text-gray-700'}`}>
                  <li>• <span className="font-semibold">Chrome:</span> Settings → Privacy and security → Cookies</li>
                  <li>• <span className="font-semibold">Firefox:</span> Settings → Privacy & Security → Cookies</li>
                  <li>• <span className="font-semibold">Safari:</span> Preferences → Privacy → Manage Website Data</li>
                  <li>• <span className="font-semibold">Edge:</span> Settings → Cookies and site permissions</li>
                </ul>
              </div>
              <div className={`p-6 rounded-xl ${dark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  Mobile Browsers
                </h4>
                <ul className={`space-y-2 text-sm ${dark ? 'text-gray-400' : 'text-gray-700'}`}>
                  <li>• <span className="font-semibold">iOS Safari:</span> Settings → Safari → Advanced → Website Data</li>
                  <li>• <span className="font-semibold">Chrome (Android):</span> Settings → Site settings → Cookies</li>
                  <li>• <span className="font-semibold">Firefox (Mobile):</span> Settings → Enhanced Tracking Protection</li>
                  <li>• <span className="font-semibold">Samsung Internet:</span> Settings → Sites and downloads → Cookies</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className={`mt-12 pt-12 border-t ${dark ? 'border-white/5' : 'border-gray-200'}`}>
            <h3 className="text-2xl font-bold mb-4">Questions About Cookies?</h3>
            <p className={`mb-8 ${dark ? 'text-gray-400' : 'text-gray-700'}`}>
              If you have questions about our cookie practices or need help managing your preferences, we're here to help.
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
                href="/help/cookies"
                className={`flex items-center gap-4 p-6 rounded-xl transition-all ${
                  dark ? 'hover:bg-white/5' : 'hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`p-3 rounded-lg ${dark ? 'bg-purple-600/10' : 'bg-purple-100'}`}>
                  <ExternalLink className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="font-semibold mb-1">Cookie Help Center</div>
                  <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Learn more about cookies</div>
                </div>
              </a>
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