'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/app/components/ui/Toast';
import { Camera, Edit2, Play, Plus, ChevronRight, Award, Trophy, Users, Calendar, Video, Upload, Layers } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useGallery } from '@/app/hooks/useGallery';
import Lightbox from '@/app/components/ui/Lightbox';
import ClassModal from '@/app/components/modals/ClassModal';
import CreateDrillModal from '@/app/components/modals/CreateDrillModal';
import DrillDetailsModal from '@/app/components/modals/DrillDetailsModal';
import { Session } from '@/app/types';
import { compressImage } from '@/app/lib/image-utils';
import { formatHK } from '@/app/lib/dateUtils';

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

const MOCK_DRILLS = [
    {
        id: 1,
        title: "Power Slapshot Mastery",
        difficulty: "PRO",
        duration: "12 MIN",
        category: "SHOOTING",
        image: "https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=800"
    },
    {
        id: 2,
        title: "Defensive Zone Breakouts",
        difficulty: "U15",
        duration: "8 MIN",
        category: "DEFENSE",
        image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800"
    },
    {
        id: 3,
        title: "High-Speed Puck Control",
        difficulty: "U12",
        duration: "15 MIN",
        category: "PASSING",
        image: "https://images.unsplash.com/photo-1518407613690-d9fc996e74bc?auto=format&fit=crop&q=80&w=800"
    },
    {
        id: 4,
        title: "Goalie Screen Deflection",
        difficulty: "PRO",
        duration: "10 MIN",
        category: "SHOOTING",
        image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800"
    }
];

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
    
    // Drills State
    const [showCreateDrill, setShowCreateDrill] = useState(false);
    const [selectedDrill, setSelectedDrill] = useState<any | null>(null);
    const [drills, setDrills] = useState<any[]>([]);
    const [drillsLoading, setDrillsLoading] = useState(false);

    const fetchDrills = async () => {
        if (!profileData?.id) return;
        setDrillsLoading(true);
        const { data, error } = await supabase.from('coach_drills').select('*').eq('coach_id', profileData.id).order('created_at', { ascending: false });
        if (!error && data) {
            setDrills(data);
        }
        setDrillsLoading(false);
    };

    useEffect(() => {
        if (activeTab === 'drills') {
            fetchDrills();
        }
    }, [activeTab, profileData?.id]);

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
            .limit(50);

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

        const { data: allSessions } = await supabase
            .from('sessions')
            .select('*')
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true });

        if (allSessions) {
            const normalize = (name: string) => name?.replace(/\s+/g, ' ').trim().toLowerCase() || '';
            const coachFullName = normalize(`${profileData.first_name || ''} ${profileData.last_name || ''}`);
            const coachFirstName = normalize(profileData.first_name || '');

            const filtered = allSessions.filter((s: Session) => {
                const instr = normalize(s.instructor || '');
                return instr.includes(coachFullName) || (profileData.first_name && instr.includes(coachFirstName));
            });
            setUpcomingSessions(filtered as Session[]);
        }
    };




    // Avatar Upload
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const originalFile = e.target.files[0];
        setUploading(true);

        try {
            // Compress image before upload
            const file = await compressImage(originalFile);

            const fileExt = file.name.split('.').pop();
            const fileName = `avatar-${profileData.id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);

            if (uploadError) {
                throw new Error(`Upload failed: ${uploadError.message}`);
            }

            const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);

            const { error: dbError } = await supabase
                .from('profiles')
                .update({ avatar_url: data.publicUrl })
                .eq('id', profileData.id);

            if (dbError) {
                throw new Error(`Profile update failed: ${dbError.message}`);
            }

            addToast('Avatar updated!', 'success');
            window.location.reload();
        } catch (error: any) {
            console.error('Coach avatar upload error:', error);
            addToast(error.message || 'Avatar upload failed', 'error');
        } finally {
            setUploading(false);
        }
    };

    // Video Upload
    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `video-${profileData.id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);

            if (uploadError) {
                throw new Error(`Video upload failed: ${uploadError.message}`);
            }

            const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
            const { error: dbError } = await supabase.from('profiles').update({ intro_video_url: data.publicUrl }).eq('id', profileData.id);

            if (dbError) {
                throw new Error(`Video profile update failed: ${dbError.message}`);
            }

            addToast('Intro video uploaded!', 'success');
            window.location.reload();
        } catch (error: any) {
            console.error('Coach video upload error:', error);
            addToast(error.message || 'Video upload failed', 'error');
        } finally {
            setUploading(false);
        }
    };

    // Gallery Upload
    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const originalFile = e.target.files[0];
        setUploading(true);

        try {
            // Compress image before upload
            const file = await compressImage(originalFile);

            const fileExt = file.name.split('.').pop();
            const fileName = `gallery-${profileData.id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, file);

            if (uploadError) {
                throw new Error(`Gallery upload failed: ${uploadError.message}`);
            }

            const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
            const newImageUrl = data.publicUrl;

            const updatedGallery = [...(profileData.gallery_images || []), newImageUrl];
            const { error: dbError } = await supabase
                .from('profiles')
                .update({ gallery_images: updatedGallery })
                .eq('id', profileData.id);

            if (dbError) {
                throw new Error(`Gallery update failed: ${dbError.message}`);
            }

            addToast('Photo added to gallery!', 'success');
            window.location.reload();
        } catch (error: any) {
            console.error('Coach gallery upload error:', error);
            addToast(error.message || 'Gallery upload failed', 'error');
        } finally {
            setUploading(false);
        }
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
                            <button data-testid="settings-button" onClick={onOpenSettings} className="absolute top-4 right-6 z-30 text-gray-400 hover:text-white transition-colors">
                                <Edit2 size={24} />
                            </button>
                        )}

                        <div className="absolute right-8 top-20 z-0 opacity-20">
                            <h1 className="font-black italic text-[8rem] text-white leading-none tracking-tighter select-none uppercase">COACH</h1>
                        </div>

                        <div className="absolute left-6 top-16 z-10">
                            <div
                                className={`w-44 h-44 rounded-full border-[6px] border-white/10 bg-white/5 overflow-hidden shadow-2xl backdrop-blur-sm relative ${isPublic ? '' : 'cursor-pointer group'}`}
                                onClick={(e) => {
                                    if (!isPublic) {
                                        e.stopPropagation();
                                        avatarInputRef.current?.click();
                                    }
                                }}
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
                            <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="absolute w-0 h-0 opacity-0 pointer-events-none" accept="image/*" />
                            <input type="file" ref={fileInputRef} onChange={handleGalleryUpload} className="absolute w-0 h-0 opacity-0 pointer-events-none" accept="image/*" />
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 w-full gap-2">
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

                    {/* 3. METADATA BANNER */}
                    <div className="w-full bg-black/60 backdrop-blur-xl py-5 px-8 flex justify-between items-center shadow-2xl border-y border-white/5 relative z-30 group hover:border-east-light/30 transition-colors">
                        <div className="absolute inset-0 bg-gradient-to-r from-east-light/5 via-transparent to-east-light/5 opacity-50" />
                        <div className="text-center relative z-10">
                            <div className="font-black italic text-[9px] text-east-light tracking-widest uppercase mb-1">SPECIALTY</div>
                            <div className="font-black text-xl text-white italic uppercase drop-shadow-md">HOCKEY IQ</div>
                        </div>
                        <div className="w-px h-8 bg-white/10 relative z-10" />
                        <div className="text-center relative z-10">
                            <div className="font-black italic text-[9px] text-east-light tracking-widest uppercase mb-1">TEAM</div>
                            <div className="font-black text-xl text-white italic uppercase drop-shadow-md">{profileData.team || 'EAST ELITE'}</div>
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
                                        <button onClick={(e) => { e.stopPropagation(); videoInputRef.current?.click(); }} className="p-2 bg-black/50 rounded-full hover:bg-east-light hover:text-black text-white transition-all backdrop-blur-sm border border-white/10">
                                            <Upload size={16} />
                                        </button>
                                        <input type="file" ref={videoInputRef} onChange={handleVideoUpload} className="absolute w-0 h-0 opacity-0 pointer-events-none" accept="video/*" />
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
                                        <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="text-[10px] font-black text-east-light uppercase hover:text-white transition-all flex items-center gap-1">
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
                                                <span className="text-[8px] font-bold text-gray-500 uppercase">{formatHK(slot.start_time, 'h:mm a')}</span>
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
                                                    {new Date(session.start_time).toLocaleDateString([], { weekday: 'short' })} • {formatHK(session.start_time, 'h:mm a')}
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
                            {/* Filter Pills */}
                            <div className="flex flex-wrap gap-2 px-2">
                                {DRILL_FILTERS.type.map((type, i) => (
                                    <button key={i} className={`px-4 py-1.5 rounded-full text-[10px] font-black italic uppercase transition-all border ${i === 0 ? 'bg-east-light text-black border-east-light shadow-[0_0_15px_rgba(40,209,96,0.3)]' : 'bg-black/40 text-gray-400 border-white/10 hover:border-white/30 hover:text-white backdrop-blur-md'}`}>
                                        {type}
                                    </button>
                                ))}
                            </div>

                            {/* Rich Drills Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2">
                                {drillsLoading ? (
                                    <div className="col-span-2 text-center py-20">
                                        <div className="w-8 h-8 border-4 border-east-light border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Syncing Library</p>
                                    </div>
                                ) : drills.length === 0 ? (
                                    <div className="col-span-2 text-center py-20 border border-dashed border-white/5 rounded-[3rem] bg-white/[0.02]">
                                        <Layers className="mx-auto mb-4 text-gray-800" size={40} />
                                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">No Drills Published</p>
                                    </div>
                                ) : drills.map(drill => (
                                    <div key={drill.id} onClick={() => window.location.href = `/drill-hub?drill_id=${drill.id}`} className="relative overflow-hidden rounded-[2.5rem] border border-white/5 group cursor-pointer shadow-2xl bg-[#0a0a0a] h-64 active:scale-[0.98] transition-all duration-500 hover:border-east-light/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:-translate-y-1">
                                        {/* Background Image */}
                                        <img src={drill.thumbnail_url || drill.image_url || "https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=800"} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-1000" alt={drill.title} />
                                        
                                        {/* Dark Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                        
                                        {/* Glow Overlay */}
                                        <div className="absolute inset-0 bg-east-light/0 group-hover:bg-east-light/5 transition-colors duration-700" />

                                        {/* Play Button Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-10 scale-75 group-hover:scale-100">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-white flex items-center justify-center pl-1 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                                                <Play fill="black" size={24} className="text-black" />
                                            </div>
                                        </div>

                                        {/* Badges Top */}
                                        <div className="absolute top-6 left-6 flex gap-2 z-10 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                            <span className="px-3 py-1 bg-east-light/10 backdrop-blur-md rounded-full text-[8px] font-black text-east-light uppercase tracking-widest border border-east-light/20">
                                                {drill.level_tags?.[0] || 'PRO'}
                                            </span>
                                            {drill.duration && (
                                                <span className="px-3 py-1 bg-white/5 backdrop-blur-md rounded-full text-[8px] font-black text-gray-300 uppercase tracking-widest border border-white/10">
                                                    {drill.duration}
                                                </span>
                                            )}
                                        </div>

                                        {/* Content Bottom */}
                                        <div className="absolute bottom-6 left-8 right-8 z-10">
                                            <h4 className="font-black italic text-2xl text-white uppercase leading-tight line-clamp-2 drop-shadow-2xl group-hover:text-east-light transition-colors duration-500">
                                                {drill.title}
                                            </h4>
                                            <div className="flex items-center gap-3 mt-3 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-75">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                                    {drill.skill_tags?.[0] || 'SKILL'}
                                                </p>
                                                <div className="w-1 h-1 bg-east-light rounded-full" />
                                                <p className="text-[10px] font-black text-east-light uppercase tracking-[0.2em] italic">
                                                    Tactical Sequence
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {!isPublic && (
                                <button onClick={() => setShowCreateDrill(true)} className="group relative overflow-hidden w-full bg-[#111] border border-white/5 hover:border-east-light/50 text-white font-black italic text-sm py-6 rounded-[2rem] transition-all duration-700 active:scale-[0.98] shadow-2xl mt-4">
                                    <div className="absolute inset-0 bg-gradient-to-r from-east-light/0 via-east-light/5 to-east-light/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <span className="relative z-10 uppercase tracking-[0.3em] flex items-center justify-center gap-3 drop-shadow-md group-hover:text-east-light transition-colors">
                                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-700" /> PUBLISH NEW DRILL
                                    </span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showCreateDrill && (
                <CreateDrillModal 
                    coachId={profileData.id} 
                    onClose={() => setShowCreateDrill(false)} 
                    onSuccess={() => {
                        setShowCreateDrill(false);
                        fetchDrills();
                    }}
                />
            )}

            {selectedDrill && (
                <DrillDetailsModal 
                    drill={selectedDrill} 
                    onClose={() => setSelectedDrill(null)} 
                    isCoach={!isPublic}
                />
            )}

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
                        sessions={upcomingSessions}
                        currentUserId={currentUserId || null}
                        bookedSessions={bookedSessionIds.map(id => ({ id } as Session))}
                        onClose={() => setSelectedSession(null)}
                        onScheduleChange={() => setRefreshKey(prev => prev + 1)}
                        origin="coaches"
                        coachBio={profileData.bio}
                        coachName={`${profileData.first_name} ${profileData.last_name}`}
                        initialSessionId={selectedSession.id}
                    />
                )
            }
        </div >
    );
}
