'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy /qr route — redirects to the Wallet tab on the main app.
 * Ticket #19: replaced by QRScreen component in the bottom-nav wallet tab.
 */
export default function QRRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/?tab=qr');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-black text-white">
      <p className="font-bold text-xs uppercase tracking-widest animate-pulse">Loading Wallet...</p>
    </div>
  );
}