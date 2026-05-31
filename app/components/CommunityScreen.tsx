'use client';
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { supabase } from '@/app/lib/supabase';
import { ChevronDown, ChevronLeft, Trash2, Camera, Image as ImageIcon, Paperclip, Heart, Share2, X, Send, Trophy, Search, Users as UsersRound, Video, ClipboardList } from 'lucide-react';
import { useToast } from './ui/Toast';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Post, Message, Profile } from '@/app/types/community';
import { compressImage } from '@/app/lib/image-utils';
import PrivateMessenger from './PrivateMessenger';

// --- HELPER: Safely Format Post Data ---
// ✅ UPDATED: Accepts currentUserId and now constructs full name from First/Last
const formatPostData = (data: any[], currentUserId: string) => {
    return data.map(post => {
        // Handle nested shared post structure
        let rawShared = post.shared_post;
        if (Array.isArray(rawShared)) {
            rawShared = rawShared.length > 0 ? rawShared[0] : null;
        }

        const hasSharedPost = rawShared && rawShared.id;

        let sharedProfile = null;
        if (hasSharedPost && rawShared.profiles) {
            sharedProfile = Array.isArray(rawShared.profiles) ? rawShared.profiles[0] : rawShared.profiles;
        }

        // Handle author profile
        let authorProfile = post.profiles;
        if (Array.isArray(authorProfile)) authorProfile = authorProfile[0];

        // ✅ FIX: Construct full name from new DB columns (with space)
        const firstName = authorProfile?.first_name || '';
        const lastName = authorProfile?.last_name || '';
        // Fallback to username if names are empty
        const fullName = (firstName + ' ' + lastName).trim() || authorProfile?.username || 'Unknown';

        // Same logic for shared post author
        const sharedFirstName = sharedProfile?.first_name || '';
        const sharedLastName = sharedProfile?.last_name || '';
        const sharedFullName = (sharedFirstName + ' ' + sharedLastName).trim() || sharedProfile?.username || 'Unknown';

        return {
            ...post,
            username: fullName, // ✅ Displays "Nicholas Macaskill"
            avatar_url: authorProfile?.avatar_url,
            profiles: authorProfile,
            likes_count: post.likes ? post.likes.length : 0,
            user_has_liked: post.likes ? post.likes.some((l: any) => l.user_id === currentUserId) : false,

            shared_post: hasSharedPost ? {
                ...rawShared,
                username: sharedFullName,
                avatar_url: sharedProfile?.avatar_url,
                profiles: sharedProfile
            } : null
        };
    });
};

// --- COMPONENT: Shared Post Card ---
const SharedPostCard = ({ post }: { post: Post }) => {
    if (!post || !post.id) return null;
    // @ts-ignore
    const authorName = post.username || post.profiles?.username || 'Unknown';
    // @ts-ignore
    const authorAvatar = post.avatar_url || post.profiles?.avatar_url || "https://placehold.co/100";

    return (
        <div className="mt-3 border border-gray-700 rounded-xl overflow-hidden bg-[#222] hover:bg-[#2a2a2a] transition-colors cursor-pointer select-none">
            <div className="p-3 pb-2 flex items-center gap-2 border-b border-gray-700/50">
                <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-500">
                    <img src={authorAvatar} className="w-full h-full object-cover" alt="avatar" />
                </div>
                <div>
                    <span className="font-montserrat font-black italic text-[10px] text-white uppercase block leading-none">
                        {authorName}
                    </span>
                    <span className="text-[8px] text-gray-500 font-bold uppercase">Original Author</span>
                </div>
            </div>
            <div className="p-3">
                <p className="font-montserrat font-bold italic text-xs text-gray-300 leading-relaxed line-clamp-3 mb-2">
                    {post.caption}
                </p>
            </div>
            {post.image_url && (
                <div className="w-full aspect-video relative">
                    <img src={post.image_url} className="w-full h-full object-cover" alt="shared content" />
                </div>
            )}
        </div>
    );
};

