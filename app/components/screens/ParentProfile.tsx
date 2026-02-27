'use client';
import React, { useState, useRef } from 'react';
import { Edit2, CheckCircle2, ChevronRight, Users, Calendar, Heart, Award, Lock, Plus, X, Coins, Camera } from 'lucide-react';
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
         if (uploadError) throw uploadError;

         const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
         const { error: dbError } = await supabase
            .from('profiles')
            .update({ avatar_url: data.publicUrl })
            .eq('id', profileData.id);

         if (dbError) throw dbError;

         addToast('Profile photo updated!', 'success');
         if (onRefresh) onRefresh();
         else window.location.reload();
      } catch (error: any) {
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
         if (uploadError) throw uploadError;

         const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
         const { error: dbError } = await supabase
            .from('profiles')
            .update({ avatar_url: data.publicUrl })
            .eq('id', editingChildId);

         if (dbError) throw dbError;

         addToast('Athlete photo updated!', 'success');
         if (onRefresh) onRefresh();
         else window.location.reload();
      } catch (error: any) {
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
         // Ideally triggers a refresh of the parent data, but for now we reload or rely on state update if parent fetches again?
         // Since app/page.tsx handles the state, a reload is safest to update both balances
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

   // Check lock status
   const isLocked = profileData.subscription_status && profileData.subscription_status !== 'active' && profileData.subscription_status !== 'trialing';

   return (
      <div className="animate-fadeIn bg-black min-h-screen pb-24 relative overflow-hidden">
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
         <div className="px-6 -mt-20 relative z-10 flex flex-col items-center">
            <div
               data-testid="parent-avatar-container"
               className={`w-32 h-32 rounded-full border-[6px] border-black shadow-2xl overflow-hidden bg-zinc-900 relative group ${isReadOnly ? '' : 'cursor-pointer'}`}
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
                     <span className="text-3xl font-black italic text-gray-700">{profileData.first_name?.[0]}</span>
                  </div>
               )}
               {!isReadOnly && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <Camera size={32} className="text-white" />
                  </div>
               )}
            </div>
            <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="absolute w-0 h-0 opacity-0 pointer-events-none" accept="image/*" />

            <div className="mt-4 text-center">
               <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-none mb-1">
                  {profileData.first_name} {profileData.last_name}
               </h1>
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-east-light/10 border border-east-light/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-east-light animate-pulse shadow-[0_0_10px_#28D160]" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-east-light">
                     {profileData.role || 'PARENT'} ACCT
                  </span>
               </div>
            </div>

            <div className="flex justify-center w-full mt-6">
               {[
                  {
                     l: 'CREDITS\nBALANCE',
                     v: profileData.credits || '0',
                     icon: isLocked ? Lock : Coins,
                     isLocked: isLocked
                  },
               ].map((stat, i) => (
                  <div
                     key={i}
                     onClick={() => stat.isLocked && addToast("Current credits are unusable until a new subscription is purchased.", "warning")}
                     title={stat.isLocked ? "Current credits are unusable until a new subscription is purchased." : ""}
                     className={`flex flex-col items-center p-3 bg-white/5 rounded-xl border group hover:border-east-light/50 transition-colors w-1/2 max-w-[200px] ${stat.isLocked ? 'border-red-900/50 bg-red-900/10 cursor-not-allowed' : 'border-white/10'}`}
                  >
                     <div className="flex items-center gap-1 mb-1">
                        <stat.icon size={14} className={stat.isLocked ? 'text-red-500' : 'text-east-light'} />
                        {stat.isLocked && <Lock size={10} className="text-red-500" />}
                     </div>
                     <span className={`font-black text-lg italic ${stat.isLocked ? 'text-red-500/50' : 'text-white'}`}>{stat.v}</span>
                     <span className="text-[7px] font-black font-montserrat uppercase text-center leading-tight text-gray-500 whitespace-pre-line">{stat.l}</span>
                  </div>
               ))}
            </div>
         </div>

         {/* NAVIGATION */}
         <div className="flex justify-center gap-6 py-6 relative z-20 overflow-x-auto no-scrollbar px-4">
            {
               ['ATHLETES'].map(tab => (
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
                     {(myChildren || []).map((athlete) => {
                        const isSelected = selectedChildId === athlete.id;
                        return (
                           <div
                              key={athlete.id}
                              data-testid={`child-section-${athlete.id}`}
                              onClick={() => {
                                 setSelectedChildId(athlete.id);
                                 if (setActiveChildId) setActiveChildId(athlete.id);
                              }}
                              className={`relative overflow-hidden rounded-2xl border transition-all duration-300 group cursor-pointer ${isSelected ? 'border-east-light shadow-2xl scale-[1.02]' : 'border-white/5 hover:border-white/20'}`}
                           >
                              <div className="p-4 flex items-center gap-4 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md">
                                 <div
                                    className={`w-20 h-20 rounded-full overflow-hidden border-4 transition-colors relative group/childimg ${isSelected ? 'border-east-light' : 'border-white/10'} ${isReadOnly ? '' : 'cursor-pointer'}`}
                                    onClick={(e) => {
                                       if (!isReadOnly) {
                                          e.stopPropagation();
                                          setEditingChildId(athlete.id);
                                          childAvatarInputRef.current?.click();
                                       }
                                    }}
                                 >
                                    <img src={athlete.avatar_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2??auto=format&fit=crop&q=80&w=200"} className="w-full h-full object-cover" alt={athlete.first_name} />
                                    {!isReadOnly && (
                                       <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/childimg:opacity-100 transition-opacity">
                                          <Camera size={20} className="text-white" />
                                       </div>
                                    )}
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                       <h4 className={`font-montserrat font-black italic text-lg leading-none uppercase ${isSelected ? 'text-white' : 'text-white/80'}`}>{athlete.first_name}</h4>
                                       {isSelected && <div className="bg-east-light text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase italic">Selected</div>}
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">{athlete.team || 'EAST SPORTS'}</p>
                                    <div className="flex items-center gap-4 mt-3">
                                       <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                          <Coins size={10} className="text-east-light" />
                                          <span className="text-[10px] font-black text-white">{athlete.credits || 0} <span className="text-gray-500">CREDITS</span></span>
                                       </div>
                                       <button
                                          onClick={(e) => handleOpenTransfer(e, athlete)}
                                          className="bg-east-light text-black text-[8px] font-black uppercase px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
                                       >
                                          + Transfer
                                       </button>
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


            {/* TRANSFER MODAL */}
            {showTransferModal && transferTarget && (
               <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md">
                  <div className="bg-[#1e1e1e] p-8 rounded-[2rem] w-full max-w-sm border border-white/10 relative shadow-2xl">
                     <button
                        onClick={() => setShowTransferModal(false)}
                        className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                     >
                        <X size={24} />
                     </button>

                     <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-east-light/10 text-east-light rounded-full flex items-center justify-center mx-auto mb-4 border border-east-light/20">
                           <Coins size={32} />
                        </div>
                        <h3 className="font-black italic text-2xl text-white uppercase tracking-tighter">Transfer Credits</h3>
                        <p className="text-gray-500 text-xs font-bold uppercase mt-2 tracking-wide">
                           To <span className="text-white">{transferTarget.name}</span>
                        </p>
                     </div>

                     <div className="space-y-6">
                        <div>
                           <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block text-center">Amount to Transfer</label>
                           <input
                              type="number"
                              min="1"
                              max={profileData.credits || 0}
                              value={transferAmount}
                              onChange={(e) => setTransferAmount(parseInt(e.target.value) || 0)}
                              className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-center text-3xl font-black italic text-white outline-none focus:border-east-light"
                           />
                        </div>

                        <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center">
                           <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">New Parent Balance</p>
                           <p className="text-white font-bold text-lg">
                              {(profileData.credits || 0) - transferAmount} <span className="text-xs text-gray-600">CREDITS</span>
                           </p>
                        </div>

                        <button
                           onClick={handleTransferCredits}
                           disabled={isTransferring || transferAmount > (profileData.credits || 0)}
                           className="w-full bg-east-light text-black font-black uppercase py-4 rounded-xl text-sm hover:bg-white transition-all shadow-[0_0_20px_rgba(40,209,96,0.2)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           {isTransferring ? 'Processing...' : 'Confirm Transfer'}
                        </button>
                     </div>
                  </div>
               </div>
            )}



            <input type="file" ref={childAvatarInputRef} onChange={handleChildAvatarUpload} className="absolute w-0 h-0 opacity-0 pointer-events-none" accept="image/*" />
         </div>
      </div>
   );
}