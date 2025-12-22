// src/app/marketplace/check-data/page.tsx ← CREATE THIS TO DEBUG
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function CheckData() {
  const [videos, setVideos] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    console.log('Current User:', user);

    // Get videos
    const { data: videosData } = await supabase
      .from('printing_videos')
      .select('*')
      .order('created_at', { ascending: false });
    
    setVideos(videosData || []);
    console.log('Videos from DB:', videosData);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black">Data Inspector 🔍</h1>
          <Link href="/marketplace" className="text-purple-400 underline">
            ← Back to Feed
          </Link>
        </div>

        {/* Current User Info */}
        <div className="bg-zinc-900 rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Your Profile Data</h2>
          {currentUser ? (
            <div className="space-y-2 text-sm font-mono">
              <p><strong>User ID:</strong> {currentUser.id}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>Username:</strong> {currentUser.user_metadata?.username || '❌ NOT SET'}</p>
              <p><strong>Profile Picture:</strong> {currentUser.user_metadata?.profile_picture || '❌ NOT SET'}</p>
              
              {currentUser.user_metadata?.profile_picture && (
                <div className="mt-4">
                  <p className="mb-2"><strong>Profile Picture Preview:</strong></p>
                  <img 
                    src={currentUser.user_metadata.profile_picture} 
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-purple-500"
                    onError={() => alert('Image failed to load!')}
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-400">Not logged in</p>
          )}
        </div>

        {/* Videos Table */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Videos in Database ({videos.length})</h2>
          
          {videos.length === 0 ? (
            <p className="text-gray-400">No videos found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-2">Creator Name</th>
                    <th className="text-left p-2">Username</th>
                    <th className="text-left p-2">Profile Pic</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-left p-2">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map((video) => (
                    <tr key={video.id} className="border-b border-white/10">
                      <td className="p-2 font-mono text-xs">
                        {video.creator_name || '❌ NULL'}
                      </td>
                      <td className="p-2 font-mono text-xs">
                        {video.creator_username ? (
                          <span className="text-green-400">✓ {video.creator_username}</span>
                        ) : (
                          <span className="text-red-400">❌ NULL</span>
                        )}
                      </td>
                      <td className="p-2 font-mono text-xs break-all max-w-xs">
                        {video.creator_profile_picture ? (
                          <span className="text-green-400">✓ {video.creator_profile_picture.substring(0, 40)}...</span>
                        ) : (
                          <span className="text-red-400">❌ NULL</span>
                        )}
                      </td>
                      <td className="p-2 text-xs max-w-xs truncate">
                        {video.description || <span className="text-gray-500">No description</span>}
                      </td>
                      <td className="p-2">
                        {video.creator_profile_picture ? (
                          <img 
                            src={video.creator_profile_picture}
                            alt="Preview"
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '';
                              e.currentTarget.alt = '❌ Failed';
                              e.currentTarget.className = 'w-10 h-10 rounded-full bg-red-900 flex items-center justify-center text-xs';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                            👤
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-3">🔧 How to Fix:</h3>
          <ol className="space-y-2 text-sm">
            <li>
              <strong>1. Set your profile:</strong> Go to{' '}
              <Link href="/marketplace/profile" className="text-purple-400 underline">
                Profile Page
              </Link>
              {' '}and upload a profile picture + set username
            </li>
            <li>
              <strong>2. Check if columns exist:</strong> Make sure your database has{' '}
              <code className="bg-black/50 px-2 py-1 rounded">creator_username</code> and{' '}
              <code className="bg-black/50 px-2 py-1 rounded">creator_profile_picture</code> columns
            </li>
            <li>
              <strong>3. Upload new video:</strong> After setting profile, upload a new video - it should automatically save your username & picture
            </li>
            <li>
              <strong>4. For old videos:</strong> Run SQL to update them:
              <pre className="bg-black/50 p-3 rounded mt-2 text-xs overflow-x-auto">
{`UPDATE printing_videos 
SET 
  creator_username = '${currentUser?.user_metadata?.username || 'YOUR_USERNAME'}',
  creator_profile_picture = '${currentUser?.user_metadata?.profile_picture || 'YOUR_PIC_URL'}'
WHERE creator_id = '${currentUser?.id || 'YOUR_USER_ID'}';`}
              </pre>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}