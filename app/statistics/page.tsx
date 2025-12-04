'use client';
import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Statistics() {
  const [activeTab, setActiveTab] = useState('statistics');

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Header />
      
      <main className="flex-1 w-full">
        <iframe
          src="https://east.booking.dynevents.com/public/stats/league/22/season/27/divisions"
          className="w-full h-full border-none"
          style={{
            height: 'calc(100vh - 140px)', // Adjust for header and footer height
            marginTop: '20px'
          }}
        />
      </main>

      <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}