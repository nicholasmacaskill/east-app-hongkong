import React, { useRef, useState, useEffect } from 'react';
import { X, Play, PenTool, Eraser, Trash2, Video, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useTracking } from '@/app/hooks/useTracking';

interface Drill {
    id: string;
    title: string;
    description?: string;
    difficulty?: string;
    duration?: string;
    category?: string;
    skill_tags?: string[];
    level_tags?: string[];
    group_tags?: string[];
    age_tags?: string[];
    video_url?: string;
    image_url?: string;
    thumbnail_url?: string;
    coach_id?: string;
    accessories?: string[];
    pods?: string;
    colors?: string;
}

const ActivityDescription = ({ text }: { text?: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const fallbackText = "No tactical details provided for this sequence.";
    const content = text || fallbackText;
    const isLong = content.length > 150;
    
    return (
        <div className="space-y-2">
            <h3 className="text-[10px] font-black text-east-light uppercase tracking-[0.3em] mb-1 italic opacity-85">Activity Description</h3>
            <p className="text-sm text-gray-300 font-medium leading-relaxed italic transition-all duration-300">
                {isExpanded ? content : (isLong ? `${content.substring(0, 150)}...` : content)}
            </p>
            {isLong && (
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-[9px] font-black text-east-light uppercase tracking-widest hover:underline mt-1"
                >
                    {isExpanded ? "Show Less" : "More"}
                </button>
            )}
        </div>
    );
};

const AccessoriesList = ({ accessories }: { accessories?: string[] }) => {
    if (!accessories || accessories.length === 0) return null;
    return (
        <div className="space-y-1.5">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Accessories</h3>
            <p className="text-sm text-gray-300 font-medium">
                {accessories.join(' · ')}
            </p>
        </div>
    );
};

const ActivityGoals = ({ drill }: { drill: Drill }) => {
    const allTags = [
        ...(drill.skill_tags || []),
        ...(drill.group_tags || []),
        ...(drill.age_tags || [])
    ].filter(Boolean);
    
    if (allTags.length === 0) return null;
    
    return (
        <div className="space-y-2.5">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Activity Goals</h3>
            <div className="flex flex-wrap gap-2">
                {allTags.map((tag, idx) => (
                    <span 
                        key={idx} 
                        className="px-3 py-1 rounded-full text-[10px] font-semibold text-gray-300 border border-white/20 bg-white/5"
                    >
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
};

const SetupGrid = ({ drill }: { drill: Drill }) => {
    const hasSetup = drill.pods || drill.colors || drill.duration;
    if (!hasSetup) return null;
    return (
        <div className="space-y-5">
            {hasSetup && (
                <div>
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">Setup</h3>
                    <div className="grid grid-cols-3 gap-2.5">
                        {drill.pods && (
                            <div className="bg-[#1C2541]/60 border border-white/8 rounded-2xl p-3.5 shadow-lg">
                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">Pods</span>
                                <span className="text-xs text-white font-black">{drill.pods}</span>
                            </div>
                        )}
                        {drill.colors && (
                            <div className="bg-[#1C2541]/60 border border-white/8 rounded-2xl p-3.5 shadow-lg">
                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">Colors</span>
                                <span className="text-xs text-white font-black">{drill.colors}</span>
                            </div>
                        )}
                        {drill.duration && (
                            <div className="bg-[#1C2541]/60 border border-white/8 rounded-2xl p-3.5 shadow-lg">
                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">Duration</span>
                                <span className="text-xs text-white font-black">{drill.duration}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

interface DrillDetailsModalProps {
    drill: Drill;
    onClose: () => void;
    isCoach: boolean;
}

export default function DrillDetailsModal({ drill, onClose, isCoach }: DrillDetailsModalProps) {
    const { track } = useTracking();
    const [activeTab, setActiveTab] = useState<'video' | 'whiteboard'>('video');
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoUrl, setVideoUrl] = useState(drill.video_url || '');
    const [uploading, setUploading] = useState(false);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const coverImage = drill.thumbnail_url || drill.image_url || '';

    useEffect(() => {
        track('drill_viewed', { drill_name: drill.title, skill_tags: drill.skill_tags });
    }, [drill.id]);

    // Whiteboard State
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#28D160');
    const [lineWidth, setLineWidth] = useState(3);
    const [isEraser, setIsEraser] = useState(false);

    useEffect(() => {
        if (activeTab === 'whiteboard' && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Initial canvas setup if needed
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
        }
    }, [activeTab]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isCoach) return; // Only coaches can draw
        
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !isCoach) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Prevent mobile page scrolling while drawing
        if (e.cancelable) {
            e.preventDefault();
        }

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);

        ctx.lineTo(x, y);
        ctx.strokeStyle = isEraser ? '#ffffff' : color;
        ctx.lineWidth = isEraser ? 20 : lineWidth;
        
        if (isEraser) {
             ctx.globalCompositeOperation = 'destination-out';
        } else {
             ctx.globalCompositeOperation = 'source-over';
        }
        
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isCoach) return;
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const ext = file.name.split('.').pop();
            const fileName = `drill-video-${drill.id}-${Date.now()}.${ext}`;
            const { error: uploadErr } = await supabase.storage.from('uploads').upload(fileName, file);
            if (uploadErr) throw new Error(uploadErr.message);
            const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
            const url = data.publicUrl;
            await supabase.from('coach_drills').update({ video_url: url }).eq('id', drill.id);
            setVideoUrl(url);
        } catch (err: any) {
            console.error('Video upload failed:', err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/95 backdrop-blur-2xl animate-fadeIn font-montserrat">
            {/* Ambient Glows */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-east-light/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-east-light/3 blur-[100px] rounded-full" />
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-[3rem] w-full max-w-5xl overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative flex flex-col h-[90vh] max-h-[900px] z-10">
                
                {/* Header */}
                <div className="flex justify-between items-center p-10 border-b border-white/5 bg-gradient-to-r from-black via-black/80 to-transparent relative z-20">
                    <div>
                        <div className="flex gap-3 mb-3">
                            <div className="px-3 py-1 bg-east-light/10 text-east-light rounded-full text-[9px] font-black uppercase tracking-widest border border-east-light/20">
                                {drill.category}
                            </div>
                            <div className="px-3 py-1 bg-white/5 text-gray-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                                {drill.difficulty}
                            </div>
                        </div>
                        <h2 className="text-white font-black italic text-4xl uppercase tracking-tighter leading-none drop-shadow-2xl brightness-125">{drill.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-5 bg-white/5 rounded-2xl hover:bg-white/10 transition-all duration-300 border border-white/5 hover:border-east-light/50 group shadow-xl active:scale-90">
                        <X size={24} className="text-gray-400 group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex flex-1 overflow-hidden relative">
                    {/* Left Sidebar (Details - Redesigned with Dark Blue-Grey Glassmorphism) */}
                    <div className="w-1/3 min-w-[320px] border-r border-white/10 bg-[#0B132B]/80 p-8 flex flex-col gap-6 overflow-y-auto no-scrollbar relative z-10 backdrop-blur-md">
                        <div className="space-y-6">
                            <ActivityDescription text={drill.description} />
                            
                            <AccessoriesList accessories={drill.accessories} />
                            
                            <ActivityGoals drill={drill} />
                            
                            <SetupGrid drill={drill} />
                        </div>

                        {/* Action Tabs */}
                        <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-white/10">
                            <button 
                                onClick={() => setActiveTab('video')}
                                className={`group py-4 px-5 rounded-2xl font-black italic text-[10px] uppercase tracking-[0.2em] transition-all duration-500 relative overflow-hidden flex items-center justify-between ${activeTab === 'video' ? 'bg-white text-black shadow-[0_20px_40px_rgba(255,255,255,0.15)]' : 'bg-white/5 text-gray-500 border border-white/5 hover:border-white/20 hover:text-white'}`}
                            >
                                <span className="relative z-10">Video Feed</span>
                                <Video size={16} className={activeTab === 'video' ? 'text-black' : 'text-gray-600'} />
                                {activeTab === 'video' && <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-200" />}
                            </button>
                            <button 
                                onClick={() => setActiveTab('whiteboard')}
                                className={`group py-4 px-5 rounded-2xl font-black italic text-[10px] uppercase tracking-[0.2em] transition-all duration-500 relative overflow-hidden flex items-center justify-between ${activeTab === 'whiteboard' ? 'bg-east-light text-black shadow-[0_20px_40px_rgba(40,209,96,0.3)]' : 'bg-white/5 text-gray-500 border border-white/5 hover:border-white/20 hover:text-white'}`}
                            >
                                <span className="relative z-10">Tactical Board</span>
                                <PenTool size={16} className={activeTab === 'whiteboard' ? 'text-black' : 'text-gray-600'} />
                                {activeTab === 'whiteboard' && <div className="absolute inset-0 bg-gradient-to-r from-east-light to-[#20a34b]" />}
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                        
                        {activeTab === 'video' && (
                            <div className="w-full h-full relative group">
                                {videoUrl ? (
                                    <>
                                        <video 
                                            ref={videoRef}
                                            src={videoUrl} 
                                            className="w-full h-full object-contain"
                                            controls={false}
                                            onClick={togglePlay}
                                        />
                                        {!isPlaying && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none backdrop-blur-[2px]">
                                                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center pl-2 shadow-[0_30px_60px_rgba(255,255,255,0.2)] animate-pulse">
                                                    <Play fill="black" size={40} className="text-black" />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full relative">
                                        {coverImage && <img src={coverImage} className="w-full h-full object-cover opacity-30" alt="Thumbnail" />}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-6">
                                            <Video size={48} className="text-gray-600" />
                                            <span className="text-gray-500 font-black italic uppercase tracking-widest text-sm">No Video Uploaded</span>
                                            {isCoach && (
                                                <>
                                                    <button
                                                        onClick={() => videoInputRef.current?.click()}
                                                        disabled={uploading}
                                                        className="flex items-center gap-2 px-6 py-3 bg-east-light text-black font-black italic uppercase tracking-widest text-xs rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(40,209,96,0.3)] disabled:opacity-50 active:scale-95"
                                                    >
                                                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                                        {uploading ? 'Uploading...' : 'Upload Analysis Video'}
                                                    </button>
                                                    <input
                                                        ref={videoInputRef}
                                                        type="file"
                                                        accept="video/*"
                                                        className="hidden"
                                                        onChange={handleVideoUpload}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'whiteboard' && (
                            <div className="w-full h-full relative flex flex-col">
                                {/* Whiteboard Toolbar */}
                                {isCoach && (
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-black/80 backdrop-blur-md border border-white/10 rounded-full px-6 py-2 flex items-center gap-4 shadow-xl">
                                        <div className="flex gap-2 border-r border-white/10 pr-4">
                                            {['#28D160', '#ff3b30', '#007aff', '#ffffff'].map(c => (
                                                <button 
                                                    key={c} 
                                                    onClick={() => {setColor(c); setIsEraser(false);}}
                                                    className={`w-6 h-6 rounded-full border-2 ${color === c && !isEraser ? 'border-white scale-110' : 'border-transparent'}`}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                        <button 
                                            onClick={() => setIsEraser(!isEraser)}
                                            className={`p-2 rounded-full transition-colors ${isEraser ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            <Eraser size={18} />
                                        </button>
                                        <button onClick={clearCanvas} className="p-2 text-red-400 hover:bg-red-500/10 rounded-full transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                                
                                {/* Rink Background image pattern */}
                                <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                                    {/* Placeholder Rink SVG */}
                                    <svg viewBox="0 0 800 400" className="w-full h-full max-w-[90%] opacity-30">
                                        <rect x="50" y="20" width="700" height="360" rx="100" fill="none" stroke="white" strokeWidth="4"/>
                                        <line x1="400" y1="20" x2="400" y2="380" stroke="#ff3b30" strokeWidth="4"/>
                                        <line x1="250" y1="20" x2="250" y2="380" stroke="#007aff" strokeWidth="4"/>
                                        <line x1="550" y1="20" x2="550" y2="380" stroke="#007aff" strokeWidth="4"/>
                                        <circle cx="400" cy="200" r="60" fill="none" stroke="#007aff" strokeWidth="4"/>
                                        <circle cx="400" cy="200" r="4" fill="#007aff"/>
                                    </svg>
                                </div>

                                <canvas 
                                    ref={canvasRef}
                                    width={800}
                                    height={600}
                                    className={`w-full h-full relative z-20 ${isCoach ? 'cursor-crosshair' : 'cursor-default'}`}
                                     style={{ touchAction: 'none' }}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseOut={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                />
                                
                                {!isCoach && (
                                    <div className="absolute bottom-4 right-4 z-30 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
                                        <span className="text-[10px] font-black italic text-gray-400 uppercase tracking-widest">Read Only Mode</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
