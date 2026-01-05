'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit2, Upload, X, Save } from 'lucide-react';

interface NewsItem {
    id: number;
    title: string;
    description: string;
    image_url: string;
    start_time: string;
}

export default function AdminNewsPage() {
    const router = useRouter();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<NewsItem>>({});
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('category', 'NEWS')
            .order('start_time', { ascending: false });

        if (error) console.error('Error fetching news:', error);
        else setNews(data || []);
        setLoading(false);
    };

    const handleEdit = (item: NewsItem) => {
        setCurrentItem(item);
        setIsEditing(true);
    };

    const handleCreate = () => {
        setCurrentItem({
            title: '',
            description: '',
            image_url: '',
            start_time: new Date().toISOString().slice(0, 16) // Default to now
        });
        setIsEditing(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this story?')) return;

        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', id);

        if (error) alert('Error deleting news: ' + error.message);
        else {
            fetchNews();
        }
    };

    const handleSave = async () => {
        if (!currentItem.title || !currentItem.description) {
            alert('Title and Description are required.');
            return;
        }

        const payload = {
            title: currentItem.title,
            description: currentItem.description,
            image_url: currentItem.image_url,
            start_time: new Date(currentItem.start_time || Date.now()).toISOString(),
            // Fixed fields for News items
            category: 'NEWS',
            instructor: 'Admin', // Default author
            end_time: new Date(Date.now() + 86400000).toISOString(), // Dummy end time (24h later)
            card_color: 'bg-black', // Default style
            credit_cost: 0
        };

        let error;
        if (currentItem.id) {
            // Update
            const res = await supabase
                .from('sessions')
                .update(payload)
                .eq('id', currentItem.id);
            error = res.error;
        } else {
            // Create
            const res = await supabase
                .from('sessions')
                .insert(payload);
            error = res.error;
        }

        if (error) {
            alert('Error saving news: ' + error.message);
        } else {
            setIsEditing(false);
            fetchNews();
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `news/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(filePath, file);

        if (uploadError) {
            alert('Error uploading image: ' + uploadError.message);
            setUploading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(filePath);

        setCurrentItem({ ...currentItem, image_url: publicUrl });
        setUploading(false);
    };

    return (
        <div className="p-8 text-black bg-white min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">News Management</h1>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-gray-800 transition-all"
                >
                    <Plus size={18} />
                    Add Story
                </button>
            </div>

            {loading ? (
                <div>Loading news...</div>
            ) : (
                <div className="grid gap-4">
                    {news.map(item => (
                        <div key={item.id} className="border border-gray-200 p-4 rounded-xl flex items-center gap-6 shadow-sm hover:shadow-md transition-all">
                            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">No Img</div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg uppercase tracking-tight">{item.title}</h3>
                                <p className="text-gray-500 text-sm line-clamp-2">{item.description}</p>
                                <span className="text-xs text-gray-400 mt-2 block">{new Date(item.start_time).toLocaleDateString()}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(item)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                >
                                    <Edit2 size={20} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {news.length === 0 && <p className="text-gray-500 italic">No news stories found.</p>}
                </div>
            )}

            {/* EDITOR MODAL */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-black italic uppercase tracking-tighter">
                                {currentItem.id ? 'Edit Story' : 'New Story'}
                            </h2>
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-black">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Image Section */}
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Cover Image</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative group">
                                        {currentItem.image_url ? (
                                            <img src={currentItem.image_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <Upload size={24} />
                                            </div>
                                        )}
                                        {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">Uploading...</div>}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
                                        />
                                        <p className="text-xs text-gray-400 mt-2">Recommended: 1200x800px or similar landscape.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Headline</label>
                                    <input
                                        type="text"
                                        value={currentItem.title || ''}
                                        onChange={e => setCurrentItem({ ...currentItem, title: e.target.value })}
                                        className="w-full p-3 border border-gray-200 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-black"
                                        placeholder="Enter headline..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Story Text</label>
                                    <textarea
                                        value={currentItem.description || ''}
                                        onChange={e => setCurrentItem({ ...currentItem, description: e.target.value })}
                                        className="w-full p-3 border border-gray-200 rounded-lg h-40 focus:outline-none focus:ring-2 focus:ring-black"
                                        placeholder="Write your story here..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Publish Date</label>
                                    <input
                                        type="datetime-local"
                                        value={currentItem.start_time ? new Date(currentItem.start_time).toISOString().slice(0, 16) : ''}
                                        onChange={e => setCurrentItem({ ...currentItem, start_time: new Date(e.target.value).toISOString() })}
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black hover:bg-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-8 py-3 rounded-full bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg flex items-center gap-2"
                            >
                                <Save size={16} />
                                Save Story
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
