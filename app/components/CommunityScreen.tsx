'use client';
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { supabase } from '@/app/lib/supabase';
import { ChevronDown, ChevronLeft, Trash2, Camera, Image as ImageIcon, Paperclip, Heart, Share2, X, Send } from 'lucide-react';
import { Post, Message, Profile } from '@/app/types/community';

// ⚠️ HARDCODED TEST ID
const CURRENT_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; 

// --- HELPER: Safely Format Post Data ---
const formatPostData = (data: any[]) => {
  return data.map(post => {
      let rawShared = post.shared_post;
      if (Array.isArray(rawShared)) {
          rawShared = rawShared.length > 0 ? rawShared[0] : null;
      }
      const hasSharedPost = rawShared && rawShared.id;
      
      let sharedProfile = null;
      if (hasSharedPost && rawShared.profiles) {
           if (Array.isArray(rawShared.profiles)) {
               sharedProfile = rawShared.profiles[0];
           } else {
               sharedProfile = rawShared.profiles;
           }
      }

      let authorProfile = post.profiles;
      if (Array.isArray(authorProfile)) authorProfile = authorProfile[0];

      return {
          ...post,
          username: authorProfile?.username || 'Unknown',
          avatar_url: authorProfile?.avatar_url,
          profiles: authorProfile, 
          likes_count: post.likes ? post.likes.length : 0,
          user_has_liked: post.likes ? post.likes.some((l: any) => l.user_id === CURRENT_USER_ID) : false,
          shared_post: hasSharedPost ? {
              ...rawShared,
              username: sharedProfile?.username || 'Unknown', 
              avatar_url: sharedProfile?.avatar_url,
              profiles: sharedProfile 
          } : null
      };
  });
};

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
           <p className="font-montserrat font-bold italic text-xs text-gray-300 leading-relaxed uppercase line-clamp-3 mb-2">
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

