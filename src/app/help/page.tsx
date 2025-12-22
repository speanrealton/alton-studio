"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Sun, Moon, Search, Book, CreditCard, Shield, Users, Settings, Zap, MessageCircle, Mail, Phone, Clock, TrendingUp, FileText, HelpCircle, ChevronRight, ExternalLink, Video, Download, Upload, Tag, AlertCircle, CheckCircle } from "lucide-react";

export default function HelpCenter() {
  const [dark, setDark] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "All Topics", icon: Book },
    { id: "getting-started", name: "Getting Started", icon: Zap },
    { id: "account", name: "Account & Settings", icon: Settings },
    { id: "payments", name: "Payments & Payouts", icon: CreditCard },
    { id: "selling", name: "Selling & Creators", icon: TrendingUp },
    { id: "privacy", name: "Privacy & Security", icon: Shield },
    { id: "community", name: "Community", icon: Users },
  ];

  const articles = [
    // Getting Started
    {
      id: 1,
      category: "getting-started",
      title: "How to Create Your First Account",
      description: "Step-by-step guide to setting up your Alton Studio account and getting started.",
      icon: Zap,
      popular: true,
    },
    {
      id: 2,
      category: "getting-started",
      title: "Understanding the Dashboard",
      description: "Learn how to navigate and use all the features in your creator dashboard.",
      icon: Book,
      popular: true,
    },
    {
      id: 3,
      category: "getting-started",
      title: "Uploading Your First Product",
      description: "Everything you need to know about uploading and listing your first digital product.",
      icon: Upload,
      popular: true,
    },
    
    // Account & Settings
    {
      id: 4,
      category: "account",
      title: "Managing Your Profile",
      description: "Customize your profile, bio, social links, and public presence.",
      icon: Settings,
    },
    {
      id: 5,
      category: "account",
      title: "Two-Factor Authentication",
      description: "Enable 2FA to secure your account with an extra layer of protection.",
      icon: Shield,
      popular: true,
    },
    {
      id: 6,
      category: "account",
      title: "Changing Your Password",
      description: "How to update your password and recover account access.",
      icon: AlertCircle,
    },
    {
      id: 7,
      category: "account",
      title: "Email Preferences & Notifications",
      description: "Control what emails and notifications you receive from Alton Studio.",
      icon: Mail,
    },
    
    // Payments & Payouts
    {
      id: 8,
      category: "payments",
      title: "How Creator Payouts Work",
      description: "Understand the 80/20 revenue split and when you'll receive payments.",
      icon: CreditCard,
      popular: true,
    },
    {
      id: 9,
      category: "payments",
      title: "Setting Up Payment Methods",
      description: "Connect Stripe, PayPal, or bank accounts to receive your earnings.",
      icon: CreditCard,
    },
    {
      id: 10,
      category: "payments",
      title: "Understanding Fees & Taxes",
      description: "Learn about platform fees, payment processing, and tax obligations.",
      icon: FileText,
    },
    {
      id: 11,
      category: "payments",
      title: "Refunds & Chargebacks",
      description: "How refunds work and what to do if you receive a chargeback.",
      icon: AlertCircle,
    },
    
    // Selling & Creators
    {
      id: 12,
      category: "selling",
      title: "Pricing Your Products",
      description: "Best practices for setting competitive and profitable prices.",
      icon: Tag,
      popular: true,
    },
    {
      id: 13,
      category: "selling",
      title: "Product Descriptions & SEO",
      description: "Write compelling descriptions that help customers find your work.",
      icon: FileText,
    },
    {
      id: 14,
      category: "selling",
      title: "Managing Sales & Orders",
      description: "Track your sales, manage orders, and communicate with buyers.",
      icon: TrendingUp,
    },
    {
      id: 15,
      category: "selling",
      title: "File Formats & Requirements",
      description: "Supported file types, size limits, and technical requirements.",
      icon: Download,
    },
    
    // Privacy & Security
    {
      id: 16,
      category: "privacy",
      title: "Understanding Our Privacy Policy",
      description: "How we collect, use, and protect your personal information.",
      icon: Shield,
    },
    {
      id: 17,
      category: "privacy",
      title: "Cookie Settings & Preferences",
      description: "Manage cookies and tracking preferences in your browser.",
      icon: Settings,
    },
    {
      id: 18,
      category: "privacy",
      title: "Data Export & Deletion",
      description: "Request a copy of your data or permanently delete your account.",
      icon: Download,
    },
    {
      id: 19,
      category: "privacy",
      title: "Reporting Security Issues",
      description: "How to report vulnerabilities or security concerns to our team.",
      icon: AlertCircle,
    },
    
    // Community
    {
      id: 20,
      category: "community",
      title: "Community Guidelines",
      description: "Rules and expectations for participating in the Alton Studio community.",
      icon: Users,
      popular: true,
    },
    {
      id: 21,
      category: "community",
      title: "Reporting Violations",
      description: "How to report inappropriate content, copyright infringement, or abuse.",
      icon: AlertCircle,
    },
    {
      id: 22,
      category: "community",
      title: "Collaborating with Other Creators",
      description: "Best practices for partnerships, collaborations, and co-creation.",
      icon: Users,
    },
  ];

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularArticles = articles.filter(a => a.popular);

  return (
    <div className={dark ? "min-h-screen bg-black text-white" : "min-h-screen bg-white text-zinc-900"}>
      {/* Header */}
      <header className={`border-b ${dark ? 'border-white/5 bg-black/50' : 'border-gray-200 bg-white/80'} backdrop-blur-xl sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-semibold">Home</span>
            </a>
            <div className="hidden md:block">
              <h1 className="text-xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Help Center
              </h1>
            </div>
          </div>
          <button
            aria-label="Toggle theme"
            onClick={() => setDark((d) => !d)}
            className={`p-2 rounded-lg ${dark ? 'bg-zinc-900/50 hover:bg-zinc-900/70' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/20 text-purple-300 text-xs font-semibold mb-4">
            <HelpCircle className="w-3 h-3" />
            Support Hub
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent leading-tight">
            How can we help?
          </h1>
          <p className={`text-lg mb-8 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
            Search our knowledge base or browse by category
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${dark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 rounded-xl text-base ${
                dark 
                  ? 'bg-white/5 border border-white/10 focus:border-purple-500 text-white placeholder-gray-500' 
                  : 'bg-white border border-gray-200 focus:border-purple-400 text-gray-900 placeholder-gray-400 shadow-lg'
              } focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all`}
            />
          </div>
        </section>

        {/* Quick Links */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Popular Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularArticles.map((article) => {
              const Icon = article.icon;
              return (
                <a
                  key={article.id}
                  href={`/help/article/${article.id}`}
                  className={`group p-6 rounded-xl border transition-all ${
                    dark 
                      ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30' 
                      : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${dark ? 'bg-purple-600/10' : 'bg-purple-100'} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${dark ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold mb-2 group-hover:text-purple-400 transition-colors">{article.title}</h3>
                      <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{article.description}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 flex-shrink-0 ${dark ? 'text-gray-500' : 'text-gray-400'} group-hover:text-purple-400 transition-colors`} />
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === cat.id
                      ? dark 
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' 
                        : 'bg-purple-100 text-purple-700 border border-purple-300'
                      : dark
                        ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 border border-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Articles Grid */}
          <div className="space-y-3">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article) => {
                const Icon = article.icon;
                return (
                  <a
                    key={article.id}
                    href={`/help/article/${article.id}`}
                    className={`group flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      dark 
                        ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30' 
                        : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${dark ? 'bg-purple-600/10' : 'bg-purple-100'} flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${dark ? 'text-purple-400' : 'text-purple-600'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1 group-hover:text-purple-400 transition-colors">{article.title}</h3>
                      <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>{article.description}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 flex-shrink-0 ${dark ? 'text-gray-500' : 'text-gray-400'} group-hover:text-purple-400 transition-colors`} />
                  </a>
                );
              })
            ) : (
              <div className={`text-center py-12 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No articles found matching your search.</p>
                <button
                  onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
                  className="mt-4 text-purple-400 hover:text-purple-300 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Contact Support */}
        <section className={`mt-16 pt-16 border-t ${dark ? 'border-white/5' : 'border-gray-200'}`}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
            <p className={`text-lg ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
              Our support team is here to assist you
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <a
              href="mailto:support@alton.studio"
              className={`group p-8 rounded-xl border transition-all text-center ${
                dark 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30' 
                  : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg'
              }`}
            >
              <div className={`p-4 rounded-full ${dark ? 'bg-purple-600/10' : 'bg-purple-100'} w-fit mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                <Mail className={`w-8 h-8 ${dark ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <h3 className="font-bold mb-2">Email Support</h3>
              <p className={`text-sm mb-2 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                Get help via email
              </p>
              <div className="flex items-center justify-center gap-1 text-purple-400 text-sm font-medium">
                support@alton.studio
                <ExternalLink className="w-3 h-3" />
              </div>
            </a>

            <a
              href="/community"
              className={`group p-8 rounded-xl border transition-all text-center ${
                dark 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30' 
                  : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg'
              }`}
            >
              <div className={`p-4 rounded-full ${dark ? 'bg-purple-600/10' : 'bg-purple-100'} w-fit mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                <MessageCircle className={`w-8 h-8 ${dark ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <h3 className="font-bold mb-2">Community Forum</h3>
              <p className={`text-sm mb-2 ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                Ask questions and connect
              </p>
              <div className="flex items-center justify-center gap-1 text-purple-400 text-sm font-medium">
                Visit Forum
                <ChevronRight className="w-3 h-3" />
              </div>
            </a>

            <div
              className={`p-8 rounded-xl border text-center ${
                dark 
                  ? 'bg-white/5 border-white/10' 
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className={`p-4 rounded-full ${dark ? 'bg-purple-600/10' : 'bg-purple-100'} w-fit mx-auto mb-4`}>
                <Clock className={`w-8 h-8 ${dark ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <h3 className="font-bold mb-2">Response Time</h3>
              <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                We typically respond within 1-3 business days
              </p>
            </div>
          </div>
        </section>

        {/* Additional Resources */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Additional Resources</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <a
              href="/terms"
              className={`group flex items-center gap-4 p-6 rounded-xl border transition-all ${
                dark 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30' 
                  : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg'
              }`}
            >
              <div className={`p-3 rounded-lg ${dark ? 'bg-purple-600/10' : 'bg-purple-100'} flex-shrink-0`}>
                <FileText className={`w-6 h-6 ${dark ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1 group-hover:text-purple-400 transition-colors">Terms & Conditions</h3>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Platform rules and agreements</p>
              </div>
              <ChevronRight className={`w-5 h-5 ${dark ? 'text-gray-500' : 'text-gray-400'} group-hover:text-purple-400`} />
            </a>

            <a
              href="/privacy"
              className={`group flex items-center gap-4 p-6 rounded-xl border transition-all ${
                dark 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30' 
                  : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg'
              }`}
            >
              <div className={`p-3 rounded-lg ${dark ? 'bg-purple-600/10' : 'bg-purple-100'} flex-shrink-0`}>
                <Shield className={`w-6 h-6 ${dark ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1 group-hover:text-purple-400 transition-colors">Privacy Policy</h3>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>How we protect your data</p>
              </div>
              <ChevronRight className={`w-5 h-5 ${dark ? 'text-gray-500' : 'text-gray-400'} group-hover:text-purple-400`} />
            </a>

            <a
              href="/cookies"
              className={`group flex items-center gap-4 p-6 rounded-xl border transition-all ${
                dark 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30' 
                  : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg'
              }`}
            >
              <div className={`p-3 rounded-lg ${dark ? 'bg-purple-600/10' : 'bg-purple-100'} flex-shrink-0`}>
                <Settings className={`w-6 h-6 ${dark ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1 group-hover:text-purple-400 transition-colors">Cookie Policy</h3>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Manage cookie preferences</p>
              </div>
              <ChevronRight className={`w-5 h-5 ${dark ? 'text-gray-500' : 'text-gray-400'} group-hover:text-purple-400`} />
            </a>

            <a
              href="/help/system-status"
              className={`group flex items-center gap-4 p-6 rounded-xl border transition-all ${
                dark 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30' 
                  : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-lg'
              }`}
            >
              <div className={`p-3 rounded-lg ${dark ? 'bg-green-600/10' : 'bg-green-100'} flex-shrink-0`}>
                <CheckCircle className={`w-6 h-6 ${dark ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1 group-hover:text-purple-400 transition-colors">System Status</h3>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>Check platform uptime</p>
              </div>
              <ChevronRight className={`w-5 h-5 ${dark ? 'text-gray-500' : 'text-gray-400'} group-hover:text-purple-400`} />
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`mt-16 py-8 border-t ${dark ? 'border-white/5' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
            © {new Date().getFullYear()} Alton Studio. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}