'use client';

/**
 * /auth/google-callback
 *
 * This page handles the redirect back from Google OAuth via Supabase.
 * It captures the provider_refresh_token from the Supabase session and
 * securely stores it server-side before redirecting to the calendar.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Connecting your Google Calendar...');

  useEffect(() => {
    async function handleCallback() {
      try {
        const { supabase } = await import('@/app/lib/supabase');

        // Wait briefly for Supabase to process the OAuth tokens from the URL hash
        await new Promise((r) => setTimeout(r, 500));

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          setTimeout(() => router.push('/calendar'), 3000);
          return;
        }

        const refreshToken = session.provider_refresh_token;

        if (!refreshToken) {
          // Token not present — user may have already connected, or Google
          // didn't return a refresh token (happens if prompt=consent was skipped)
          setStatus('success');
          setMessage('Google Calendar connected!');
          setTimeout(() => router.push('/calendar'), 1500);
          return;
        }

        // Store the refresh token server-side
        const res = await fetch('/api/auth/google/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
          throw new Error('Failed to save token');
        }

        setStatus('success');
        setMessage('Google Calendar connected!');
        setTimeout(() => router.push('/calendar'), 1500);
      } catch (err) {
        console.error('[google-callback]', err);
        setStatus('error');
        setMessage('Something went wrong. Redirecting back...');
        setTimeout(() => router.push('/calendar'), 3000);
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
      <div className="text-4xl font-montserrat font-black italic">EAST</div>

      <div className="flex flex-col items-center gap-3">
        {status === 'processing' && (
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
        )}
        {status === 'success' && (
          <div className="text-green-400 text-4xl">✓</div>
        )}
        {status === 'error' && (
          <div className="text-red-400 text-4xl">✗</div>
        )}
        <p className="text-gray-400 text-sm">{message}</p>
      </div>
    </div>
  );
}
