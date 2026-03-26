'use client';
import React, { useState, useRef } from 'react';
import { Edit2, ChevronRight, Lock, Plus, X, Coins, Camera } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '../ui/Toast';
import { compressImage } from '@/app/lib/image-utils';

interface ParentProfileProps {
   onOpenSettings: () => void;
   profileData: any;
   isReadOnly?: boolean;
   myChildren?: any[];
   activeChildId?: string;
   setActiveChildId?: (id: string) => void;
   onAddChild: (child: any) => Promise<void>;
   onRefresh?: () => void;
}

export default function ParentProfile({
   onOpenSettings,
   profileData,
   isReadOnly = false,
   myChildren = [],
   activeChildId,
   setActiveChildId,
   onAddChild,
   onRefresh
}: ParentProfileProps) {
   const { addToast } = useToast();

   const [activeTab, setActiveTab] = useState('athletes');
   const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
   const [showAddChild, setShowAddChild] = useState(false);
   const [newChild, setNewChild] = useState({ first: '', last: '', email: '', sport: '' });

   const [uploading, setUploading] = useState(false);

   const avatarInputRef = useRef<HTMLInputElement>(null);
   const coverInputRef = useRef<HTMLInputElement>(null);
   const childAvatarInputRef = useRef<HTMLInputElement>(null);
   const [editingChildId, setEditingChildId] = useState<string | null>(null);

   const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      const originalFile = e.target.files[0];
      setUploading(true);

      try {
         const file = await compressImage(originalFile);
         const fileExt = file.name.split('.').pop();
         const fileName = `avatar-${profileData.id}-${Date.now()}.${fileExt}`;
         const filePath = `${fileName}`;

         const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);
         if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

         const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
         const { error: dbError } = await supabase
            .from('profiles')
            .update({ avatar_url: data.publicUrl })
            .eq('id', profileData.id);

         if (dbError) throw new Error(`Profile update failed: ${dbError.message}`);

         addToast('Profile photo updated!', 'success');
         if (onRefresh) onRefresh();
         else window.location.reload();
      } catch (error: any) {
         console.error('Avatar upload error:', error);
         addToast(error.message || 'Upload failed', 'error');
      } finally {
         setUploading(false);
      }
   };

   const handleChildAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0 || !editingChildId) return;
      const originalFile = e.target.files[0];
      setUploading(true);

      try {
         const file = await compressImage(originalFile);
         const fileExt = file.name.split('.').pop();
         const fileName = `avatar-${editingChildId}-${Date.now()}.${fileExt}`;
         const filePath = `${fileName}`;

         const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);
         if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

         const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
         const { error: dbError } = await supabase
            .from('profiles')
            .update({ avatar_url: data.publicUrl })
            .eq('id', editingChildId);

         if (dbError) throw new Error(`Athlete profile update failed: ${dbError.message}`);

         addToast('Athlete photo updated!', 'success');
         if (onRefresh) onRefresh();
         else window.location.reload();
      } catch (error: any) {
         console.error('Athlete avatar upload error:', error);
         addToast(error.message || 'Upload failed', 'error');
      } finally {
         setUploading(false);
         setEditingChildId(null);
      }
   };

   const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      const originalFile = e.target.files[0];
      setUploading(true);

      try {
         const file = await compressImage(originalFile);
         const fileExt = file.name.split('.').pop();
         const fileName = `banner-${profileData.id}-${Date.now()}.${fileExt}`;
         const filePath = `${fileName}`;

         const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);
         if (uploadError) throw uploadError;

         const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
         const { error: dbError } = await supabase
            .from('profiles')
            .update({ banner_url: data.publicUrl })
            .eq('id', profileData.id);

         if (dbError) throw dbError;

         addToast('Cover photo updated!', 'success');
         if (onRefresh) onRefresh();
         else window.location.reload();
      } catch (error: any) {
         addToast(error.message || 'Upload failed', 'error');
      } finally {
         setUploading(false);
      }
   };

   // Transfer Logic
   const [showTransferModal, setShowTransferModal] = useState(false);
   const [transferTarget, setTransferTarget] = useState<{ id: string, name: string } | null>(null);
   const [transferAmount, setTransferAmount] = useState(5);
   const [isTransferring, setIsTransferring] = useState(false);

   const handleOpenTransfer = (e: React.MouseEvent, child: any) => {
      e.stopPropagation();
      setTransferTarget({ id: child.id, name: child.first_name });
      setTransferAmount(5);
      setShowTransferModal(true);
   };

   const handleTransferCredits = async () => {
      if (!transferTarget || transferAmount <= 0) return;

      setIsTransferring(true);
      try {
         const { data: { session } } = await supabase.auth.getSession();
         if (!session) throw new Error("Not authenticated");

         const res = await fetch('/api/user/transfer-credits', {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
               recipientId: transferTarget.id,
               amount: transferAmount
            })
         });

         const data = await res.json();
         if (!data.success) {
            throw new Error(data.error || 'Transfer failed');
         }

         addToast('Credits transferred successfully!', 'success');
         setShowTransferModal(false);
         window.location.reload();

      } catch (error: any) {
         addToast(error.message, 'error');
      } finally {
         setIsTransferring(false);
      }
   };

   const handleAddChild = async () => {
      if (!newChild.first || !newChild.last) return;
      await onAddChild(newChild);
      setShowAddChild(false);
      setNewChild({ first: '', last: '', email: '', sport: '' });
   };

   const isLocked = profileData.subscription_status && profileData.subscription_status !== 'active' && profileData.subscription_status !== 'trialing';

   return (
      <div className="animate-fadeIn bg-black min-h-screen pb-24 relative overflow-hidden font-montserrat">
         {/* HEADER IMAGE */}
         <div
            className={`h-56 relative shadow-2xl ${!isReadOnly ? 'cursor-pointer' : ''}`}
            onClick={(e) => {
               if (!isReadOnly) {
                  e.stopPropagation();
                  coverInputRef.current?.click();
               }
            }}
         >
            <img
               src={profileData.banner_url || "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2670&auto=format&fit=crop"}
               className="w-full h-full object-cover opacity-60"
               alt="Cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
            <div className="absolute top-6 right-6 flex gap-3">
               {!isReadOnly && (
                  <button
                     onClick={(e) => {
                        e.stopPropagation();
                        coverInputRef.current?.click();
                     }}
                     className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 text-white hover:bg-east-light hover:text-black active:scale-95 transition-all shadow-2xl group/btn"
                     title="Update Cover Photo"
                  >
                     <Camera size={20} className="group-hover/btn:scale-110 transition-transform" />
                  </button>
               )}
               <button data-testid="settings-button" onClick={(e) => { e.stopPropagation(); onOpenSettings(); }} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 text-gray-400 hover:text-white active:scale-95 transition-all shadow-2xl">
                  <Edit2 size={20} />
               </button>
            </div>
            <input type="file" ref={coverInputRef} onChange={handleCoverUpload} className="absolute w-0 h-0 opacity-0 pointer-events-none" accept="image/*" />
         </div>

         {/* PROFILE INFO */}
         <div className="relative z-10 flex flex-col items-center -mt-20 px-4">
            <div
               data-testid="parent-avatar-container"
               className={`w-36 h-36 rounded-full border-[6px] border-black shadow-2xl overflow-hidden bg-zinc-900 relative group ${isReadOnly ? '' : 'cursor-pointer'}`}
               onClick={(e) => {
                  if (!isReadOnly) {
                     e.stopPropagation();
                     avatarInputRef.current?.click();
                  }
               }}
            >
               {profileData.avatar_url ? (
                  <img src={profileData.avatar_url} className="w-full h-full object-cover" alt="Profile" />
               ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-black">
                     <span className="text-4xl font-black italic text-gray-700">{profileData.first_name?.[0]}</span>
                  </div>
               )}
               {!isReadOnly && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <Camera size={40} className="text-white" />
                  </div>
               )}
            </div>
            <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="absolute w-0 h-0 opacity-0 pointer-events-none" accept="image/*" />

            <div className="mt-4 text-center">
               <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none mb-2">
                  {profileData.first_name} <span className="text-east-light">{profileData.last_name}</span>
               </h1>
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-east-light/10 border border-east-light/20">
                  <div className="w-2 h-2 rounded-full bg-east-light animate-pulse shadow-[0_0_10px_#28D160]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-east-light">
                     {profileData.role || 'PARENT'} ACCESS
                  </span>
               </div>
            </div>
         </div>

         {/* MAIN GRID */}
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pb-24">
            <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-start">
               
               {/* LEFT SIDEBAR: NAV & CREDITS */}
               <div className="lg:col-span-4 lg:sticky lg:top-8 flex flex-col gap-8">
                  {/* NAVIGATION */}
                  <div className="flex lg:flex-col justify-center lg:justify-start gap-4 p-2 bg-white/5 rounded-2xl border border-white/5">
                     {['ATHLETES'].map(tab => (
                        <button
                           key={tab}
                           onClick={() => setActiveTab(tab.toLowerCase())}
                           className={`font-black italic text-xs uppercase transition-all px-6 py-4 rounded-xl text-left ${activeTab === tab.toLowerCase() ? 'bg-east-light text-black scale-105 shadow-xl' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                           {tab}
                        </button>
                     ))}
                  </div>

                  {/* CREDITS CARD */}
                  <div
                     onClick={() => isLocked && addToast("Current credits are unusable until a new subscription is purchased.", "warning")}
                     className={`flex flex-col items-center p-8 bg-gradient-to-br from-white/10 to-transparent rounded-[2rem] border transition-all hover:scale-[1.02] ${isLocked ? 'border-red-900/50 bg-red-900/10 cursor-not-allowed' : 'border-white/10 shadow-2xl'}`}
                  >
                     <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center mb-4 border border-east-light/20 shadow-inner">
                        <Coins size={32} className={isLocked ? 'text-red-500' : 'text-east-light'} />
                     </div>
                     <span className={`font-black text-5xl italic ${isLocked ? 'text-red-500/50' : 'text-white'}`}>{profileData.credits || '0'}</span>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mt-2">Available Credits</span>
                     {isLocked && (
                        <div className="mt-4 flex items-center gap-2 text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                           <Lock size={12} />
                           <span className="text-[9px] font-black uppercase">Account Locked</span>
                        </div>
                     )}
                  </div>
               </div>

               {/* RIGHT CONTENT: ATHLETES LIST */}
               <div className="lg:col-span-8 mt-12 lg:mt-0">
                  {activeTab === 'athletes' && (
                     <div className="flex flex-col gap-6 animate-fadeIn">
                        {(myChildren || []).map((athlete) => {
                           const isSelected = selectedChildId === athlete.id;
                           return (
                              <div
                                 key={athlete.id}
                                 onClick={() => {
                                    setSelectedChildId(athlete.id);
                                    if (setActiveChildId) setActiveChildId(athlete.id);
                                 }}
                                 className={`relative overflow-hidden rounded-[2rem] border transition-all duration-500 group cursor-pointer ${isSelected ? 'border-east-light bg-east-light/5 shadow-2xl scale-[1.02]' : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'}`}
                              >
                                 <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
                                    {/* Athlete Avatar */}
                                    <div
                                       className={`w-28 h-28 rounded-full overflow-hidden border-4 transition-all duration-500 relative shrink-0 ${isSelected ? 'border-east-light scale-105' : 'border-white/10'}`}
                                       onClick={(e) => {
                                          if (!isReadOnly) {
                                             e.stopPropagation();
                                             setEditingChildId(athlete.id);
                                             childAvatarInputRef.current?.click();
                                          }
                                       }}
                                    >
                                       <img src={athlete.avatar_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2"} className="w-full h-full object-cover" alt={athlete.first_name} />
                                       {!isReadOnly && (
                                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                             <Camera size={24} className="text-white" />
                                          </div>
                                       )}
                                    </div>

                                    <div className="flex-1 text-center sm:text-left">
                                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                          <div>
                                             <h4 className="font-black italic text-2xl uppercase tracking-tighter text-white">{athlete.first_name}</h4>
                                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{athlete.team || 'EAST SPORTS ACADEMY'}</p>
                                          </div>
                                          {isSelected && (
                                             <div className="bg-east-light text-black text-[9px] font-black px-3 py-1 rounded-full uppercase italic self-center sm:self-start shadow-lg">Current Selection</div>
                                          )}
                                       </div>

                                       <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 mt-6">
                                          <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                                             <Coins size={14} className="text-east-light" />
                                             <span className="text-sm font-black text-white">{athlete.credits || 0} <span className="text-[10px] text-gray-500 italic ml-1">CREDITS</span></span>
                                          </div>
                                          <button
                                             onClick={(e) => handleOpenTransfer(e, athlete)}
                                             className="bg-white/10 text-white text-[10px] font-black uppercase px-5 py-2.5 rounded-xl hover:bg-east-light hover:text-black transition-all active:scale-95 border border-white/10"
                                          >
                                             + Transfer Credits
                                          </button>
                                       </div>
                                    </div>
                                    <ChevronRight size={24} className={`hidden sm:block transition-all duration-500 ${isSelected ? 'text-east-light translate-x-1' : 'text-gray-700 opacity-0 group-hover:opacity-100'}`} />
                                 </div>
                              </div>
                           );
                        })}

                        {/* ADD CHILD BUTTON */}
                        <button
                           onClick={() => setShowAddChild(true)}
                           className="w-full py-8 border-2 border-dashed border-white/10 rounded-[2rem] text-gray-500 font-black italic text-sm hover:border-east-light/50 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest group"
                        >
                           <span className="flex items-center justify-center gap-3">
                              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                              Register New Athlete
                           </span>
                        </button>
                     </div>
                  )}

                  {/* ADD CHILD MODAL */}
                  {showAddChild && (
                     <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-xl">
                        <div className="bg-[#1e1e1e] p-8 rounded-[2.5rem] w-full max-w-md border border-white/10 shadow-2xl relative">
                           <button onClick={() => setShowAddChild(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white">
                              <X size={24} />
                           </button>
                           <h3 className="font-black italic text-3xl uppercase mb-8 text-white tracking-tighter">Add <span className="text-east-light">Athlete</span></h3>
                           <div className="space-y-5">
                              <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block ml-1">First Name</label>
                                    <input
                                       value={newChild.first}
                                       onChange={e => setNewChild({ ...newChild, first: e.target.value })}
                                       className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-east-light transition-colors"
                                       placeholder="Michael"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block ml-1">Last Name</label>
                                    <input
                                       value={newChild.last}
                                       onChange={e => setNewChild({ ...newChild, last: e.target.value })}
                                       className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-east-light transition-colors"
                                       placeholder="Jordan"
                                    />
                                 </div>
                              </div>
                              <div>
                                 <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block ml-1">Email Address</label>
                                 <input
                                    value={newChild.email}
                                    onChange={e => setNewChild({ ...newChild, email: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-east-light transition-colors"
                                    placeholder="athlete@example.com"
                                    type="email"
                                 />
                              </div>
                              <div>
                                 <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block ml-1">Primary Sport / Team</label>
                                 <input
                                    value={newChild.sport}
                                    onChange={e => setNewChild({ ...newChild, sport: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-east-light transition-colors"
                                    placeholder="Ice Hockey"
                                 />
                              </div>
                              <div className="flex gap-4 pt-4">
                                 <button onClick={handleAddChild} className="flex-1 bg-east-light text-black font-black uppercase py-4 rounded-2xl text-sm hover:scale-[1.02] transition-all shadow-lg active:scale-95">Save Profile</button>
                                 <button onClick={() => setShowAddChild(false)} className="flex-1 bg-white/10 text-white font-black uppercase py-4 rounded-2xl text-sm hover:bg-white/20 transition-all">Cancel</button>
                              </div>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* TRANSFER MODAL */}
         {showTransferModal && transferTarget && (
            <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-6 backdrop-blur-2xl">
               <div className="bg-[#1e1e1e] p-10 rounded-[3rem] w-full max-w-md border border-white/10 relative shadow-2xl">
                  <button onClick={() => setShowTransferModal(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white">
                     <X size={28} />
                  </button>

                  <div className="text-center mb-10">
                     <div className="w-20 h-20 bg-east-light/10 text-east-light rounded-full flex items-center justify-center mx-auto mb-6 border border-east-light/20 shadow-xl">
                        <Coins size={40} />
                     </div>
                     <h3 className="font-black italic text-3xl text-white uppercase tracking-tighter">Transfer <span className="text-east-light">Credits</span></h3>
                     <p className="text-gray-500 text-[10px] font-black uppercase mt-3 tracking-[0.2em]">
                        To <span className="text-white">{transferTarget.name}</span>
                     </p>
                  </div>

                  <div className="space-y-8">
                     <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500 mb-4 block text-center tracking-widest">Amount to Transfer</label>
                        <input
                           type="number"
                           min="1"
                           max={profileData.credits || 0}
                           value={transferAmount}
                           onChange={(e) => setTransferAmount(parseInt(e.target.value) || 0)}
                           className="w-full bg-black/60 border border-white/10 p-6 rounded-3xl text-center text-5xl font-black italic text-white outline-none focus:border-east-light transition-all shadow-inner"
                        />
                     </div>

                     <div className="bg-black/40 p-5 rounded-2xl border border-white/5 text-center">
                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">New Parent Balance</p>
                        <p className="text-white font-black text-2xl italic mt-1">
                           {(profileData.credits || 0) - transferAmount} <span className="text-xs text-gray-600 not-italic ml-1">CREDITS</span>
                        </p>
                     </div>

                     <button
                        onClick={handleTransferCredits}
                        disabled={isTransferring || transferAmount > (profileData.credits || 0)}
                        className="w-full bg-east-light text-black font-black uppercase py-5 rounded-2xl text-base hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(40,209,96,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                     >
                        {isTransferring ? 'Processing...' : 'Confirm Transfer Now'}
                     </button>
                  </div>
               </div>
            </div>
         )}
         
         <input type="file" ref={childAvatarInputRef} onChange={handleChildAvatarUpload} className="absolute w-0 h-0 opacity-0 pointer-events-none" accept="image/*" />
      </div>
   );
}