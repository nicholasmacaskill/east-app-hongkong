'use client';
import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Loader2, Plus, Trash2, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '@/app/components/ui/Toast';

interface DrillStep {
    title: string;
    description: string;
    image_url?: string;
}

interface CreateDrillModalProps {
    coachId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const SKILL_CATEGORIES = ['SHOOTING', 'DEFENSE', 'PASSING', 'SKATING', 'STICKHANDLING', 'GOALIE'];
const DIFFICULTY_LEVELS = ['U10', 'U12', 'U15', 'PRO'];
const AGE_GROUPS = ['10-12', '12-16', '16-20', '20-24', '24+'];

export default function CreateDrillModal({ coachId, onClose, onSuccess }: CreateDrillModalProps) {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState<'details' | 'steps'>('details');

    // Drill metadata
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('SHOOTING');
    const [difficulty, setDifficulty] = useState('PRO');
    const [selectedAges, setSelectedAges] = useState<string[]>([]);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

    // Steps
    const [steps, setSteps] = useState<DrillStep[]>([{ title: '', description: '' }]);
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [stepImageFiles, setStepImageFiles] = useState<Record<number, File>>({});
    
    const thumbnailInputRef = useRef<HTMLInputElement>(null);
    const stepImageRefs = useRef<Record<number, HTMLInputElement | null>>({});

    const toggleAge = (age: string) => {
        setSelectedAges(prev => prev.includes(age) ? prev.filter(a => a !== age) : [...prev, age]);
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
        // Update step with local preview
        const url = URL.createObjectURL(file);
        setSteps(prev => prev.map((s, i) => i === idx ? { ...s, image_url: url } : s));
    };

    const addStep = () => {
        setSteps(prev => [...prev, { title: '', description: '' }]);
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

    const updateStep = (idx: number, field: keyof DrillStep, value: string) => {
        setSteps(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
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
                    skill_tags: [category],
                    level_tags: [difficulty],
                    age_tags: selectedAges,
                    status: 'published',
                    thumbnail_url: thumbnailUrl,
                })
                .select()
                .single();

            if (drillErr) throw new Error(`Failed to create drill: ${drillErr.message}`);

            // 3. Upload step images and insert steps
            const validSteps = steps.filter(s => s.title.trim() || s.description.trim());
            for (let i = 0; i < validSteps.length; i++) {
                let stepImageUrl: string | undefined;
                const stepFile = stepImageFiles[steps.indexOf(validSteps[i])];
                if (stepFile) {
                    const ext = stepFile.name.split('.').pop();
                    const fileName = `drill-step-${drillData.id}-${i}-${Date.now()}.${ext}`;
                    const { error: sImgErr } = await supabase.storage.from('uploads').upload(fileName, stepFile);
                    if (!sImgErr) {
                        const { data: sImgData } = supabase.storage.from('uploads').getPublicUrl(fileName);
                        stepImageUrl = sImgData.publicUrl;
                    }
                }

                await supabase.from('coach_drill_steps').insert({
                    drill_id: drillData.id,
                    step_order: i + 1,
                    title: validSteps[i].title.trim() || `Step ${i + 1}`,
                    description: validSteps[i].description.trim(),
                    image_url: stepImageUrl,
                });
            }

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
                    <div className="overflow-y-auto flex-1 p-6 space-y-5 no-scrollbar">

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

                        {/* Category + Difficulty */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[9px] font-black text-east-light uppercase tracking-[0.3em] mb-2">Skill</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-east-light transition-colors font-bold text-xs uppercase"
                                >
                                    {SKILL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-east-light uppercase tracking-[0.3em] mb-2">Level</label>
                                <select
                                    value={difficulty}
                                    onChange={e => setDifficulty(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-east-light transition-colors font-bold text-xs uppercase"
                                >
                                    {DIFFICULTY_LEVELS.map(d => <option key={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Age Groups */}
                        <div>
                            <label className="block text-[9px] font-black text-east-light uppercase tracking-[0.3em] mb-3">Age Groups</label>
                            <div className="flex flex-wrap gap-2">
                                {AGE_GROUPS.map(age => (
                                    <button
                                        key={age}
                                        type="button"
                                        onClick={() => toggleAge(age)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedAges.includes(age) ? 'bg-east-light text-black border-east-light shadow-[0_0_15px_rgba(40,209,96,0.3)]' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/30'}`}
                                    >
                                        {age}
                                    </button>
                                ))}
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

                            {/* Step diagram/image */}
                            <div>
                                <label className="block text-[9px] font-black text-east-light uppercase tracking-[0.3em] mb-2">Diagram / Image <span className="text-gray-600 normal-case">(optional)</span></label>
                                <div
                                    onClick={() => stepImageRefs.current[activeStepIndex]?.click()}
                                    className="relative h-28 rounded-2xl overflow-hidden border-2 border-dashed border-white/10 hover:border-east-light/40 cursor-pointer group transition-all bg-black/30"
                                >
                                    {activeStep.image_url ? (
                                        <>
                                            <img src={activeStep.image_url} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" alt="diagram" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-[9px] font-black text-white uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-full">Change Image</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full gap-1.5">
                                            <ImageIcon size={22} className="text-gray-700 group-hover:text-east-light transition-colors" />
                                            <span className="text-[10px] font-black uppercase text-gray-700 group-hover:text-gray-500 tracking-widest">Upload Diagram</span>
                                        </div>
                                    )}
                                    <input
                                        ref={el => { stepImageRefs.current[activeStepIndex] = el; }}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => handleStepImageSelect(activeStepIndex, e)}
                                    />
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
