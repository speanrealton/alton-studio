'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Send, Loader2, ArrowRight, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import GENERATED_KNOWLEDGE from './generated-knowledge.json';

type KnowledgeItem = { intent: string; triggers?: string[]; answer?: string };
type Message = { role: 'user' | 'ai'; text: string; meta?: { type: 'link' | 'video' | 'embed'; href: string } };
type AssistantResponse = string | { text: string; meta?: { type: 'link' | 'video' | 'embed'; href: string } };

export default function SuperChatSystem() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastLiveResults, setLastLiveResults] = useState<any[]>([]);
  const [creatingQuote, setCreatingQuote] = useState(false);
  const [showQuickQuoteModal, setShowQuickQuoteModal] = useState(false);
  const [quickTarget, setQuickTarget] = useState<any | null>(null);
  const [quickQuantity, setQuickQuantity] = useState<number>(100);
  const [quickService, setQuickService] = useState<string>('');
  const [quickServicesList, setQuickServicesList] = useState<Array<any>>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // --- COMPREHENSIVE KNOWLEDGE GRAPH ---
  const EMBEDDED_KNOWLEDGE: KnowledgeItem[] = [
    {
      intent: "Quoting & Pricing",
      triggers: ["quote", "price", "cost", "how much", "expensive", "pay", "billing", "budget"],
      answer: "Alton Studio uses a decentralized bidding system. To get a quote: \n1. Visit the 'Printers' tab.\n2. Select a Verified Printer.\n3. Use the 'Request Quote' button.\nPrices are not fixed because they depend on material choice, quantity, and turnaround speed. All payments are processed through our secure gateway."
    },
    {
      intent: "Trust & Verification",
      triggers: ["safe", "trust", "scam", "real", "verified", "check", "badge", "quality"],
      answer: "Every 'Verified' partner undergoes a 5-tier inspection: Facility Audit, Hardware Calibration Check, Fulfillment History review (>98% success), and Quality Control testing. Your transaction is held in escrow until you confirm the print quality."
    },
    {
      intent: "Capabilities & Materials",
      triggers: ["what", "print", "do you", "service", "can i", "material", "categories", "tshirt", "3d", "canvas"],
      answer: "We support professional production across: T-Shirts, Business Cards, Posters, Canvas, Packaging, and 3D Printing (FDM/SLA). If you have custom material requirements (like recycled fabrics or specific resins), filter for 'Specialist' printers in the directory."
    },
    {
      intent: "Platform Navigation",
      triggers: ["feed", "studio", "upload", "how work", "help", "nav"],
      answer: "The 'Alton Feed' is for community showcases and marketplace trends. The 'Studio' is where your design work happens. To start an order, simply find a printer and initiate a conversation via their profile."
    }
  ];

  // Merge embedded docs + generated knowledge
  const KNOWLEDGE_BASE: KnowledgeItem[] = ((): KnowledgeItem[] => {
    try { return [...EMBEDDED_KNOWLEDGE, ...((GENERATED_KNOWLEDGE as KnowledgeItem[]) || [])]; }
    catch { return [...EMBEDDED_KNOWLEDGE]; }
  })();

  // Lightweight NLP helpers (no external APIs)
  const tokenize = (s: string) => s.toLowerCase().split(/\W+/).filter(Boolean);
  const jaccard = (a: string[], b: string[]) => {
    const A = new Set(a);
    const B = new Set(b);
    const inter = new Set([...A].filter(x => B.has(x))).size;
    const uni = new Set([...A, ...B]).size || 1;
    return inter / uni;
  };

  const findBestMatch = (input: string) => {
    // Build TF-IDF vectors for KNOWLEDGE_BASE and the query (simple local embeddings)
    const docs = KNOWLEDGE_BASE.map(it => tokenize([it.intent, ...(it.triggers || []), it.answer || ''].join(' ')));
    const queryTokens = tokenize(input);
    const allTokens = Array.from(new Set(docs.flat().concat(queryTokens)));

    // document frequency
    const df: Record<string, number> = {};
    for (const t of allTokens) df[t] = 0;
    for (const d of docs) {
      const seen = new Set(d);
      for (const t of seen) df[t] = (df[t] || 0) + 1;
    }
    const N = docs.length || 1;

    const idf = (t: string) => Math.log((N + 1) / ((df[t] || 0) + 1)) + 1;

    const tfMap = (tokens: string[]) => {
      const m: Record<string, number> = {};
      for (const t of tokens) m[t] = (m[t] || 0) + 1;
      // normalize
      const len = Object.values(m).reduce((a, b) => a + b, 0) || 1;
      for (const k of Object.keys(m)) m[k] = m[k] / len;
      return m;
    };

    const toTfIdf = (tokens: string[]) => {
      const tf = tfMap(tokens);
      const vec: Record<string, number> = {};
      for (const t of Object.keys(tf)) vec[t] = tf[t] * idf(t);
      return vec;
    };

    const docsVec = docs.map(d => toTfIdf(d));
    const qVec = toTfIdf(queryTokens);

    const dot = (a: Record<string, number>, b: Record<string, number>) => {
      let s = 0;
      for (const k of Object.keys(a)) if (b[k]) s += a[k] * b[k];
      return s;
    };
    const norm = (a: Record<string, number>) => Math.sqrt(Object.values(a).reduce((acc, v) => acc + v * v, 0) || 1);

    let best = null;
    let bestScore = 0;
    for (let i = 0; i < KNOWLEDGE_BASE.length; i++) {
      const item = KNOWLEDGE_BASE[i];
      const hay = docs[i];
      const jScore = jaccard(queryTokens, hay);
      const inter = new Set(queryTokens.filter(t => hay.includes(t))).size;
      const overlapRatio = queryTokens.length ? inter / queryTokens.length : 0;

      const cosine = dot(qVec, docsVec[i]) / (norm(qVec) * norm(docsVec[i]) || 1);

      // combine: prefer semantic (cosine) but keep lexical signals
      const combined = (cosine * 0.7) + (overlapRatio * 0.45) + (jScore * 0.25);

      if (combined > bestScore) {
        bestScore = combined;
        best = { item, score: combined };
      }
    }

    return best ? { ...best, score: best.score } : null;
  };

  // return top N matches (re-uses TF-IDF logic but ranks all)
  const getTopMatches = useCallback((input: string, topN = 3) => {
    if (!input || !input.trim()) return [];
    const docs = KNOWLEDGE_BASE.map(it => tokenize([it.intent, ...(it.triggers || []), it.answer || ''].join(' ')));
    const queryTokens = tokenize(input);
    const allTokens = Array.from(new Set(docs.flat().concat(queryTokens)));
    const df: Record<string, number> = {};
    for (const t of allTokens) df[t] = 0;
    for (const d of docs) {
      const seen = new Set(d);
      for (const t of seen) df[t] = (df[t] || 0) + 1;
    }
    const N = docs.length || 1;
    const idf = (t: string) => Math.log((N + 1) / ((df[t] || 0) + 1)) + 1;
    const tfMap = (tokens: string[]) => {
      const m: Record<string, number> = {};
      for (const t of tokens) m[t] = (m[t] || 0) + 1;
      const len = Object.values(m).reduce((a, b) => a + b, 0) || 1;
      for (const k of Object.keys(m)) m[k] = m[k] / len;
      return m;
    };
    const toTfIdf = (tokens: string[]) => {
      const tf = tfMap(tokens);
      const vec: Record<string, number> = {};
      for (const t of Object.keys(tf)) vec[t] = tf[t] * idf(t);
      return vec;
    };
    const docsVec = docs.map(d => toTfIdf(d));
    const qVec = toTfIdf(queryTokens);
    const dot = (a: Record<string, number>, b: Record<string, number>) => {
      let s = 0;
      for (const k of Object.keys(a)) if (b[k]) s += a[k] * b[k];
      return s;
    };
    const norm = (a: Record<string, number>) => Math.sqrt(Object.values(a).reduce((acc, v) => acc + v * v, 0) || 1);

    const results: Array<{item:KnowledgeItem;score:number}> = [];
    for (let i = 0; i < KNOWLEDGE_BASE.length; i++) {
      const item = KNOWLEDGE_BASE[i];
      const hay = docs[i];
      const jScore = jaccard(queryTokens, hay);
      const inter = new Set(queryTokens.filter(t => hay.includes(t))).size;
      const overlapRatio = queryTokens.length ? inter / queryTokens.length : 0;
      const cosine = dot(qVec, docsVec[i]) / (norm(qVec) * norm(docsVec[i]) || 1);
      const combined = (cosine * 0.7) + (overlapRatio * 0.45) + (jScore * 0.25);
      results.push({ item, score: combined });
    }
    results.sort((a,b) => b.score - a.score);
    return results.slice(0, topN).map(r => ({ intent: r.item.intent || 'Unknown', score: Number((r.score || 0).toFixed(3)) }));
  }, [KNOWLEDGE_BASE]);

  // Response synthesizer that adds professional tone, follow-ups and clarifying questions
  const synthesize = (match: { item: KnowledgeItem; score: number } | null, input: string) => {
    const low = input.toLowerCase();
    const greetWords = ['hello','hi','hey','greetings','good morning','good afternoon','good evening'];
    if (greetWords.some(g => low.includes(g)) && tokenize(input).length <= 4) {
      return { text: `Hello — I'm Alton Core. How can I assist you with the site or your order today?` };
    }
    if (!match) {
      // fallback: ask for clarification and offer suggested topics
      return (
        "Thanks — I can help with site navigation, printing & materials, quoting, verification, or account/security. " +
        "Could you provide a bit more detail (e.g., which printer, or which page you're on)?"
      );
    }

    const { item, score } = match as { item: KnowledgeItem; score: number };
    // If confidence low, ask clarifying Q
    if (score < 0.12) {
      return { text: `I found information related to \"${item.intent}\", but I need a bit more context to be precise. Do you mean: ${item.intent} or something else?` };
    }

    // polish answer: professional, concise, and action-oriented
    const prefix = "Alton Core — Professional Assistant:\n";
    let answer = String(item.answer || '').trim();
    if (answer.length > 1200) answer = answer.slice(0, 1200) + '...';
    // If input contains a verb like 'how' or 'where' ask to offer steps
    // If the matched item corresponds to a site page, return link meta
    if (item.intent && item.intent.startsWith('Page:')) {
      let route = item.intent.replace(/^Page:\s*/i, '').trim();
      if (!route.startsWith('/')) route = `/${route}`;
      return { text: `${prefix}${answer}`, meta: { type: 'link' as const, href: route } };
    }

    if (/how|where|steps|process|quote|request|order/.test(input.toLowerCase())) {
      return { text: `${answer}\n\nIf you'd like, I can walk you through the steps — tell me which part you'd like to start with.` };
    }

    return { text: `${prefix}${answer}` };
  };

  // --- INTELLIGENT INFERENCE LOGIC (ENTRY) ---
  const categoryMap: Record<string, string> = {
    't-shirts': 'tshirt', 'tshirts': 'tshirt', 't-shirt': 'tshirt', 't shirt': 'tshirt',
    'business cards': 'business-card', 'business card': 'business-card', 'businesscards': 'business-card',
    'posters': 'poster', 'poster': 'poster',
    'canvas': 'canvas',
    'packaging': 'packaging',
    'promotional': 'promotional', 'promo': 'promotional',
    'large format': 'large-format', 'large-format': 'large-format',
    '3d': '3d-printing', '3d print': '3d-printing', '3d-print': '3d-printing', '3d-printing': '3d-printing'
  };

  const fetchLivePrinters = async (categoryId?: string) => {
    try {
      const q = supabase.from('printers').select(`id,company_name,city,country,logo_url,email,phone,rating,printer_services(*)`).eq('status', 'approved').order('rating', { ascending: false }).limit(40);
      const { data, error } = await q;
      if (error || !data) return [];
      let list = data as any[];
      if (categoryId) {
        list = list.filter(p => (p.printer_services || []).some((s: any) => s.category === categoryId));
      }
      return list.map(p => ({
        id: p.id,
        name: p.company_name || p.id,
        rating: p.rating || 0,
        location: `${p.city || ''}${p.country ? ', ' + p.country : ''}`,
        profileUrl: `/printer/${p.id}`,
        logo: p.logo_url || null,
        email: p.email || null
      }));
    } catch (e) {
      return [];
    }
  };

  // Attempt to parse chat-initiated quote commands like: "request quote 1 for 500 business cards"
  const handleQuoteCommand = async (input: string) => {
    const userResp = await supabase.auth.getUser();
    const currentUser = (userResp?.data as any)?.user || null;
    if (!currentUser) return { text: 'Please sign in to request quotes.' };

    // match: request quote <index> [for <quantity>] [<service text>]
    const re = /(?:request quote|quote)\s+(\d+)(?:\s+for\s+(\d+))?(?:\s+(.*))?$/i;
    const m = input.match(re);
    if (!m) return null;
    const idx = parseInt(m[1], 10);
    const qty = m[2] ? parseInt(m[2], 10) : 100;
    const serviceText = m[3] ? m[3].trim() : '';

    if (!lastLiveResults || lastLiveResults.length === 0) {
      return { text: 'I don\'t have a recent list of printers to reference. Ask me to show printers first (e.g., "show business cards").' };
    }
    if (isNaN(idx) || idx < 1 || idx > lastLiveResults.length) {
      return { text: `Please provide a valid printer number between 1 and ${lastLiveResults.length}.` };
    }

    let selected = lastLiveResults[idx - 1];
    // if not found by index, try matching by name
    if (!selected) {
      const nameMatch = Object.values(lastLiveResults).find((p: any) => (p.name || '').toLowerCase().includes((m[1] || '').toLowerCase()));
      if (nameMatch) selected = nameMatch as any;
    }
    if (!selected) return { text: 'Could not find that printer.' };

    // Try to get a sensible service_type from the printer services if available
    let service_type = serviceText;
    // normalize service text against categoryMap
    if (service_type) {
      const sk = Object.keys(categoryMap).find(k => service_type.toLowerCase().includes(k));
      if (sk) service_type = categoryMap[sk];
    }
    if (!service_type) {
      try {
        const { data } = await supabase.from('printer_services').select('category').eq('printer_id', selected.id).limit(1);
        if (data && data[0]) service_type = data[0].category || '';
      } catch (e) {
        // ignore
      }
    }

    const payload: any = {
      printer_id: selected.id,
      user_id: currentUser.id,
      service_type: service_type || 'general',
      quantity: qty,
      description: `Requested via chat: ${input}`
    };

    const { error } = await supabase.from('quote_requests').insert(payload);
    if (error) {
      console.error('Quote create error:', error);
      return { text: 'Failed to create quote request — please try again.' };
    }

    return { text: `Quote request sent to ${selected.name} for ${qty} items. You can view responses in your Dashboard > Received Quotes.` };
  };

  const createQuote = async (printerId: string, quantity = 100, serviceType = 'general') => {
    setCreatingQuote(true);
    try {
      const { data: userResp } = await supabase.auth.getUser();
      const currentUser = (userResp as any)?.user;
      if (!currentUser) {
        setMessages(m => [...m, { role: 'ai', text: 'Please sign in to request quotes.' }]);
        return;
      }

      const payload = {
        printer_id: printerId,
        user_id: currentUser.id,
        service_type: serviceType,
        quantity,
        description: `Requested via chat quick action`
      };

      const { error } = await supabase.from('quote_requests').insert(payload);
      if (error) {
        console.error('Quote create error:', error);
        setMessages(m => [...m, { role: 'ai', text: 'Failed to create quote request — please try again.' }]);
      } else {
        // find printer name
        const p = lastLiveResults.find(p => p.id === printerId) || null;
        setMessages(m => [...m, { role: 'ai', text: `Quote request sent to ${p?.name || 'printer'} for ${quantity} items.` }]);
      }
    } finally {
      setCreatingQuote(false);
    }
  };

  const openQuickQuote = async (printer: any) => {
    setQuickTarget(printer);
    setQuickQuantity(100);
    setQuickService('');
    setQuickServicesList([]);
    setShowQuickQuoteModal(true);
    try {
      const { data } = await supabase.from('printer_services').select('id,service_name,category').eq('printer_id', printer.id).order('id');
      if (data) setQuickServicesList(data as any[]);
    } catch (e) {
      // ignore
    }
  };

  const submitQuickQuote = async (e?: any) => {
    e && e.preventDefault();
    if (!quickTarget) return;
    await createQuote(quickTarget.id, quickQuantity, quickService || (quickServicesList[0]?.category || 'general'));
    setShowQuickQuoteModal(false);
    setQuickTarget(null);
    setQuickQuantity(100);
    setQuickService('');
    setQuickServicesList([]);
  };

  const analyzeAndRespond = async (input: string): Promise<AssistantResponse> => {
    if (!input || !input.trim()) return { text: "Could you rephrase that? I didn't catch the question." };
    const cleaned = input.trim();

    // greeting detection
    const low = cleaned.toLowerCase();
    const greetWords: string[] = ['hello','hi','hey','greetings','good morning','good afternoon','good evening'];
    if (greetWords.some(g => low.includes(g)) && tokenize(cleaned).length <= 6) {
      return { text: `Hello — I'm Alton Core. How can I assist you with the site or your order today?` };
    }

    // Check for printer-category queries: map common words to category ids and fetch live printers
    const normalized = cleaned.toLowerCase();
    const matchedKey = Object.keys(categoryMap).find(k => normalized.includes(k));
    if (matchedKey) {
      const categoryId = categoryMap[matchedKey];
      const live = await fetchLivePrinters(categoryId);
      if (live && live.length) {
        setLastLiveResults(live);
        const top = live.slice(0, 6).map((c, i) => ({ index: i + 1, id: c.id, name: c.name, rating: c.rating, location: c.location, profileUrl: c.profileUrl, logo: c.logo }));
        const reply = { text: `Here are top-rated ${matchedKey} companies (live):`, meta: { printers: top } } as any;
        setMessages((m) => [...m, { role: 'ai', text: reply.text, meta: reply.meta }]);
        return reply as any;
      }
    }

    // If user asked to request a quote via chat, handle it
    if (/\b(?:request quote|quote)\b/i.test(cleaned)) {
      const qResp = await handleQuoteCommand(cleaned);
      if (qResp) return qResp;
    }

    // direct intent/trigger match first (strong match)
    const direct = KNOWLEDGE_BASE.find(k => (k.triggers || []).some((t: string) => low.includes(t)));
    if (direct) return synthesize({ item: direct, score: 1.0 }, cleaned);

    // fuzzy match via TF-IDF + lexical signals
    const best = findBestMatch(cleaned);
    return synthesize(best, cleaned);
  };

  const suggestions = ((): Array<{intent:string;score:number}> => {
    if (!newMessage || !newMessage.trim()) return [];
    return getTopMatches(newMessage, 4).filter(s => s.score > 0.05);
  })();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user as unknown as Record<string, unknown>);
        setMessages([{
          role: 'ai',
          text: `Neural Link Active. I am the Alton Core. I've analyzed 12+ countries and 50+ printing facilities. How can I optimize your production today?`
        }]);
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const userText = newMessage;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setNewMessage('');
    setIsTyping(true);

    try {
      const resp = await analyzeAndRespond(userText);
      if (!resp) {
        setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I could not process that.' }]);
      } else if (typeof resp === 'string') {
        setMessages(prev => [...prev, { role: 'ai', text: resp }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: resp.text || String(resp), ...(resp.meta ? { meta: resp.meta } : {}) }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: 'An error occurred while fetching live data.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  

  useEffect(() => {
    if (showChat) inputRef.current?.focus();
  }, [showChat]);

  if (!user) return null;

  return (
    <>
      <button 
        onClick={() => setShowChat(true)} 
        title="Open chat"
        aria-label="Open chat"
        className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-black border border-purple-500/50 rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group overflow-hidden"
      >
        <div className="absolute inset-0 bg-linear-to-t from-purple-600/20 to-transparent" />
        <Image src="/logo2.svg" alt="Alton" width={32} height={32} className="relative z-10" />
      </button>

      <AnimatePresence>
        {showChat && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-8 right-8 z-50 w-[440px] h-[680px] bg-[#0c0c0e] border border-white/10 rounded-none shadow-[0_40px_100px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden"
          >
            {/* Cyber Header */}
            <div className="p-6 bg-linear-to-r from-zinc-900/50 to-zinc-800/30 border-b border-white/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 relative flex-shrink-0">
                  <Image src="/logo2.svg" alt="Alton Logo" fill className="object-contain" />
                </div>
                <div>
                  <h2 className="text-[12px] font-black tracking-[0.25em] text-white uppercase">
                    ALTON ASSISTANT AI
                  </h2>
                  <p className="text-[10px] text-zinc-400 font-mono mt-1 uppercase tracking-widest">Protocol v4.0.2 • Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowChat(false)} title="Close chat" aria-label="Close chat" className="text-zinc-600 hover:text-white transition p-2 rounded-none"><X className="w-6 h-6"/></button>
              </div>
            </div>

            {/* Response Stream */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] ${msg.role === 'user' ? 'text-right' : 'text-left'} flex items-end gap-3`}> 
                    {msg.role !== 'user' && (
                      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center p-0">
                        <Image src="/logo2.svg" alt="Alton" width={32} height={32} className="object-contain" />
                      </div>
                    )}
                    <div className={`p-4 rounded-none text-[13px] leading-relaxed shadow-sm max-w-full ${
                      msg.role === 'user' 
                        ? 'bg-white text-black font-semibold' 
                        : 'bg-zinc-900/70 text-zinc-200 border border-white/6 backdrop-blur-sm'
                    }`}>
                      {msg.text}
                      {msg.meta && msg.meta.type === 'link' && (
                        <div className="mt-3 p-3 bg-black/40 border border-white/6 rounded-none">
                          <a href={msg.meta.href} target="_blank" rel="noreferrer" className="text-sm text-purple-300 underline">Open related page</a>
                        </div>
                      )}
                      {msg.meta && (msg.meta as any).printers && (
                        <div className="mt-3 space-y-2">
                          {(msg.meta as any).printers.map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between bg-black/20 p-2 rounded">
                              <div className="flex items-center gap-3">
                                {p.logo ? (<img src={p.logo} alt={p.name} className="w-8 h-8 object-cover rounded" />) : (<div className="w-8 h-8 bg-white/5 rounded flex items-center justify-center text-xs">P</div>)}
                                <div className="text-sm">
                                  <div className="font-bold">{p.index}. {p.name}</div>
                                  <div className="text-xs text-gray-400">{p.rating}⭐ • {p.location}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <a href={p.profileUrl} target="_blank" rel="noreferrer" className="px-3 py-1 bg-white/5 rounded text-xs">View</a>
                                <button onClick={() => openQuickQuote(p)} disabled={creatingQuote} className="px-3 py-1 bg-purple-600 rounded text-xs text-white">Request Quote</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 bg-transparent flex items-center justify-center p-0">
                        <Send className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-3 text-[10px] text-purple-500 font-black tracking-widest animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" /> RUNNING HEURISTIC ANALYSIS...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input & Quick Intents */}
              <div className="p-8 bg-zinc-900/20 border-t border-white/5">
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2" />
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Command className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                  <input 
                    ref={inputRef}
                    value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask me about the site, quoting, printers, or type 'help'..." 
                    className="w-full bg-linear-to-b from-zinc-900/60 to-black border border-white/8 rounded-none pl-12 pr-5 py-4 text-sm text-white focus:outline-none focus:border-purple-500/40 transition-all font-mono" 
                  />
                  {suggestions.length > 0 && (
                    <div className="mt-2 absolute left-0 right-0 top-full z-40 bg-zinc-900/80 border border-white/5 rounded-none p-3 flex gap-2 overflow-x-auto">
                            {suggestions.map(s => (
                              <button key={s.intent} onClick={() => { setNewMessage(s.intent); inputRef.current?.focus(); }} aria-label={`Suggestion ${s.intent}`} className="px-3 py-1 rounded-none bg-white/5 hover:bg-white/10 text-[11px] text-zinc-300 font-semibold">
                                {s.intent} <span className="ml-2 text-[10px] text-zinc-500">{s.score}</span>
                              </button>
                            ))}
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleSend}
                  title="Send message"
                  aria-label="Send message"
                  className="w-14 h-14 bg-white text-black rounded-none flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all shadow-2xl active:scale-90"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
            <AnimatePresence>
              {showQuickQuoteModal && quickTarget && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowQuickQuoteModal(false)} className="fixed inset-0 bg-black/80 z-50" />
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="fixed right-8 bottom-[140px] z-60 w-[360px] bg-zinc-950 border border-white/10 rounded-xl p-5">
                    <h3 className="text-sm font-bold mb-2">Request Quote — {quickTarget.name}</h3>
                    <form onSubmit={submitQuickQuote} className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400">Service</label>
                        <select value={quickService} onChange={(e) => setQuickService(e.target.value)} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-sm">
                          <option value="">Select service</option>
                          {quickServicesList.length === 0 && <option value="general">General</option>}
                          {quickServicesList.map(s => (<option key={s.id} value={s.category}>{s.service_name}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Quantity</label>
                        <input type="number" value={quickQuantity} min={1} onChange={(e) => setQuickQuantity(Number(e.target.value))} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-sm" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="submit" disabled={creatingQuote} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 py-2 rounded text-sm font-bold">Send Request</button>
                        <button type="button" onClick={() => setShowQuickQuoteModal(false)} className="px-3 py-2 bg-white/5 rounded text-sm">Cancel</button>
                      </div>
                    </form>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}