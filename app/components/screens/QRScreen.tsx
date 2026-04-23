'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User as UserIcon, ShoppingBag, ArrowLeft, CheckCircle2, ScanLine } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';

interface ShopItem {
  id: number;
  name: string;
  price_credits: number;
  category: string;
}

export default function QRScreen({ credits, currentUserId, subscriptionStatus, accountStatus, role }: { credits: number, currentUserId: string | null, subscriptionStatus?: string, accountStatus?: string, role?: string }) {
  const router = useRouter();
  const [view, setView] = useState<'wallet' | 'shop' | 'confirm' | 'success'>('wallet');
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [loadingShop, setLoadingShop] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrValue, setQrValue] = useState('');

  // Generate static QR value
  useEffect(() => {
    if (!currentUserId) return;
    
    setQrValue(JSON.stringify({
      type: 'athlete_wallet',
      userId: currentUserId
    }));
  }, [currentUserId]);

  const fetchShopItems = async () => {
    setLoadingShop(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch('/api/shop-items', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setShopItems(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingShop(false);
  };

  const handleOpenShop = () => {
    fetchShopItems();
    setView('shop');
  };

  const handlePurchase = async () => {
    if (!selectedItem || !currentUserId) return;
    setPurchasing(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not logged in");

      const res = await fetch('/api/sessions/pay-via-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: currentUserId,
          amount: selectedItem.price_credits,
          reason: `Purchased: ${selectedItem.name}`
        })
      });

      const data = await res.json();
      if (data.success) {
        setView('success');
      } else {
        setError(data.error || 'Purchase failed. Not enough credits?');
      }
    } catch (e: any) {
      setError(e.message || 'Error processing purchase');
    }
    setPurchasing(false);
  };

  const CAT_COLOR: Record<string, string> = {
    drinks: 'bg-blue-500/10 text-blue-600',
    snacks: 'bg-yellow-500/10 text-yellow-600',
    merch: 'bg-purple-500/10 text-purple-600',
    equipment: 'bg-orange-500/10 text-orange-600',
    general: 'bg-gray-100 text-gray-600',
  };

  const renderWallet = () => (
    <>
      <div className="p-8 flex flex-col items-center">
        <h2 className="font-montserrat font-black italic text-3xl mb-1 uppercase tracking-tighter text-black leading-none">WALLET</h2>
        <p className="font-bold text-[10px] text-gray-400 uppercase mb-8 tracking-widest">EAST SPORTS GROUP</p>

        <div className="relative p-6 border-[1px] border-black/10 rounded-3xl mb-8 bg-gray-50 shadow-inner group">
          {currentUserId && (
            <div className="bg-white p-2 rounded-xl text-black opacity-90 group-hover:scale-105 transition-transform duration-500">
              <QRCodeSVG
                value={qrValue}
                size={144}
                level="H"
                includeMargin={true}
              />
            </div>
          )}
          <div className="absolute -top-3 -left-3 w-8 h-8 border-t-4 border-l-4 border-east-dark rounded-tl-xl" />
          <div className="absolute -top-3 -right-3 w-8 h-8 border-t-4 border-r-4 border-east-dark rounded-tr-xl" />
          <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-4 border-l-4 border-east-dark rounded-bl-xl" />
          <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-4 border-r-4 border-east-dark rounded-br-xl" />
        </div>

        <div className="text-center w-full mb-6">
          <div className="bg-black text-white rounded-2xl p-4 mb-4 shadow-xl border border-gray-800">
            <div className="text-[9px] font-black text-east-light uppercase tracking-widest mb-1 italic">AVAILABLE BALANCE</div>
            <div className="flex items-center justify-center gap-2">
              <span className="font-montserrat font-black italic text-4xl">{credits}</span>
              <span className="text-xs font-black text-gray-500 uppercase mt-2 italic tracking-tighter">Credits</span>
            </div>
          </div>

          {/* Locked Credits Warning */}
          {(() => {
            const isSubscriber = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
            const isManuallyActive = accountStatus === 'active';
            const isUnlocked = isSubscriber || isManuallyActive;
            const needsLockCheck = role === 'player' || role === 'parent' || !role;
            const isLocked = needsLockCheck && !isUnlocked;

            if (!isLocked) return null;

            return (
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3 mb-4">
                <p className="text-[10px] font-bold text-red-400 text-center uppercase tracking-wide">
                  ⚠️ Credits locked until subscription is purchased or reactivated. <Link href="/membership" className="underline hover:text-white transition-colors">renew or purchase new membership here</Link>
                </p>
              </div>
            );
          })()}

          <div className="flex gap-2 mb-2">
            <button
              onClick={() => router.push('/top-up')}
              className="flex-1 bg-east-light text-black font-montserrat font-black italic text-sm py-4 rounded-2xl uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
            >
              Top Up
            </button>
            <button
              onClick={handleOpenShop}
              className="flex-1 bg-black text-white font-montserrat font-black italic text-sm py-4 rounded-2xl uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} /> Shop
            </button>
          </div>
          {/* Scan & Pay — customer scans an admin-displayed Quick Pay QR at the front desk */}
          <button
            onClick={() => router.push('/check-in')}
            className="w-full bg-white border-2 border-black text-black font-montserrat font-black italic text-sm py-3.5 rounded-2xl uppercase tracking-wider hover:bg-black hover:text-white active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ScanLine size={16} /> Scan &amp; Pay
          </button>
        </div>

        <button
          onClick={() => router.push('/membership')}
          className="w-full mt-2 pt-6 border-t border-dashed border-gray-200 flex justify-between items-center group"
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
    </>
  );

  const renderShop = () => (
    <div className="p-6 flex flex-col h-full bg-white text-black min-h-[500px]">
      <div className="flex items-center mb-6">
        <button onClick={() => setView('wallet')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 text-center pr-8">
          <h2 className="font-montserrat font-black italic text-2xl uppercase tracking-tighter">THE SHOP</h2>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-3 mb-6 flex justify-between items-center border border-gray-200">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Balance</span>
        <span className="font-montserrat font-black italic text-east-dark">{credits} <span className="text-xs font-bold text-gray-400 not-italic">cr</span></span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {loadingShop ? (
          <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest py-10">Loading...</p>
        ) : shopItems.length === 0 ? (
          <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest py-10">No items available</p>
        ) : (
          <div className="flex flex-col gap-3">
            {shopItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setSelectedItem(item); setView('confirm'); }}
                className="w-full text-left p-4 rounded-2xl border border-gray-200 bg-white hover:border-east-light hover:shadow-md transition-all flex justify-between items-center"
              >
                <div>
                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded tracking-widest ${CAT_COLOR[item.category] || CAT_COLOR.general}`}>
                    {item.category}
                  </span>
                  <p className="font-bold text-sm mt-1">{item.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-montserrat font-black italic text-lg">{item.price_credits}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Credits</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderConfirm = () => (
    <div className="p-6 flex flex-col h-full bg-white text-black min-h-[500px]">
      <div className="flex items-center mb-6">
        <button onClick={() => setView('shop')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors" disabled={purchasing}>
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 text-center pr-8">
          <h2 className="font-montserrat font-black italic text-xl uppercase tracking-tighter">CONFIRM</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <ShoppingBag size={48} className="text-gray-300 mb-6" />
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">You are buying</p>
        <h3 className="font-black text-2xl mb-8">{selectedItem?.name}</h3>
        
        <div className="bg-gray-50 w-full rounded-2xl p-6 border border-gray-200 mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase">Cost</span>
            <span className="font-montserrat font-black italic text-xl text-red-500">-{selectedItem?.price_credits} cr</span>
          </div>
          <div className="w-full h-[1px] bg-gray-200 mb-4" />
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 uppercase">Remaining Balance</span>
            <span className="font-montserrat font-black italic text-lg text-black">{credits - (selectedItem?.price_credits || 0)} cr</span>
          </div>
        </div>

        {error && (
          <div className="w-full bg-red-50 border border-red-200 rounded-xl p-3 mb-6">
            <p className="text-xs font-bold text-red-500">{error}</p>
          </div>
        )}

        <button
          onClick={handlePurchase}
          disabled={purchasing || (credits < (selectedItem?.price_credits || 0))}
          className="w-full bg-east-light text-black font-montserrat font-black italic text-lg py-4 rounded-full uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          {purchasing ? 'Processing...' : 'Swipe to Buy'}
        </button>
        
        {(!purchasing && credits < (selectedItem?.price_credits || 0)) && (
          <p className="text-xs font-bold text-red-500 mt-4 uppercase tracking-widest">Not enough credits</p>
        )}
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="p-8 flex flex-col items-center justify-center h-full bg-[#28D160] text-black min-h-[500px] animate-fadeIn">
      <CheckCircle2 size={80} className="text-black mb-6" strokeWidth={1.5} />
      <h2 className="font-montserrat font-black italic text-4xl uppercase tracking-tighter mb-2 text-center leading-none">PURCHASE<br/>SUCCESS</h2>
      <p className="text-sm font-bold opacity-80 mb-8 max-w-[200px] text-center">Paid {selectedItem?.price_credits} credits for {selectedItem?.name}</p>
      
      <div className="bg-black/10 rounded-2xl p-6 w-full text-center border border-black/20 mb-8">
        <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Show this screen</p>
        <p className="font-black">Present to staff to collect your item</p>
      </div>

      <button
        onClick={() => { 
          setView('wallet'); 
          // Reload page to refresh credits
          window.location.reload();
        }}
        className="w-full bg-black text-[#28D160] font-montserrat font-black italic text-sm py-4 rounded-full uppercase tracking-wider shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
      >
        Done
      </button>
    </div>
  );

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
        
        {view === 'wallet' && renderWallet()}
        {view === 'shop' && renderShop()}
        {view === 'confirm' && renderConfirm()}
        {view === 'success' && renderSuccess()}
      </div>
    </div>
  );
}