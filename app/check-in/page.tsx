'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Home, Wallet, ScanLine, CheckCircle2, XCircle, Pencil } from 'lucide-react';
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { supabase } from '@/app/lib/supabase';

const QrScanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then((mod) => mod.Scanner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-[#28D160] text-xs font-black animate-pulse uppercase tracking-widest">
          Loading Camera...
        </p>
      </div>
    ),
  }
);

interface ShopItem { id: number; name: string; price_credits: number; category: string; }
interface MemberProfile { id: string; first_name: string | null; last_name: string | null; avatar_url: string | null; credits: number; }
interface PaymentRequest { amount: number; reason: string; data: any; }
interface ChargeRequest { targetUserId: string; member: MemberProfile; }

// ─── Category accent colours ──────────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  drinks: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  snacks: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
  merch: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
  equipment: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
  general: 'bg-white/5 text-gray-400 border-white/10',
};

export default function CheckIn() {
  const router = useRouter();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [chargeRequest, setChargeRequest] = useState<ChargeRequest | null>(null);
  const [lastScanMessage, setLastScanMessage] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // Shop items
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customAmount, setCustomAmount] = useState<number>(10);
  const [customReason, setCustomReason] = useState<string>('');

  // Fetch current user role
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('role').eq('id', user.id).single()
        .then(({ data }) => { if (data?.role) setCurrentUserRole(data.role); });
    });
  }, []);

  // Fetch shop items for admin
  useEffect(() => {
    const fetchItems = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/admin/shop-items', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setShopItems(Array.isArray(data) ? data : []);
      }
    };
    fetchItems();
  }, []);

  // Expose simulateScan for Playwright tests
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).simulateScan = (val: string) =>
        handleScan([{ rawValue: val, format: 'qr_code', cornerPoints: [] as any } as any]);
    }
  }, []);

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  const isAdmin = currentUserRole === 'sys-admin' || currentUserRole === 'admin';

  const handleScan = useCallback(async (detectedCodes: IDetectedBarcode[]) => {
    if (processing || scanned || paymentRequest || chargeRequest) return;
    const raw = detectedCodes?.[0]?.rawValue;
    if (!raw) return;

    try {
      const payload = JSON.parse(raw);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('You must be logged in.'); return; }

      // ── Identity Verification ──────────────────

      // ── Gym check-in QR ──────────────────────────────────────────
      if (payload.type === 'check-in') {
        setProcessing(true);
        const token = await getAuthToken();
        const res = await fetch('/api/check-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ userId: user.id, locationId: payload.location, timestamp: payload.timestamp }),
        });
        const data = await res.json();
        setProcessing(false);
        if (data.success) { setLastScanMessage(`Checked in at ${payload.location}`); setScanned(true); }
        else setError(data.error || 'Check-In failed');
      }

      // ── Self-pay QR ──────────────────────────────────────────────
      else if (payload.type === 'pay') {
        setPaymentRequest({ amount: payload.amount, reason: payload.reason, data: payload });
      }

      // ── Member wallet QR — admin check-in or shop charge ──────────
      else if (payload.type === 'athlete_wallet') {
        if (!isAdmin) { setError('Only admins can scan member wallet QR codes.'); return; }
        setProcessing(true);
        const { data: memberProfile, error: profileErr } = await supabase
          .from('profiles').select('id, first_name, last_name, avatar_url, credits').eq('id', payload.userId).single();
        setProcessing(false);
        if (profileErr || !memberProfile) { setError('Member not found.'); return; }
        setSelectedItem(null);
        setCustomMode(false);
        setCustomAmount(10);
        setCustomReason('');
        setChargeRequest({ targetUserId: payload.userId, member: memberProfile as MemberProfile });
      }

      else setError('Unknown QR Code type.');
    } catch (e: any) { 
      console.error("[SCAN] Parse error:", e);
      // Silently ignore browser-native barcode detection noise.
      // "The string did not match the expected pattern" is a DOMException thrown
      // by the browser's BarcodeDetector API when it reads a partial/non-QR frame.
      // This is normal scanner behaviour and should NOT surface to the user.
      const msg = e?.message || '';
      if (msg.includes('did not match the expected pattern') || msg.includes('No MultiFormat Readers')) {
        return;
      }
      setError('Invalid QR Code format.'); 
    }
  }, [processing, scanned, paymentRequest, chargeRequest, isAdmin]);

  // ── Self-pay confirm ──────────────────────────────────────────────────────
  const confirmPayment = async () => {
    if (!paymentRequest) return;
    setProcessing(true);
    const req = paymentRequest; setPaymentRequest(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');
      const token = await getAuthToken();
      const res = await fetch('/api/sessions/pay-via-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ userId: user.id, amount: req.amount, reason: req.reason }),
      });
      const data = await res.json();
      if (data.success) { setLastScanMessage(`Paid ${req.amount} credits.`); setScanned(true); }
      else setError(data.error || 'Payment failed');
    } catch (e: any) { setError(e.message); }
    finally { setProcessing(false); }
  };

  // ── Admin charge confirm ──────────────────────────────────────────────────
  const confirmCharge = async () => {
    if (!chargeRequest) return;
    const amount = customMode ? customAmount : selectedItem?.price_credits;
    const reason = customMode ? (customReason || 'Admin charge') : selectedItem?.name;
    if (!amount || amount <= 0) { setError('Select an item or enter a valid amount.'); return; }

    setProcessing(true);
    const req = chargeRequest; setChargeRequest(null);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/charge-via-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ targetUserId: req.targetUserId, amount, reason }),
      });
      const data = await res.json();
      if (data.success) {
        const name = `${req.member.first_name || ''} ${req.member.last_name || ''}`.trim();
        setLastScanMessage(`${amount} credits charged from ${name}. New balance: ${data.newBalance}`);
        setScanned(true);
      } else setError(data.error || 'Charge failed');
    } catch (e: any) { setError(e.message); }
    finally { setProcessing(false); }
  };

  // ── Admin entry ONLY (no charge) ───────────────────────────────────────────
  const confirmEntry = async () => {
    if (!chargeRequest) return;
    setProcessing(true);
    const req = chargeRequest; setChargeRequest(null);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/check-in-athlete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ userId: req.targetUserId, locationId: 'Front Desk' }),
      });
      const data = await res.json();
      if (data.success) {
        const name = `${req.member.first_name || ''} ${req.member.last_name || ''}`.trim();
        setLastScanMessage(`${name} checked in successfully (no charge).`);
        setScanned(true);
      } else setError(data.error || 'Check-in failed');
    } catch (e: any) { setError(e.message); }
    finally { setProcessing(false); }
  };

  const reset = () => {
    setScanned(false); setError(null);
    setPaymentRequest(null); setChargeRequest(null);
    setSelectedItem(null); setCustomMode(false);
    setLastScanMessage('');
  };

  const showScanner = !scanned && !processing && !paymentRequest && !chargeRequest;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans select-none">

      {/* Header */}
      <header className="flex-none pt-10 pb-4 text-center">
        <h1 className="font-montserrat font-black italic text-5xl uppercase tracking-tighter text-white">EAST</h1>
        <div className="h-[2px] w-12 bg-[#28D160] mx-auto mt-2 rounded-full" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-5 pt-6 pb-32">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#28D160] mb-6">
          {isAdmin ? 'Admin Scanner' : 'Check-In / Pay'}
        </p>

        <div className="relative w-full max-w-sm">
          <div className="relative bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl" style={{ minHeight: 320 }}>
            <div className="h-1 w-full bg-gradient-to-r from-[#28D160] to-[#1aab4a]" />
            <div className="p-5">

              {/* Live camera */}
              {showScanner && (
                <div className="relative overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: '1/1' }}>
                  <QrScanner
                    onScan={handleScan}
                    onError={() => {}}
                    components={{ torch: false }}
                    constraints={{ facingMode: 'environment' }}
                  />
                  {[['top-2 left-2','border-t-2 border-l-2 rounded-tl-lg'],
                    ['top-2 right-2','border-t-2 border-r-2 rounded-tr-lg'],
                    ['bottom-2 left-2','border-b-2 border-l-2 rounded-bl-lg'],
                    ['bottom-2 right-2','border-b-2 border-r-2 rounded-br-lg']
                  ].map(([pos, borders], i) => (
                    <div key={i} className={`absolute ${pos} w-6 h-6 ${borders} border-[#28D160]`} />
                  ))}
                  <div className="absolute left-4 right-4 h-[1px] bg-[#28D160]/60 animate-scanline top-1/2" />
                </div>
              )}

              {/* Processing */}
              {processing && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-white/10 border-t-[#28D160] rounded-full animate-spin mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Processing...</p>
                </div>
              )}

              {/* ── Self-pay confirm ────────────────────────── */}
              {paymentRequest && (
                <div className="flex flex-col items-center py-4 animate-fadeIn">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4">Confirm Payment</p>
                  <span className="font-montserrat font-black italic text-5xl text-white">{paymentRequest.amount}</span>
                  <span className="text-xs font-black uppercase text-gray-600 tracking-widest mt-1 mb-1">Credits</span>
                  <p className="text-sm text-gray-400 mb-6">"{paymentRequest.reason}"</p>
                  <div className="flex gap-3 w-full">
                    <button onClick={() => { setPaymentRequest(null); reset(); }}
                      className="flex-1 py-3.5 rounded-2xl border border-white/10 text-gray-400 font-bold text-xs uppercase tracking-widest hover:border-white/30 transition-colors">
                      Cancel
                    </button>
                    <button id="confirm-payment-btn" onClick={confirmPayment}
                      className="flex-1 py-3.5 rounded-2xl bg-[#28D160] text-black font-montserrat font-black italic text-sm uppercase tracking-wide hover:bg-[#32e86e] active:scale-95 transition-all">
                      Pay Now
                    </button>
                  </div>
                </div>
              )}

              {/* ── Admin: Charge member ────────────────────── */}
              {chargeRequest && (
                <div className="flex flex-col animate-fadeIn">
                  {/* Member identity card */}
                  <div className="w-full bg-black rounded-2xl p-3 flex items-center gap-3 mb-6 border border-white/5">
                    {chargeRequest.member.avatar_url ? (
                      <img src={chargeRequest.member.avatar_url} alt="member"
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#28D160] flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#28D160]/10 border border-[#28D160]/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#28D160] font-black text-lg">
                          {(chargeRequest.member.first_name?.[0] || '?').toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-montserrat font-black italic text-white text-base leading-tight truncate">
                        {chargeRequest.member.first_name} {chargeRequest.member.last_name}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        {chargeRequest.member.credits} credits available
                      </p>
                    </div>
                  </div>

                  {/* Primary Choice: Entry vs Shop */}
                  {!selectedItem && !customMode && (
                    <div className="flex flex-col gap-3 py-2">
                       <button
                        onClick={confirmEntry}
                        className="w-full py-4 rounded-2xl bg-white text-black font-montserrat font-black italic text-sm uppercase tracking-wide hover:bg-gray-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={18} /> Check-In Only
                      </button>
                      <div className="flex items-center gap-2 my-2">
                        <div className="flex-1 h-[1px] bg-white/10" />
                        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">or charge for item</span>
                        <div className="flex-1 h-[1px] bg-white/10" />
                      </div>
                    </div>
                  )}

                  {/* Mode toggle: shop items vs custom (only shown if charging) */}
                  <div className="flex p-1 bg-black rounded-xl mb-4 border border-white/10">
                    <button
                      onClick={() => setCustomMode(false)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!customMode ? 'bg-[#28D160] text-black' : 'text-gray-500 hover:text-white'}`}
                    >Shop Items</button>
                    <button
                      onClick={() => { setCustomMode(true); setSelectedItem(null); }}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 ${customMode ? 'bg-[#28D160] text-black' : 'text-gray-500 hover:text-white'}`}
                    >
                      <Pencil size={10} /> Custom
                    </button>
                  </div>

                  {/* ── Shop item grid ── */}
                  {!customMode && (
                    <div className="grid grid-cols-2 gap-2 mb-4 max-h-44 overflow-y-auto pr-1">
                      {shopItems.length === 0 && (
                        <p className="col-span-2 text-center text-gray-600 text-xs py-4">No items configured.</p>
                      )}
                      {shopItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className={`text-left p-3 rounded-xl border transition-all ${
                            selectedItem?.id === item.id
                              ? 'border-[#28D160] bg-[#28D160]/10'
                              : 'border-white/10 bg-black hover:border-white/20'
                          }`}
                        >
                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded tracking-widest ${CAT_COLOR[item.category] || CAT_COLOR.general}`}>
                            {item.category}
                          </span>
                          <p className="text-white text-[11px] font-bold mt-1.5 leading-snug truncate">{item.name}</p>
                          <p className="font-montserrat font-black italic text-[#28D160] text-base mt-1">
                            {item.price_credits}<span className="text-gray-600 text-[8px] ml-0.5 not-italic font-bold">cr</span>
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ── Custom amount ── */}
                  {customMode && (
                    <div className="flex flex-col gap-3 mb-4">
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1.5">Credits</label>
                        <input
                          id="charge-amount-input"
                          type="number" min={1} value={customAmount}
                          onChange={e => setCustomAmount(Number(e.target.value))}
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-montserrat font-black italic text-3xl text-center focus:outline-none focus:border-[#28D160] transition-colors"
                        />
                      </div>
                      <div>
                        <input
                          id="charge-reason-input"
                          type="text" value={customReason}
                          onChange={e => setCustomReason(e.target.value)}
                          placeholder="Reason (optional)"
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-[#28D160] transition-colors placeholder:text-gray-700"
                        />
                      </div>
                    </div>
                  )}

                  {/* Summary + confirm */}
                  {(selectedItem || customMode) && (
                    <div className="bg-black border border-white/5 rounded-xl px-4 py-2.5 mb-4 text-xs text-center">
                      <span className="text-gray-500">Charging </span>
                      <span className="font-montserrat font-black italic text-[#28D160]">
                        {customMode ? customAmount : selectedItem?.price_credits} cr
                      </span>
                      <span className="text-gray-500"> for </span>
                      <span className="font-bold text-white">
                        {customMode ? (customReason || 'Manual') : selectedItem?.name}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => { setChargeRequest(null); reset(); }}
                      className="flex-1 py-3.5 rounded-2xl border border-white/10 text-gray-400 font-bold text-xs uppercase tracking-widest hover:border-white/30 transition-colors">
                      Cancel
                    </button>
                    {(selectedItem || customMode) && (
                      <button
                        id="confirm-charge-btn"
                        onClick={confirmCharge}
                        className="flex-1 py-3.5 rounded-2xl bg-[#28D160] text-black font-montserrat font-black italic text-sm uppercase tracking-wide hover:bg-[#32e86e] active:scale-95 transition-all"
                      >
                        Charge
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Success */}
              {scanned && !paymentRequest && !chargeRequest && !processing && (
                <div className="flex flex-col items-center justify-center py-10 animate-fadeIn text-center">
                  <CheckCircle2 size={56} className="text-[#28D160] mb-4" strokeWidth={1.5} />
                  <p className="font-montserrat font-black italic text-2xl uppercase tracking-tighter text-white mb-2">Done!</p>
                  <p className="text-xs text-gray-500 mb-8 max-w-[200px] leading-relaxed">{lastScanMessage}</p>
                  <button onClick={reset}
                    className="px-8 py-3 rounded-full bg-[#28D160] text-black font-montserrat font-black italic text-sm uppercase tracking-wider hover:bg-[#32e86e] active:scale-95 transition-all">
                    Scan Again
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
              <XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-red-400 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400 text-xs font-bold">✕</button>
            </div>
          )}

          {showScanner && (
            <p className="text-center mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-700">
              {isAdmin ? 'Scan member wallet QR · gym check-in · or pay' : 'Point camera at a QR code'}
            </p>
          )}
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/5 pb-safe">
        <div className="flex max-w-sm mx-auto">
          {[
            { label: 'Home', icon: Home, action: () => router.push('/') },
            { label: 'Scanner', icon: ScanLine, action: () => {}, active: true },
            { label: 'Wallet', icon: Wallet, action: () => router.push('/?tab=qr') },
          ].map(({ label, icon: Icon, action, active }) => (
            <button key={label} onClick={action}
              className={`flex-1 flex flex-col items-center gap-1 py-4 transition-colors ${active ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}>
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[9px] font-black uppercase tracking-widest font-montserrat">{label}</span>
            </button>
          ))}
        </div>
        <div className="flex max-w-sm mx-auto px-4 pb-2">
          {['', 'active', ''].map((s, i) => (
            <div key={i} className={`flex-1 h-0.5 mx-1 rounded-full ${s ? 'bg-[#28D160]' : 'bg-transparent'}`} />
          ))}
        </div>
      </nav>

      <style>{`
        @keyframes scanline {
          0%   { transform: translateY(-100px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(100px); opacity: 0; }
        }
        .animate-scanline { animation: scanline 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}