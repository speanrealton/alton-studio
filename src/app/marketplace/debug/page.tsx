// src/app/marketplace/debug/page.tsx  ← CREATE THIS TO DEBUG
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function DebugVideos() {
  const [videos, setVideos] = useState<any[]>([]);
  const [bucketInfo, setBucketInfo] = useState<any>(null);
  const [storageFiles, setStorageFiles] = useState<any[]>([]);

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    // Get videos from database
    const { data: videosData, error: videoError } = await supabase
      .from('printing_videos')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Videos from DB:', videosData);
    console.log('Video DB Error:', videoError);
    setVideos(videosData || []);

    // Get bucket info
    const { data: buckets } = await supabase.storage.listBuckets();
    const printsBucket = buckets?.find(b => b.name === 'prints');
    console.log('Prints bucket:', printsBucket);
    setBucketInfo(printsBucket);

    // List files in bucket
    const { data: files } = await supabase.storage.from('prints').list();
    console.log('Files in bucket:', files);
    setStorageFiles(files || []);
  };

  const testVideoUrl = async (url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return {
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type')
      };
    } catch (err) {
      return { error: err };
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-black">🔍 DEBUG MODE</h1>
          <Link href="/marketplace" className="text-xl underline">
            ← Back to Feed
          </Link>
        </div>

        {/* BUCKET INFO */}
        <div className="bg-zinc-900 rounded-2xl p-6 mb-6">
          <h2 className="text-3xl font-black mb-4">Storage Bucket Info</h2>
          {bucketInfo ? (
            <div className="space-y-2 text-lg">
              <p>Name: <strong>{bucketInfo.name}</strong></p>
              <p>Public: <strong className={bucketInfo.public ? 'text-green-400' : 'text-red-400'}>
                {bucketInfo.public ? '✓ YES' : '✗ NO (THIS IS THE PROBLEM!)'}
              </strong></p>
              <p>ID: <code className="text-sm">{bucketInfo.id}</code></p>
            </div>
          ) : (
            <p className="text-red-400">No bucket found named 'prints'</p>
          )}
          
          {bucketInfo && !bucketInfo.public && (
            <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-xl">
              <p className="text-xl font-black mb-2">⚠️ BUCKET IS NOT PUBLIC</p>
              <p className="mb-4">Run this SQL in Supabase SQL Editor:</p>
              <code className="block bg-black p-4 rounded text-sm">
                UPDATE storage.buckets SET public = true WHERE name = 'prints';
              </code>
            </div>
          )}
        </div>

        {/* FILES IN STORAGE */}
        <div className="bg-zinc-900 rounded-2xl p-6 mb-6">
          <h2 className="text-3xl font-black mb-4">Files in Storage ({storageFiles.length})</h2>
          {storageFiles.length > 0 ? (
            <div className="space-y-2">
              {storageFiles.slice(0, 5).map((file, i) => (
                <div key={i} className="bg-black p-3 rounded">
                  <p className="text-sm">📹 {file.name}</p>
                  <p className="text-xs text-gray-400">
                    Size: {(file.metadata?.size / 1024 / 1024).toFixed(2)}MB
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-yellow-400">No files uploaded yet</p>
          )}
        </div>

        {/* VIDEOS IN DATABASE */}
        <div className="bg-zinc-900 rounded-2xl p-6">
          <h2 className="text-3xl font-black mb-4">Videos in Database ({videos.length})</h2>
          {videos.length > 0 ? (
            <div className="space-y-4">
              {videos.map((video, i) => (
                <div key={video.id} className="bg-black p-4 rounded-xl">
                  <p className="text-xl font-bold mb-2">Video #{i + 1}</p>
                  <div className="space-y-2 text-sm">
                    <p>Creator: <strong>{video.creator_name}</strong></p>
                    <p>Product: <strong>{video.tagged_product_slug}</strong></p>
                    <p>Likes: <strong>{video.likes || 0}</strong></p>
                    <p className="break-all">URL: 
                      <a href={video.video_url} target="_blank" className="text-blue-400 underline ml-2">
                        {video.video_url}
                      </a>
                    </p>
                    
                    {/* TEST VIDEO */}
                    <button
                      onClick={async () => {
                        const result = await testVideoUrl(video.video_url);
                        alert(JSON.stringify(result, null, 2));
                      }}
                      className="bg-purple-600 px-4 py-2 rounded-full font-bold text-xs mt-2"
                    >
                      Test URL
                    </button>

                    {/* PREVIEW */}
                    <div className="mt-4">
                      <p className="text-xs text-gray-400 mb-2">Preview:</p>
                      <video
                        src={video.video_url}
                        className="w-32 h-56 object-cover rounded"
                        controls
                        onError={() => alert('❌ Video failed to load!')}
                        onLoadedData={() => alert('✓ Video loaded successfully!')}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-yellow-400">No videos in database</p>
          )}
        </div>

        {/* QUICK FIXES */}
        <div className="bg-red-900/30 border border-red-500 rounded-2xl p-6 mt-6">
          <h2 className="text-3xl font-black mb-4">🔧 Quick Fixes</h2>
          <div className="space-y-4 text-lg">
            <div>
              <p className="font-bold mb-2">1. Make bucket public:</p>
              <code className="block bg-black p-3 rounded text-sm">
                UPDATE storage.buckets SET public = true WHERE name = 'prints';
              </code>
            </div>
            
            <div>
              <p className="font-bold mb-2">2. Add storage RLS policy:</p>
              <code className="block bg-black p-3 rounded text-sm whitespace-pre-wrap">
{`CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'prints' );`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}