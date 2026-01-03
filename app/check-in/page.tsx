'use client';
import { useState } from 'react';
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

export default function CheckIn() {
  const [activeTab, setActiveTab] = useState('check-in');
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<{ amount: number, reason: string, data: any } | null>(null);
  const [lastScanMessage, setLastScanMessage] = useState("");

  // Helper to get current User ID (mocked or from Supabase auth if we were inside a component that fetched it)
  // For client-side safety, we should ideally fetch the user here.
  // BUT the API endpoints will need the USER ID. 
  // Let's assume we can get it from supabase.auth.getUser() inside the handler.
  const { supabase } = require('@/app/lib/supabase'); // Or import at top

  const handleScan = async (detectedCodes: IDetectedBarcode[]) => {
    if (processing || scanned || paymentRequest) return; // Prevent double scan

    if (detectedCodes && detectedCodes.length > 0) {
      const raw = detectedCodes[0].rawValue;
      if (!raw) return;

      console.log('QR Code data:', raw);

      try {
        const payload = JSON.parse(raw);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setError("You must be logged in.");
          return;
        }

        // 1. CHECK-IN
        if (payload.type === 'check-in') {
          setProcessing(true);
          const res = await fetch('/api/check-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, locationId: payload.location, timestamp: payload.timestamp })
          });
          const data = await res.json();
          setProcessing(false);

          if (data.success) {
            setLastScanMessage(`Checked in at ${payload.location}`);
            setScanned(true);
          } else {
            setError(data.error || "Check-in failed");
          }
        }

        // 2. PAYMENT
        else if (payload.type === 'pay') {
          // Pause scanner, show modal
          setPaymentRequest({
            amount: payload.amount,
            reason: payload.reason,
            data: payload // Keep raw payload for the confirmation step
          });
        }

        else {
          setError("Unknown QR Code type.");
        }

      } catch (e) {
        console.error("Parse error", e);
        setError("Invalid QR Code format.");
      }
    }
  };

  const confirmPayment = async () => {
    if (!paymentRequest) return;
    setProcessing(true);
    setPaymentRequest(null); // Hide modal

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const res = await fetch('/api/sessions/pay-via-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: paymentRequest.amount,
          reason: paymentRequest.reason
        })
      });
      const data = await res.json();

      if (data.success) {
        setLastScanMessage(`Paid ${paymentRequest.amount} credits.`);
        setScanned(true);
      } else {
        setError(data.error || "Payment failed");
      }
    } catch (e: any) {
      setError(e.message || "Payment Error");
    } finally {
      setProcessing(false);
    }
  };

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    // Ignore some common camera noise errors if needed, but log them
    console.error(err);
  };

  return (
    <div className="app min-h-screen bg-dark text-white flex flex-col items-center">
      <div className="east-logo text-4xl md:text-6xl text-center py-6 w-full">EAST</div>

      <main className="main-content w-full max-w-4xl mx-auto px-4 flex flex-col items-center">
        <div className="qr-container mt-8 w-full">
          <h2 className="text-2xl font-bold mb-6 text-center">Check-In / Pay</h2>

          <div className="qr-code-wrapper mb-4 bg-white p-4 rounded-lg min-h-[300px] flex items-center justify-center relative">
            {!scanned && !processing && (
              <div className="w-full max-w-[300px] aspect-square mx-auto relative overflow-hidden rounded-lg">
                <QrScanner
                  onScan={handleScan}
                  onError={handleError}
                  components={{ torch: false }}
                  constraints={{ facingMode: 'environment' }}
                />
              </div>
            )}

            {/* Processing State */}
            {processing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20">
                <div className="w-12 h-12 border-4 border-[#28D160] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-black font-bold uppercase tracking-widest text-xs">Processing...</p>
              </div>
            )}

            {/* Payment Confirmation Modal */}
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
                    onClick={confirmPayment}
                    className="flex-1 py-3 bg-[#28D160] rounded-lg text-black font-bold text-xs uppercase hover:shadow-lg"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            )}

            {/* Success State */}
            {scanned && !paymentRequest && !processing && (
              <div className="w-full max-w-[300px] aspect-square mx-auto flex flex-col items-center justify-center bg-green-50 rounded-lg animate-fadeIn text-center p-4">
                <span className="text-6xl mb-4">✅</span>
                <p className="text-green-800 font-bold text-lg mb-2">Success!</p>
                <p className="text-green-600 text-sm mb-4">{lastScanMessage}</p>
                <button
                  onClick={() => setScanned(false)}
                  className="bg-[#28D160] px-6 py-2 rounded-full text-black font-bold text-xs uppercase"
                >
                  Scan Again
                </button>
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-center mb-4 text-xs font-bold bg-red-500/10 p-2 rounded">
              {error}
            </p>
          )}

          {!scanned && !paymentRequest && (
            <p className="text-center mb-4 font-bold text-sm uppercase tracking-widest opacity-50">
              Scan a QR code to check in or pay
            </p>
          )}
        </div>
      </main>

      <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}