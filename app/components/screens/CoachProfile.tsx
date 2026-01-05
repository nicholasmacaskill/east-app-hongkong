'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/app/components/ui/Toast';
import { Camera, Edit2, Play, Plus, ChevronRight, Award, Trophy, Users, Calendar, Video, Upload } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useGallery } from '@/app/hooks/useGallery';
import Lightbox from '@/app/components/ui/Lightbox';
import ClassModal from '@/app/components/modals/ClassModal';
import { Session } from '@/app/types/session';

// Mock Data for redesign (Keep stats for now/remove later)
const PROFILE_STATS = {
    win_rate: '85%',
    total_sessions: 412,
    experience: '12 YRS'
};


const DRILL_FILTERS = {
    age: ['U10', 'U12', 'U15', 'PRO'],
    type: ['SHOOTING', 'DEFENSE', 'PASSING']
};

export default function CoachProfile({ onOpenSettings, profileData, isPublic = false, currentUserId }: { onOpenSettings: () => void, profileData: any, isPublic?: boolean, currentUserId?: string | null }) {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'profile' | 'sessions' | 'drills'>('profile');
    const [uploading, setUploading] = useState(false);
    const [availability, setAvailability] = useState<any[]>([]);
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bioText, setBioText] = useState(profileData.bio || '');

    // New State for Real Sessions
    const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [bookedSessionIds, setBookedSessionIds] = useState<number[]>([]);
    const [refreshKey, setRefreshKey] = useState(0); // to trigger refetches

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const displayGallery = profileData.gallery_images && profileData.gallery_images.length > 0
        ? profileData.gallery_images
        : [
            "https://images.unsplash.com/photo-1518407613690-d9fc996e74bc?auto=format&fit=crop&q=80&w=400",
            "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=400",
            "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=400",
        ];

    const gallery = useGallery(displayGallery);

    // Fetch Availability
    const fetchAvailability = async () => {
        const { data } = await supabase
            .from('availability')
            .select('*')
            .eq('coach_id', profileData.id)
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true })
            .limit(9);

        if (data) setAvailability(data);
    };

    useEffect(() => {
        if (profileData?.id) {
            fetchAvailability();
            fetchUpcomingSessions();
        }
    }, [profileData, refreshKey]);

    useEffect(() => {
        if (currentUserId) {
            fetchBookings();
        }
    }, [currentUserId, refreshKey]);

    const fetchBookings = async () => {
        if (!currentUserId) return;
        const { data } = await supabase
            .from('registrations')
            .select('session_id')
            .eq('user_id', currentUserId);
        if (data) {
            setBookedSessionIds(data.map(r => r.session_id));
        }
    };

    const fetchUpcomingSessions = async () => {
        const coachName = profileData.first_name || profileData.username;
        if (!coachName) return;

        // Fetch sessions where instructor name matches (simple text match for now)
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .ilike('instructor', `%${coachName}%`)
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true }); // Removed Limit to show all upcoming

        if (data) setUpcomingSessions(data as Session[]);
    };




    // Avatar Upload
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);

        const fileExt = file.name.split('.').pop();
        const fileName = `avatar-${profileData.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);

        if (uploadError) {
            addToast('Avatar upload failed', 'error');
            setUploading(false);
            return;
        }

        const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);

        const { error: dbError } = await supabase
            .from('profiles')
            .update({ avatar_url: data.publicUrl })
            .eq('id', profileData.id);

        if (!dbError) {
            profileData.avatar_url = data.publicUrl;
            window.location.reload();
        }
        setUploading(false);
    };

    // Video Upload
    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);

        const fileExt = file.name.split('.').pop();
        const fileName = `video-${profileData.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);

        if (uploadError) {
            addToast('Video upload failed: ' + uploadError.message, 'error');
            setUploading(false);
            return;
        }

        const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
        const { error: dbError } = await supabase.from('profiles').update({ intro_video_url: data.publicUrl }).eq('id', profileData.id);

        if (!dbError) {
            profileData.intro_video_url = data.publicUrl;
            addToast('Intro video uploaded!', 'success');
            window.location.reload();
        }
        setUploading(false);
    };

    // Gallery Upload
    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);

        const fileExt = file.name.split('.').pop();
        const fileName = `gallery-${profileData.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);

        if (uploadError) {
            addToast('Upload failed', 'error');
            setUploading(false);
            return;
        }

        const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
        const newImageUrl = data.publicUrl;

        const updatedGallery = [...(profileData.gallery_images || []), newImageUrl];
        const { error: dbError } = await supabase
            .from('profiles')
            .update({ gallery_images: updatedGallery })
            .eq('id', profileData.id);

        if (!dbError) {
            addToast('Photo added to gallery!', 'success');
            window.location.reload();
        }
        setUploading(false);
    };

    // Save Bio
    const saveBio = async () => {
        const { error } = await supabase
            .from('profiles')
            .update({ bio: bioText })
            .eq('id', profileData.id);

        if (!error) {
            profileData.bio = bioText;
            setIsEditingBio(false);
            addToast('Bio updated successfully', 'success');
        } else {
            addToast("Failed to save bio", 'error');
        }
    };

    if (!profileData) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-montserrat font-bold animate-pulse uppercase tracking-widest">Loading Coach Profile...</div>;


    return (
        <div className="animate-fadeIn bg-black min-h-screen pb-24 relative overflow-hidden font-montserrat">
            {/* Background Image Layer - Premium Blur Overlay */}
            <div className="fixed inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=1200"
                    className="w-full h-full object-cover opacity-20 grayscale"
                    alt="bg"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90" />
            </div>

            <div className="relative z-10 w-full max-w-md mx-auto">
                {/* HEADER CONTAINER */}
                <div className="flex flex-col">
                    {/* 1. TOP VISUALS */}
                    <div className="relative h-[250px] w-full shrink-0">
                        {!isPublic && (
                            <button onClick={onOpenSettings} className="absolute top-4 right-6 z-30 text-gray-400 hover:text-white transition-colors">
                                <Edit2 size={24} />
                            </button>
                        )}

                        <div className="absolute right-8 top-20 z-0 opacity-20">
                            <h1 className="font-black italic text-[8rem] text-white leading-none tracking-tighter select-none uppercase">COACH</h1>
                        </div>

                        <div className="absolute left-6 top-16 z-10">
                            <div
                                className={`w-44 h-44 rounded-full border-[6px] border-white/10 bg-white/5 overflow-hidden shadow-2xl backdrop-blur-sm relative ${isPublic ? '' : 'cursor-pointer group'}`}
                                onClick={() => !isPublic && avatarInputRef.current?.click()}
                            >
                                <img
                                    src={profileData.avatar_url || "https://images.pexels.com/photos/6550836/pexels-photo-6550836.jpeg"}
                                    className={`w-full h-full object-cover opacity-90 transition-opacity ${isPublic ? '' : 'group-hover:opacity-40'}`}
                                    alt="profile"
                                />
                                {!isPublic && (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera size={32} className="text-white" />
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                            <input type="file" ref={fileInputRef} onChange={handleGalleryUpload} className="hidden" accept="image/*" />
                        </div>
                    </div>

                    {/* 2. MIDDLE CONTENT */}
                    <div className="px-6 pb-8 flex flex-col gap-6 items-center w-full -mt-2">
                        <div className="w-full flex flex-col items-center pt-8">
                            <h2 className="font-black italic text-2xl text-white uppercase tracking-tighter leading-none text-center">
                                {profileData.first_name || 'COACH'} <span className="text-east-light">{profileData.last_name || 'WHIT'}</span>
                            </h2>
                            <p className="font-bold text-[10px] text-gray-500 uppercase tracking-widest mt-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                PRO INSTRUCTOR • HOCKEY SPECIALIST
                            </p>
                        </div>

                        {/* Bio Section with Toggle */}
                        <div className="w-full bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl relative z-20">
                            {isEditingBio ? (
                                <div className="flex flex-col gap-3">
                                    <textarea
                                        value={bioText}
                                        onChange={(e) => setBioText(e.target.value)}
                                        className="w-full bg-black/40 text-white text-xs p-3 rounded-lg border border-east-light outline-none min-h-[80px] font-bold"
                                        placeholder="Write your bio..."
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={saveBio} className="bg-east-light text-black text-[10px] font-black italic px-4 py-2 rounded-full uppercase hover:bg-white transition-all shadow-lg">SAVE</button>
                                        <button onClick={() => setIsEditingBio(false)} className="text-gray-400 text-[10px] font-black italic px-4 py-2 uppercase hover:text-white transition-all">CANCEL</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="group relative">
                                    <p className="text-white text-xs font-bold italic leading-relaxed opacity-90 text-center">"{profileData.bio || "Crafting athletes of the future at East Sports Group."}"</p>
                                    {!isPublic && (
                                        <button
                                            onClick={() => setIsEditingBio(true)}
                                            className="absolute -top-2 -right-2 p-1.5 bg-black/60 rounded-full border border-white/10 text-gray-500 hover:text-east-light opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Edit2 size={10} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Stat Grid */}
                        <div className="grid grid-cols-3 w-full gap-2">
                            {[
                                { l: 'WIN\nRATE', v: PROFILE_STATS.win_rate, icon: Trophy },
                                { l: 'SESSIONS\nDONE', v: PROFILE_STATS.total_sessions, icon: Video },
                                { l: 'EXP\nLEVEL', v: PROFILE_STATS.experience, icon: Award },
                            ].map((stat, i) => (
                                <div key={i} className="flex flex-col items-center p-3 bg-white/5 rounded-xl border border-white/10 group hover:border-east-light/50 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center mb-2 border border-white/10 group-hover:border-east-light/30 transition-colors shadow-lg">
                                        <stat.icon size={14} className="text-white" />
                                    </div>
                                    <span className="font-black text-lg text-white italic">{stat.v}</span>
                                    <span className="text-[7px] font-black uppercase text-center leading-tight text-gray-500 whitespace-pre-line">{stat.l}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. COLORED BANNER */}
                    <div className="w-full bg-gradient-to-r from-east-light to-east-dark py-4 px-8 flex justify-between items-center shadow-lg border-y border-white/10 relative z-30">
                        <div className="text-center">
                            <div className="font-black italic text-[10px] text-black/60 tracking-widest uppercase">SPECIALTY</div>
                            <div className="font-black text-xl text-white mt-0.5 italic uppercase">HOCKEY IQ</div>
                        </div>
                        <div className="text-center">
                            <div className="font-black italic text-[10px] text-black/60 tracking-widest uppercase">TEAM</div>
                            <div className="font-black text-xl text-white mt-0.5 italic uppercase">{profileData.team || 'EAST ELITE'}</div>
                        </div>
                    </div>
                </div>

                {/* NAVIGATION TABS */}
                <div className="flex justify-center gap-6 py-6 relative z-20 overflow-x-auto no-scrollbar px-4">
                    {['PROFILE', 'SESSIONS', 'DRILLS'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase() as any)}
                            className={`font-black italic text-xs uppercase transition-all drop-shadow-lg whitespace-nowrap ${activeTab === tab.toLowerCase() ? 'text-white border-b-2 border-east-light pb-1' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* CONTENT AREA */}
                <div className="px-4 pb-24 w-full">
                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="flex flex-col gap-6 animate-fadeIn">
                            {/* Intro Video Card */}
                            <div className="relative rounded-[2rem] overflow-hidden border border-white/10 group cursor-pointer shadow-2xl bg-black aspect-video">
                                {profileData.intro_video_url ? (
                                    <video
                                        src={profileData.intro_video_url}
                                        controls
                                        className="w-full h-full object-cover"
                                        poster="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800"
                                    />
                                ) : (
                                    <>
                                        <img src="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" alt="intro" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-14 h-14 rounded-full bg-east-light flex items-center justify-center pl-1 shadow-2xl group-hover:scale-110 transition-transform">
                                                <Play fill="black" size={24} className="text-black" />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {!isPublic && (
                                    <div className="absolute top-4 right-4 z-20">
                                        <button onClick={() => videoInputRef.current?.click()} className="p-2 bg-black/50 rounded-full hover:bg-east-light hover:text-black text-white transition-all backdrop-blur-sm border border-white/10">
                                            <Upload size={16} />
                                        </button>
                                        <input type="file" ref={videoInputRef} onChange={handleVideoUpload} className="hidden" accept="video/*" />
                                    </div>
                                )}

                                <div className="absolute bottom-4 left-6 pointer-events-none">
                                    <h4 className="font-black italic text-lg text-white uppercase tracking-tighter">MEET COACH {profileData.last_name || 'WHIT'}</h4>
                                    <p className="text-[9px] font-bold text-east-light uppercase tracking-widest">{profileData.intro_video_url ? 'WATCH INTRO' : 'NO VIDEO UPLOADED'}</p>
                                </div>
                            </div>

                            {/* Gallery Row */}
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-black italic text-sm text-white uppercase tracking-widest">Gallery</h3>
                                    {!isPublic && (
                                        <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black text-east-light uppercase hover:text-white transition-all flex items-center gap-1">
                                            <Plus size={12} /> ADD PHOTO
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                    {displayGallery.map((img: string, i: number) => (
                                        <div key={i} onClick={() => gallery.open(i)} className="w-32 h-20 shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-lg group cursor-pointer active:scale-95 transition-transform">
                                            <img src={img} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Availability Summary */}
                            <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                                <div className="flex justify-between items-end mb-4">
                                    <h3 className="font-black italic text-sm text-white uppercase tracking-widest">NEXT SLOTS</h3>
                                    <Calendar size={18} className="text-east-light" />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {availability.length > 0 ? availability.slice(0, 3).map((slot, i) => {
                                        const start = new Date(slot.start_time);
                                        return (
                                            <div key={i} className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col items-center transition-colors hover:border-east-light/40">
                                                <span className="text-[9px] font-black text-east-light uppercase">{start.toLocaleDateString([], { weekday: 'short' })}</span>
                                                <span className="text-lg font-black italic text-white leading-none my-1">{start.getDate()}</span>
                                                <span className="text-[8px] font-bold text-gray-500 uppercase">{start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                                            </div>
                                        );
                                    }) : (
                                        <div className="col-span-3 py-4 text-center border border-dashed border-white/10 rounded-xl">
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">No slots listed</p>
                                        </div>
                                    )}
                                </div>
                                {!isPublic && <p className="text-[9px] text-gray-600 font-bold text-center mt-4 uppercase underline cursor-pointer hover:text-white transition-colors">Manage Full Calendar</p>}
                            </div>
                        </div>
                    )}

                    {/* SESSIONS TAB */}
                    {activeTab === 'sessions' && (
                        <div className="flex flex-col gap-4 animate-fadeIn">
                            <h3 className="font-black italic text-sm text-white uppercase tracking-widest mb-2 px-2">Upcoming Classes</h3>

                            {upcomingSessions.length === 0 ? (
                                <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl">
                                    <p className="text-gray-500 font-bold uppercase text-xs">No upcoming classes scheduled.</p>
                                </div>
                            ) : (
                                upcomingSessions.map((session) => (
                                    <div key={session.id} onClick={() => setSelectedSession(session)} className="relative overflow-hidden rounded-2xl border border-white/10 group hover:border-east-light/50 transition-all cursor-pointer bg-white/5 shadow-xl active:scale-95 duration-200">
                                        <div className="p-4 flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/20">
                                                <img
                                                    src={session.image_url || "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=400"}
                                                    className="w-full h-full object-cover"
                                                    alt={session.title}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-black italic text-lg text-white leading-none uppercase">{session.title}</h4>
                                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                                    {new Date(session.start_time).toLocaleDateString([], { weekday: 'short' })} • {new Date(session.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                </p>
                                                <div className="flex gap-3 mt-3">
                                                    <div className="flex items-center gap-1">
                                                        <Users size={10} className="text-east-light" />
                                                        <span className="text-[9px] font-black text-white/50 uppercase">JOIN SESSION</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-600 group-hover:text-east-light transition-colors" />
                                        </div>
                                    </div>
                                ))
                            )}
                            {!isPublic && (
                                <button onClick={() => addToast("Feature Coming Soon", 'info')} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-gray-400 font-black italic text-xs hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest mt-2 shadow-lg active:scale-95 duration-200 group">
                                    <span className="group-hover:text-east-light transition-colors">+ Schedule New Group Session</span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* DRILLS TAB */}
                    {activeTab === 'drills' && (
                        <div className="flex flex-col gap-6 animate-fadeIn">
                            <div className="flex flex-wrap gap-2 px-2">
                                {DRILL_FILTERS.type.map((type, i) => (
                                    <button key={i} className={`px-4 py-1.5 rounded-full text-[10px] font-black italic uppercase transition-all ${i === 0 ? 'bg-east-light text-black shadow-lg shadow-east-light/20' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} onClick={() => addToast("Viewing Drill Details...", 'info')} className="aspect-square bg-[#1e1e1e] border border-white/10 rounded-2xl p-4 flex flex-col justify-between group hover:border-east-light transition-all shadow-xl hover:-translate-y-1 active:scale-95 duration-200 cursor-pointer">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-east-light/30 transition-colors">
                                            <Video size={20} className="text-gray-500 group-hover:text-east-light" />
                                        </div>
                                        <div>
                                            <h4 className="font-black italic text-xs text-white uppercase leading-tight line-clamp-2">Power Slapshot<br />Mastery</h4>
                                            <p className="text-[8px] font-bold text-east-light uppercase tracking-widest mt-1">Difficulty: PRO</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {!isPublic && (
                                <button onClick={() => addToast("Feature Coming Soon", 'info')} className="w-full py-4 bg-east-light text-black font-black italic text-xs rounded-2xl uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                                    CREATE NEW DRILL
                                </button>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* LIGHTBOX OVERLAY */}
            <Lightbox
                isOpen={gallery.isOpen}
                imageSrc={gallery.currentImage}
                onClose={gallery.close}
                onNext={gallery.next}
                onPrev={gallery.prev}
                currentIndex={gallery.selectedIndex ?? 0}
                totalImages={displayGallery.length}
            />

            {/* CLASS MODAL */}
            {
                selectedSession && (
                    <ClassModal
                        sessions={[selectedSession]}
                        currentUserId={currentUserId || null}
                        bookedSessions={bookedSessionIds.map(id => ({ id } as Session))}
                        onClose={() => setSelectedSession(null)}
                        onScheduleChange={() => setRefreshKey(prev => prev + 1)}
                    />
                )
            }
        </div >
    );
}
