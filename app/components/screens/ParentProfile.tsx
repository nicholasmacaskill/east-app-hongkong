'use client';
import React, { useState } from 'react';
import { Edit2, CheckCircle2, ChevronRight, Users, Calendar, Heart, Award, Lock } from 'lucide-react';

// ... (lines 4-31 same)

export default function ParentProfile({
   onOpenSettings,
   profileData,
   isReadOnly = false,
   myChildren = [],
   activeChildId,
   setActiveChildId,
   onAddChild
}: ParentProfileProps) {
   // ... (lines 33-143 same)

   const isLocked = profileData.subscription_status && profileData.subscription_status !== 'active' && profileData.subscription_status !== 'trialing';

   return (
      <div className="animate-fadeIn bg-black min-h-screen pb-24 relative overflow-hidden">
         {/* ... (lines 147-198 same) */}

         <div className="grid grid-cols-3 w-full gap-2">
            {[
               { l: 'VOLUNTEER\nHRS', v: '48', icon: Heart },
               {
                  l: 'CREDITS\nBALANCE',
                  v: isLocked ? 'LOCKED' : (profileData.credits || '0'),
                  icon: isLocked ? Lock : Users,
                  isLocked: isLocked
               },
               { l: 'EVENTS\nJOINED', v: '15', icon: Calendar },
            ].map((stat, i) => (
               <div key={i} className={`flex flex-col items-center p-3 bg-white/5 rounded-xl border group hover:border-east-light/50 transition-colors ${stat.isLocked ? 'border-red-900/50 bg-red-900/10' : 'border-white/10'}`}>
                  <stat.icon size={14} className={`mb-1 ${stat.isLocked ? 'text-red-500' : 'text-east-light'}`} />
                  <span className={`font-black text-lg italic ${stat.isLocked ? 'text-red-500 text-sm mt-1' : 'text-white'}`}>{stat.v}</span>
                  <span className="text-[7px] font-black font-montserrat uppercase text-center leading-tight text-gray-500 whitespace-pre-line">{stat.l}</span>
               </div>
            ))}
         </div>

         {/* NAVIGATION */}
         <div className="flex justify-center gap-6 py-6 relative z-20 overflow-x-auto no-scrollbar px-4">
            {
               ['ATHLETES', 'AVAILABILITY'].map(tab => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(tab.toLowerCase())}
                     className={`font-montserrat font-black italic text-xs uppercase transition-all drop-shadow-lg whitespace-nowrap ${activeTab === tab.toLowerCase() ? 'text-white border-b-2 border-east-light pb-1' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                     {tab}
                  </button>
               ))
            }
         </div>

         {/* CONTENT AREA */}
         <div className="px-4 pb-24 w-full">
            {/* ATHLETES TAB */}
            {
               activeTab === 'athletes' && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                     {myAthletes.map((athlete) => {
                        const isSelected = selectedChildId === athlete.id;
                        return (
                           <div
                              key={athlete.id}
                              onClick={() => {
                                 setSelectedChildId(athlete.id);
                                 if (setActiveChildId) setActiveChildId(athlete.id);
                              }}
                              className={`relative overflow-hidden rounded-2xl border transition-all duration-300 group cursor-pointer ${isSelected ? 'border-east-light shadow-2xl scale-[1.02]' : 'border-white/5 hover:border-white/20'}`}
                           >
                              <div className="p-4 flex items-center gap-4 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md">
                                 <div className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-colors ${isSelected ? 'border-east-light' : 'border-white/10'}`}>
                                    <img src={athlete.avatar_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2??auto=format&fit=crop&q=80&w=200"} className="w-full h-full object-cover" alt={athlete.first_name} />
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                       <h4 className={`font-montserrat font-black italic text-lg leading-none uppercase ${isSelected ? 'text-white' : 'text-white/80'}`}>{athlete.first_name}</h4>
                                       {isSelected && <div className="bg-east-light text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase italic">Selected</div>}
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">{athlete.team || 'EAST SPORTS'}</p>
                                    <div className="flex gap-2 mt-3">
                                       <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                                          <div className="h-full bg-east-light w-[70%]" />
                                       </div>
                                       <span className="text-[8px] font-bold text-east-light">70% XP</span>
                                    </div>
                                 </div>
                                 <ChevronRight size={18} className={`transition-transform ${isSelected ? 'text-east-light rotate-90' : 'text-gray-600'}`} />
                              </div>
                           </div>
                        );
                     })}

                     {/* ADD CHILD BUTTON */}
                     <button
                        onClick={() => setShowAddChild(true)}
                        className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-gray-500 font-montserrat font-black italic text-xs hover:border-east-light/50 hover:text-white transition-all uppercase tracking-widest bg-white/5">
                        + Register New Athlete
                     </button>

                     {/* ADD CHILD MODAL */}
                     {showAddChild && (
                        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                           <div className="bg-[#1e1e1e] p-6 rounded-2xl w-full max-w-sm border border-white/10">
                              <h3 className="font-black italic text-xl uppercase mb-4 text-white">Add Child</h3>
                              <div className="space-y-4">
                                 <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500">First Name</label>
                                    <input
                                       value={newChild.first}
                                       onChange={e => setNewChild({ ...newChild, first: e.target.value })}
                                       className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-east-light"
                                       placeholder="e.g. Michael"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500">Last Name</label>
                                    <input
                                       value={newChild.last}
                                       onChange={e => setNewChild({ ...newChild, last: e.target.value })}
                                       className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-east-light"
                                       placeholder="e.g. Jordan"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500">Email Address</label>
                                    <input
                                       value={newChild.email}
                                       onChange={e => setNewChild({ ...newChild, email: e.target.value })}
                                       className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-east-light"
                                       placeholder="child@example.com"
                                       type="email"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500">Sport / Team</label>
                                    <input
                                       value={newChild.sport}
                                       onChange={e => setNewChild({ ...newChild, sport: e.target.value })}
                                       className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-east-light"
                                       placeholder="e.g. Ice Hockey"
                                    />
                                 </div>
                                 <div className="flex gap-2 pt-2">
                                    <button onClick={handleAddChild} className="flex-1 bg-east-light text-black font-black uppercase py-3 rounded-lg text-xs hover:bg-white">Save</button>
                                    <button onClick={() => setShowAddChild(false)} className="flex-1 bg-white/10 text-white font-black uppercase py-3 rounded-lg text-xs hover:bg-white/20">Cancel</button>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               )
            }

            {/* AVAILABILITY TAB */}
            {
               activeTab === 'availability' && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                     <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                        <div className="flex justify-between items-end mb-6">
                           <div>
                              <h3 className="font-montserrat font-black italic text-sm text-white uppercase tracking-widest">Live Availability</h3>
                              <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">
                                 {savingAvailability ? <span className="text-east-light animate-pulse">SAVING CHANGES...</span> : 'Tap dates to toggle available days'}
                              </p>
                           </div>
                           <Calendar size={18} className={savingAvailability ? 'text-east-light animate-spin' : 'text-east-light'} />
                        </div>
                        <div className="grid grid-cols-7 gap-3">
                           {next14Days.slice(0, 14).map((day, i) => {
                              const isAvailable = availability.includes(day.fullDate);
                              return (
                                 <div key={i} onClick={() => toggleAvailability(day.fullDate)} className="flex flex-col items-center gap-2 cursor-pointer group">
                                    <span className="text-[8px] font-bold text-gray-600 uppercase group-hover:text-white transition-colors">{day.day}</span>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${day.fullDate === new Date().toISOString().split('T')[0] ? 'border border-east-light text-east-light' : 'bg-white/5 text-white group-hover:bg-white/10'}`}>
                                       {day.date}
                                    </div>
                                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${isAvailable ? 'bg-east-light scale-110 shadow-[0_0_10px_#28D160]' : 'bg-white/10'}`} />
                                 </div>
                              )
                           })}
                        </div>
                     </div>
                     <p className="text-[10px] text-gray-500 text-center italic font-bold">Your availability helps us coordinate volunteering & events.</p>
                  </div>
               )
            }

            {/* Removed Contributions and Gallery content */}
         </div>
      </div>
   );
}