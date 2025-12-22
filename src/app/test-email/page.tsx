'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function EmailTestPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const testEmail = async (status: 'approved' | 'rejected') => {
    if (!email || !name) {
      alert('Please fill in email and name');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log('Sending test email to:', email);
      
      const response = await fetch('/api/send-approval-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          displayName: name,
          status: status,
          reviewNotes: status === 'rejected' ? 'This is a test rejection note' : null
        })
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      setResult({
        success: true,
        message: `✅ ${status === 'approved' ? 'Approval' : 'Rejection'} email sent successfully to ${email}!`
      });
    } catch (err: any) {
      console.error('Email test error:', err);
      setResult({
        success: false,
        message: `❌ Error: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          📧 Email System Test
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Test if your email notifications are working
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Test Email Address
            </label>
            <Input
              type="email"
              placeholder="your-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-50 dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Recipient Name
            </label>
            <Input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-50 dark:bg-gray-700"
            />
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <Button
            onClick={() => testEmail('approved')}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Test Approval Email
          </Button>

          <Button
            onClick={() => testEmail('rejected')}
            disabled={loading}
            variant="destructive"
            className="w-full"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Test Rejection Email
          </Button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
              : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          }`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <p className={`text-sm ${
                result.success
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {result.message}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <p className="text-xs font-semibold text-purple-900 dark:text-purple-200 mb-2">
            📋 Checklist:
          </p>
          <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
            <li>✓ API route exists at /api/send-approval-email</li>
            <li>✓ RESEND_API_KEY in .env.local</li>
            <li>✓ Resend package installed (npm install resend)</li>
            <li>✓ Check browser console for errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
}