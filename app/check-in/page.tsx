'use client';
import { useState } from 'react';
import Footer from '../components/Footer';
import QrScanner from 'react-qr-scanner';
import type { Result } from 'react-qr-scanner';

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
          <div className="qr-code-wrapper mb-4 bg-white p-4 rounded-lg">
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
          </div>
          {error && (
            <p className="text-red-500 text-center mb-4">
              Error: {error}. Please make sure you've granted camera permissions.
            </p>
          )}
          <p className="text-center mb-4">
            {scanned 
              ? "Successfully checked in!" 
              : "Please scan your QR code to check in"}
          </p>
          {scanned && (
            <button
              onClick={() => setScanned(false)}
              className="bg-primary px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
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