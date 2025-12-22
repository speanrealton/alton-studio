// src/app/contributor/apply/success/page.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ApplicationSuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center shadow-xl"
      >
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
          Application Submitted! 🎉
        </h1>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          Thank you for applying to become an <span className="font-bold text-purple-600">Alton Stock Contributor</span>! 
          We're reviewing your application and will get back to you within <span className="font-bold">2-3 business days</span>.
        </p>

        {/* What's Next */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6 text-left">
          <h3 className="font-bold text-sm text-purple-900 dark:text-purple-200 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            What happens next?
          </h3>
          <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Our team will review your portfolio and sample works</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>You'll receive an email with the decision</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>If approved, you can start uploading immediately!</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/alton-designs">
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              Browse Designs
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Email Notice */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
          Check your email (including spam folder) for updates
        </p>
      </motion.div>
    </div>
  );
}