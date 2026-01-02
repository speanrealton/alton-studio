'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ExecutivePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.push('/executive/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="text-white text-2xl font-bold">Loading Executive Dashboard...</div>
      </div>
    </div>
  );
}
