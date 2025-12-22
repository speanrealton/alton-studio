// src/app/settings/page.tsx - SYNCED VERSION
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Loader2, User, Mail, Shield, Bell, Sun, Moon, Camera, UploadCloud,
  Trash2, Database, LogOut, Calendar, DollarSign, ChevronDown,
  Smartphone, Clock, AlertCircle, CheckCircle, XCircle, Download,
  Zap, Radio, Volume2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllCurrencies, getCurrencyName, getCurrencySymbol, type CurrencyCode } from '@/lib/currencies';

type ProfileRow = {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  location?: string | null;
};

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [locationField, setLocationField] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'security' | 'notifications' | 'preferences' | 'data'>('profile');
  const [message, setMessage] = useState<{ text: string; type?: 'success' | 'error' } | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);

  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(30);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketplaceNotifications, setMarketplaceNotifications] = useState(true);
  const [communityNotifications, setCommunityNotifications] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState('weekly');

  // Data settings
  const [dataRetention, setDataRetention] = useState('12');

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth');
          return;
        }
        setUser(user);
        setEmail(user.email ?? '');

        const metaBanner = (user.user_metadata as any)?.banner_url;
        if (metaBanner) setBannerUrl(metaBanner);

        const preferredCurrency = (user.user_metadata as any)?.preferred_currency || 'USD';
        setSelectedCurrency(preferredCurrency);

        await fetchProfile(user.id);
      } catch (err) {
        console.error('init error', err);
        router.push('/auth');
      } finally {
        setPageLoading(false);
      }
    };

    init();
  }, [router]);

  const fetchProfile = async (userId?: string) => {
    if (!userId && !user) return;
    const id = userId ?? user!.id;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,username,full_name,avatar_url,bio,location')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setUsername(data.username ?? '');
        setFullName(data.full_name ?? '');
        setBio(data.bio ?? '');
        setLocationField(data.location ?? '');
        setAvatarUrl(data.avatar_url ?? null);
      } else {
        setProfile(null);
        setUsername('');
        setFullName('');
        setBio('');
        setLocationField('');
        setAvatarUrl(null);
      }
    } catch (err) {
      console.error('fetchProfile error', err);
      setMessage({ text: 'Failed to load profile.', type: 'error' });
    }
  };

  const saveProfile = async () => {
    if (!user) return setMessage({ text: 'No authenticated user', type: 'error' });
    setLoading(true);
    setMessage(null);

    const payload: Partial<ProfileRow> = {
      id: user.id,
      username: username || null,
      full_name: fullName || null,
      bio: bio || null,
      location: locationField || null,
      avatar_url: avatarUrl || null,
    };

    try {
      // 1. Update profiles table
      const { error: profileError } = await supabase.from('profiles').upsert(payload, { returning: 'representation' });
      if (profileError) throw profileError;

      // 2. SYNC to user_metadata (THIS IS THE KEY ADDITION)
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          username: username || null,
          full_name: fullName || null,
          bio: bio || null,
          profile_picture: avatarUrl || null,
          preferred_currency: selectedCurrency,
        }
      });
      if (metadataError) throw metadataError;

      // 3. Update all existing videos with new creator info
      const { error: videosError } = await supabase
        .from('printing_videos')
        .update({
          creator_name: fullName || username || user.email?.split('@')[0] || 'User',
          creator_username: username || user.email?.split('@')[0] || 'user',
          creator_profile_picture: avatarUrl || null,
        })
        .eq('creator_id', user.id);

      if (videosError) throw videosError;

      setMessage({ text: 'Profile saved and synced everywhere!', type: 'success' });
      await fetchProfile(user.id);
    } catch (err: any) {
      console.error('saveProfile error', err);
      setMessage({ text: err.message || 'Failed to save profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file?: File) => {
    if (!file || !user) return;
    setUploadingAvatar(true);
    setMessage(null);
    try {
      const ext = file.name.split('.').pop();
      // Add timestamp to filename to avoid caching issues
      const timestamp = Date.now();
      const filePath = `avatars/${user.id}/avatar-${timestamp}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Add cache buster to URL
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrlWithCache = `${publicUrl}?v=${timestamp}`;

      // Update profiles table
      const { error: updateError } = await supabase.from('profiles').upsert({ id: user.id, avatar_url: publicUrlWithCache });
      if (updateError) throw updateError;

      // SYNC to user_metadata
      await supabase.auth.updateUser({
        data: { profile_picture: publicUrlWithCache }
      });

      // Update all videos
      await supabase
        .from('printing_videos')
        .update({ creator_profile_picture: publicUrlWithCache })
        .eq('creator_id', user.id);

      setAvatarUrl(publicUrlWithCache);
      setMessage({ text: 'Avatar uploaded and synced!', type: 'success' });
      
      // Force re-fetch to get fresh data
      await fetchProfile(user.id);
      
      // Force page refresh of images by clearing React state temporarily
      setAvatarUrl(null);
      setTimeout(() => setAvatarUrl(publicUrlWithCache), 100);
    } catch (err: any) {
      console.error('uploadAvatar error', err);
      setMessage({ text: err.message || 'Failed to upload avatar', type: 'error' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const uploadBanner = async (file?: File) => {
    if (!file || !user) return;
    setUploadingBanner(true);
    setMessage(null);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `banners/${user.id}/banner.${ext}`;

      const { error: uploadError } = await supabase.storage.from('banners').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(filePath);

      const { error: updateUserErr } = await supabase.auth.updateUser({
        data: { banner_url: publicUrl },
      });
      if (updateUserErr) throw updateUserErr;

      setBannerUrl(publicUrl);
      setMessage({ text: 'Banner uploaded and saved!', type: 'success' });
    } catch (err: any) {
      console.error('uploadBanner error', err);
      setMessage({ text: err.message || 'Failed to upload banner', type: 'error' });
    } finally {
      setUploadingBanner(false);
    }
  };

  const removeAvatar = async () => {
    if (!user) return;
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
      if (error) throw error;

      // SYNC to user_metadata
      await supabase.auth.updateUser({
        data: { profile_picture: null }
      });

      // Update all videos
      await supabase
        .from('printing_videos')
        .update({ creator_profile_picture: null })
        .eq('creator_id', user.id);

      setAvatarUrl(null);
      setMessage({ text: 'Avatar removed and synced!', type: 'success' });
      await fetchProfile(user.id);
    } catch (err: any) {
      console.error('removeAvatar error', err);
      setMessage({ text: err.message || 'Failed to remove avatar', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const removeBanner = async () => {
    if (!user) return;
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ data: { banner_url: null } });
      if (error) throw error;
      setBannerUrl(null);
      setMessage({ text: 'Banner removed.', type: 'success' });
    } catch (err: any) {
      console.error('removeBanner error', err);
      setMessage({ text: err.message || 'Failed to remove banner', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      setMessage({ text: 'Email update request sent — check your inbox!', type: 'success' });
    } catch (err: any) {
      console.error('updateEmail error', err);
      setMessage({ text: err.message || 'Failed to update email', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (password.length < 6) {
        setMessage({ text: 'Password must be at least 6 characters', type: 'error' });
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage({ text: 'Password updated successfully!', type: 'success' });
      setPassword('');
    } catch (err: any) {
      console.error('updatePassword error', err);
      setMessage({ text: err.message || 'Failed to update password', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const saveCurrencyPreference = async () => {
    if (!user) return;
    setSavingCurrency(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          preferred_currency: selectedCurrency,
        }
      });
      if (error) throw error;
      setMessage({ text: `Currency preference updated to ${selectedCurrency}!`, type: 'success' });
      setShowCurrencyDropdown(false);
    } catch (err: any) {
      console.error('saveCurrencyPreference error', err);
      setMessage({ text: err.message || 'Failed to save currency preference', type: 'error' });
    } finally {
      setSavingCurrency(false);
    }
  };

  const saveSecuritySettings = async () => {
    if (!user) return;
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          security_settings: {
            twoFactorEnabled,
            loginAlerts,
            sessionTimeout,
          }
        }
      });
      if (error) throw error;
      setMessage({ text: 'Security settings saved successfully!', type: 'success' });
    } catch (err: any) {
      console.error('saveSecuritySettings error', err);
      setMessage({ text: err.message || 'Failed to save security settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    if (!user) return;
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          notification_settings: {
            emailNotifications,
            pushNotifications,
            marketplaceNotifications,
            communityNotifications,
            digestFrequency,
          }
        }
      });
      if (error) throw error;
      setMessage({ text: 'Notification preferences updated!', type: 'success' });
    } catch (err: any) {
      console.error('saveNotificationSettings error', err);
      setMessage({ text: err.message || 'Failed to save notification settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const saveDataSettings = async () => {
    if (!user) return;
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          data_settings: {
            dataRetention,
          }
        }
      });
      if (error) throw error;
      setMessage({ text: 'Data settings saved successfully!', type: 'success' });
    } catch (err: any) {
      console.error('saveDataSettings error', err);
      setMessage({ text: err.message || 'Failed to save data settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const exportUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userData = {
        id: user.id,
        email: user.email,
        profile: profile,
        exportedAt: new Date().toISOString(),
      };
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-data-${user.id}.json`;
      link.click();
      setMessage({ text: 'User data exported successfully!', type: 'success' });
    } catch (err: any) {
      console.error('exportUserData error', err);
      setMessage({ text: 'Failed to export user data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} min-h-screen pb-20`}>
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-current">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>

            <div>
              <h1 className="text-3xl font-extrabold">Settings</h1>
              <p className="text-sm text-gray-400">Manage your profile, security, and data.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-lg px-3 py-2 bg-white/5 hover:bg-white/10 transition"
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-300" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={signOut}
              className="rounded-lg px-3 py-2 bg-red-600 hover:bg-red-700 transition text-white flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1">
            <div className={`${darkMode ? 'bg-white/5' : 'bg-white'} rounded-2xl p-4 sticky top-24`}>
              <div className="flex flex-col items-center gap-4 pb-4 border-b border-white/10 mb-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl font-bold overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user?.email?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const el = document.getElementById('avatar-file-input');
                      (el as HTMLInputElement | null)?.click();
                    }}
                    className="absolute -bottom-1 -right-1 bg-white/10 p-2 rounded-full hover:bg-white/20"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center">
                  <div className="font-semibold">{fullName || user?.email}</div>
                  <div className="text-xs text-gray-400">@{username || user?.email?.split('@')[0]}</div>
                </div>
              </div>

              <nav className="flex flex-col gap-2">
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'account', label: 'Account', icon: Mail },
                  { id: 'security', label: 'Security', icon: Shield },
                  { id: 'notifications', label: 'Notifications', icon: Bell },
                  { id: 'preferences', label: 'Preferences', icon: Sun },
                  { id: 'data', label: 'Data', icon: Database },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md transition ${
                      activeTab === t.id ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    <t.icon className="w-5 h-5" />
                    <span className="font-medium">{t.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <main className="lg:col-span-3 space-y-6">
            <div className={`${darkMode ? 'bg-white/5' : 'bg-white'} rounded-2xl p-6`}>
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold">Profile</h2>
                        <p className="text-sm text-gray-400">Changes sync to marketplace feed automatically</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Full name</label>
                        <input className="w-full p-3 rounded-lg bg-transparent border border-white/10" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">Username</label>
                        <div className="flex">
                          <span className="px-3 py-3 rounded-l-lg bg-white/6 border border-r-0 border-white/10">@</span>
                          <input className="w-full p-3 rounded-r-lg bg-transparent border border-white/10" value={username} onChange={(e) => setUsername(e.target.value)} />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2">Bio</label>
                        <textarea className="w-full p-3 rounded-lg bg-transparent border border-white/10" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">Location</label>
                        <input className="w-full p-3 rounded-lg bg-transparent border border-white/10" value={locationField} onChange={(e) => setLocationField(e.target.value)} />
                      </div>

                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <div className="p-4 border border-white/6 rounded-lg">
                          <label className="block text-sm font-semibold mb-2">Avatar</label>
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-white/5 overflow-hidden flex items-center justify-center">
                              {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-2xl">{user?.email?.charAt(0).toUpperCase()}</span>}
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="inline-flex items-center gap-2 px-3 py-2 rounded bg-white/5 cursor-pointer">
                                <input id="avatar-file-input" type="file" accept="image/*" onChange={(e) => uploadAvatar(e.target.files?.[0])} className="hidden" />
                                <UploadCloud className="w-4 h-4" /> Upload
                              </label>
                              <button onClick={removeAvatar} className="px-3 py-2 rounded bg-white/5 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Remove</button>
                              {uploadingAvatar && <div className="text-sm text-gray-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</div>}
                            </div>
                          </div>
                        </div>

                        <div className="p-4 border border-white/6 rounded-lg">
                          <label className="block text-sm font-semibold mb-2">Banner</label>
                          <div className="flex flex-col gap-3">
                            <div className="h-32 rounded-md bg-white/5 overflow-hidden flex items-center justify-center">
                              {bannerUrl ? <img src={bannerUrl} alt="banner" className="w-full h-full object-cover" /> : <span className="text-sm text-gray-400">No banner</span>}
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="inline-flex items-center gap-2 px-3 py-2 rounded bg-white/5 cursor-pointer">
                                <input type="file" accept="image/*" onChange={(e) => uploadBanner(e.target.files?.[0])} className="hidden" />
                                <UploadCloud className="w-4 h-4" /> Upload
                              </label>
                              <button onClick={removeBanner} className="px-3 py-2 rounded bg-white/5 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Remove</button>
                              {uploadingBanner && <div className="text-sm text-gray-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</div>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button onClick={saveProfile} disabled={loading} className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 font-semibold">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Sync Profile'}
                      </button>
                      <button onClick={() => { fetchProfile(user!.id); setMessage({ text: 'Reverted changes', type: 'success' }); }} className="px-4 py-2 rounded-lg bg-white/5">Revert</button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'account' && (
                  <motion.div key="account" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                    <h2 className="text-xl font-bold mb-4">Account</h2>
                    <div className="grid gap-4">
                      <form onSubmit={updateEmail} className="grid sm:grid-cols-3 gap-3 items-end">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold mb-2">Email</label>
                          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 rounded-lg bg-transparent border border-white/10" />
                        </div>
                        <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600">
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                        </button>
                      </form>

                      <form onSubmit={updatePassword} className="grid sm:grid-cols-3 gap-3 items-end">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold mb-2">New password</label>
                          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full p-3 rounded-lg bg-transparent border border-white/10" />
                        </div>
                        <button type="submit" disabled={loading || !password} className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600">
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Change'}
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'preferences' && (
                  <motion.div key="preferences" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                    <h2 className="text-xl font-bold mb-4">Preferences</h2>
                    
                    <div className="space-y-6">
                      <div className="p-4 border border-white/10 rounded-lg">
                        <div className="flex items-start gap-3">
                          <DollarSign className="w-5 h-5 text-purple-400 mt-1" />
                          <div className="flex-1">
                            <label className="block text-sm font-semibold mb-2">Display Currency</label>
                            <p className="text-xs text-gray-400 mb-3">Choose your preferred currency for displaying prices and amounts across the platform.</p>
                            
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                                className="w-full sm:w-64 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition flex items-center justify-between text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold">{getCurrencySymbol(selectedCurrency)}</span>
                                  <span className="text-xs text-gray-400">{selectedCurrency}</span>
                                  <span className="text-xs text-gray-500">- {getCurrencyName(selectedCurrency)}</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 transition ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
                              </button>

                              {showCurrencyDropdown && (
                                <div className="absolute top-full left-0 mt-2 w-full sm:w-80 bg-gray-950 border border-white/10 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                                  <div className="p-2">
                                    {getAllCurrencies().map((currency) => (
                                      <button
                                        key={currency}
                                        type="button"
                                        onClick={() => {
                                          setSelectedCurrency(currency);
                                          setShowCurrencyDropdown(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-md transition flex items-center justify-between ${
                                          selectedCurrency === currency
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                            : 'hover:bg-white/5 text-gray-300'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 flex-1">
                                          <span className="text-sm font-semibold">{getCurrencySymbol(currency)}</span>
                                          <span className="text-xs">{currency}</span>
                                          <span className="text-xs text-gray-400 flex-1">{getCurrencyName(currency)}</span>
                                        </div>
                                        {selectedCurrency === currency && <span className="text-sm">✓</span>}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={saveCurrencyPreference}
                              disabled={savingCurrency}
                              className="mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 font-semibold text-sm inline-flex items-center gap-2"
                            >
                              {savingCurrency ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                              Save Currency
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div key="security" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                    <h2 className="text-xl font-bold mb-4">Security</h2>
                    <div className="space-y-6">
                      <div className="p-4 border border-white/10 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-blue-400" />
                            <div>
                              <p className="font-semibold">Two-Factor Authentication</p>
                              <p className="text-xs text-gray-400">Add an extra layer of security to your account</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                              twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-700'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 border border-white/10 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-orange-400" />
                            <div>
                              <p className="font-semibold">Login Alerts</p>
                              <p className="text-xs text-gray-400">Get notified of suspicious login attempts</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setLoginAlerts(!loginAlerts)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                              loginAlerts ? 'bg-orange-600' : 'bg-gray-700'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                loginAlerts ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 border border-white/10 rounded-lg">
                        <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-400" />
                          Session Timeout
                        </label>
                        <p className="text-xs text-gray-400 mb-3">Automatically log out after inactivity</p>
                        <select
                          value={sessionTimeout}
                          onChange={(e) => setSessionTimeout(Number(e.target.value))}
                          className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={120}>2 hours</option>
                          <option value={0}>Never</option>
                        </select>
                      </div>

                      <div className="p-4 border border-white/10 rounded-lg bg-red-600/10 border-red-600/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <XCircle className="w-5 h-5 text-red-400" />
                            <div>
                              <p className="font-semibold">Sign Out All Sessions</p>
                              <p className="text-xs text-gray-400">Log out from all devices</p>
                            </div>
                          </div>
                          <button
                            onClick={() => { signOut(); }}
                            className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition text-sm font-semibold"
                          >
                            Sign Out All
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={saveSecuritySettings}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 font-semibold flex items-center gap-2"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                        Save Security Settings
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'notifications' && (
                  <motion.div key="notifications" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                    <h2 className="text-xl font-bold mb-4">Notifications</h2>
                    <div className="space-y-6">
                      <div className="p-4 border border-white/10 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-blue-400" />
                            <div>
                              <p className="font-semibold">Email Notifications</p>
                              <p className="text-xs text-gray-400">Receive updates via email</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setEmailNotifications(!emailNotifications)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                              emailNotifications ? 'bg-blue-600' : 'bg-gray-700'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                emailNotifications ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 border border-white/10 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-green-400" />
                            <div>
                              <p className="font-semibold">Push Notifications</p>
                              <p className="text-xs text-gray-400">Receive real-time browser notifications</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setPushNotifications(!pushNotifications)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                              pushNotifications ? 'bg-green-600' : 'bg-gray-700'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                pushNotifications ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 border border-white/10 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            <div>
                              <p className="font-semibold">Marketplace Activity</p>
                              <p className="text-xs text-gray-400">Updates on new templates, orders, and sales</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setMarketplaceNotifications(!marketplaceNotifications)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                              marketplaceNotifications ? 'bg-yellow-600' : 'bg-gray-700'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                marketplaceNotifications ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 border border-white/10 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Radio className="w-5 h-5 text-pink-400" />
                            <div>
                              <p className="font-semibold">Community Activity</p>
                              <p className="text-xs text-gray-400">Updates on circles, posts, and comments</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setCommunityNotifications(!communityNotifications)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                              communityNotifications ? 'bg-pink-600' : 'bg-gray-700'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                communityNotifications ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 border border-white/10 rounded-lg">
                        <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-purple-400" />
                          Digest Frequency
                        </label>
                        <p className="text-xs text-gray-400 mb-3">How often to receive notification digests</p>
                        <select
                          value={digestFrequency}
                          onChange={(e) => setDigestFrequency(e.target.value)}
                          className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white"
                        >
                          <option value="instant">Instant</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <button
                        onClick={saveNotificationSettings}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 font-semibold flex items-center gap-2"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                        Save Notification Settings
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'data' && (
                  <motion.div key="data" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                    <h2 className="text-xl font-bold mb-4">Data & Privacy</h2>
                    <div className="space-y-6">
                      <div className="p-4 border border-white/10 rounded-lg">
                        <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-400" />
                          Data Retention Period
                        </label>
                        <p className="text-xs text-gray-400 mb-3">How long to keep your activity data</p>
                        <select
                          value={dataRetention}
                          onChange={(e) => setDataRetention(e.target.value)}
                          className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white"
                        >
                          <option value="3">3 months</option>
                          <option value="6">6 months</option>
                          <option value="12">1 year</option>
                          <option value="24">2 years</option>
                          <option value="permanent">Keep permanently</option>
                        </select>
                      </div>

                      <div className="p-4 border border-white/10 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Download className="w-5 h-5 text-green-400 mt-1" />
                          <div className="flex-1">
                            <p className="font-semibold mb-1">Export Your Data</p>
                            <p className="text-xs text-gray-400 mb-3">Download a copy of your profile and activity data</p>
                            <button
                              onClick={exportUserData}
                              disabled={loading}
                              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition font-semibold text-sm inline-flex items-center gap-2"
                            >
                              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                              Download My Data
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border border-white/10 rounded-lg bg-blue-600/10 border-blue-600/20">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-blue-400 mt-1" />
                          <div>
                            <p className="font-semibold mb-1">Privacy Information</p>
                            <p className="text-xs text-gray-400">Your data is encrypted and never shared with third parties without your consent.</p>
                            <div className="mt-3 flex gap-2">
                              <Link href="/privacy" className="text-xs text-blue-400 hover:text-blue-300">Privacy Policy</Link>
                              <span className="text-gray-600">•</span>
                              <Link href="/terms" className="text-xs text-blue-400 hover:text-blue-300">Terms of Service</Link>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border border-white/10 rounded-lg bg-red-600/10 border-red-600/20">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-400 mt-1" />
                          <div className="flex-1">
                            <p className="font-semibold mb-1">Delete Account</p>
                            <p className="text-xs text-gray-400 mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                                  setMessage({ text: 'Account deletion feature coming soon', type: 'error' });
                                }
                              }}
                              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition font-semibold text-sm"
                            >
                              Delete Account
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={saveDataSettings}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 font-semibold flex items-center gap-2"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                        Save Data Settings
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {message && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={`mt-6 p-3 rounded-md ${message.type === 'success' ? 'bg-green-600/10 text-green-300 border border-green-600/20' : 'bg-red-600/10 text-red-300 border border-red-600/20'}`}>
                    {message.text}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}