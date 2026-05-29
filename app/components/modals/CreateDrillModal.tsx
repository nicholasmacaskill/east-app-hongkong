'use client';
import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Loader2, Plus, Trash2, ChevronLeft, ChevronRight, GripVertical, Video, PenTool, Eraser, Save, Layers } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '@/app/components/ui/Toast';
import { useTracking } from '@/app/hooks/useTracking';

interface DrillStep {
    title: string;
    description: string;
    image_url?: string;
    video_url?: string;
    tactical_data?: string;
    media_type: 'image' | 'video' | 'tactical';
}

interface CreateDrillModalProps {
    coachId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const WORKOUT_TAGS = [
    'lower body',
    'upper body',
    'speed',
    'auxiliary',
    'conditioning',
    'mobility',
    'strength',
    'power, speed & conditioning'
];

const HOCKEY_TAGS = [
    'individual skills',
    'stickhandling',
    'shooting',
    'skating',
    'team',
    'small group',
    'breakout',
    'pp',
    'pk',
    'team offense',
    'individual offense',
    'team defense',
    'individual defense',
    'fun',
    'challenges',
    'battles',
    'contact'
];

const AGE_TAGS = [
    'Beginner',
    'U9',
    'U11',
    'U13',
    'U15',
    'U18'
];

export default function CreateDrillModal({ coachId, onClose, onSuccess }: CreateDrillModalProps) {
    const { addToast } = useToast();
    const { track } = useTracking();
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState<'details' | 'steps'>('details');

    // Drill metadata
    const [title, setTitle] = useState('');
    const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);
    const [selectedHockey, setSelectedHockey] = useState<string[]>([]);
    const [selectedAges, setSelectedAges] = useState<string[]>([]);
    
