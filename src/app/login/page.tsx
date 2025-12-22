// src/app/login/page.tsx
'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const supabase = createClientComponentClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        redirect('/studio');
      }
    });
  }, [supabase]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <h1 className="text-6xl font-black text-center mb-10 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          ALTON
        </h1>
        <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-10 shadow-2xl">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#a855f7',
                    brandAccent: '#c084fc',
                  },
                },
              },
            }}
            theme="dark"
            providers={['google']}
            redirectTo="http://localhost:3000/studio"
          />
        </div>
        <p className="text-center text-gray-500 mt-8 text-sm">
          Join the creative revolution — Kenya
        </p>
      </div>
    </div>
  );
}