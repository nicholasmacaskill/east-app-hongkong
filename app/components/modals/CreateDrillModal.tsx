import React, { useState, useRef } from 'react';
import { X, Upload, Video, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '@/app/components/ui/Toast';
import { compressImage } from '@/app/lib/image-utils';

interface CreateDrillModalProps {
    coachId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateDrillModal({ coachId, onClose, onSuccess }: CreateDrillModalProps) {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState('PRO');
    const [duration, setDuration] = useState('10 MIN');
    const [category, setCategory] = useState('SHOOTING');
    
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !category) {
            addToast('Title and Category are required', 'error');
            return;
        }

        setLoading(true);
        try {
            let imageUrl = 'https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=800';
            let videoUrl = '';

            // Upload Image
            if (imageFile) {
                const compressed = await compressImage(imageFile);
                const fileExt = compressed.name.split('.').pop();
                const fileName = `drill-thumb-${coachId}-${Date.now()}.${fileExt}`;
                const { error: imgErr } = await supabase.storage.from('uploads').upload(fileName, compressed);
                if (imgErr) throw new Error(`Image upload failed: ${imgErr.message}`);
                
                const { data: imgData } = supabase.storage.from('uploads').getPublicUrl(fileName);
                imageUrl = imgData.publicUrl;
            }

            // Upload Video
            if (videoFile) {
                const fileExt = videoFile.name.split('.').pop();
                const fileName = `drill-video-${coachId}-${Date.now()}.${fileExt}`;
                const { error: vidErr } = await supabase.storage.from('uploads').upload(fileName, videoFile);
                if (vidErr) throw new Error(`Video upload failed: ${vidErr.message}`);
                
                const { data: vidData } = supabase.storage.from('uploads').getPublicUrl(fileName);
                videoUrl = vidData.publicUrl;
            }

            // Insert into drills
            const { error: insertErr } = await supabase.from('drills').insert({
                coach_id: coachId,
                title,
                description,
                difficulty,
                duration,
                category,
                image_url: imageUrl,
                video_url: videoUrl
            });

            if (insertErr) throw new Error(`Database error: ${insertErr.message}`);

            addToast('Drill created successfully!', 'success');
            onSuccess();
        } catch (error: any) {
            console.error(error);
            addToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-montserrat">
            <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
                
                <div className="flex justify-between items-center p-5 border-b border-white/10 bg-white/5">
                    <h2 className="text-white font-black italic text-lg uppercase tracking-widest drop-shadow-md">Create New Drill</h2>
                    <button onClick={onClose} className="p-2 bg-black/40 rounded-full hover:bg-white/10 transition-colors border border-white/5">
                        <X size={18} className="text-gray-400" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 no-scrollbar flex-1">
                    <form id="drill-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
                        {/* Title */}
                        <div>
                            <label className="block text-[10px] font-black text-east-light uppercase tracking-widest mb-1.5 ml-1">Drill Title</label>
                            <input 
                                type="text" 
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-east-light transition-colors font-bold text-sm" 
                                placeholder="e.g. Power Slapshot Mastery"
                                required 
                            />
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-east-light uppercase tracking-widest mb-1.5 ml-1">Category</label>
                                <select 
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-east-light transition-colors font-bold text-xs uppercase"
                                >
                                    <option>SHOOTING</option>
                                    <option>DEFENSE</option>
                                    <option>PASSING</option>
                                    <option>SKATING</option>
                                    <option>STICKHANDLING</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-east-light uppercase tracking-widest mb-1.5 ml-1">Difficulty</label>
                                <select 
                                    value={difficulty}
                                    onChange={e => setDifficulty(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-east-light transition-colors font-bold text-xs uppercase"
                                >
                                    <option>U10</option>
                                    <option>U12</option>
                                    <option>U15</option>
                                    <option>PRO</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-east-light uppercase tracking-widest mb-1.5 ml-1">Duration</label>
                            <input 
                                type="text" 
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-east-light transition-colors font-bold text-sm" 
                                placeholder="e.g. 15 MIN" 
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-[10px] font-black text-east-light uppercase tracking-widest mb-1.5 ml-1">Description & Key Focus</label>
                            <textarea 
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-east-light transition-colors font-bold text-xs min-h-[80px]" 
                                placeholder="Describe the drill..." 
                            />
                        </div>

                        {/* Uploads */}
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                            <div 
                                onClick={() => imageInputRef.current?.click()}
                                className={`border border-dashed ${imageFile ? 'border-east-light bg-east-light/10' : 'border-white/20 bg-white/5 hover:bg-white/10'} rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center h-28`}
                            >
                                <ImageIcon size={24} className={imageFile ? 'text-east-light' : 'text-gray-500'} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${imageFile ? 'text-east-light' : 'text-gray-400'}`}>
                                    {imageFile ? 'Thumbnail Selected' : 'Upload Thumbnail*'}
                                </span>
                                <input type="file" ref={imageInputRef} onChange={e => setImageFile(e.target.files?.[0] || null)} className="hidden" accept="image/*" />
                            </div>
                            
                            <div 
                                onClick={() => videoInputRef.current?.click()}
                                className={`border border-dashed ${videoFile ? 'border-east-light bg-east-light/10' : 'border-white/20 bg-white/5 hover:bg-white/10'} rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center h-28`}
                            >
                                <Video size={24} className={videoFile ? 'text-east-light' : 'text-gray-500'} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${videoFile ? 'text-east-light' : 'text-gray-400'}`}>
                                    {videoFile ? 'Video Selected' : 'Upload Video (Opt)'}
                                </span>
                                <input type="file" ref={videoInputRef} onChange={e => setVideoFile(e.target.files?.[0] || null)} className="hidden" accept="video/*" />
                            </div>
                        </div>

                    </form>
                </div>
                
                <div className="p-5 border-t border-white/10 bg-black/40">
                    <button 
                        type="submit" 
                        form="drill-form"
                        disabled={loading}
                        className="w-full bg-east-light text-black font-black italic uppercase tracking-widest py-4 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(40,209,96,0.3)]"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                        {loading ? 'UPLOADING...' : 'SAVE DRILL'}
                    </button>
                </div>
            </div>
        </div>
    );
}
