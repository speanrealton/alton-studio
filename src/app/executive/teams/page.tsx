'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function ExecutiveTeams() {
  useAdminAuth('executive');

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <h1 className="text-3xl font-black text-white mb-4">Teams</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-gray-400">
        <p>Executive teams management coming soon...</p>
      </div>
    </div>
  );
}
