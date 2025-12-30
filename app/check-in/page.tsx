'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Footer from '../components/Footer';
import type { Result } from 'react-qr-scanner';

// Dynamic import with SSR disabled to avoid "document is not defined" error during build
const QrScanner = dynamic(() => import('react-qr-scanner'), {
  ssr: false,
  loading: () => <div className="w-full max-w-[300px] aspect-square mx-auto bg-gray-100 flex items-center justify-center rounded-lg">
    <p className="text-black/50 text-xs font-bold animate-pulse uppercase tracking-widest">Loading Camera...</p>
  </div>
});

export default function CheckIn() {
  const [activeTab, setActiveTab] = useState('check-in');
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = (data: Result | null) => {
    if (data?.text) {
      setScanned(true);
      console.log('QR Code data:', data.text);
    }
  };

  const handleError = (err: Error) => {
    setError(err.message);
    console.error(err);
  };

  return (
    <div className="app min-h-screen bg-dark text-white flex flex-col items-center">
      <div className="east-logo text-4xl md:text-6xl text-center py-6 w-full">EAST</div>

      <main className="main-content w-full max-w-4xl mx-auto px-4 flex flex-col items-center">
        <div className="qr-container mt-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Check-In</h2>
          <div className="qr-code-wrapper mb-4 bg-white p-4 rounded-lg min-h-[300px] flex items-center justify-center">
            {!scanned && (
              <QrScanner
                delay={300}
                onError={handleError}
                onScan={handleScan}
                constraints={{
                  audio: false,
                  video: { facingMode: 'environment' }
                }}
                className="w-full max-w-[300px] aspect-square mx-auto"
              />
            )}
            {scanned && (
              <div className="w-full max-w-[300px] aspect-square mx-auto flex items-center justify-center bg-green-50 rounded-lg">
                <span className="text-4xl">✅</span>
              </div>
            )}
          </div>
          {error && (
            <p className="text-red-500 text-center mb-4 text-xs font-bold">
              Error: {error}. Please make sure you've granted camera permissions.
            </p>
          )}
          <p className="text-center mb-4 font-bold text-sm uppercase tracking-widest">
            {scanned
              ? "Successfully checked in!"
              : "Please scan your QR code to check in"}
          </p>
          {scanned && (
            <button
              onClick={() => setScanned(false)}
              className="w-full bg-primary px-4 py-3 rounded-lg hover:opacity-90 transition-opacity font-bold uppercase tracking-widest text-xs"
            >
              Scan Another Code
            </button>
          )}
        </div>
      </main>

      <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}