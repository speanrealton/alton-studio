'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Print page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-red-500 mb-2">Oops!</h1>
          <p className="text-xl text-gray-300 mb-4">Something went wrong loading the Print Network</p>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-400 font-mono break-words">
            {error.message || 'Unknown error'}
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-white transition"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
