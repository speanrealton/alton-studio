'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

export default function PrinterProfilePageClient() {
  const params = useParams() as { id?: string };
  const id = params?.id;
  const router = useRouter();
  const [printer, setPrinter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({ service_type: '', quantity: 100, description: '' });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('printers')
        .select(`*, printer_services(*), printer_portfolio(*)`)
        .eq('id', id)
        .single();
      if (error) {
        console.error(error);
        setPrinter(null);
      } else if (mounted) {
        setPrinter(data);
      }
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const submitQuote = async (e: any) => {
    e && e.preventDefault();
    if (!user) {
      setStatus('Please sign in to request a quote.');
      return;
    }
    if (!printer) return;
    setSending(true);
    const { error } = await supabase.from('quote_requests').insert({
      printer_id: printer.id,
      user_id: user.id,
      service_type: form.service_type || (printer.printer_services?.[0]?.category || ''),
      quantity: Number(form.quantity || 1),
      description: form.description
    });
    setSending(false);
    if (error) {
      console.error(error);
      setStatus('Failed to send quote request.');
    } else {
      setStatus('Quote request sent — printers will respond via your dashboard.');
      // optionally navigate to /print and open quotes
      router.push('/print');
    }
  };

  if (loading) return <div className="p-8">Loading profile...</div>;
  if (!printer) return <div className="p-8">Printer not found. <Link href="/print">Back to directory</Link></div>;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto bg-zinc-950 border border-white/10 rounded-xl overflow-hidden">
        <div className="relative h-48 bg-gradient-to-br from-purple-900/20 to-pink-900/20">
          {printer.banner_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={printer.banner_url} alt={printer.company_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><h2 className="text-4xl font-black text-purple-400">{printer.company_name?.charAt(0)}</h2></div>
          )}
          <div className="absolute bottom-0 left-6 transform translate-y-1/2">
            <div className="w-24 h-24 bg-zinc-900 border-4 border-zinc-950 rounded-xl flex items-center justify-center overflow-hidden">
              {printer.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={printer.logo_url} alt={printer.company_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-purple-400">{printer.company_name?.charAt(0)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black text-white mb-1">{printer.company_name}</h1>
              <p className="text-sm text-gray-400">{printer.city}, {printer.country}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-white">{printer.rating?.toFixed(1) || 'New'}</div>
              <div className="text-xs text-gray-400">{printer.review_count || 0} reviews</div>
            </div>
          </div>

          {printer.about && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-2">About</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{printer.about}</p>
            </div>
          )}

          {printer.printer_services?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3">Services</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {printer.printer_services.map((s: any) => (
                  <div key={s.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-white text-sm">{s.service_name}</h4>
                      <span className="text-purple-400 font-bold text-sm">${s.starting_price}+</span>
                    </div>
                    {s.description && <p className="text-xs text-gray-400">{s.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-3">Request a Quote</h3>
            <form onSubmit={submitQuote} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Service</label>
                <select value={form.service_type} onChange={(e) => setForm(f => ({ ...f, service_type: e.target.value }))} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white">
                  <option value="">Select service</option>
                  {printer.printer_services?.map((s: any) => (
                    <option key={s.id} value={s.category}>{s.service_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Quantity</label>
                <input type="number" value={form.quantity} min={1} onChange={(e) => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">Details</label>
                <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white" placeholder="Project details, materials, deadline..."></textarea>
              </div>

              <div>
                <button type="submit" disabled={sending} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg font-bold text-sm flex items-center justify-center">
                  {sending ? 'Sending...' : 'Send Quote Request'}
                </button>
              </div>

              {status && <div className="text-sm text-gray-300">{status}</div>}
            </form>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-3">Contact</h3>
            <div className="flex gap-3 items-center">
              {printer.email && <a href={`mailto:${printer.email}`} className="text-purple-400">Email</a>}
              {printer.phone && <a href={`tel:${printer.phone}`} className="text-purple-400">Call</a>}
              {printer.website && <a href={printer.website} target="_blank" rel="noreferrer" className="text-purple-400">Website</a>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
