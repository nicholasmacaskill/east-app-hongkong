'use client';
import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function QRCode() {
  const [activeTab, setActiveTab] = useState('qr');

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="qr-container text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">BEN MACASKILL</h1>
            <div className="text-xl mb-4">POINTS: 1510</div>
            <div className="text-sm">MEMBER SINCE: 10 Dec 2024</div>
          </div>
          
          <div className="qr-code-wrapper bg-white p-6 rounded-lg shadow-lg">
            <img
              src="/qr-code.png"
              alt="QR Code"
              className="w-64 h-64"
            />
          </div>
        </div>
      </main>

      <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}