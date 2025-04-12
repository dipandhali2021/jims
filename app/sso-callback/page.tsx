'use client';

import { useEffect } from 'react';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk();
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      try {
        // Force the redirect to dashboard after successful authentication
        const redirectResult = await handleRedirectCallback({
          afterSignInUrl: '/dashboard',
          afterSignUpUrl: '/dashboard',
        });
        
        // Log the redirect result for debugging
        console.log('SSO Callback redirect result:', redirectResult);
        
        // Ensure we redirect to dashboard if the callback doesn't do it automatically
        if (!redirectResult) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error handling SSO callback:', error);
        router.push('/error');
      }
    }

    handleCallback();
  }, [handleRedirectCallback, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-lg text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}