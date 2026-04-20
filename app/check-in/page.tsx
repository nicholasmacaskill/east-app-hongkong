'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Home, Wallet, ScanLine, CheckCircle2, XCircle } from 'lucide-react';
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

interface MemberProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  credits: number;
}

interface PaymentRequest {
  amount: number;
  reason: string;
  data: any;
}

interface ChargeRequest {
  targetUserId: string;
  member: MemberProfile;
}

export default function CheckIn() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('check-in');
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [chargeRequest, setChargeRequest] = useState<ChargeRequest | null>(null);
  const [chargeAmount, setChargeAmount] = useState<number>(10);
  const [chargeReason, setChargeReason] = useState<string>('Drop-in session');
  const [lastScanMessage, setLastScanMessage] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.role) setCurrentUserRole(data.role);
        });
    });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).simulateScan = (val: string) =>
        handleScan([{ rawValue: val, format: 'qr_code', cornerPoints: [] as any } as any]);
    }
  }, []);

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  const isAdmin = currentUserRole === 'sys-admin' || currentUserRole === 'admin';

  const handleScan = useCallback(async (detectedCodes: IDetectedBarcode[]) => {
    if (processing || scanned || paymentRequest || chargeRequest) return;
    if (!detectedCodes?.length) return;

    const raw = detectedCodes[0].rawValue;
    if (!raw) return;

    try {
      const payload = JSON.parse(raw);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('You must be logged in.'); return; }

      // ── Check-in QR ──────────────────────────────────────────────
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

      // ── Self-pay QR ───────────────────────────────────────────────
      else if (payload.type === 'pay') {
        setPaymentRequest({ amount: payload.amount, reason: payload.reason, data: payload });
      }

      // ── Member wallet QR (admin charges member) ───────────────────
      else if (payload.type === 'athlete_wallet') {
        if (!isAdmin) { setError('Only admins can scan member wallet QR codes.'); return; }
        setProcessing(true);
        const { data: memberProfile, error: profileErr } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url, credits')
          .eq('id', payload.userId)
          .single();
        setProcessing(false);
        if (profileErr || !memberProfile) { setError('Member not found.'); return; }
        setChargeAmount(10);
        setChargeReason('Drop-in session');
        setChargeRequest({ targetUserId: payload.userId, member: memberProfile as MemberProfile });
      }

      else setError('Unknown QR Code type.');
    } catch {
      setError('Invalid QR Code format.');
    }
  }, [processing, scanned, paymentRequest, chargeRequest, isAdmin]);

  const confirmPayment = async () => {
    if (!paymentRequest) return;
    setProcessing(true);
    const req = paymentRequest;
    setPaymentRequest(null);
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
    } catch (e: any) { setError(e.message || 'Payment Error'); }
    finally { setProcessing(false); }
  };

  const confirmCharge = async () => {
    if (!chargeRequest || !chargeAmount || chargeAmount <= 0) { setError('Enter a valid amount.'); return; }
    setProcessing(true);
    const req = chargeRequest;
    setChargeRequest(null);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/charge-via-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ targetUserId: req.targetUserId, amount: chargeAmount, reason: chargeReason || 'Admin QR Charge' }),
      });
      const data = await res.json();
      if (data.success) {
        const name = `${req.member.first_name || ''} ${req.member.last_name || ''}`.trim();
        setLastScanMessage(`${chargeAmount} credits charged from ${name}. New balance: ${data.newBalance}`);
        setScanned(true);
      } else setError(data.error || 'Charge failed');
    } catch (e: any) { setError(e.message || 'Charge Error'); }
    finally { setProcessing(false); }
  };

  const reset = () => {
    setScanned(false); setError(null);
    setPaymentRequest(null); setChargeRequest(null);
    setLastScanMessage('');
  };

  const showScanner = !scanned && !processing && !paymentRequest && !chargeRequest;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans select-none">

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="flex-none pt-10 pb-4 text-center">
        <h1 className="font-montserrat font-black italic text-5xl uppercase tracking-tighter text-white">
          EAST
        </h1>
        <div className="h-[2px] w-12 bg-[#28D160] mx-auto mt-2 rounded-full" />
      </header>

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-start px-5 pt-6 pb-32">

        {/* Page label */}
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#28D160] mb-6">
          {isAdmin ? 'Admin Scanner' : 'Check-In / Pay'}
        </p>

        {/* ── Scanner card ──────────────────────────────────── */}
        <div className="relative w-full max-w-sm">

          {/* Outer frame */}
          <div className="relative bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
               style={{ minHeight: 320 }}>

            {/* Green top accent bar */}
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
                  {/* Corner finder marks */}
                  {[['top-2 left-2', 'border-t-2 border-l-2 rounded-tl-lg'],
                    ['top-2 right-2', 'border-t-2 border-r-2 rounded-tr-lg'],
                    ['bottom-2 left-2', 'border-b-2 border-l-2 rounded-bl-lg'],
                    ['bottom-2 right-2', 'border-b-2 border-r-2 rounded-br-lg']
                  ].map(([pos, borders], i) => (
                    <div key={i} className={`absolute ${pos} w-6 h-6 ${borders} border-[#28D160]`} />
                  ))}
                  {/* Scan line animation */}
                  <div className="absolute left-4 right-4 h-[1px] bg-[#28D160]/60 animate-scanline top-1/2" />
                </div>
              )}

              {/* Processing spinner */}
              {processing && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-white/10 border-t-[#28D160] rounded-full animate-spin mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Processing...</p>
                </div>
              )}

              {/* ── Self-pay confirmation ────────────────────────── */}
              {paymentRequest && (
                <div className="flex flex-col items-center py-4 animate-fadeIn">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4">Confirm Payment</p>
                  <div className="mb-1">
                    <span className="font-montserrat font-black italic text-5xl text-white">{paymentRequest.amount}</span>
                    <span className="text-xs font-black uppercase text-gray-600 ml-2 tracking-widest">Credits</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-6">"{paymentRequest.reason}"</p>
                  <div className="flex gap-3 w-full mt-2">
                    <button
                      onClick={() => { setPaymentRequest(null); reset(); }}
                      className="flex-1 py-3.5 rounded-2xl border border-white/10 text-gray-400 font-bold text-xs uppercase tracking-widest hover:border-white/30 transition-colors"
                    >Cancel</button>
                    <button
                      id="confirm-payment-btn"
                      onClick={confirmPayment}
                      className="flex-1 py-3.5 rounded-2xl bg-[#28D160] text-black font-montserrat font-black italic text-sm uppercase tracking-wide hover:bg-[#32e86e] active:scale-95 transition-all"
                    >Pay Now</button>
                  </div>
                </div>
              )}

              {/* ── Admin: Charge member modal ───────────────────── */}
              {chargeRequest && (
                <div className="flex flex-col items-center py-2 animate-fadeIn">
                  {/* Member card */}
                  <div className="w-full bg-black rounded-2xl p-4 flex items-center gap-3 mb-5 border border-white/5">
                    {chargeRequest.member.avatar_url ? (
                      <img
                        src={chargeRequest.member.avatar_url}
                        alt="member"
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#28D160] flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#28D160]/10 border border-[#28D160]/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#28D160] text-lg font-black">
                          {(chargeRequest.member.first_name?.[0] || '?').toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="text-left min-w-0">
                      <p className="font-montserrat font-black italic text-white text-base leading-tight truncate">
                        {chargeRequest.member.first_name} {chargeRequest.member.last_name}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-0.5">
                        {chargeRequest.member.credits} credits available
                      </p>
                    </div>
                  </div>

                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4">Charge Member</p>

                  {/* Amount */}
                  <div className="w-full mb-3">
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1.5">
                      Credits to Charge
                    </label>
                    <input
                      id="charge-amount-input"
                      type="number"
                      min={1}
                      value={chargeAmount}
                      onChange={(e) => setChargeAmount(Number(e.target.value))}
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-montserrat font-black italic text-3xl text-center focus:outline-none focus:border-[#28D160] transition-colors"
                    />
                  </div>

                  {/* Reason */}
                  <div className="w-full mb-5">
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1.5">
                      Reason
                    </label>
                    <input
                      id="charge-reason-input"
                      type="text"
                      value={chargeReason}
                      onChange={(e) => setChargeReason(e.target.value)}
                      placeholder="Drop-in session, Equipment hire..."
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#28D160] transition-colors placeholder:text-gray-700"
                    />
                  </div>

                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => { setChargeRequest(null); reset(); }}
                      className="flex-1 py-3.5 rounded-2xl border border-white/10 text-gray-400 font-bold text-xs uppercase tracking-widest hover:border-white/30 transition-colors"
                    >Cancel</button>
                    <button
                      id="confirm-charge-btn"
                      onClick={confirmCharge}
                      className="flex-1 py-3.5 rounded-2xl bg-[#28D160] text-black font-montserrat font-black italic text-sm uppercase tracking-wide hover:bg-[#32e86e] active:scale-95 transition-all"
                    >Charge {chargeAmount}</button>
                  </div>
                </div>
              )}

              {/* ── Success state ────────────────────────────────── */}
              {scanned && !paymentRequest && !chargeRequest && !processing && (
                <div className="flex flex-col items-center justify-center py-10 animate-fadeIn text-center">
                  <CheckCircle2 size={56} className="text-[#28D160] mb-4" strokeWidth={1.5} />
                  <p className="font-montserrat font-black italic text-2xl uppercase tracking-tighter text-white mb-2">Done!</p>
                  <p className="text-xs text-gray-500 mb-8 max-w-[200px] leading-relaxed">{lastScanMessage}</p>
                  <button
                    onClick={reset}
                    className="px-8 py-3 rounded-full bg-[#28D160] text-black font-montserrat font-black italic text-sm uppercase tracking-wider hover:bg-[#32e86e] active:scale-95 transition-all"
                  >Scan Again</button>
                </div>
              )}
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mt-3 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
              <XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-red-400 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400/50 hover:text-red-400 text-xs font-bold">✕</button>
            </div>
          )}

          {/* Hint */}
          {showScanner && (
            <p className="text-center mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-700">
              {isAdmin
                ? 'Scan member wallet QR · gym check-in · or pay'
                : 'Point camera at a QR code'}
            </p>
          )}
        </div>
      </main>

      {/* ── Bottom nav ────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/5 pb-safe">
        <div className="flex max-w-sm mx-auto">
          {[
            { label: 'Home', icon: Home, action: () => router.push('/') },
            { label: 'Scanner', icon: ScanLine, action: () => {}, active: true },
            { label: 'Wallet', icon: Wallet, action: () => router.push('/?tab=qr') },
          ].map(({ label, icon: Icon, action, active }) => (
            <button
              key={label}
              onClick={action}
              className={`flex-1 flex flex-col items-center gap-1 py-4 transition-colors ${
                active ? 'text-white' : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[9px] font-black uppercase tracking-widest font-montserrat">
                {label}
              </span>
            </button>
          ))}
        </div>
        {/* Active indicator */}
        <div className="flex max-w-sm mx-auto px-4 pb-2">
          {['', 'active', ''].map((s, i) => (
            <div key={i} className={`flex-1 h-0.5 mx-1 rounded-full ${s ? 'bg-[#28D160]' : 'bg-transparent'}`} />
          ))}
        </div>
      </nav>

      {/* Global scan-line animation */}
      <style>{`
        @keyframes scanline {
          0%   { transform: translateY(-100px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(100px); opacity: 0; }
        }
        .animate-scanline {
          animation: scanline 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}