"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Sun, Moon, Download, Printer, ChevronDown, Search, BookOpen, Scale, Shield, Users, Coins, AlertCircle, Mail, ExternalLink, Check } from "lucide-react";

export default function Terms() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [dark, setDark] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
      
      // Update active section based on scroll position
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
      id: "ownership",
      title: "1. You Own Your Content",
      icon: Shield,
      short: "You keep 100% ownership of everything you create and upload.",
      body: `You retain full ownership and all intellectual property rights in and to the content you create, upload, post or otherwise make available through the Service ("Your Content"). This includes copyrights, moral rights and database rights where applicable. By uploading or submitting Your Content you represent and warrant that you have all rights necessary to provide that content and to grant the limited rights we require to operate the Service (described below).`,
      tags: ["ownership", "content", "intellectual property"]
    },
    {
      id: "creator-revenue",
      title: "2. Creator Revenue",
      icon: Coins,
      short: "You earn 80% on every sale. We take only 20% to run the platform.",
      body: `We operate a transparent revenue split. Unless otherwise agreed in a signed contract, creators receive 80% of the net sale price for items sold through the platform ("Creator Revenue"); Alton Studio retains 20% ("Platform Fee"). \n\nPayments: Payouts are issued according to the payout schedule shown on your account dashboard. Taxes, payment processing fees and chargebacks may affect the net amount paid to creators. The platform will not withhold tax on behalf of creators unless required by law.`,
      tags: ["revenue", "payment", "earnings", "payout"]
    },
    {
      id: "community",
      title: "3. Community Rules",
      icon: Users,
      short: `No hate speech, harassment, or illegal content; Respect copyright — only upload what you have rights to; Be kind. This is a creator-first community`,
      body: `Our community rules are designed to keep Alton Studio a safe, inclusive and creative place for everyone. Prohibited conduct includes — but is not limited to — hate speech, targeted harassment, illegal activity, explicit exploitation, and uploading content you do not have rights to. Violations may result in content removal, warnings, temporary suspension or permanent termination.`,
      tags: ["community", "rules", "conduct", "safety"]
    },
    {
      id: "termination",
      title: "4. Account Termination",
      icon: AlertCircle,
      short: "We reserve the right to suspend accounts that violate these rules.",
      body: `We may suspend or terminate accounts for repeated or severe violations of these Terms, for suspected fraud, for legal reasons, or if we reasonably believe continued access would cause harm to the platform or other users. Where possible we will provide notice and reasons, but we may act immediately in urgent situations. Termination does not relieve you of amounts owed to us.`,
      tags: ["termination", "suspension", "account", "violations"]
    },
    {
      id: "license",
      title: "5. Limited License to the Platform",
      icon: BookOpen,
      short: "You grant us a limited license so we can operate and display your content.",
      body: `By uploading content you grant Alton Studio a non-exclusive, worldwide, royalty-free license to host, store, reproduce, distribute, display and transmit your content for the purposes of operating and promoting the Service. This license is limited to what is reasonably necessary to provide and improve the Service and may be terminated by you by deleting your content, subject to certain operational constraints.`,
      tags: ["license", "content", "platform", "rights"]
    },
    {
      id: "ip",
      title: "6. Intellectual Property & Copyright",
      icon: Scale,
      short: "Respect copyright — only upload what you have rights to.",
      body: `If you believe your copyright has been infringed, please follow the DMCA notice process or other applicable takedown procedure described on our help center. We respond to valid notices and may terminate repeat infringers. You also agree not to circumvent DRM or other technical protections.`,
      tags: ["copyright", "intellectual property", "dmca", "infringement"]
    },
    {
      id: "privacy",
      title: "7. Privacy",
      icon: Shield,
      short: "We process personal data according to our Privacy Policy.",
      body: `Your use of the Service is subject to our Privacy Policy, which explains what personal data we collect, how we use it, how long we retain it and the choices available to you. By using the Service you consent to such processing and to the transfer of information in and to countries where data protection laws may be different.`,
      tags: ["privacy", "data", "personal information"]
    },
    {
      id: "liability",
      title: "8. Limitation of Liability",
      icon: AlertCircle,
      short: "We limit liability to the fullest permitted by law.",
      body: `To the maximum extent permitted by applicable law, Alton Studio and its affiliates will not be liable for indirect, incidental, special, consequential or punitive damages, or for loss of profits, revenue, data or use arising out of or in connection with these Terms or the Service. Our aggregate liability for direct damages is limited to the amount you paid to us in the 12 months prior to the claim, except where prohibited by law.`,
      tags: ["liability", "legal", "damages"]
    },
    {
      id: "indemnity",
      title: "9. Indemnification",
      icon: Scale,
      short: `You agree to indemnify and hold harmless Alton Studio against claims arising from your use of the Service.`,
      body: `You will defend, indemnify and hold harmless Alton Studio, its officers, directors, employees and agents from and against any claims, liabilities, damages, losses and expenses arising out of or in any way connected with Your Content, your breach of these Terms, or your violation of any law or the rights of a third party.`,
      tags: ["indemnification", "legal", "liability"]
    },
    {
      id: "governing",
      title: "10. Governing Law",
      icon: Scale,
      short: "These Terms are governed by the laws of the jurisdiction indicated in your account or the Company headquarters.",
      body: `These Terms will be governed by and construed in accordance with the laws of the jurisdiction where Alton Studio is incorporated, without regard to conflict of law principles. Where applicable consumer protection laws provide greater protection, those laws will apply.`,
      tags: ["law", "jurisdiction", "legal"]
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
              <a href="/terms" className={`block px-3 py-2 rounded-lg text-sm font-bold ${dark ? 'bg-purple-600/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
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
                href="mailto:support@alton.studio" 
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  dark ? 'bg-zinc-900/50 hover:bg-zinc-900/70 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Mail className="w-4 h-4" />
                Contact Support
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
              <Scale className="w-3 h-3" />
              Legal Document
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent leading-tight">
              Terms & Conditions
            </h1>
            <p className={`text-lg ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
              Last updated: <span className="font-semibold">November 2025</span>
            </p>
          </header>

          {/* Key Highlights Card */}
          <section className="mb-12">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Check className="w-6 h-6 text-purple-400" />
              Key Highlights
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-black text-purple-400 mb-2">100%</div>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>You own all your content</p>
              </div>
              <div>
                <div className="text-4xl font-black text-pink-400 mb-2">80%</div>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Creator revenue share</p>
              </div>
              <div>
                <div className="text-4xl font-black text-purple-400 mb-2">24/7</div>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Support available</p>
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
              <button 
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium transition-all"
              >
                Read Full Terms
              </button>
            </div>
          </section>

          {/* Search & Controls */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${dark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search terms and conditions..."
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

          {/* Overview */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-3">Overview</h2>
            <p className={dark ? 'text-gray-400' : 'text-gray-700'}>
              These Terms & Conditions govern your use of the Alton Studio platform. They sit alongside other policies such as our Privacy Policy. By using Alton Studio you agree to these Terms.
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
                    <div className={`pl-16 pt-2`}>
                      <p className={`whitespace-pre-line leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-700'}`}>
                        {s.body}
                      </p>

                      {s.id === "creator-revenue" && (
                        <div className={`mt-6 p-5 rounded-lg ${dark ? 'bg-white/5' : 'bg-purple-50'}`}>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Coins className="w-4 h-4 text-purple-400" />
                            Payout Example
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className={dark ? 'text-gray-400' : 'text-gray-600'}>Sale price</span>
                              <span className="font-semibold">$50.00</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={dark ? 'text-gray-400' : 'text-gray-600'}>Platform fee (20%)</span>
                              <span className="font-semibold text-purple-400">-$10.00</span>
                            </div>
                            <div className={`flex justify-between pt-2 border-t ${dark ? 'border-white/10' : 'border-purple-200'}`}>
                              <span className="font-bold">Creator receives</span>
                              <span className="font-bold text-lg text-green-500">$40.00</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}
          </article>

          {/* Support Section */}
          <section className={`mt-12 pt-12 border-t ${dark ? 'border-white/5' : 'border-gray-200'}`}>
            <h3 className="text-2xl font-bold mb-4">Need Help?</h3>
            <p className={`mb-8 ${dark ? 'text-gray-400' : 'text-gray-700'}`}>
              If you have questions about these Terms or need support, our team is here to help.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <a 
                href="mailto:support@alton.studio"
                className={`flex items-center gap-4 p-6 rounded-xl transition-all ${
                  dark ? 'hover:bg-white/5' : 'hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`p-3 rounded-lg ${dark ? 'bg-purple-600/10' : 'bg-purple-100'}`}>
                  <Mail className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="font-semibold mb-1">Email Support</div>
                  <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>support@alton.studio</div>
                </div>
              </a>
              <a 
                href="/help"
                className={`flex items-center gap-4 p-6 rounded-xl transition-all ${
                  dark ? 'hover:bg-white/5' : 'hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`p-3 rounded-lg ${dark ? 'bg-purple-600/10' : 'bg-purple-100'}`}>
                  <ExternalLink className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="font-semibold mb-1">Help Center</div>
                  <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Browse articles & guides</div>
                </div>
              </a>
            </div>
          </section>

          {/* Miscellaneous */}
          <section className={`mt-8 pt-6 pb-6 border-t text-sm ${dark ? 'border-white/5 text-gray-500' : 'border-gray-200 text-gray-600'}`}>
            <h4 className="font-semibold mb-2">Miscellaneous</h4>
            <p className="leading-relaxed">
              These Terms, together with any other legal notices published by us on the Service, constitute the entire agreement between you and Alton Studio concerning the Service. If a court finds a provision invalid, the remainder will continue in effect. No waiver by Alton Studio is effective unless in writing and signed.
            </p>
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