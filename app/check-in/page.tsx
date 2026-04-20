'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Footer from '../components/Footer';
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { supabase } from '@/app/lib/supabase';

// Dynamic import for named export 'Scanner'
const QrScanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then((mod) => mod.Scanner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-[300px] aspect-square mx-auto bg-gray-100 flex items-center justify-center rounded-lg">
        <p className="text-black/50 text-xs font-bold animate-pulse uppercase tracking-widest">
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
  const [activeTab, setActiveTab] = useState('check-in');
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [chargeRequest, setChargeRequest] = useState<ChargeRequest | null>(null);
  const [chargeAmount, setChargeAmount] = useState<number>(10);
  const [chargeReason, setChargeReason] = useState<string>('Admin QR Charge');
  const [lastScanMessage, setLastScanMessage] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // Fetch current user's role on mount to know if admin flow is available
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

  // Expose for automated testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).simulateScan = (val: string) =>
        handleScan([
          {
            rawValue: val,
            format: 'qr_code',
            cornerPoints: [] as any,
          } as any,
        ]);
    }
  }, []);

  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  const handleScan = useCallback(async (detectedCodes: IDetectedBarcode[]) => {
    if (processing || scanned || paymentRequest || chargeRequest) return;

    if (detectedCodes && detectedCodes.length > 0) {
      const raw = detectedCodes[0].rawValue;
      if (!raw) return;

      console.log('QR Code data:', raw);

      try {
        const payload = JSON.parse(raw);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setError('You must be logged in.');
          return;
        }

        // ── 1. GYM CHECK-IN QR ──────────────────────────────────
        if (payload.type === 'check-in') {
          setProcessing(true);
          const token = await getAuthToken();
          const res = await fetch('/api/check-in', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              userId: user.id,
              locationId: payload.location,
              timestamp: payload.timestamp,
            }),
          });
          const data = await res.json();
          setProcessing(false);

          if (data.success) {
            setLastScanMessage(`Checked in at ${payload.location}`);
            setScanned(true);
          } else {
            setError(data.error || 'Check-In failed');
          }
        }

        // ── 2. PAYMENT QR (gym-generated, member self-pays) ─────
        else if (payload.type === 'pay') {
          setPaymentRequest({
            amount: payload.amount,
            reason: payload.reason,
            data: payload,
          });
        }

        // ── 3. MEMBER WALLET QR (admin charges a member) ────────
        else if (payload.type === 'athlete_wallet') {
          const isAdmin =
            currentUserRole === 'sys-admin' || currentUserRole === 'admin';

          if (!isAdmin) {
            setError('Only admins can scan member wallet QR codes.');
            return;
          }

          setProcessing(true);

          // Look up the member so we can show their name + balance in the modal
          const { data: memberProfile, error: profileErr } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, credits')
            .eq('id', payload.userId)
            .single();

          setProcessing(false);

          if (profileErr || !memberProfile) {
            setError('Member not found. QR may be invalid.');
            return;
          }

          setChargeAmount(10);
          setChargeReason('Admin QR Charge');
          setChargeRequest({
            targetUserId: payload.userId,
            member: memberProfile as MemberProfile,
          });
        }

        else {
          setError('Unknown QR Code type.');
        }
      } catch (e) {
        console.error('Parse error', e);
        setError('Invalid QR Code format.');
      }
    }
  }, [processing, scanned, paymentRequest, chargeRequest, currentUserRole]);

  // ── CONFIRM PAYMENT (member self-pays via gym QR) ──────────────
  const confirmPayment = async () => {
    if (!paymentRequest) return;
    setProcessing(true);
    setPaymentRequest(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');
      const token = await getAuthToken();

      const res = await fetch('/api/sessions/pay-via-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user.id,
          amount: paymentRequest.amount,
          reason: paymentRequest.reason,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setLastScanMessage(`Paid ${paymentRequest.amount} credits.`);
        setScanned(true);
      } else {
        setError(data.error || 'Payment failed');
      }
    } catch (e: any) {
      setError(e.message || 'Payment Error');
    } finally {
      setProcessing(false);
    }
  };

  // ── CONFIRM CHARGE (admin charges a member) ─────────────────────
  const confirmCharge = async () => {
    if (!chargeRequest) return;
    if (!chargeAmount || chargeAmount <= 0) {
      setError('Enter a valid amount to charge.');
      return;
    }

    setProcessing(true);
    const pendingCharge = chargeRequest;
    setChargeRequest(null);

    try {
      const token = await getAuthToken();

      const res = await fetch('/api/admin/charge-via-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          targetUserId: pendingCharge.targetUserId,
          amount: chargeAmount,
          reason: chargeReason || 'Admin QR Charge',
        }),
      });
      const data = await res.json();

      if (data.success) {
        const name = `${pendingCharge.member.first_name || ''} ${pendingCharge.member.last_name || ''}`.trim();
        setLastScanMessage(
          `Charged ${chargeAmount} credits from ${name || 'member'}. New balance: ${data.newBalance}`
        );
        setScanned(true);
      } else {
        setError(data.error || 'Charge failed');
      }
    } catch (e: any) {
      setError(e.message || 'Charge Error');
    } finally {
      setProcessing(false);
    }
  };

  const handleError = (err: unknown) => {
    console.error(err);
  };

  const resetScanner = () => {
    setScanned(false);
    setError(null);
    setPaymentRequest(null);
    setChargeRequest(null);
    setLastScanMessage('');
  };

  return (
    <div className="app min-h-screen bg-dark text-white flex flex-col items-center">
      <div className="east-logo text-4xl md:text-6xl text-center py-6 w-full">EAST</div>

      <main className="main-content w-full max-w-4xl mx-auto px-4 flex flex-col items-center">
        <div className="qr-container mt-8 w-full">
          <h2 className="text-2xl font-bold mb-6 text-center">Check-In / Pay</h2>

          <div className="qr-code-wrapper mb-4 bg-white p-4 rounded-lg min-h-[300px] flex items-center justify-center relative">
            {/* Live camera scanner */}
            {!scanned && !processing && !paymentRequest && !chargeRequest && (
              <div className="w-full max-w-[300px] aspect-square mx-auto relative overflow-hidden rounded-lg">
                <QrScanner
                  onScan={handleScan}
                  onError={handleError}
                  components={{ torch: false }}
                  constraints={{ facingMode: 'environment' }}
                />
              </div>
            )}

            {/* Processing Spinner */}
            {processing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20">
                <div className="w-12 h-12 border-4 border-[#28D160] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-black font-bold uppercase tracking-widest text-xs">Processing...</p>
              </div>
            )}

            {/* ── Self-Pay Confirmation Modal ── */}
            {paymentRequest && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-30 p-6 text-center animate-fadeIn">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Confirm Payment</p>
                <div className="text-4xl font-black text-black mb-1">{paymentRequest.amount}</div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">Credits</div>
                <p className="text-black font-medium mb-8">For: "{paymentRequest.reason}"</p>

                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => { setPaymentRequest(null); setScanned(false); }}
                    className="flex-1 py-3 border border-gray-200 rounded-lg text-black font-bold text-xs uppercase hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-payment-btn"
                    onClick={confirmPayment}
                    className="flex-1 py-3 bg-[#28D160] rounded-lg text-black font-bold text-xs uppercase hover:shadow-lg"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            )}

            {/* ── Admin: Charge Member Modal ── */}
            {chargeRequest && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-30 p-6 text-center animate-fadeIn overflow-y-auto">
                {/* Member identity */}
                <div className="mb-4">
                  {chargeRequest.member.avatar_url ? (
                    <img
                      src={chargeRequest.member.avatar_url}
                      alt="member"
                      className="w-14 h-14 rounded-full object-cover mx-auto mb-2 border-2 border-[#28D160]"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-2">
                      <span className="text-gray-500 text-lg font-black">
                        {(chargeRequest.member.first_name?.[0] || '?').toUpperCase()}
                      </span>
                    </div>
                  )}
                  <p className="text-black font-black text-lg">
                    {chargeRequest.member.first_name} {chargeRequest.member.last_name}
                  </p>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                    Balance: {chargeRequest.member.credits} credits
                  </p>
                </div>

                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Charge Member</p>

                {/* Amount input */}
                <div className="w-full mb-3 text-left">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Credits to Charge
                  </label>
                  <input
                    id="charge-amount-input"
                    type="number"
                    min={1}
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg p-3 text-black font-black text-2xl text-center focus:outline-none focus:border-[#28D160]"
                  />
                </div>

                {/* Reason input */}
                <div className="w-full mb-6 text-left">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Reason
                  </label>
                  <input
                    id="charge-reason-input"
                    type="text"
                    value={chargeReason}
                    onChange={(e) => setChargeReason(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg p-3 text-black text-sm focus:outline-none focus:border-[#28D160]"
                    placeholder="e.g. Drop-in session, Equipment hire..."
                  />
                </div>

                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => { setChargeRequest(null); setScanned(false); }}
                    className="flex-1 py-3 border border-gray-200 rounded-lg text-black font-bold text-xs uppercase hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-charge-btn"
                    onClick={confirmCharge}
                    className="flex-1 py-3 bg-[#28D160] rounded-lg text-black font-bold text-xs uppercase hover:shadow-lg"
                  >
                    Charge {chargeAmount} Credits
                  </button>
                </div>
              </div>
            )}

            {/* Success State */}
            {scanned && !paymentRequest && !chargeRequest && !processing && (
              <div className="w-full max-w-[300px] aspect-square mx-auto flex flex-col items-center justify-center bg-green-50 rounded-lg animate-fadeIn text-center p-4">
                <span className="text-6xl mb-4">✅</span>
                <p className="text-green-800 font-bold text-lg mb-2">Success!</p>
                <p className="text-green-600 text-sm mb-4">{lastScanMessage}</p>
                <button
                  onClick={resetScanner}
                  className="bg-[#28D160] px-6 py-2 rounded-full text-black font-bold text-xs uppercase"
                >
                  Scan Again
                </button>
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-center mb-4 text-xs font-bold bg-red-500/10 p-2 rounded">
              {error}{' '}
              <button onClick={() => setError(null)} className="underline ml-1">Dismiss</button>
            </p>
          )}

          {!scanned && !paymentRequest && !chargeRequest && (
            <p className="text-center mb-4 font-bold text-sm uppercase tracking-widest opacity-50">
              {currentUserRole === 'sys-admin' || currentUserRole === 'admin'
                ? 'Scan a member QR to charge, or a gym QR to check in'
                : 'Scan a QR code to check in or pay'}
            </p>
          )}
        </div>
      </main>

      <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}