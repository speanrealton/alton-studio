'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugPage() {
  const [debug, setDebug] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setDebug((prev: any) => ({ ...prev, user: user?.id || 'No user' }));

        if (user) {
          // Check user_roles
          const { data: roles, error: roleError } = await supabase
            .from('user_roles')
            .select('*')
            .eq('user_id', user.id);

          setDebug((prev: any) => ({ 
            ...prev, 
            roles,
            roleError: roleError?.message || 'No error'
          }));

          // Check contributor_applications
          const { data: contrib, error: contribError } = await supabase
            .from('contributor_applications')
            .select('*')
            .limit(1);

          setDebug((prev: any) => ({
            ...prev,
            contributorSample: contrib?.[0] || 'No data',
            contributorError: contribError?.message || 'No error'
          }));

          // Check printer_submissions
          const { data: printers, error: printerError } = await supabase
            .from('printer_submissions')
            .select('*')
            .limit(1);

          setDebug((prev: any) => ({
            ...prev,
            printerSample: printers?.[0] || 'No data',
            printerError: printerError?.message || 'No error'
          }));
        }
      } catch (err: any) {
        setDebug((prev: any) => ({ ...prev, error: err.message }));
      } finally {
        setLoading(false);
      }
    };

    check();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
      <pre className="bg-gray-800 p-4 rounded text-xs overflow-auto">
        {JSON.stringify(debug, null, 2)}
      </pre>
    </div>
  );
}
