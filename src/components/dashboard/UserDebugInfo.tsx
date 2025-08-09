'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, getUserProfile, getMedicalRecords } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function UserDebugInfo() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDebugInfo = async () => {
      try {
        console.log('🔍 Loading debug information...');
        
        // Get current user from session
        const { user, session } = await getCurrentUser();
        console.log('Current session user:', user);
        
        if (!user) {
          setDebugInfo({ error: 'No user logged in', userError: null });
          setIsLoading(false);
          return;
        }

        // Get user profile
        const { data: profile, error: profileError } = await getUserProfile(user.id);
        console.log('User profile:', profile);

        // Get user's medical records
        const { data: records, error: recordsError } = await getMedicalRecords(user.id);
        console.log('User records:', records);

        setDebugInfo({
          session: {
            id: user.id,
            email: user.email,
            created_at: user.created_at
          },
          profile: profile || { error: profileError?.message },
          records: records || { error: recordsError?.message },
          recordCount: records?.length || 0
        });

      } catch (err) {
        console.error('Debug info error:', err);
        setDebugInfo({ error: err instanceof Error ? err.message : 'Unknown error' });
      } finally {
        setIsLoading(false);
      }
    };

    loadDebugInfo();
  }, []);

  if (isLoading) {
    return (
      <Card className="mb-4 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-sm text-yellow-800">🔍 Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-700">Loading debug information...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-sm text-blue-800">🔍 User Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs text-blue-700">
          <strong>Session User:</strong>
          <ul className="ml-4 mt-1">
            <li>ID: {debugInfo?.session?.id || 'Not found'}</li>
            <li>Email: {debugInfo?.session?.email || 'Not found'}</li>
          </ul>
        </div>
        
        <div className="text-xs text-blue-700">
          <strong>Profile:</strong>
          <ul className="ml-4 mt-1">
            {debugInfo?.profile?.id ? (
              <>
                <li>MED ID: {debugInfo.profile.med_id}</li>
                <li>Type: {debugInfo.profile.user_type}</li>
                <li>Name: {debugInfo.profile.full_name || 'Not set'}</li>
              </>
            ) : (
              <li>Error: {debugInfo?.profile?.error || 'Profile not found'}</li>
            )}
          </ul>
        </div>
        
        <div className="text-xs text-blue-700">
          <strong>Medical Records:</strong>
          <ul className="ml-4 mt-1">
            <li>Count: {debugInfo?.recordCount || 0}</li>
            {debugInfo?.records?.error && (
              <li>Error: {debugInfo.records.error}</li>
            )}
          </ul>
        </div>
        
        <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-100 rounded">
          <strong>Expected Behavior:</strong><br />
          • If record count is 0 but database shows 1 record, there's a user mismatch<br />
          • The record belongs to potupureddybhavani@gmail.com (ID: 9b03238c-3849-4255-90f4-56d0a3051117)
        </div>
      </CardContent>
    </Card>
  );
}
