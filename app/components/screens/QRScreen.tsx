'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, User as UserIcon } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';

export default function QRScreen({ credits, currentUserId }: { credits: number, currentUserId: string | null }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleTopUp = async () => {
    if (!currentUserId || isLoading) return;
    setIsLoading(true);

    try {
      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP || 'price_1SfcDS12ap1SCxToMWo5Lz3m';

      // Fetch user email
      const { data: profile } = await supabase.from('profiles').select('contact_email').eq('id', currentUserId).single();
      const { data: { user } } = await supabase.auth.getUser();
      const email = profile?.contact_email || user?.email;

      const baseUrl = window.location.origin;

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: currentUserId,
          userEmail: email,
          successUrl: `${baseUrl}/?success=true`,
          cancelUrl: `${baseUrl}/?canceled=true`
        })
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to initiate checkout.");
      }
    } catch (e) {
      console.error(e);
      alert("Error initiating Top Up.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 animate-fadeIn pb-24 relative">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=1200"
          alt="Hockey Background"
          className="w-full h-full object-cover opacity-20 blur-sm"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="w-full max-w-xs bg-white text-black rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 border border-white/20">
        <div className="h-3 w-full bg-gradient-to-r from-east-light to-east-dark" />

        <div className="p-8 flex flex-col items-center">
          <h2 className="font-montserrat font-black italic text-3xl mb-1 uppercase tracking-tighter text-black leading-none">WALLET</h2>
          <p className="font-bold text-[10px] text-gray-400 uppercase mb-8 tracking-widest">EAST SPORTS GROUP</p>

          <div className="relative p-6 border-[1px] border-black/10 rounded-3xl mb-8 bg-gray-50 shadow-inner group">
            <QrCode size={160} strokeWidth={1.5} className="text-black opacity-90 group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute -top-3 -left-3 w-8 h-8 border-t-4 border-l-4 border-east-dark rounded-tl-xl" />
            <div className="absolute -top-3 -right-3 w-8 h-8 border-t-4 border-r-4 border-east-dark rounded-tr-xl" />
            <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-4 border-l-4 border-east-dark rounded-bl-xl" />
            <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-4 border-r-4 border-east-dark rounded-br-xl" />
          </div>

          <div className="text-center w-full mb-8">
            <div className="bg-black text-white rounded-2xl p-4 mb-4 shadow-xl border border-gray-800">
              <div className="text-[9px] font-black text-east-light uppercase tracking-widest mb-1 italic">AVAILABLE BALANCE</div>
              <div className="flex items-center justify-center gap-2">
                <span className="font-montserrat font-black italic text-4xl">{credits}</span>
                <span className="text-xs font-black text-gray-500 uppercase mt-2 italic tracking-tighter">Credits</span>
              </div>
            </div>

            <button
              onClick={handleTopUp}
              disabled={isLoading}
              className="w-full bg-east-light text-black font-montserrat font-black italic text-[12px] py-4 rounded-full uppercase tracking-widest hover:bg-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isLoading ? 'WORKING...' : 'TOP UP CREDITS'}
            </button>
          </div>

          <button
            onClick={() => router.push('/membership')}
            className="w-full mt-6 pt-6 border-t border-dashed border-gray-200 flex justify-between items-center group"
          >
            <div className="text-left">
              <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">MEMBERSHIP</div>
              <div className="font-montserrat font-black italic text-sm tracking-tight text-east-dark uppercase group-hover:text-black transition-colors">VIEW OPTIONS</div>
            </div>
            <div className="h-10 w-10 bg-gray-50 text-black rounded-full flex items-center justify-center border border-black/5 group-hover:bg-black group-hover:text-white transition-all">
              <UserIcon size={16} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}