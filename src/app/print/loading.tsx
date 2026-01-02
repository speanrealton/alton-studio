'use client';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Loading Print Network...</p>
        </div>
      </div>
    </div>
  );
}