// ✅ UPDATED: Component now accepts currentUserId prop
export default function CommunityScreen({ currentUserId }: { currentUserId: string }) {
    const { addToast } = useToast();
    const searchParams = useSearchParams();
    const chatWithParam = searchParams.get('chatWith');
    const [viewMode, setViewMode] = useState<'feed' | 'messenger-list' | 'chat-detail'>(chatWithParam ? 'chat-detail' : 'messenger-list');

    const [posts, setPosts] = useState<Post[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [users, setUsers] = useState<Profile[]>([]);
    const [activeChatUser, setActiveChatUser] = useState<Profile | null>(null);

    const [inputMsg, setInputMsg] = useState('');
    const [caption, setCaption] = useState('');
    const [postToShare, setPostToShare] = useState<Post | null>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const chatFileRef = useRef<HTMLInputElement>(null);
    const postFileRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const feedTopRef = useRef<HTMLDivElement>(null);

    // --- FETCH SINGLE POST (For Manual Updates) ---
    const fetchSinglePostRobust = async (id: number) => {
        // ✅ UPDATED: Select first_name and last_name
        const { data: mainPost } = await supabase.from('posts')
            .select(`*, profiles(username, first_name, last_name, avatar_url), likes(user_id)`)
            .eq('id', id)
            .single();

        if (!mainPost) return null;

        let sharedPostData = null;
        if (mainPost.shared_post_id) {
            const { data: shared } = await supabase.from('posts')
                .select(`*, profiles(username, first_name, last_name, avatar_url)`)
                .eq('id', mainPost.shared_post_id)
                .single();
            sharedPostData = shared;
        }

        const combined = { ...mainPost, shared_post: sharedPostData };
        return formatPostData([combined], currentUserId)[0];
    };

    // --- FETCH FEED (Initial Load) ---
    useEffect(() => {
        const fetchPosts = async () => {
            // ✅ UPDATED: Select first_name and last_name
            const { data: mainPosts, error } = await supabase.from('posts')
                .select(`*, profiles(username, first_name, last_name, avatar_url), likes(user_id)`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching main posts:", error);
                return;
            }
            if (!mainPosts) return;

            const sharedIds = mainPosts
                .map(p => p.shared_post_id)
                .filter(id => id !== null);

            let sharedPostsMap: Record<number, any> = {};

            if (sharedIds.length > 0) {
                const { data: sharedData } = await supabase.from('posts')
                    .select(`*, profiles(username, first_name, last_name, avatar_url)`)
                    .in('id', sharedIds);

                if (sharedData) {
                    sharedData.forEach(p => {
                        sharedPostsMap[p.id] = p;
                    });
                }
            }

            const combinedPosts = mainPosts.map(post => ({
                ...post,
                shared_post: post.shared_post_id ? sharedPostsMap[post.shared_post_id] : null
            }));

            setPosts(formatPostData(combinedPosts, currentUserId) as Post[]);
        };

        fetchPosts();

        const channel = supabase.channel('feed_updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' },
                async (payload) => {
                    const newPost = await fetchSinglePostRobust(payload.new.id);
                    if (newPost) {
                        setPosts(prev => {
                            if (prev.some(p => p.id === newPost.id)) return prev;
                            return [newPost as Post, ...prev];
                        });
                    }
                }
            )
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' },
                (payload) => {
                    setPosts(prev => prev.filter(p => p.id !== payload.old.id));
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentUserId]);

    // --- FETCH MESSAGES ---
    useEffect(() => {
        if (viewMode !== 'chat-detail' || !activeChatUser) return;

        const fetchMessages = async () => {
            const { data } = await supabase.from('messages')
                .select('*')
                .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${activeChatUser.id}),and(sender_id.eq.${activeChatUser.id},receiver_id.eq.${currentUserId})`)
                .order('created_at', { ascending: true });

            if (data) setMessages(data as Message[]);
        };
        fetchMessages();

        const channel = supabase.channel(`chat:${activeChatUser.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    if (payload.new.sender_id !== currentUserId) {
                        setMessages(prev => [...prev, payload.new as Message]);
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            )
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' },
                (payload) => setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [viewMode, activeChatUser, currentUserId]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    useEffect(() => {
        supabase.from('profiles').select('*').neq('id', currentUserId)
            .then(({ data }) => {
                if (data) {
                    setUsers(data as Profile[]);
                    if (chatWithParam) {
                        const targetUser = data.find(u => u.id === chatWithParam);
                        if (targetUser) {
                            setActiveChatUser(targetUser as Profile);
                            setViewMode('chat-detail');
                            // Clear URL param after loading to prevent getting stuck
                            window.history.replaceState({}, '', '/?tab=community');
                        }
                    }
                }
            });
    }, [currentUserId, chatWithParam]);

    // --- ACTIONS ---

    const uploadImage = async (file: File) => {
        // Compress image before upload
        const compressedFile = await compressImage(file);

        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;
        const { error } = await supabase.storage.from('uploads').upload(filePath, compressedFile);
        if (error) { console.error('Upload error:', error); return null; }
        const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setPostToShare(null);
        }
    };

    const deletePost = async (postId: number) => {
        setPosts(prev => prev.filter(p => p.id !== postId));
        await supabase.from('posts').delete().eq('id', postId);
        addToast('Post deleted', 'success');
    };

    const deleteMessage = async (messageId: number) => {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        await supabase.from('messages').delete().eq('id', messageId);
    };

    const toggleLike = async (post: Post) => {
        const isLiked = post.user_has_liked;
        const newCount = (post.likes_count || 0) + (isLiked ? -1 : 1);
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, user_has_liked: !isLiked, likes_count: newCount } : p));

        if (isLiked) await supabase.from('likes').delete().match({ user_id: currentUserId, post_id: post.id });
        else await supabase.from('likes').insert({ user_id: currentUserId, post_id: post.id });
    };

    const handleExternalShare = async (post: Post) => {
        const title = `Post by ${post.username} on EAST Community`;
        const text = post.caption || "Check out this post on EAST Sports Group!";
        const url = window.location.href; // In a real app, this would be a deep link to the post

        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
            addToast('Link copied to clipboard!', 'success');
        }
    };

    const sharePost = (post: Post) => {
        const targetPost = post.shared_post || post;
        setPostToShare(targetPost);
        setSelectedFile(null);
        setCaption('');
        feedTopRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendPost = async () => {
        if (!caption && !selectedFile && !postToShare) return;
        setIsUploading(true);
        let url = null;
        if (selectedFile) url = await uploadImage(selectedFile);
        const sharedId = (postToShare && postToShare.id) ? postToShare.id : null;

        const { data, error } = await supabase.from('posts').insert({
            user_id: currentUserId, caption, image_url: url, shared_post_id: sharedId
        }).select().single();

        if (error) addToast("Could not post: " + error.message, 'error');
        else if (data) {
            const newPost = await fetchSinglePostRobust(data.id);
            if (newPost) setPosts(prev => [newPost as Post, ...prev]);
            setCaption(''); setSelectedFile(null); setPostToShare(null);
        }
        setIsUploading(false);
    };

    const sendMessage = async () => {
        if ((!inputMsg && !selectedFile) || !activeChatUser) return;

        const tempId = Date.now();
        const messageContent = inputMsg;
        const fileToSend = selectedFile;

        const optimisticMessage: Message = {
            id: tempId,
            sender_id: currentUserId,
            receiver_id: activeChatUser.id,
            content: messageContent || (fileToSend ? 'Sending image...' : ''),
            image_url: fileToSend ? URL.createObjectURL(fileToSend) : undefined,
            created_at: new Date().toISOString(),
            is_me: true
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setInputMsg(''); setSelectedFile(null);

        let url = null;
        if (fileToSend) url = await uploadImage(fileToSend);

        const { data, error } = await supabase.from('messages').insert({
            sender_id: currentUserId,
            receiver_id: activeChatUser.id,
            content: messageContent || (url ? 'Sent an image' : ''),
            image_url: url
        }).select().single();

        if (error) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            addToast("Failed to send message", 'error');
        } else {
            setMessages(prev => prev.map(m => m.id === tempId ? {
                ...m, id: data.id, content: data.content, image_url: data.image_url, is_me: true
            } : m));
        }
    };

    // --- RENDERERS ---
    const renderMessengerList = () => (
        <div className="h-full flex flex-col relative animate-fadeIn bg-black">
            <div className="relative z-10 px-5 pt-10 flex-1 overflow-y-auto pb-32 no-scrollbar">
                <div className="flex items-center justify-between gap-3 mb-6">
                    <h1 className="font-montserrat font-black italic text-4xl text-white tracking-tight">MESSENGER</h1>
                    <button className="text-east-light hover:text-white transition-colors bg-white/5 p-2.5 rounded-full border border-white/10">
                        <UsersRound size={20} />
                    </button>
                </div>

                <div className="relative mb-8">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder="SEARCH PLAYERS OR TEAMS..."
                        className="w-full bg-[#111] border border-gray-800 rounded-full py-3.5 pl-12 pr-4 text-white font-black italic text-xs uppercase tracking-widest placeholder:text-gray-600 focus:outline-none focus:border-east-light transition-colors"
                    />
                </div>

                <div className="mb-10">
                    <h3 className="font-montserrat font-black italic text-gray-500 text-[10px] uppercase tracking-[0.3em] mb-5">ACTIVE TEAMS</h3>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                        {['U15 Elite', 'Skills Clinic A', 'Defense Camp'].map((team) => (
                            <div key={team} className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-4 shrink-0 cursor-pointer group hover:border-east-light transition-all flex flex-col items-center justify-center min-w-[120px]">
                                <div className="w-12 h-12 bg-east-light/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <UsersRound size={24} className="text-east-light" />
                                </div>
                                <span className="font-montserrat font-black italic text-[10px] text-white uppercase text-center">{team}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-10">
                    <h3 className="font-montserrat font-black italic text-gray-500 text-[10px] uppercase tracking-[0.3em] mb-6">ACTIVE NOW</h3>
                    <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
                        {users.map((u) => (
                            <div key={u.id} onClick={() => { setActiveChatUser(u); setViewMode('chat-detail'); }} className="flex flex-col items-center gap-3 shrink-0 cursor-pointer group">
                                <div className="w-16 h-16 rounded-full border-2 border-gray-900 overflow-hidden group-hover:border-east-light transition-colors relative">
                                    <img src={u.avatar_url || "https://placehold.co/100"} className="w-full h-full object-cover" alt="user" />
                                    <div className="absolute bottom-1 right-1 w-3 h-3 bg-east-light rounded-full border-2 border-black" />
                                </div>
                                <span className="font-montserrat font-black italic text-[9px] text-gray-400 group-hover:text-white uppercase transition-colors">{u.username ? u.username.split(' ')[0] : 'User'}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-6">
                    <h3 className="font-montserrat font-black italic text-gray-500 text-[10px] uppercase tracking-[0.3em] mb-6">RECENT CHATS</h3>
                    {users.map(u => (
                        <div key={u.id} onClick={() => { setActiveChatUser(u); setViewMode('chat-detail'); }} className="flex items-center gap-4 cursor-pointer group">
                            <div className="w-14 h-14 rounded-full bg-gray-900 border border-gray-800 overflow-hidden shrink-0 group-hover:border-white transition-colors">
                                <img src={u.avatar_url || "https://placehold.co/100"} className="w-full h-full object-cover opacity-80" alt="user" />
                            </div>
                            <div className="flex-1 min-w-0 border-b border-gray-900 pb-5">
                                <h4 className="font-montserrat font-black italic text-white text-[15px] uppercase tracking-tight group-hover:text-east-light transition-colors">{u.username}</h4>
                                <p className="text-[9px] font-bold text-gray-600 truncate uppercase mt-0.5 tracking-wider">Tap to open conversation</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderChatDetail = () => (
        <div className="h-full flex flex-col bg-black animate-fadeIn">
            <div className="h-16 border-b border-gray-800 flex items-center px-4 justify-between bg-black shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => setViewMode('messenger-list')} className="text-white hover:text-east-light transition-colors">
                        <ChevronLeft size={28} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-700">
                            <img src={activeChatUser?.avatar_url || "https://placehold.co/200"} className="w-full h-full object-cover" alt="User" />
                        </div>
                        <div>
                            <h1 className="font-montserrat font-black italic text-lg text-white leading-none uppercase">{activeChatUser?.username}</h1>
                            <p className="text-[10px] text-east-light font-bold uppercase tracking-wider">Active now</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUserId || msg.is_me;
                    return (
                        <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-4 group items-end`}>
                            {!isMe && (
                                <div className="w-7 h-7 rounded-full overflow-hidden mr-2 mb-1 border border-gray-800 shrink-0">
                                    <img src={activeChatUser?.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                                </div>
                            )}
                            {isMe && (
                                <button onClick={() => deleteMessage(msg.id)} className="mr-2 mb-3 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                            )}
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                <span className="font-montserrat font-black italic text-[10px] text-gray-500 mb-1 px-1 uppercase tracking-widest">{isMe ? 'ME' : activeChatUser?.username.split(' ')[0]}</span>
                                <div className={`px-4 py-3 relative shadow-sm overflow-hidden ${isMe ? 'bg-east-light text-black rounded-[22px] rounded-br-[4px]' : 'bg-[#262626] text-white rounded-[22px] rounded-bl-[4px] border border-gray-800'}`}>
                                    {msg.image_url && (
                                        <div className="mb-3 -mx-4 -mt-3">
                                            <img src={msg.image_url} className="w-full h-auto object-cover max-h-[300px] border-b border-white/10 rounded-t-lg" alt="attachment" />
                                        </div>
                                    )}
                                    {msg.content && <p className="font-montserrat font-bold italic text-sm leading-snug whitespace-pre-wrap">{msg.content}</p>}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-black shrink-0 pb-32">
                {selectedFile && (
                    <div className="mb-2 ml-2 relative w-fit">
                        <img src={URL.createObjectURL(selectedFile)} className="h-16 rounded-lg border border-gray-700" alt="Preview" />
                        <button onClick={() => setSelectedFile(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white"><Trash2 size={10} /></button>
                    </div>
                )}
                <div className="bg-[#262626] rounded-full p-1.5 flex items-center pr-2 border border-gray-800">
                    <button onClick={() => chatFileRef.current?.click()} className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-gray-400 ml-1 shrink-0 hover:text-east-light transition-colors"><Camera size={20} /></button>
                    <input type="file" ref={chatFileRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                    <input className="flex-1 bg-transparent text-white font-montserrat font-medium text-sm px-3 outline-none placeholder:text-gray-500 min-w-0" placeholder="Message..." value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} />
                    {(inputMsg.length > 0 || selectedFile) ? (
                        <button onClick={sendMessage} className="w-10 h-10 bg-east-light rounded-full flex items-center justify-center hover:scale-105 transition-transform shrink-0">
                            <Send size={18} className="text-black ml-0.5" />
                        </button>
                    ) : (
                        <div className="flex gap-2.5 px-2 shrink-0">
                            <button className="text-gray-400 hover:text-east-light transition-colors" title="Attach Workout/Practice"><ClipboardList size={20} /></button>
                            <button className="text-gray-400 hover:text-east-light transition-colors" title="Attach Video Feedback"><Video size={20} /></button>
                            <button className="text-gray-400 hover:text-east-light transition-colors"><Paperclip size={20} /></button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderFeed = () => (
        <div className="h-full flex flex-col relative animate-fadeIn bg-black">
            <div className="relative z-10 px-5 pt-10 flex-1 overflow-y-auto pb-32 no-scrollbar">
                <div ref={feedTopRef} />
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setViewMode('messenger-list')}>
                        <h1 className="font-montserrat font-black italic text-4xl text-white tracking-tight">FEED</h1>
                        <ChevronDown className="text-east-light group-hover:translate-y-1 transition-transform" />
                    </div>
                    <Link href="/stats" className="bg-gray-900 border border-gray-800 p-2.5 rounded-full hover:border-east-light transition-all active:scale-90">
                        <Trophy className="text-east-light" size={22} />
                    </Link>
                </div>
                <div className="mb-10 bg-[#0a0a0a] p-5 rounded-2xl border border-gray-800 relative z-20 shadow-2xl">
                    {postToShare && (
                        <div className="mb-5 border-l-2 border-east-light pl-4 bg-white/5 py-3 rounded-r-xl">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[9px] font-black text-east-light uppercase tracking-[0.2em]">Replying to post</span>
                                <button onClick={() => setPostToShare(null)} className="text-gray-500 hover:text-white p-1 hover:bg-white/10 rounded-full transition-all"><X size={14} /></button>
                            </div>
                            <div className="opacity-80 scale-95 origin-top-left">
                                <SharedPostCard post={postToShare} />
                            </div>
                        </div>
                    )}
                    <textarea
                        className="w-full bg-transparent text-sm font-bold text-white placeholder:text-gray-700 outline-none mb-4 resize-none min-h-[60px]"
                        placeholder={postToShare ? "Add your thoughts..." : "WHAT'S ON YOUR MIND?"}
                        rows={2}
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                    />
                    {selectedFile && (
                        <div className="mb-4 relative w-fit group">
                            <img src={URL.createObjectURL(selectedFile)} className="h-24 rounded-xl border border-gray-800 object-cover shadow-lg" alt="Preview" />
                            <button onClick={() => setSelectedFile(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1.5 text-white shadow-lg group-hover:scale-110 transition-transform"><Trash2 size={12} /></button>
                        </div>
                    )}
                    <div className="flex justify-between items-center border-t border-gray-900 pt-4">
                        <div className="flex gap-5">
                            <button
                                onClick={() => postFileRef.current?.click()}
                                className={`text-gray-500 hover:text-east-light transition-all hover:scale-110 ${postToShare ? 'opacity-20 cursor-not-allowed' : ''}`}
                                disabled={!!postToShare}
                            >
                                <ImageIcon size={22} />
                            </button>
                            <input type="file" ref={postFileRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                        </div>
                        <button
                            onClick={sendPost}
                            disabled={isUploading || (!caption && !selectedFile)}
                            className="bg-white text-black font-black italic text-[11px] px-8 py-2.5 rounded-full uppercase hover:bg-east-light transition-all active:scale-95 disabled:opacity-30 tracking-tight"
                        >
                            {isUploading ? 'POSTING...' : 'POST'}
                        </button>
                    </div>
                </div>
                <div className="space-y-10 pb-32">
                    {posts.map(post => (
                        <div key={post.id} className="rounded-3xl overflow-hidden bg-[#0a0a0a] border border-gray-800 shadow-2xl relative group transition-all hover:border-gray-700">
                            {post.user_id === currentUserId && (
                                <button onClick={(e) => { e.stopPropagation(); deletePost(post.id); }} className="absolute top-5 right-5 z-50 bg-black/80 p-2.5 rounded-full text-gray-500 hover:text-red-400 hover:bg-black transition-all cursor-pointer opacity-0 group-hover:opacity-100 border border-gray-800">
                                    <Trash2 size={16} />
                                </button>
                            )}
                            <div className="p-5 flex items-center gap-4">
                                <div className="w-11 h-11 rounded-full overflow-hidden border border-gray-800 bg-gray-900">
                                    <img src={post.avatar_url || "https://placehold.co/100"} className="w-full h-full object-cover" alt="user" />
                                </div>
                                <div>
                                    <h3 className="font-montserrat font-black italic text-white text-[15px] uppercase leading-none tracking-tight">{post.username || 'User'}</h3>
                                    <p className="font-black text-[9px] text-gray-600 uppercase tracking-widest mt-1">HONG KONG WARRIOR</p>
                                </div>
                            </div>
                            {post.caption && <div className="px-7 pb-3"><p className="font-montserrat font-bold italic text-sm text-gray-200 leading-relaxed">{post.caption}</p></div>}
                            {post.image_url && <div className="aspect-video w-full relative bg-black mt-1"><img src={post.image_url} className="w-full h-full object-cover opacity-90" alt="content" /></div>}
                            {post.shared_post && post.shared_post.id && <div className="px-5 pb-3 pt-2"><SharedPostCard post={post.shared_post} /></div>}
                            <div className="px-7 pb-6">
                                <div className="flex items-center gap-8 border-t border-gray-900 pt-5 mt-3">
                                    <button onClick={() => toggleLike(post)} className="flex items-center gap-2 group/btn">
                                        <Heart size={22} className={`transition-all ${post.user_has_liked ? 'fill-east-light text-east-light' : 'text-gray-600 group-hover/btn:text-white'}`} />
                                        <span className={`font-montserrat font-black text-xs italic ${post.user_has_liked ? 'text-east-light' : 'text-gray-600 group-hover/btn:text-white'}`}>{post.likes_count || 0}</span>
                                    </button>
                                    <button onClick={() => sharePost(post)} className="flex items-center gap-2 group/btn text-gray-600 hover:text-white transition-all">
                                        <Share2 size={22} className="group-hover/btn:hidden" />
                                        <span onClick={(e) => { e.stopPropagation(); handleExternalShare(post); }} className="font-montserrat font-black text-[10px] italic uppercase tracking-widest hover:text-east-light">External Share</span>
                                        <span className="font-montserrat font-black text-[10px] italic uppercase tracking-widest group-hover/btn:block hidden">Internal Reshare</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-[100dvh] pb-24 bg-black flex flex-col relative">
            <PrivateMessenger currentUserId={currentUserId} chatWithUserId={chatWithParam} />
        </div>
    );
}