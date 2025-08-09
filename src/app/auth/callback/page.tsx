'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Heart, AlertCircle, CheckCircle } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Callback: Starting auth callback processing...');
        
        // Check for callback errors first
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error('Callback: OAuth Error:', error, errorDescription);
          setStatus('error');
          setMessage(`Authentication failed: ${errorDescription || error}`);
          setTimeout(() => router.push('/auth/signin'), 3000);
          return;
        }

        setMessage('Verifying your account...');
        console.log('Callback: Getting session...');
        
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Callback: Session error:', sessionError);
          setStatus('error');
          setMessage('Failed to verify authentication. Please try again.');
          setTimeout(() => router.push('/auth/signin'), 3000);
          return;
        }

        if (data?.session?.user) {
          console.log('Callback: User session found:', data.session.user.id);
          setMessage('Checking your profile...');
          
          // Check if user profile exists
          const { data: existingProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            // PGRST116 is "not found" which is expected for new users
            console.error('Callback: Profile check error:', profileError);
            setStatus('error');
            setMessage('Database connection issue. Please contact support.');
            setTimeout(() => router.push('/auth/signin'), 3000);
            return;
          }

          if (existingProfile) {
            // User exists, redirect to dashboard
            console.log('Callback: Existing user found, redirecting to dashboard...');
            setStatus('success');
            setMessage('Welcome back! Redirecting to dashboard...');
            setTimeout(() => router.push('/dashboard'), 1500);
          } else {
            // New user, redirect to onboarding
            console.log('Callback: New user, redirecting to onboarding...');
            setStatus('success');
            setMessage('Welcome! Setting up your profile...');
            setTimeout(() => router.push('/auth/onboarding'), 1500);
          }
        } else {
          console.log('Callback: No valid session found');
          setStatus('error');
          setMessage('No valid session found. Redirecting to sign in...');
          setTimeout(() => router.push('/auth/signin'), 3000);
        }
      } catch (error) {
        console.error('Callback: Unexpected error in auth callback:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try signing in again.');
        setTimeout(() => router.push('/auth/signin'), 3000);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-blue-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className={`flex items-center justify-center h-16 w-16 rounded-full ${
              status === 'loading' ? 'bg-primary animate-pulse' :
              status === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {status === 'loading' && <Heart className="h-8 w-8 text-white animate-pulse" />}
              {status === 'success' && <CheckCircle className="h-8 w-8 text-white" />}
              {status === 'error' && <AlertCircle className="h-8 w-8 text-white" />}
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {status === 'loading' && 'Authenticating...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Authentication Failed'}
          </h2>
          <p className="text-gray-600">
            {message}
          </p>
          {status === 'loading' && (
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Heart className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
