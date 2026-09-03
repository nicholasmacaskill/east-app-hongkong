'use client';
import React, { useState, useRef } from 'react';
import Image from 'next/image';
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

   const [showTransferModal, setShowTransferModal] = useState(false);
   const [transferTarget, setTransferTarget] = useState<{ id: string, name: string } | null>(null);
   const [transferAmount, setTransferAmount] = useState(5);
   const [isTransferring, setIsTransferring] = useState(false);

   // Conversion Logic
   const [showConvertModal, setShowConvertModal] = useState(false);
   const [convertTarget, setConvertTarget] = useState<{ id: string, name: string } | null>(null);
   const [convertEmail, setConvertEmail] = useState('');
   const [convertPassword, setConvertPassword] = useState('');
   const [isConverting, setIsConverting] = useState(false);

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

   const handleOpenConvert = (e: React.MouseEvent, child: any) => {
      e.stopPropagation();
      setConvertTarget({ id: child.id, name: `${child.first_name} ${child.last_name || ''}`.trim() });
      setConvertEmail('');
      setConvertPassword('');
      setShowConvertModal(true);
   };

   const handleConvertChild = async () => {
      if (!convertTarget || !convertEmail || !convertPassword) {
         addToast('Please enter both email and password', 'error');
         return;
      }
      setIsConverting(true);
      try {
         const res = await fetch('/api/family/convert-child', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               childId: convertTarget.id,
               parentId: profileData.id,
               email: convertEmail,
               password: convertPassword
            })
         });
         const data = await res.json();
         if (!res.ok) throw new Error(data.error || 'Conversion failed');

         addToast(data.message || 'Child account successfully converted!', 'success');
         setShowConvertModal(false);
         if (onRefresh) onRefresh();
         else window.location.reload();
      } catch (err: any) {
         addToast(err.message || 'Failed to convert child', 'error');
      } finally {
         setIsConverting(false);
      }
   };

   const handleAddChild = async () => {
      if (!newChild.first) {
         addToast('First name is required', 'error');
         return;
      }
      await onAddChild({
         first: newChild.first.trim(),
         last: (newChild.last || profileData.last_name || '').trim(),
         sport: newChild.sport.trim()
      });
      setShowAddChild(false);
      setNewChild({ first: '', last: '', email: '', sport: '' });
   };

   // Check lock status consistently across the app (unlocked if active subscription or active account status)
   const isSubscriber = profileData.subscription_status === 'active' || profileData.subscription_status === 'trialing';
   const isManuallyActive = profileData.account_status === 'active';
   const isUnlocked = isSubscriber || isManuallyActive;
   const isLocked = !isUnlocked;
   const displayStatus = isSubscriber ? 'ACTIVE' : (isManuallyActive ? 'ACTIVE' : (profileData.subscription_status?.toUpperCase() || 'ACTIVE'));

   return (
      <div className="animate-fadeIn bg-black min-h-screen pb-24 relative overflow-hidden font-montserrat">
         {/* Background Image Layer - Premium Blur Overlay */}
         <div className="fixed inset-0 z-0 overflow-hidden">
            <Image
               src="/EAST-BLACK-BACKGROUND.png"
               className="object-cover opacity-20 grayscale scale-110"
               fill
               alt="Premium background"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/40 to-black/95" />
         </div>

         <div className="relative z-10 w-full mx-auto px-4">
            <div className="flex flex-col pt-4">
               {/* PROFILE INFO HEADER */}
               <div className="w-full relative">
                  {!isReadOnly && (
                     <div className="absolute top-2 right-2 z-30 flex gap-2">
                        <button
                           onClick={(e) => {
                              e.stopPropagation();
                              onOpenSettings();
                           }}
                           className="bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition-colors border border-white/10"
                        >
                           <Edit2 size={16} className="text-gray-400" />
                        </button>
                     </div>
                  )}

                  {/* Split Header Row (Avatar Left, Info Right) */}
                  <div className="flex items-center gap-4 w-full pt-4">
                     {/* Left: Avatar */}
                     <div className="relative shrink-0">
                        <div
                           data-testid="parent-avatar-container"
                           className={`w-32 h-32 rounded-full border-4 border-white/10 bg-white/5 overflow-hidden shadow-xl backdrop-blur-sm relative ${isReadOnly ? '' : 'cursor-pointer group'}`}
                           onClick={(e) => {
                              if (!isReadOnly) {
                                 e.stopPropagation();
                                 avatarInputRef.current?.click();
                              }
                           }}
                        >
                           <Image
                              src={profileData.avatar_url || "https://images.pexels.com/photos/6550836/pexels-photo-6550836.jpeg"}
                              className={`object-cover transition-opacity ${isReadOnly ? '' : 'group-hover:opacity-40'} ${uploading ? 'opacity-20' : 'opacity-90'}`}
                              fill
                              alt="profile"
                           />
                           {!isReadOnly && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 {uploading ? (
                                    <div className="w-6 h-6 border-3 border-east-light border-t-transparent rounded-full animate-spin" />
                                 ) : (
                                    <Camera size={24} className="text-white" />
                                 )}
                              </div>
                           )}
                        </div>
                        <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="absolute w-0 h-0 opacity-0 pointer-events-none" accept="image/*" />
                     </div>

                     {/* Right: Name, Username, Metadata pills */}
                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h2 className="font-black italic text-xl text-white uppercase tracking-tight truncate">
                           {profileData.first_name} <span className="text-east-light">{profileData.last_name}</span>
                        </h2>
                        {profileData.username && (
                           <p className="font-bold text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">@{profileData.username}</p>
                        )}

                        {/* Inline Metadata Pills */}
                        <div className="flex flex-wrap gap-1 mt-2">
                           <span className="text-[7px] font-black text-[#28D160] bg-[#28D160]/10 border border-[#28D160]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              PARENT ACCT
                           </span>
                           <span className="text-[7px] font-black text-[#28D160] bg-[#28D160]/10 border border-[#28D160]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              ATHLETES: {myChildren.length}
                           </span>
                           <span className="text-[7px] font-black text-[#28D160] bg-[#28D160]/10 border border-[#28D160]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              STATUS: {displayStatus}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* Bio Block */}
                  {profileData.bio && (
                     <div className="mt-3 px-2 border-l-2 border-[#28D160]/40 pl-3">
                        <p className="text-white/70 text-[11px] font-medium italic leading-relaxed">
                           "{profileData.bio}"
                        </p>
                     </div>
                  )}

                  {/* Divider and Horizontal Badge Row */}
                  <div className="w-full h-px bg-white/5 my-3" />
                  <div className="flex items-center justify-between w-full gap-1">
                     {[
                        {
                           l: 'CREDITS',
                           v: profileData.credits || 0,
                           icon: isLocked ? Lock : Coins,
                           action: () => isLocked && addToast("Current credits are unusable until a new subscription is purchased.", "warning")
                        },
                        {
                           l: 'ATHLETES',
                           v: myChildren.length,
                           icon: Users,
                           action: () => {}
                        },
                        {
                           l: 'STATUS',
                           v: displayStatus.toLowerCase(),
                           icon: Heart,
                           action: () => {}
                        }
                     ].map((badge: any, i) => (
                        <div
                           key={i}
                           onClick={badge.action}
                           className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                              badge.action ? 'cursor-pointer hover:scale-105 group' : ''
                           }`}
                        >
                           <div className="w-10 h-10 rounded-full border border-east-light/20 bg-white/5 flex items-center justify-center mb-1.5 shadow-md group-hover:border-[#28D160]/40 transition-colors">
                              <badge.icon size={18} className="text-[#28D160] drop-shadow-md" />
                           </div>
                           <span className="font-black text-sm text-white italic leading-none truncate max-w-[80px] uppercase">
                              {badge.v}
                           </span>
                           <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest mt-1 text-center truncate w-full">
                              {badge.l}
                           </span>
                        </div>
                     ))}
                  </div>
                  <div className="w-full h-px bg-white/5 mt-3 mb-6" />
               </div>

               {/* CONTENT AREA */}
               <div className="pb-24 w-full mt-4">
                  <div className="flex flex-col gap-10 animate-fadeIn">
                     <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-1">
                           <h3 className="font-black italic text-[10px] text-white/40 uppercase tracking-widest">REGISTERED ATHLETES</h3>
                        </div>

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
                                 className={`relative overflow-hidden rounded-2xl border transition-all duration-300 group cursor-pointer ${
                                    isSelected
                                       ? 'border-east-light/40 bg-white/5 shadow-xl scale-[1.01]'
                                       : 'border-white/5 bg-black/40 backdrop-blur-sm hover:border-white/20'
                                 }`}
                              >
                                 <div className="p-3.5 flex items-center gap-3.5">
                                    <div
                                       className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-colors relative group/childimg shrink-0 ${
                                          isSelected ? 'border-east-light' : 'border-white/10'
                                       } ${isReadOnly ? '' : 'cursor-pointer'}`}
                                       onClick={(e) => {
                                          if (!isReadOnly) {
                                             e.stopPropagation();
                                             setEditingChildId(athlete.id);
                                             childAvatarInputRef.current?.click();
                                          }
                                       }}
                                    >
                                       <Image
                                          src={athlete.avatar_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2??auto=format&fit=crop&q=80&w=200"}
                                          fill
                                          className="object-cover"
                                          alt={athlete.first_name}
                                       />
                                       {!isReadOnly && (
                                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/childimg:opacity-100 transition-opacity">
                                             <Camera size={14} className="text-white" />
                                          </div>
                                       )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-2">
                                          <h4 className="font-montserrat font-black italic text-sm leading-none uppercase text-white truncate">
                                             {athlete.first_name} {athlete.last_name || ''}
                                          </h4>
                                          {isSelected && (
                                             <span className="text-[#28D160] bg-[#28D160]/10 border border-[#28D160]/20 text-[6.5px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                                Selected
                                             </span>
                                          )}
                                       </div>
                                       <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1 truncate">
                                          {athlete.team || athlete.bio || 'EAST SPORTS ATHLETE'}
                                       </p>
                                       <div className="flex items-center gap-2 mt-2">
                                          <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md border border-white/5">
                                             <Coins size={8} className="text-[#28D160]" />
                                             <span className="text-[8px] font-black text-white">
                                                {athlete.credits || 0} <span className="text-gray-500">CR</span>
                                             </span>
                                          </div>
                                          <button
                                             onClick={(e) => handleOpenTransfer(e, athlete)}
                                             className="bg-[#28D160]/10 hover:bg-[#28D160]/20 border border-[#28D160]/20 text-[#28D160] text-[7px] font-black uppercase px-2 py-1 rounded-md transition-colors"
                                          >
                                             + Transfer
                                          </button>
                                          <button
                                             onClick={(e) => handleOpenConvert(e, athlete)}
                                             title="Convert to full athlete account with direct login credentials"
                                             className="bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white text-[7px] font-black uppercase px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                                          >
                                             <Award size={8} className="text-east-light" />
                                             Convert
                                          </button>
                                       </div>
                                    </div>
                                    <ChevronRight
                                       size={14}
                                       className={`transition-transform shrink-0 ${
                                          isSelected ? 'text-east-light' : 'text-gray-600'
                                       }`}
                                    />
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
                              <h3 className="font-black italic text-xl uppercase mb-4 text-white">Register Athlete</h3>
                              <div className="space-y-4">
                                 <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400">First Name <span className="text-red-400">*</span></label>
                                    <input
                                       data-testid="child-first-name-input"
                                       value={newChild.first}
                                       onChange={e => setNewChild({ ...newChild, first: e.target.value })}
                                       className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-east-light text-sm"
                                       placeholder="e.g. Michael"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400">Last Name (Optional)</label>
                                    <input
                                       data-testid="child-last-name-input"
                                       value={newChild.last}
                                       onChange={e => setNewChild({ ...newChild, last: e.target.value })}
                                       className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-east-light text-sm"
                                       placeholder={profileData.last_name ? `e.g. ${profileData.last_name}` : 'e.g. Jordan'}
                                    />
                                 </div>
                                 <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400">Sport / Team (Optional)</label>
                                    <input
                                       data-testid="child-sport-input"
                                       value={newChild.sport}
                                       onChange={e => setNewChild({ ...newChild, sport: e.target.value })}
                                       className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-east-light text-sm"
                                       placeholder="e.g. Ice Hockey"
                                    />
                                 </div>

                                 <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-[10px] text-gray-400">
                                    <span className="text-east-light font-bold">ℹ️ Contact Info:</span> Booking updates and notifications will automatically be sent to your email (<strong>{profileData.contact_email || profileData.username || 'Parent Email'}</strong>).
                                 </div>

                                 <div className="flex gap-2 pt-2">
                                    <button data-testid="child-save-btn" onClick={handleAddChild} className="flex-1 bg-east-light text-black font-black uppercase py-3 rounded-lg text-xs hover:bg-white transition-colors">Save</button>
                                    <button onClick={() => setShowAddChild(false)} className="flex-1 bg-white/10 text-white font-black uppercase py-3 rounded-lg text-xs hover:bg-white/20 transition-colors">Cancel</button>
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

            {/* CONVERT TO ATHLETE MODAL */}
            {showConvertModal && convertTarget && (
               <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md">
                  <div className="bg-[#1e1e1e] p-6 rounded-2xl w-full max-w-sm border border-white/10 relative shadow-2xl">
                     <button
                        data-testid="convert-modal-close-btn"
                        onClick={() => setShowConvertModal(false)}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                     >
                        <X size={20} />
                     </button>

                     <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-east-light/10 text-east-light rounded-full flex items-center justify-center mx-auto mb-3 border border-east-light/20">
                           <Award size={28} />
                        </div>
                        <h3 className="font-black italic text-xl text-white uppercase tracking-tight">Convert to Full Athlete</h3>
                        <p className="text-gray-400 text-xs mt-1">
                           Give <strong className="text-white">{convertTarget.name}</strong> their own independent login account.
                        </p>
                     </div>

                     <div className="space-y-4">
                        <div>
                           <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Athlete's Email Address</label>
                           <input
                              data-testid="convert-email-input"
                              type="email"
                              value={convertEmail}
                              onChange={e => setConvertEmail(e.target.value)}
                              placeholder="athlete@example.com"
                              className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-east-light text-sm"
                           />
                        </div>

                        <div>
                           <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Create Password</label>
                           <input
                              data-testid="convert-password-input"
                              type="password"
                              value={convertPassword}
                              onChange={e => setConvertPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-east-light text-sm"
                           />
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-[9.5px] text-gray-400">
                           ✨ All booking history, credits, assessments, and stats will be preserved under their new login.
                        </div>

                        <button
                           data-testid="convert-confirm-btn"
                           onClick={handleConvertChild}
                           disabled={isConverting || !convertEmail || !convertPassword}
                           className="w-full bg-east-light text-black font-black uppercase py-3.5 rounded-xl text-xs hover:bg-white transition-all shadow-[0_0_20px_rgba(40,209,96,0.2)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           {isConverting ? 'Converting...' : 'Confirm Conversion'}
                        </button>
                     </div>
                  </div>
               </div>
            )}



            <input type="file" ref={childAvatarInputRef} onChange={handleChildAvatarUpload} className="absolute w-0 h-0 opacity-0 pointer-events-none" accept="image/*" />
         </div>
      </div>
   </div>
   );
}