    // Details matching mockup
    const [description, setDescription] = useState('');
    const [accessoriesText, setAccessoriesText] = useState('');
    const [pods, setPods] = useState('');
    const [colors, setColors] = useState('');
    const [duration, setDuration] = useState('');
    const [lightsOut, setLightsOut] = useState('');
    const [lightDelay, setLightDelay] = useState('');

    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    // Steps
    const [steps, setSteps] = useState<DrillStep[]>([{ title: '', description: '', media_type: 'image' }]);
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [stepImageFiles, setStepImageFiles] = useState<Record<number, File>>({});
    const [stepVideoFiles, setStepVideoFiles] = useState<Record<number, File>>({});
    
    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawColor, setDrawColor] = useState('#28D160');
    const [isEraser, setIsEraser] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const thumbnailInputRef = useRef<HTMLInputElement>(null);
    const stepImageRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const stepVideoRefs = useRef<Record<number, HTMLInputElement | null>>({});

    const toggleAge = (age: string) => {
        setSelectedAges(prev => prev.includes(age) ? prev.filter(a => a !== age) : [...prev, age]);
    };

    const toggleWorkout = (tag: string) => {
        setSelectedWorkouts(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const toggleHockey = (tag: string) => {
        setSelectedHockey(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setThumbnailFile(file);
        setThumbnailPreview(URL.createObjectURL(file));
    };

    const handleStepImageSelect = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setStepImageFiles(prev => ({ ...prev, [idx]: file }));
        const url = URL.createObjectURL(file);
        setSteps(prev => prev.map((s, i) => i === idx ? { ...s, image_url: url } : s));
    };

    const handleStepVideoSelect = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setStepVideoFiles(prev => ({ ...prev, [idx]: file }));
        const url = URL.createObjectURL(file);
        setSteps(prev => prev.map((s, i) => i === idx ? { ...s, video_url: url } : s));
    };

    const addStep = () => {
        setSteps(prev => [...prev, { title: '', description: '', media_type: 'image' }]);
        setActiveStepIndex(steps.length);
    };

    const removeStep = (idx: number) => {
        if (steps.length === 1) return;
        setSteps(prev => prev.filter((_, i) => i !== idx));
        setStepImageFiles(prev => {
            const next = { ...prev };
            delete next[idx];
            return next;
        });
        setActiveStepIndex(Math.max(0, idx - 1));
    };

    const updateStep = (idx: number, field: keyof DrillStep, value: any) => {
        setSteps(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
    };

    // --- Drawing Logic ---
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        // Scale display coordinates to canvas coordinates
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        
        // Prevent mobile page scrolling while drawing
        if (e.cancelable) {
            e.preventDefault();
        }
        
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        // Scale display coordinates to canvas coordinates
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        
        ctx.lineTo(x, y);
        ctx.strokeStyle = isEraser ? '#111' : drawColor;
        ctx.lineWidth = isEraser ? 30 : 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        // Save to step state immediately
        const canvas = canvasRef.current;
        if (canvas) {
            const dataUrl = canvas.toDataURL();
            updateStep(activeStepIndex, 'tactical_data', dataUrl);
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            updateStep(activeStepIndex, 'tactical_data', undefined);
        }
    };

    const canProceedToSteps = title.trim().length > 0;

    const handleSubmit = async () => {
        if (!title.trim()) { addToast('Drill title is required', 'error'); return; }
        const hasValidStep = steps.some(s => s.title.trim() && s.description.trim());
        if (!hasValidStep) { addToast('At least one complete step is required', 'error'); return; }

        setLoading(true);
        try {
            // 1. Upload thumbnail
            let thumbnailUrl = 'https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=800';
            if (thumbnailFile) {
                const ext = thumbnailFile.name.split('.').pop();
                const fileName = `drill-thumb-${coachId}-${Date.now()}.${ext}`;
                const { error: imgErr } = await supabase.storage.from('uploads').upload(fileName, thumbnailFile);
                if (imgErr) throw new Error(`Thumbnail upload failed: ${imgErr.message}`);
                const { data: imgData } = supabase.storage.from('uploads').getPublicUrl(fileName);
                thumbnailUrl = imgData.publicUrl;
            }

            // 2. Insert into coach_drills
            const { data: drillData, error: drillErr } = await supabase
                .from('coach_drills')
                .insert({
                    coach_id: coachId,
                    title: title.trim(),
                    skill_tags: selectedHockey,
                    level_tags: [],
                    group_tags: selectedWorkouts,
                    age_tags: selectedAges,
                    status: 'published',
                    thumbnail_url: thumbnailUrl,
                    description: description.trim(),
                    accessories: accessoriesText.split(',').map(s => s.trim()).filter(Boolean),
                    pods: pods.trim(),
                    colors: colors.trim(),
                    duration: duration.trim(),
                })
                .select()
                .single();

            if (drillErr) throw new Error(`Failed to create drill: ${drillErr.message}`);

            // 3. Upload step media and insert steps
            const validSteps = steps.filter(s => s.title.trim() || s.description.trim());
            for (let i = 0; i < validSteps.length; i++) {
                const originalIdx = steps.indexOf(validSteps[i]);
                let stepImageUrl: string | undefined = validSteps[i].image_url;
                let stepVideoUrl: string | undefined = validSteps[i].video_url;

                // Handle Image Upload
                const imageFile = stepImageFiles[originalIdx];
                if (imageFile) {
                    const ext = imageFile.name.split('.').pop();
                    const fileName = `drill-step-img-${drillData.id}-${i}-${Date.now()}.${ext}`;
                    const { error: sImgErr } = await supabase.storage.from('uploads').upload(fileName, imageFile);
                    if (!sImgErr) {
                        const { data: sImgData } = supabase.storage.from('uploads').getPublicUrl(fileName);
                        stepImageUrl = sImgData.publicUrl;
                    }
                }

                // Handle Video Upload
                const videoFile = stepVideoFiles[originalIdx];
                if (videoFile) {
                    const ext = videoFile.name.split('.').pop();
                    const fileName = `drill-step-vid-${drillData.id}-${i}-${Date.now()}.${ext}`;
                    const { error: sVidErr } = await supabase.storage.from('uploads').upload(fileName, videoFile);
                    if (!sVidErr) {
                        const { data: sVidData } = supabase.storage.from('uploads').getPublicUrl(fileName);
                        stepVideoUrl = sVidData.publicUrl;
                    }
                }

                await supabase.from('coach_drill_steps').insert({
                    drill_id: drillData.id,
                    step_number: i + 1,
                    title: validSteps[i].title.trim() || `Step ${i + 1}`,
                    instruction: validSteps[i].description.trim(),
                    diagram_url: stepImageUrl,
                    video_url: stepVideoUrl,
                    tactical_data: validSteps[i].tactical_data
                });
            }

            track('drill_created', { drill_name: drillData.title, skill_tags: drillData.skill_tags, steps_count: validSteps.length });
            addToast('Drill published successfully!', 'success');
            onSuccess();
        } catch (err: any) {
            console.error(err);
            addToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const activeStep = steps[activeStepIndex];

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn font-montserrat">
            <div className="bg-[#111] border border-white/10 rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] md:max-h-[88vh]">

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-5 border-b border-white/10 shrink-0">
                    <div>
                        <p className="text-[9px] font-black text-east-light uppercase tracking-[0.3em] italic">Evolution System</p>
                        <h2 className="text-white font-black italic text-xl uppercase tracking-tight leading-none mt-0.5">
                            {currentPage === 'details' ? 'New Drill' : 'Build Slides'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Step indicator */}
                        <div className="flex gap-1.5">
                            <div className={`h-1.5 w-6 rounded-full transition-all ${currentPage === 'details' ? 'bg-east-light' : 'bg-white/20'}`} />
                            <div className={`h-1.5 w-6 rounded-full transition-all ${currentPage === 'steps' ? 'bg-east-light' : 'bg-white/20'}`} />
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors">
                            <X size={16} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* PAGE 1: DRILL DETAILS */}
                {currentPage === 'details' && (
                    <div className="overflow-y-auto flex-1 p-6 space-y-6 no-scrollbar">

                        {/* Thumbnail Upload */}
                        <div
                            onClick={() => thumbnailInputRef.current?.click()}
                            className="relative h-40 rounded-2xl overflow-hidden border-2 border-dashed border-white/15 hover:border-east-light/50 cursor-pointer group transition-all bg-black/30"
                        >
                            {thumbnailPreview ? (
                                <>
                                    <img src={thumbnailPreview} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt="thumbnail" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-[9px] font-black text-white uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-full">Change Thumbnail</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full gap-2">
                                    <ImageIcon size={28} className="text-gray-700 group-hover:text-east-light transition-colors" />
                                    <span className="text-[10px] font-black uppercase text-gray-600 group-hover:text-gray-400 tracking-widest">Upload Cover Thumbnail</span>
                                </div>
                            )}
                            <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailSelect} />
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-[9px] font-black text-east-light uppercase tracking-[0.3em] mb-2">Drill Title *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-east-light transition-colors font-bold text-sm placeholder:text-gray-700"
                                placeholder="e.g. Power Slapshot Mastery"
                            />
                        </div>

                        {/* ── TAG SECTION ── */}
                        <div className="border-t border-white/5 pt-5 space-y-5">

                            {/* Workouts Tags */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <label className="text-[9px] font-black text-east-light uppercase tracking-[0.3em]">Workouts</label>
                                    {selectedWorkouts.length > 0 && (
                                        <span className="text-[8px] font-black bg-east-light/15 text-east-light px-2 py-0.5 rounded-full">{selectedWorkouts.length} selected</span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {WORKOUT_TAGS.map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleWorkout(tag)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all active:scale-95 ${selectedWorkouts.includes(tag) ? 'bg-east-light text-black border-east-light shadow-[0_0_15px_rgba(40,209,96,0.3)]' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/30 hover:text-white'}`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Hockey Tags */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <label className="text-[9px] font-black text-east-light uppercase tracking-[0.3em]">Hockey</label>
                                    {selectedHockey.length > 0 && (
                                        <span className="text-[8px] font-black bg-east-light/15 text-east-light px-2 py-0.5 rounded-full">{selectedHockey.length} selected</span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {HOCKEY_TAGS.map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleHockey(tag)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all active:scale-95 ${selectedHockey.includes(tag) ? 'bg-east-light text-black border-east-light shadow-[0_0_15px_rgba(40,209,96,0.3)]' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/30 hover:text-white'}`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Ages Tags */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <label className="text-[9px] font-black text-east-light uppercase tracking-[0.3em]">Ages</label>
                                    {selectedAges.length > 0 && (
                                        <span className="text-[8px] font-black bg-east-light/15 text-east-light px-2 py-0.5 rounded-full">{selectedAges.length} selected</span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {AGE_TAGS.map(age => (
                                        <button
                                            key={age}
                                            type="button"
                                            onClick={() => toggleAge(age)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all active:scale-95 ${selectedAges.includes(age) ? 'bg-east-light text-black border-east-light shadow-[0_0_15px_rgba(40,209,96,0.3)]' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/30 hover:text-white'}`}
                                        >
                                            {age}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── ACTIVITY DETAILS ── */}
                        <div className="border-t border-white/5 pt-5 space-y-5">

                            {/* Description */}
                            <div>
                                <label className="block text-[9px] font-black text-east-light uppercase tracking-[0.3em] mb-2">Activity Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-east-light transition-colors font-bold text-sm placeholder:text-gray-700 resize-none"
                                    rows={3}
                                    placeholder="Describe the drill setup and flow..."
                                />
                            </div>

                            {/* Accessories */}
                            <div>
                                <label className="block text-[9px] font-black text-east-light uppercase tracking-[0.3em] mb-2">Accessories</label>
                                <input
                                    type="text"
                                    value={accessoriesText}
                                    onChange={e => setAccessoriesText(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-east-light transition-colors font-bold text-sm placeholder:text-gray-700"
                                    placeholder="Comma separated — e.g. Goal, Soccer Balls, Cones"
                                />
                            </div>

                            {/* Setup Grid */}
                            <div>
                                <label className="block text-[9px] font-black text-east-light uppercase tracking-[0.3em] mb-3">Setup Metrics</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <span className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Pods</span>
                                        <input type="text" value={pods} onChange={e => setPods(e.target.value)} className="w-full bg-black/50 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-east-light transition-colors font-bold text-xs" placeholder="e.g. 4 per Station" />
                                    </div>
                                    <div>
                                        <span className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Colors</span>
                                        <input type="text" value={colors} onChange={e => setColors(e.target.value)} className="w-full bg-black/50 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-east-light transition-colors font-bold text-xs" placeholder="e.g. 1 per Player" />
                                    </div>
                                    <div>
                                        <span className="block text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Duration</span>
                                        <input type="text" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-black/50 border border-white/10 p-2.5 rounded-xl text-white outline-none focus:border-east-light transition-colors font-bold text-xs" placeholder="e.g. 60 min" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PAGE 2: STEP BUILDER */}
                {currentPage === 'steps' && (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        {/* Step tabs */}
                        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 overflow-x-auto no-scrollbar shrink-0">
                            {steps.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveStepIndex(i)}
                                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${activeStepIndex === i ? 'bg-east-light text-black border-east-light' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'}`}
                                >
                                    {s.title.trim() ? s.title.substring(0, 8) : `Step ${i + 1}`}
                                </button>
                            ))}
                            <button
                                onClick={addStep}
                                className="shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-dashed border-white/20 text-gray-600 hover:border-east-light hover:text-east-light transition-all flex items-center gap-1"
                            >
                                <Plus size={10} /> Add
                            </button>
                        </div>

                        {/* Active step editor */}
                        <div className="overflow-y-auto flex-1 p-6 space-y-4 no-scrollbar">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-4xl font-black italic text-east-light/30 leading-none">{activeStepIndex + 1}</span>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Active Slide</p>
                                        <p className="text-[10px] font-black text-white uppercase">{steps.length} TOTAL</p>
                                    </div>
                                </div>
                                {steps.length > 1 && (
                                    <button
                                        onClick={() => removeStep(activeStepIndex)}
                                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Step title */}
                            <div>
                                <label className="block text-[9px] font-black text-east-light uppercase tracking-[0.3em] mb-2">Slide Title</label>
                                <input
                                    type="text"
                                    value={activeStep.title}
                                    onChange={e => updateStep(activeStepIndex, 'title', e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-east-light transition-colors font-bold text-sm placeholder:text-gray-700"
                                    placeholder="e.g. The Windup"
                                />
                            </div>

                            {/* Step description / instruction */}
                            <div>
                                <label className="block text-[9px] font-black text-east-light uppercase tracking-[0.3em] mb-2">Coaching Instruction *</label>
                                <textarea
                                    value={activeStep.description}
                                    onChange={e => updateStep(activeStepIndex, 'description', e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-east-light transition-colors font-bold text-sm min-h-[100px] placeholder:text-gray-700"
                                    placeholder="Describe exactly what the athlete should do at this point in the drill..."
                                />
                            </div>

                            {/* Step media selector */}
                            <div className="space-y-4">
                                <label className="block text-[9px] font-black text-east-light uppercase tracking-[0.3em] mb-2">Visual Content</label>
                                
                                <div className="flex flex-col gap-3">
                                    {[
                                        { id: 'image', label: 'Drill Briefing', icon: ImageIcon },
                                        { id: 'video', label: 'Analysis Stream', icon: Video },
                                        { id: 'tactical', label: 'Tactical Board', icon: PenTool }
                                    ].map(tab => {
                                        const isActive = activeStep.media_type === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => updateStep(activeStepIndex, 'media_type', tab.id as any)}
                                                className={`w-full flex items-center justify-between px-6 py-4 rounded-xl border transition-all ${
                                                    isActive 
                                                        ? 'bg-[#28D160] border-white text-black shadow-[0_0_20px_rgba(40,209,96,0.4)]' 
                                                        : 'bg-[#1C2541]/40 border-white/10 text-gray-500 hover:border-white/20 hover:text-white'
                                                }`}
                                            >
                                                <span className={`text-[10px] font-black uppercase tracking-widest italic ${isActive ? 'text-black' : 'text-gray-400'}`}>
                                                    {tab.label}
                                                </span>
                                                <tab.icon size={16} className={isActive ? 'text-black' : 'text-gray-600'} />
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="relative h-44 rounded-2xl overflow-hidden border-2 border-dashed border-white/10 bg-black/30">
                                    {activeStep.media_type === 'image' && (
                                        <div onClick={() => stepImageRefs.current[activeStepIndex]?.click()} className="w-full h-full cursor-pointer flex flex-col items-center justify-center group">
                                            {activeStep.image_url ? (
                                                <img src={activeStep.image_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-80" alt="step" />
                                            ) : (
                                                <>
                                                    <ImageIcon size={28} className="text-gray-700 group-hover:text-east-light" />
                                                    <span className="text-[10px] font-black uppercase text-gray-700 tracking-widest mt-2">Upload Photo</span>
                                                </>
                                            )}
                                            <input ref={el => { stepImageRefs.current[activeStepIndex] = el; }} type="file" accept="image/*" className="hidden" onChange={e => handleStepImageSelect(activeStepIndex, e)} />
                                        </div>
                                    )}

                                    {activeStep.media_type === 'video' && (
                                        <div onClick={() => stepVideoRefs.current[activeStepIndex]?.click()} className="w-full h-full cursor-pointer flex flex-col items-center justify-center group">
                                            {activeStep.video_url ? (
                                                <video src={activeStep.video_url} className="w-full h-full object-cover opacity-60" />
                                            ) : (
                                                <>
                                                    <Video size={28} className="text-gray-700 group-hover:text-east-light" />
                                                    <span className="text-[10px] font-black uppercase text-gray-700 tracking-widest mt-2">Upload Video</span>
                                                </>
                                            )}
                                            <input ref={el => { stepVideoRefs.current[activeStepIndex] = el; }} type="file" accept="video/*" className="hidden" onChange={e => handleStepVideoSelect(activeStepIndex, e)} />
                                        </div>
                                    )}

                                    {activeStep.media_type === 'tactical' && (
                                        <div className="w-full h-full relative">
                                            {/* Drawing tools overlay */}
                                            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-3 border border-white/10 scale-75 origin-top">
                                                {['#28D160', '#ff3b30', '#007aff', '#ffffff'].map(c => (
                                                    <button key={c} onClick={() => {setDrawColor(c); setIsEraser(false);}} className={`w-4 h-4 rounded-full border ${drawColor === c && !isEraser ? 'border-white scale-110' : 'border-transparent opacity-50'}`} style={{ backgroundColor: c }} />
                                                ))}
                                                <button onClick={() => setIsEraser(!isEraser)} className={`p-1.5 rounded-full transition-colors ${isEraser ? 'bg-white/20 text-white' : 'text-gray-500'}`}><Eraser size={14} /></button>
                                                <button onClick={clearCanvas} className="p-1.5 text-red-500/50"><Trash2 size={14} /></button>
                                            </div>

                                            {/* Rink Background */}
                                            <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
                                                <svg viewBox="0 0 800 400" className="w-[80%] h-auto">
                                                    <rect x="50" y="20" width="700" height="360" rx="100" fill="none" stroke="white" strokeWidth="4"/>
                                                    <line x1="400" y1="20" x2="400" y2="380" stroke="#ff3b30" strokeWidth="4"/>
                                                    <line x1="250" y1="20" x2="250" y2="380" stroke="#007aff" strokeWidth="4"/>
                                                    <line x1="550" y1="20" x2="550" y2="380" stroke="#007aff" strokeWidth="4"/>
                                                    <circle cx="400" cy="200" r="60" fill="none" stroke="#007aff" strokeWidth="4"/>
                                                </svg>
                                            </div>

                                            <canvas 
                                                ref={canvasRef}
                                                width={800}
                                                height={450}
                                                className="w-full h-full relative z-20 cursor-crosshair"
                                                style={{ touchAction: 'none' }}
                                                onMouseDown={startDrawing}
                                                onMouseMove={draw}
                                                onMouseUp={stopDrawing}
                                                onMouseOut={stopDrawing}
                                                onTouchStart={startDrawing}
                                                onTouchMove={draw}
                                                onTouchEnd={stopDrawing}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Nav between steps */}
                            <div className="flex justify-between items-center pt-2">
                                <button
                                    onClick={() => setActiveStepIndex(Math.max(0, activeStepIndex - 1))}
                                    disabled={activeStepIndex === 0}
                                    className="flex items-center gap-1.5 text-[9px] font-black uppercase text-gray-500 hover:text-white disabled:opacity-20 transition-all"
                                >
                                    <ChevronLeft size={14} /> Prev
                                </button>
                                <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">{activeStepIndex + 1} / {steps.length}</span>
                                {activeStepIndex < steps.length - 1 ? (
                                    <button
                                        onClick={() => setActiveStepIndex(activeStepIndex + 1)}
                                        className="flex items-center gap-1.5 text-[9px] font-black uppercase text-gray-500 hover:text-white transition-all"
                                    >
                                        Next <ChevronRight size={14} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={addStep}
                                        className="flex items-center gap-1.5 text-[9px] font-black uppercase text-east-light hover:text-white transition-all"
                                    >
                                        <Plus size={12} /> Add Slide
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer CTA */}
                <div className="p-5 border-t border-white/10 bg-black/40 shrink-0">
                    {currentPage === 'details' ? (
                        <button
                            onClick={() => { if (canProceedToSteps) setCurrentPage('steps'); }}
                            disabled={!canProceedToSteps}
                            className="w-full bg-east-light text-black font-black italic uppercase tracking-widest py-4 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-30 shadow-[0_0_20px_rgba(40,209,96,0.25)] active:scale-[0.98]"
                        >
                            Build Slides <ChevronRight size={18} />
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCurrentPage('details')}
                                className="px-5 py-4 rounded-xl border border-white/10 text-[10px] font-black uppercase text-gray-400 hover:border-white/30 hover:text-white transition-all"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 bg-east-light text-black font-black italic uppercase tracking-widest py-4 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(40,209,96,0.25)] active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                                {loading ? 'Publishing...' : 'Publish Drill'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
