// src/app/auth/page.tsx — Fixed with logo.svg
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // CHECK IF ALREADY LOGGED IN → REDIRECT TO MAIN PAGE
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/');
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isSignUp) {
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });
      if (error) {
        setMessage(error.message);
        setLoading(false);
      } else {
        // Auto sign in after signup and redirect
        if (data.user) {
          await supabase.auth.signInWithPassword({ email, password });
          router.push('/');
        } else {
          setMessage('Account created! Redirecting...');
          setTimeout(() => router.push('/'), 2000);
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
        setLoading(false);
      } else {
        // SUCCESS → REDIRECT TO MAIN PAGE
        router.push('/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-pink-600/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-rose-600/20 rounded-full blur-2xl"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:block text-white space-y-8"
        >
          <Link href="/" className="inline-block">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="cursor-pointer transition-transform"
            >
              <Image 
                src="/logo.svg" 
                alt="Logo" 
                width={200} 
                height={80}
                className="mb-6"
                priority
              />
            </motion.div>
          </Link>
          
          <h2 className="text-4xl font-bold leading-tight">
            The Future of<br />
            Creative Commerce<br />
            Starts Here
          </h2>
          
          <p className="text-xl text-gray-300 leading-relaxed">
            Design with AI. Sell globally. Print anywhere. Get hired instantly.
          </p>

          <div className="flex gap-4 pt-4">
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-xl px-6 py-3">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <div>
                <p className="font-bold">AI Design Studio</p>
                <p className="text-sm text-gray-400">Create in seconds</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-purple-500/20 rounded-xl px-6 py-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl font-black">
                190+
              </div>
              <div>
                <p className="font-bold">Countries</p>
                <p className="text-sm text-gray-400">Global shipping</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-white/5 backdrop-blur-2xl border border-purple-500/20 rounded-3xl p-8 md:p-10 shadow-2xl">
            
            {/* Mobile Logo */}
            <Link href="/" className="lg:hidden block mb-8">
              <div className="flex justify-center">
                <Image 
                  src="/logo.svg" 
                  alt="Logo" 
                  width={150} 
                  height={60}
                  className="cursor-pointer hover:scale-105 transition-transform"
                  priority
                />
              </div>
            </Link>

            {/* Tab Switcher */}
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl mb-8">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setMessage('');
                }}
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                  !isSignUp 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setMessage('');
                }}
                className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                  isSignUp 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={isSignUp ? 'signup' : 'signin'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-white mb-2">
                  {isSignUp ? 'Create your account' : 'Welcome back'}
                </h2>
                <p className="text-gray-400 mb-6">
                  {isSignUp ? 'Start your creative journey today' : 'Sign in to continue creating'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {isSignUp && (
                  <p className="text-xs text-gray-500 mt-2">Minimum 6 characters</p>
                )}
              </div>

              {/* Forgot Password */}
              {!isSignUp && (
                <div className="text-right">
                  <Link href="/reset-password" className="text-sm text-purple-400 hover:text-purple-300 transition">
                    Forgot password?
                  </Link>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 py-4 rounded-xl text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/50 flex items-center justify-center gap-3 group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Message Display */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mt-6 p-4 rounded-xl text-sm font-medium text-center ${
                    message.includes('Check') || message.includes('success') 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {message}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Terms */}
            <p className="text-center text-xs text-gray-500 mt-6">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="text-purple-400 hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-purple-400 hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}