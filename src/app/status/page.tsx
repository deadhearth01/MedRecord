'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, AlertCircle, Database, Cloud, Key } from 'lucide-react';

export default function SystemStatus() {
  const [status, setStatus] = useState({
    supabase: 'checking',
    database: 'checking',
    storage: 'checking',
    auth: 'checking'
  });

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    // Check Supabase connection and database
    try {
      // Test basic connection
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) {
        setStatus(prev => ({ 
          ...prev, 
          supabase: 'error',
          database: 'error'
        }));
      } else {
        setStatus(prev => ({ 
          ...prev, 
          supabase: 'connected',
          database: 'connected'
        }));
      }
    } catch (error) {
      console.error('Database connection error:', error);
      setStatus(prev => ({ 
        ...prev, 
        supabase: 'error',
        database: 'error'
      }));
    }

    // Check storage with better error handling
    try {
      // First check if we can list buckets
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Storage list error:', listError);
        setStatus(prev => ({ ...prev, storage: 'error' }));
      } else {
        console.log('Available buckets:', buckets);
        
        // Check if medical-files bucket exists
        const hasMedicalFiles = buckets?.some(bucket => bucket.name === 'medical-files');
        
        if (!hasMedicalFiles) {
          console.log('medical-files bucket not found');
          setStatus(prev => ({ ...prev, storage: 'missing-bucket' }));
        } else {
          console.log('medical-files bucket found');
          // Test if we can actually access the bucket
          const { data: files, error: accessError } = await supabase.storage
            .from('medical-files')
            .list('', { limit: 1 });
          
          if (accessError) {
            console.error('Storage access error:', accessError);
            setStatus(prev => ({ ...prev, storage: 'no-access' }));
          } else {
            console.log('Storage access successful');
            setStatus(prev => ({ ...prev, storage: 'connected' }));
          }
        }
      }
    } catch (error) {
      console.error('Storage error:', error);
      setStatus(prev => ({ ...prev, storage: 'error' }));
    }

    // Check auth configuration
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        setStatus(prev => ({ ...prev, auth: 'error' }));
      } else {
        setStatus(prev => ({ ...prev, auth: user ? 'authenticated' : 'not-authenticated' }));
      }
    } catch (error) {
      console.error('Auth error:', error);
      setStatus(prev => ({ ...prev, auth: 'error' }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'configured':
      case 'authenticated':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'missing-bucket':
      case 'no-access':
      case 'not-authenticated':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'configured':
      case 'authenticated':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'missing-bucket':
      case 'no-access':
      case 'not-authenticated':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <div className="h-5 w-5 border-2 border-gray-300 rounded-full animate-spin" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'configured':
        return 'Configured';
      case 'authenticated':
        return 'Authenticated';
      case 'not-authenticated':
        return 'Not Authenticated';
      case 'error':
        return 'Error';
      case 'missing-bucket':
        return 'Missing Bucket';
      case 'no-access':
        return 'No Access';
      case 'checking':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MedRecord System Status</h1>
          <p className="text-gray-600">Check your application configuration and database connectivity</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Supabase Connection</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.supabase)}
                  <span className={getStatusColor(status.supabase)}>
                    {getStatusText(status.supabase)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Database Tables</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.database)}
                  <span className={getStatusColor(status.database)}>
                    {getStatusText(status.database)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Storage & Auth
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>File Storage</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.storage)}
                  <span className={getStatusColor(status.storage)}>
                    {getStatusText(status.storage)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Authentication</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.auth)}
                  <span className={getStatusColor(status.auth)}>
                    {getStatusText(status.auth)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Setup Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {status.database === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">Database Setup Required</h4>
                  <p className="text-red-700 mb-2">Run the database setup SQL in your Supabase SQL Editor:</p>
                  <code className="text-sm bg-red-100 p-2 rounded block">database-setup.sql</code>
                </div>
              )}
              
              {status.storage === 'missing-bucket' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Storage Bucket Missing</h4>
                  <p className="text-yellow-700 mb-2">Create a storage bucket named 'medical-files' in Supabase Dashboard:</p>
                  <ul className="list-disc list-inside text-sm text-yellow-700">
                    <li>Go to Storage in Supabase Dashboard</li>
                    <li>Create new bucket: 'medical-files'</li>
                    <li>Set as private (not public)</li>
                    <li>Run storage policies from database-setup.sql</li>
                  </ul>
                </div>
              )}

              {status.storage === 'no-access' && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">Storage Access Issue</h4>
                  <p className="text-orange-700 mb-2">Storage bucket exists but access is denied. Run these storage policies in SQL Editor:</p>
                  <pre className="text-xs bg-orange-100 p-2 rounded mt-2 overflow-x-auto">
{`CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'medical-files' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to view own files" ON storage.objects  
FOR SELECT USING (bucket_id = 'medical-files' AND auth.uid()::text = (storage.foldername(name))[1]);`}
                  </pre>
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Google OAuth Setup</h4>
                <p className="text-blue-700 mb-2">Configure Google OAuth in Supabase:</p>
                <ul className="list-disc list-inside text-sm text-blue-700">
                  <li>Go to Authentication → Providers in Supabase</li>
                  <li>Enable Google provider</li>
                  <li>Add Google OAuth Client ID and Secret</li>
                  <li>Set redirect URL: http://localhost:3000/auth/callback</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Ready to Use the App?</h4>
                <p className="text-green-700 mb-4">If your setup is complete, you can start using MedRecord:</p>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => window.location.href = '/'} 
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Go to Home Page
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/auth/signin'}
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Button onClick={checkSystemStatus} className="mr-4">
            Refresh Status
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} className="mr-4">
            Go to Home
          </Button>
          <Button variant="secondary" onClick={() => window.location.href = '/dashboard'}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
