'use client';
import React, { useState } from 'react';
import { Edit2, CheckCircle2, X, ChevronRight, Users, Calendar, Heart, Image as ImageIcon, Award } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';

// Simple Card Wrapper
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
   <div className={`bg-[#1e1e1e] rounded-xl overflow-hidden ${className}`}>
      {children}
   </div>
);

interface ParentProfileProps {
   onOpenSettings: () => void;
   profileData: any;
   isReadOnly?: boolean;
   myChildren?: any[];
   activeChildId?: string | null;
   setActiveChildId?: (id: string | null) => void;
   onAddChild?: () => void;
}

export default function ParentProfile({
   onOpenSettings,
   profileData,
   isReadOnly = false,
   myChildren = [],
   activeChildId,
   setActiveChildId,
   onAddChild
}: ParentProfileProps) {
   const [activeTab, setActiveTab] = useState('athletes');
   const [selectedChildId, setSelectedChildId] = useState<number | string>(activeChildId || 1);
   const [showAddChild, setShowAddChild] = useState(false);
   const [newChildName, setNewChildName] = useState({ first: '', last: '' });
   const [uploadingGallery, setUploadingGallery] = useState(false);
   const galleryInputRef = React.useRef<HTMLInputElement>(null);

   // Mock Data needed for tabs
   const next14Days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return {
         day: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
         date: d.getDate(),
         isAvailable: [true, true, false, true, false, true, true][i % 7]
      };
   });

   const contributions = [
      { label: 'Event Host', count: 12 },
      { label: 'Carpool', count: 45 },
      { label: 'Sponsor', count: 2 },
      { label: 'Ambassador', count: 1 }
   ];

   // Sync local state if activeChildId changes
   React.useEffect(() => {
      if (activeChildId) setSelectedChildId(activeChildId);
   }, [activeChildId]);

   // We use myChildren prop now
   const myAthletes = myChildren;

   const handleAddChild = async () => {
      if (!newChildName.first || !newChildName.last) return;
      const childId = crypto.randomUUID();

      const { error } = await supabase.from('profiles').insert({
         id: childId,
         first_name: newChildName.first,
         last_name: newChildName.last,
         parent_id: profileData.id,
         role: 'player',
         is_managed: true,
         credits: 0 // Children share parent credits usually, or start with 0
      });

      if (error) {
         alert('Error creating profile: ' + error.message);
      } else {
         // Also link in relationships table for good measure
         await supabase.from('player_relationships').insert({
            parent_id: profileData.id,
            child_id: childId
         });

         if (onAddChild) onAddChild();
         setShowAddChild(false);
         setNewChildName({ first: '', last: '' });
      }
   };

   const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      setUploadingGallery(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `gallery-${profileData.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);

      if (uploadError) {
         alert('Upload failed: ' + uploadError.message);
         setUploadingGallery(false);
         return;
      }

      const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
      const newImageUrl = data.publicUrl;

      // Update Database
      const updatedGallery = [...(profileData.gallery_images || []), newImageUrl];
      const { error: dbError } = await supabase
         .from('profiles')
         .update({ gallery_images: updatedGallery })
         .eq('id', profileData.id);

      if (!dbError) {
         if (onAddChild) onAddChild(); // Refresh profile data by triggering parent refresh
         alert('Photo added to gallery!');
      } else {
         alert('Failed to update profile: ' + dbError.message);
      }
      setUploadingGallery(false);
   };

   return (
      <div className="animate-fadeIn bg-black min-h-screen pb-24 relative overflow-hidden">
         {/* Background Image - Matching Player Profile Style */}
         <div className="fixed inset-0 z-0">
            <img
               src="https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=1200"
               className="w-full h-full object-cover opacity-20 grayscale"
               alt="bg"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
         </div>

         <div className="relative z-10 w-full max-w-md mx-auto">
            {/* HEADER CONTAINER */}
            <div className="flex flex-col">
               {/* 1. TOP VISUALS */}
               <div className="relative h-[250px] w-full shrink-0">
                  {!isReadOnly && (
                     <button onClick={onOpenSettings} className="absolute top-4 right-6 z-30 text-gray-400 hover:text-white transition-colors">
                        <Edit2 size={24} />
                     </button>
                  )}

                  <div className="absolute right-8 top-20 z-0 opacity-20">
                     <h1 className="font-montserrat font-black italic text-[7rem] text-white leading-none tracking-tighter select-none uppercase">PARENT</h1>
                  </div>

                  <div className="absolute left-6 top-16 z-10">
                     <div className="w-44 h-44 rounded-full border-[6px] border-white/10 bg-white/5 overflow-hidden shadow-2xl backdrop-blur-sm">
                        <img
                           src={profileData.avatar_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400"}
                           className="w-full h-full object-cover opacity-90"
                           alt="profile"
                        />
                     </div>
                  </div>
               </div>

               {/* 2. MIDDLE CONTENT: Name, Bio & Badges */}
               <div className="px-6 pb-8 flex flex-col gap-6 items-center w-full -mt-2">
                  <div className="w-full flex flex-col items-center pt-8">
                     <h2 className="font-montserrat font-black italic text-2xl text-white uppercase tracking-tighter leading-none text-center">
                        {profileData.first_name} <span className="text-east-light">{profileData.last_name || 'PARENT'}</span>
                     </h2>
                     <p className="font-bold text-[10px] text-gray-500 uppercase tracking-widest mt-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                        {profileData.tier?.toUpperCase() || 'MEMBER'} • HOCKEY PARENT
                     </p>
                  </div>

                  {profileData.bio && (
                     <div className="w-full bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl text-center relative z-20">
                        <p className="text-white text-xs font-montserrat font-bold italic leading-relaxed opacity-90">"{profileData.bio}"</p>
                     </div>
                  )}

                  <div className="grid grid-cols-3 w-full gap-2">
                     {[
                        { l: 'VOLUNTEER\nHRS', v: '48', icon: Heart },
                        { l: 'CREDITS\nBALANCE', v: profileData.credits || '0', icon: Users },
                        { l: 'EVENTS\nJOINED', v: '15', icon: Calendar },
                     ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center p-3 bg-white/5 rounded-xl border border-white/10 group hover:border-east-light/50 transition-colors">
                           <stat.icon size={14} className="text-east-light mb-1" />
                           <span className="font-black text-lg text-white italic">{stat.v}</span>
                           <span className="text-[7px] font-black font-montserrat uppercase text-center leading-tight text-gray-500 whitespace-pre-line">{stat.l}</span>
                        </div>
                     ))}
                  </div>
               </div>

               {/* 3. COLORED BANNER */}
               <div className="w-full bg-gradient-to-r from-east-light to-east-dark py-4 px-8 flex justify-between items-center shadow-lg border-y border-white/10 relative z-30">
                  <div className="text-center">
                     <div className="font-montserrat font-black italic text-[10px] text-black/60 tracking-widest">FAMILY ROLE</div>
                     <div className="font-black text-xl text-white mt-0.5 italic uppercase">HOCKEY MOM</div>
                  </div>
                  <div className="text-center">
                     <div className="font-montserrat font-black italic text-[10px] text-black/60 tracking-widest">ATHLETES</div>
                     <div className="font-black text-xl text-white mt-0.5 italic uppercase">{myAthletes.length} REGISTERED</div>
                  </div>
               </div>
            </div>

            {/* NAVIGATION */}
            <div className="flex justify-center gap-6 py-6 relative z-20 overflow-x-auto no-scrollbar px-4">
               {['ATHLETES', 'AVAILABILITY', 'CONTRIBUTIONS', 'GALLERY'].map(tab => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(tab.toLowerCase())}
                     className={`font-montserrat font-black italic text-xs uppercase transition-all drop-shadow-lg whitespace-nowrap ${activeTab === tab.toLowerCase() ? 'text-white border-b-2 border-east-light pb-1' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                     {tab}
                  </button>
               ))}
            </div>

            {/* CONTENT AREA */}
            <div className="px-4 pb-24 w-full">
               {/* ATHLETES TAB */}
               {activeTab === 'athletes' && (
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
                                       value={newChildName.first}
                                       onChange={e => setNewChildName({ ...newChildName, first: e.target.value })}
                                       className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-east-light"
                                    />
                                 </div>
                                 <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500">Last Name</label>
                                    <input
                                       value={newChildName.last}
                                       onChange={e => setNewChildName({ ...newChildName, last: e.target.value })}
                                       className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-east-light"
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
               )}

               {/* AVAILABILITY TAB */}
               {activeTab === 'availability' && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                     <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                        <div className="flex justify-between items-end mb-6">
                           <div>
                              <h3 className="font-montserrat font-black italic text-sm text-white uppercase tracking-widest">Live Availability</h3>
                              <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">Syncing with Schedule</p>
                           </div>
                           <Calendar size={18} className="text-east-light" />
                        </div>
                        <div className="grid grid-cols-7 gap-3">
                           {next14Days.slice(0, 7).map((day, i) => (
                              <div key={i} className="flex flex-col items-center gap-2">
                                 <span className="text-[8px] font-bold text-gray-600 uppercase">{day.day}</span>
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${i === 0 ? 'bg-east-light text-black scale-110 shadow-lg' : 'bg-white/5 text-white'}`}>
                                    {day.date}
                                 </div>
                                 <div className={`w-1 h-1 rounded-full ${day.isAvailable ? 'bg-east-light animate-pulse' : 'bg-red-500'}`} />
                              </div>
                           ))}
                        </div>
                     </div>
                     <p className="text-[10px] text-gray-500 text-center italic font-bold">Next 7 days shown. Adjust availability in family settings.</p>
                  </div>
               )}

               {/* CONTRIBUTIONS TAB */}
               {activeTab === 'contributions' && (
                  <div className="flex flex-col gap-3 animate-fadeIn">
                     {contributions.map((item, i) => (
                        <div key={i} className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-east-light/50 transition-all cursor-pointer">
                           <div className="p-5 flex items-center gap-5">
                              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center border border-white/10 group-hover:border-east-light/30 transition-colors shadow-xl">
                                 <Award
                                    size={24}
                                    className="text-white drop-shadow-md"
                                 />
                              </div>
                              <div>
                                 <h4 className="font-montserrat font-black italic text-sm text-white uppercase tracking-widest">{item.label}</h4>
                                 <p className="text-[10px] font-bold text-east-light uppercase">{item.count} ACTIVATIONS</p>
                              </div>
                              <ChevronRight className="ml-auto text-gray-600 group-hover:text-east-light transition-colors" size={18} />
                           </div>
                        </div>
                     ))}
                  </div>
               )}

               {/* GALLERY TAB */}
               {activeTab === 'gallery' && (
                  <div className="flex flex-col gap-4 animate-fadeIn">
                     <div className="flex justify-between items-center mb-2 px-1">
                        <h3 className="font-montserrat font-black italic text-sm text-white uppercase tracking-widest">Memories</h3>
                        <button
                           onClick={() => galleryInputRef.current?.click()}
                           disabled={uploadingGallery}
                           className="text-[10px] font-black text-east-light uppercase hover:text-white transition-all flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-full border border-white/10"
                        >
                           {uploadingGallery ? 'UPLOADING...' : <><ImageIcon size={12} /> ADD PHOTO</>}
                        </button>
                        <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} className="hidden" accept="image/*" />
                     </div>
                     <div className="grid grid-cols-3 gap-2">
                        {(profileData.gallery_images && profileData.gallery_images.length > 0
                           ? profileData.gallery_images
                           : [
                              "https://cdn.hockeycanada.ca/hockey-canada/community-engagement/asian-heritage-month/2025/2025-ahm-chihiro-suzuki.jpg?w=620&h=350&fit=crop?q=60&w=620&format=auto",
                              "https://eastsportsgroup.com/cdn/shop/files/WhatsApp_Image_2025-10-01_at_19.22.53.jpg?v=1759379442&width=1250",
                              "https://i1.wp.com/media.globalnews.ca/videostatic/335/843/larry_kwong_848x480_1190060611624.jpg?w=1040&quality=70&strip=all",
                              "https://eastsportsgroup.com/cdn/shop/files/esh.webp?v=1756778710&width=1500",
                              "https://st.focusedcollection.com/9163412/i/650/focused_517122206-stock-photo-focused-asian-male-athlete-doing.jpg",
                              "https://eastsportsgroup.com/cdn/shop/files/WhatsAppImage2024-11-21at14.04.48.jpg?v=1732169191&width=720",
                           ]).map((src: string, i: number) => (
                              <div key={i} className="aspect-square relative overflow-hidden rounded-xl bg-white/5 group">
                                 <img
                                    src={src}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                                    alt="Gallery"
                                 />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                 <ImageIcon className="absolute bottom-2 right-2 text-white/50 opacity-0 group-hover:opacity-100" size={12} />
                              </div>
                           ))}
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}