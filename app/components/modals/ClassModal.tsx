'use client';
import React, { useState, useEffect } from 'react';
import { Session } from '@/app/types/session';
import { X, Send, Share2 } from 'lucide-react';

interface ClassModalProps {
    sessions: Session[];
    onClose: () => void;
    onScheduleChange: () => void;
    currentUserId: string | null;
    bookedSessionIds: number[];
    onShare?: (s: Session) => void;
}

export default function ClassModal({ 
    sessions, 
    onClose, 
    onScheduleChange, 
    currentUserId, 
    bookedSessionIds, 
    onShare 
}: ClassModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  if (!sessions || sessions.length === 0 || !currentUserId) return null;

  const displaySession = sessions[0];
  const isNews = displaySession.category === 'NEWS';
  
  // Auto-select the first session if there's only one option
  useEffect(() => {
      if (sessions.length === 1) {
          setSelectedSessionId(sessions[0].id);
      }
  }, [sessions]);

  const isBooked = selectedSessionId ? bookedSessionIds.includes(selectedSessionId) : false;

  const handleAction = async (method: 'POST' | 'DELETE') => {
    if (!selectedSessionId || isNews) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/register', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, sessionId: selectedSessionId }),
      });

      const data = await res.json(); // ✅ FIX: Properly read the response

      if (res.ok) {
        onScheduleChange();
        onClose(); // Auto-close window on success
        alert(method === 'POST' ? "Booked successfully!" : "Booking cancelled.");
      } else {
        // Show the actual error from the API (e.g. "Already Registered")
        console.error("API Error:", data);
        alert(`Action failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Network/Client Error:", error);
      alert('Network error connecting to server.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
         
         {/* Header */}
         <div className="bg-gradient-to-r from-east-light to-east-dark p-4 flex justify-between items-center shrink-0">
            <h2 className="font-montserrat font-black italic text-xl text-white uppercase truncate pr-2">
                {isBooked ? 'MY BOOKING' : (displaySession.category === 'COACH' ? displaySession.instructor : displaySession.title)}
            </h2>
            <button onClick={onClose}>
                <X className="text-white" />
            </button>
         </div>

         {/* Scrollable Content */}
         <div className="overflow-y-auto p-6 text-black">
            <h2 className="font-montserrat font-black italic text-2xl mb-1 uppercase">{displaySession.title}</h2>
            
            <p className="font-montserrat font-bold text-[10px] mb-4 uppercase">
                {displaySession.category === 'COACH' ? 'PRIVATE COACH' : `INSTRUCTOR: ${displaySession.instructor}`}
            </p>

            <p className="font-opensans text-xs font-bold leading-relaxed mb-6">{displaySession.description}</p>
            
            {displaySession.image_url && (
                <div className="w-full aspect-video rounded-xl overflow-hidden bg-black mb-6">
                    <img src={displaySession.image_url} className="w-full h-full object-cover" alt={displaySession.title} />
                </div>
            )}
            
            {/* Share Button (if handler provided) */}
            {onShare && (
                <button onClick={() => onShare(displaySession)} className="mb-4 hover:text-east-light transition-colors">
                    <Share2 size={20} />
                </button>
            )}

            {/* Time Slots Selection */}
            {!isNews && (
                <div className="mb-6">
                    <p className="font-montserrat font-bold text-[10px] mb-2 uppercase">SELECT TIME:</p>
                    <div className="flex gap-2 flex-wrap">
                        {sessions.map((sess) => {
                            const isThisSessionBooked = bookedSessionIds.includes(sess.id);
                            const isSelected = selectedSessionId === sess.id;
                            
                            return (
                                <button
                                    key={sess.id}
                                    onClick={() => setSelectedSessionId(sess.id)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors relative 
                                        ${isSelected ? 'bg-east-light text-white border-east-light' : 'bg-white text-black border-gray-300 hover:border-east-light'}
                                    `}
                                >
                                    {new Date(sess.start_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                                    {isThisSessionBooked && <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* Active Booking Info Box */}
            {isBooked && selectedSessionId && (
                <div className="mb-6 p-4 border border-red-500/50 rounded-xl bg-red-500/10">
                    <p className="font-montserrat font-bold text-[10px] text-red-500 uppercase mb-2">SCHEDULED TIME:</p>
                    <p className="font-montserrat font-black text-lg text-black">
                        {new Date(sessions.find(s => s.id === selectedSessionId)?.start_time || '').toLocaleString([], { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                    </p>
                </div>
            )}
         </div>

         {/* Footer Actions */}
         {!isNews && (
             <div className="bg-black p-4 flex justify-between items-center shrink-0">
                <div className="flex gap-4">
                   <Send className="text-white" size={20} />
                </div>
                
                {isBooked ? (
                     <button 
                        onClick={() => {
                            if (window.confirm("Are you sure you want to cancel?")) {
                                handleAction('DELETE');
                            }
                        }}
                        disabled={isProcessing}
                        className="text-red-500 text-sm font-bold italic underline disabled:opacity-50 hover:text-red-400 transition-colors"
                     >
                       {isProcessing ? 'CANCELLING...' : 'CANCEL BOOKING'}
                     </button>
                ) : (
                    <button 
                      onClick={() => handleAction('POST')}
                      disabled={isProcessing || !selectedSessionId}
                      className="text-white text-sm font-bold italic underline disabled:opacity-50 hover:text-east-light transition-colors"
                    >
                      {isProcessing ? 'REGISTERING...' : 'REGISTER NOW'}
                    </button>
                )}
             </div>
         )}
      </div>
    </div>
  );
}