export default function CommunityScreen() {
  const [viewMode, setViewMode] = useState<'feed' | 'messenger-list' | 'chat-detail'>('feed');
  const [activeChannel, setActiveChannel] = useState('general');
  
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

  // --- FETCH SINGLE POST ---
  const fetchSinglePost = async (id: number) => {
      const { data } = await supabase.from('posts')
        .select(`*, profiles(username, avatar_url), likes(user_id), shared_post:posts(*, profiles(username, avatar_url))`)
        .eq('id', id)
        .single();
      return data ? formatPostData([data])[0] : null;
  };

  // --- FETCH FEED ---
  useEffect(() => {
    const fetchPosts = async () => {
        const { data, error } = await supabase.from('posts')
          .select(`*, profiles(username, avatar_url), likes(user_id), shared_post:posts(*, profiles(username, avatar_url))`)
          .order('created_at', { ascending: false });

        if (error) console.error("Error fetching posts:", error);
        if (data) setPosts(formatPostData(data) as Post[]);
    };
    fetchPosts();

    const channel = supabase.channel('feed_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, 
        async (payload) => {
            const newPost = await fetchSinglePost(payload.new.id);
            if (newPost) {
                setPosts(prev => {
                    if (prev.some(p => p.id === newPost.id)) return prev; 
                    return [newPost as Post, ...prev];
                });
            }
        }
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, 
        (payload) => setPosts(prev => prev.filter(p => p.id !== payload.old.id))
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- FETCH MESSAGES ---
  useEffect(() => {
    if (viewMode !== 'chat-detail' || !activeChatUser) return;

    const fetchMessages = async () => {
        const { data } = await supabase.from('messages')
          .select('*')
          .or(`and(sender_id.eq.${CURRENT_USER_ID},receiver_id.eq.${activeChatUser.id}),and(sender_id.eq.${activeChatUser.id},receiver_id.eq.${CURRENT_USER_ID})`)
          .order('created_at', { ascending: true });
        
        if (data) setMessages(data as Message[]);
    };
    fetchMessages();

    const channel = supabase.channel(`chat:${activeChatUser.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
        (payload) => {
           if (payload.new.sender_id !== CURRENT_USER_ID) {
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
  }, [viewMode, activeChatUser]);
  
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Fetch Users
  useEffect(() => {
    supabase.from('profiles').select('*').neq('id', CURRENT_USER_ID)
      .then(({ data }) => data && setUsers(data as Profile[]));
  }, []);

  // --- ACTIONS ---
  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;
    const { error } = await supabase.storage.from('uploads').upload(filePath, file);
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
    if (!confirm("Are you sure you want to delete this post?")) return;
    setPosts(prev => prev.filter(p => p.id !== postId)); 
    await supabase.from('posts').delete().eq('id', postId);
  };

  const deleteMessage = async (messageId: number) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    await supabase.from('messages').delete().eq('id', messageId);
  };

  const toggleLike = async (post: Post) => {
    const isLiked = post.user_has_liked;
    const newCount = (post.likes_count || 0) + (isLiked ? -1 : 1);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, user_has_liked: !isLiked, likes_count: newCount } : p));

    if (isLiked) await supabase.from('likes').delete().match({ user_id: CURRENT_USER_ID, post_id: post.id });
    else await supabase.from('likes').insert({ user_id: CURRENT_USER_ID, post_id: post.id });
  };

  const sharePost = (post: Post) => {
    const targetPost = post.shared_post || post;
    setPostToShare(targetPost);
    setSelectedFile(null); 
    setCaption(''); 
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- SEND POST (Feed) ---
  const sendPost = async () => {
    if (!caption && !selectedFile && !postToShare) return;
    setIsUploading(true);
    let url = null; 
    if (selectedFile) url = await uploadImage(selectedFile);
    const sharedId = (postToShare && postToShare.id) ? postToShare.id : null;

    const { data, error } = await supabase.from('posts').insert({ 
        user_id: CURRENT_USER_ID, caption, image_url: url, shared_post_id: sharedId
    }).select().single();
    
    if (error) alert("Could not post: " + error.message);
    else if (data) {
        const newPost = await fetchSinglePost(data.id);
        if (newPost) setPosts(prev => [newPost as Post, ...prev]);
        setCaption(''); setSelectedFile(null); setPostToShare(null);
    }
    setIsUploading(false);
  };

  // --- SEND MESSAGE (Chat) ---
  const sendMessage = async () => {
    if ((!inputMsg && !selectedFile) || !activeChatUser) return;

    const tempId = Date.now(); 
    const messageContent = inputMsg;
    const fileToSend = selectedFile;
    
    const optimisticMessage: Message = {
        id: tempId,
        sender_id: CURRENT_USER_ID,
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
      sender_id: CURRENT_USER_ID,
      receiver_id: activeChatUser.id,
      content: messageContent || (url ? 'Sent an image' : ''),
      image_url: url 
    }).select().single();

    if (error) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        alert("Failed to send message");
    } else {
        // FIXED: Update content, URL, AND remove the 'is_me' flag (so it looks like a real DB message)
        setMessages(prev => prev.map(m => m.id === tempId ? { 
            ...m, id: data.id, content: data.content, image_url: data.image_url, is_me: false 
        } : m));
    }
  };

  // --- RENDERERS ---
  const renderMessengerList = () => (
    <div className="h-full flex flex-col relative animate-fadeIn bg-black">
       <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1555685812-8b9c85c7954c" className="w-full h-full object-cover opacity-30 grayscale" alt="bg" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black" />
       </div>
       <div className="relative z-10 px-4 pt-6 flex-1 overflow-y-auto pb-32">
         <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => setViewMode('feed')}>
             <h1 className="font-montserrat font-black italic text-3xl text-white">MESSENGER</h1>
             <ChevronDown className="text-white" />
         </div>
         <div className="mb-8">
             <h3 className="font-montserrat font-black italic text-white text-lg mb-4">ACTIVE NOW</h3>
             <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {users.map((u) => (
                   <div key={u.id} onClick={() => { setActiveChatUser(u); setViewMode('chat-detail'); }} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer">
                      <div className="w-16 h-16 rounded-full border-2 border-gray-600 relative">
                         <img src={u.avatar_url || "https://placehold.co/100"} className="w-full h-full rounded-full object-cover" alt="user" />
                      </div>
                      <span className="font-montserrat font-bold italic text-[10px] text-white uppercase">{u.username ? u.username.split(' ')[0] : 'User'}</span>
                   </div>
                ))}
             </div>
         </div>
         <div className="space-y-4">
            <h3 className="font-montserrat font-black italic text-white text-lg mb-4">RECENT CHAT</h3>
            {users.map(u => (
               <div key={u.id} onClick={() => { setActiveChatUser(u); setViewMode('chat-detail'); }} className="flex items-center gap-4 cursor-pointer group">
                  <div className="w-14 h-14 rounded-full bg-gray-800 relative shrink-0">
                     <img src={u.avatar_url || "https://placehold.co/100"} className="w-full h-full rounded-full object-cover opacity-80" alt="user" />
                  </div>
                  <div className="flex-1 min-w-0 border-b border-gray-800 pb-4">
                     <h4 className="font-montserrat font-bold italic text-white text-lg uppercase">{u.username}</h4>
                     <p className="text-[10px] font-bold text-gray-500 truncate uppercase tracking-wide">Tap to chat...</p>
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
              const isMe = msg.sender_id === CURRENT_USER_ID || msg.is_me;
              return (
                <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-4 group items-end`}>
                    {!isMe && (
                        <div className="w-7 h-7 rounded-full overflow-hidden mr-2 mb-1 border border-gray-800 shrink-0">
                            <img src={activeChatUser?.avatar_url} className="w-full h-full object-cover" alt="Avatar"/>
                        </div>
                    )}
                    {/* FIXED: Removed !msg.is_me check so you can delete your own recent messages */}
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
                    <button onClick={() => setSelectedFile(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white"><Trash2 size={10}/></button>
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
                    <div className="flex gap-3 px-2 shrink-0"><Paperclip size={20} className="text-white" /></div>
                )}
            </div>
        </div>
    </div>
  );

  const renderFeed = () => (
    <div className="h-full flex flex-col relative animate-fadeIn">
       <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1555685812-8b9c85c7954c?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover opacity-30 grayscale" alt="bg" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black" />
       </div>
       <div className="relative z-10 px-4 pt-6 flex-1 overflow-y-auto pb-32 no-scrollbar">
         <div ref={feedTopRef} />
         <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => setViewMode('messenger-list')}>
             <h1 className="font-montserrat font-black italic text-3xl text-white">FEED</h1>
             <ChevronDown className="text-white" />
         </div>
         <div className="flex gap-4 mb-8">
             {['GENERAL', 'TEAM', 'LEAGUE'].map(tab => (
                <button key={tab} onClick={() => setActiveChannel(tab.toLowerCase())} className={`font-montserrat font-bold italic text-xs px-6 py-2 rounded-full uppercase transition-colors ${activeChannel === tab.toLowerCase() ? 'bg-white text-black' : 'bg-transparent border border-gray-600 text-gray-400'}`}>{tab}</button>
             ))}
         </div>
         <div className="mb-8 bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800 relative z-20 shadow-xl">
            {postToShare && (
                <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-east-light uppercase tracking-widest">Replying to post</span>
                        <button onClick={() => setPostToShare(null)} className="text-gray-500 hover:text-white"><X size={14}/></button>
                    </div>
                    <div className="opacity-70 scale-95 origin-top-left border-l-4 border-east-light pl-2">
                        <SharedPostCard post={postToShare} />
                    </div>
                </div>
            )}
            <textarea className="w-full bg-transparent text-sm font-bold text-white placeholder:text-gray-600 outline-none mb-3 resize-none" placeholder={postToShare ? "Add your thoughts..." : "SHARE SOMETHING WITH THE COMMUNITY..."} rows={2} value={caption} onChange={(e) => setCaption(e.target.value)} />
            {selectedFile && (
                <div className="mb-3 relative w-fit">
                    <img src={URL.createObjectURL(selectedFile)} className="h-20 rounded-lg border border-gray-700 object-cover" alt="Preview" />
                    <button onClick={() => setSelectedFile(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white"><Trash2 size={10}/></button>
                </div>
            )}
            <div className="flex justify-between items-center border-t border-gray-800 pt-3">
                <div className="flex gap-4">
                    <button onClick={() => postFileRef.current?.click()} className={`text-gray-400 hover:text-east-light transition-colors ${postToShare ? 'opacity-30 cursor-not-allowed' : ''}`} disabled={!!postToShare}><ImageIcon size={20} /></button>
                    <input type="file" ref={postFileRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                </div>
                <button onClick={sendPost} disabled={isUploading} className="bg-east-light text-black font-black italic text-[10px] px-4 py-1.5 rounded uppercase hover:bg-white transition-colors disabled:opacity-50">{isUploading ? 'POSTING...' : 'POST'}</button>
            </div>
         </div>
         <div className="space-y-8 pb-32">
            {posts.map(post => (
                <div key={post.id} className="rounded-3xl overflow-hidden bg-[#1a1a1a] border border-gray-800 shadow-2xl relative group">
                    {post.user_id === CURRENT_USER_ID && (
                        <button onClick={(e) => { e.stopPropagation(); deletePost(post.id); }} className="absolute top-4 right-4 z-50 bg-black/60 p-2 rounded-full text-white/70 hover:text-red-500 hover:bg-black transition-all cursor-pointer opacity-0 group-hover:opacity-100">
                            <Trash2 size={16} />
                        </button>
                    )}
                    <div className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                            <img src={post.avatar_url || "https://placehold.co/100"} className="w-full h-full object-cover" alt="user" />
                        </div>
                        <div>
                            <h3 className="font-montserrat font-black italic text-white text-lg uppercase leading-none">{post.username || 'User'}</h3>
                            <p className="font-bold text-[10px] text-gray-400 uppercase">HONG KONG WARRIORS</p>
                        </div>
                    </div>
                    {post.caption && <div className="px-6 pb-2"><p className="font-montserrat font-bold italic text-xs text-white leading-relaxed uppercase">{post.caption}</p></div>}
                    {post.image_url && <div className="aspect-video w-full relative bg-black/20 mt-2"><img src={post.image_url} className="w-full h-full object-cover" alt="content" /></div>}
                    {post.shared_post && post.shared_post.id && <div className="px-4 pb-2"><SharedPostCard post={post.shared_post} /></div>}
                    <div className="px-6 pb-4 bg-[#1a1a1a]">
                        <div className="flex items-center gap-6 border-t border-gray-800 pt-4 mt-2">
                            <button onClick={() => toggleLike(post)} className="flex items-center gap-2 group/btn">
                                <Heart size={20} className={`transition-all ${post.user_has_liked ? 'fill-east-light text-east-light' : 'text-gray-500 group-hover/btn:text-white'}`} />
                                <span className={`font-montserrat font-bold text-xs ${post.user_has_liked ? 'text-east-light' : 'text-gray-500 group-hover/btn:text-white'}`}>{post.likes_count || 0}</span>
                            </button>
                            <button onClick={() => sharePost(post)} className="flex items-center gap-2 group/btn hover:text-white text-gray-500 transition-colors">
                                <Share2 size={20} />
                                <span className="font-montserrat font-bold text-xs">SHARE</span>
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
    <div className="h-screen bg-black flex flex-col relative">
       {viewMode === 'messenger-list' && renderMessengerList()}
       {viewMode === 'chat-detail' && renderChatDetail()}
       {viewMode === 'feed' && renderFeed()}
    </div>
  );
}