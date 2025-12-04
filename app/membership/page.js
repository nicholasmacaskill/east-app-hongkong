'use client';
import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Membership() {
  const [activeTab, setActiveTab] = useState('membership');

  const plans = [
    {
      id: 'bronze',
      name: 'BRONZE',
      cardClass: 'bronze-card',
      buttonClass: 'bronze-button',
      price: '$29',
      period: '/month',
      features: [
        '1 credit ($399 value) monthly',
        'Save unused credit (valid 1 yr)',
        '10% off all additional rentals'
      ]
    },
    {
      id: 'silver',
      name: 'SILVER',
      cardClass: 'silver-card',
      buttonClass: 'silver-button',
      price: '$59',
      period: '/month',
      features: [
        '3 credits ($1,197 value) monthly',
        'Save unused credit (valid 1 yr)',
        '30% off all additional rentals'
      ]
    },
    {
      id: 'gold',
      name: 'GOLD',
      cardClass: 'gold-card',
      buttonClass: 'gold-button',
      price: '$99',
      period: '/month',
      features: [
        '5 credits ($1,995 value) monthly',
        'Save unused credit (valid 1 yr)',
        '50% off all additional rentals'
      ]
    }
  ];

  return (
    <div className="app min-h-screen bg-dark text-white flex flex-col">
      <div className="east-logo text-4xl md:text-6xl text-center py-6 w-full">EAST</div>
      
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-12">MEMBERSHIP PLANS</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.id} className={`membership-card ${plan.cardClass}`}>
              <div className="plan-header">
                <h2 className="text-2xl font-bold">{plan.name}</h2>
              </div>
              
              <div className="plan-content">
                <ul className="plan-features">
                  {plan.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
                
                <div className="plan-price">
                  <span className="plan-price-amount">{plan.price}</span>
                  <span className="plan-price-period">{plan.period}</span>
                </div>
                
                <button className={`plan-button ${plan.buttonClass}`}>
                  JOIN NOW
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}