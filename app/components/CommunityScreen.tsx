'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/app/lib/supabase';
import { Send, ChevronDown, ChevronLeft, Trash2 } from 'lucide-react';
import { Post, Message, Profile } from '@/app/types/community';



// HARDCODED ID for "Lee" (Matches the SQL seed data)
const CURRENT_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; 

export default function CommunityScreen() {
  const [viewMode, setViewMode] = useState<'feed' | 'messenger-list' | 'chat-detail'>('feed');
  const [activeChannel, setActiveChannel] = useState('general');
  const [posts, setPosts] = useState<Post[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<Profile | null>(null);
  const [inputMsg, setInputMsg] = useState('');
  const [caption, setCaption] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. DATA FETCHING
  useEffect(() => {
    // Feed
    supabase.from('posts').select(`*, profiles(username, avatar_url), likes(count)`).order('created_at', { ascending: false })
      .then(({ data }) => data && setPosts(data as any));

    // Messenger List (Users)
    supabase.from('profiles').select('*').neq('id', CURRENT_USER_ID)
      .then(({ data }) => data && setUsers(data as Profile[]));

    // Realtime Feed Subscription
    const channel = supabase.channel('feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, 
        (payload) => setPosts(prev => [payload.new as Post, ...prev])
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Chat Fetching
  // Chat Fetching & Realtime
  useEffect(() => {
    if (viewMode !== 'chat-detail' || !activeChatUser) return;

    // Initial Load
    supabase.from('messages').select('*')
      .or(`and(sender_id.eq.${CURRENT_USER_ID},receiver_id.eq.${activeChatUser.id}),and(sender_id.eq.${activeChatUser.id},receiver_id.eq.${CURRENT_USER_ID})`)
      .order('created_at', { ascending: true })
      .then(({ data }) => data && setMessages(data as Message[]));

    // Realtime Subscription
    const channel = supabase.channel(`chat:${activeChatUser.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
        (payload) => {
           setMessages(prev => [...prev, payload.new as Message]);
           messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, 
        (payload) => {
           // Remove the deleted message from state
           setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [viewMode, activeChatUser]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // 2. ACTIONS
  const sendPost = async () => {
    if (!caption) return;
    await supabase.from('posts').insert({ user_id: CURRENT_USER_ID, caption, image_url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974' });
    setCaption('');
  };

  const sendMessage = async () => {
    if (!inputMsg || !activeChatUser) return;
    await supabase.from('messages').insert({ sender_id: CURRENT_USER_ID, receiver_id: activeChatUser.id, content: inputMsg });
    setInputMsg('');
  };

  const deleteMessage = async (messageId: number) => {
    await supabase.from('messages').delete().eq('id', messageId);
  };

  // 3. RENDERERS
  const renderMessengerList = () => (
    <div className="h-full flex flex-col relative animate-fadeIn">
       <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1555685812-8b9c85c7954c" className="w-full h-full object-cover opacity-30 grayscale" />
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
                         <img src={u.avatar_url} className="w-full h-full rounded-full object-cover" />
                         <div className="absolute bottom-0 right-0 w-4 h-4 bg-east-light rounded-full border-2 border-black" />
                      </div>
                      
                   </div>
                ))}
             </div>
         </div>
         <div className="space-y-4">
            <h3 className="font-montserrat font-black italic text-white text-lg mb-4">RECENT CHAT</h3>
            {users.map(u => (
               <div key={u.id} onClick={() => { setActiveChatUser(u); setViewMode('chat-detail'); }} className="flex items-center gap-4 cursor-pointer group">
                  <div className="w-14 h-14 rounded-full bg-gray-800 relative shrink-0">
                     <img src={u.avatar_url} className="w-full h-full rounded-full object-cover opacity-80" />
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
        
        {/* HEADER */}
        <div className="h-16 border-b border-gray-800 flex items-center px-4 justify-between bg-black shrink-0 z-20">
           <div className="flex items-center gap-4">
               <button onClick={() => setViewMode('messenger-list')} className="text-white hover:text-east-light transition-colors">
                    <ChevronLeft size={28} />
               </button>
               <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-700">
                        <img 
                           src={activeChatUser?.avatar_url || "https://placehold.co/200"} 
                           className="w-full h-full object-cover" 
                           alt="User"
                        />
                   </div>
                   <div>
                       <h1 className="font-montserrat font-black italic text-lg text-white leading-none uppercase">
                           {activeChatUser?.username}
                       </h1>
                       <p className="text-[10px] text-east-light font-bold uppercase tracking-wider">Active now</p>
                   </div>
               </div>
           </div>
        </div>

        {/* MESSAGES LIST */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
           {messages.map((msg, index) => {
              const isMe = msg.sender_id === CURRENT_USER_ID;
              
              return (
                /* Added 'group' class here for hover effects */
                <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-4 group items-end`}>
                    
                    {/* Receiver Avatar */}
                    {!isMe && (
                        <div className="w-7 h-7 rounded-full overflow-hidden mr-2 mb-1 border border-gray-800 shrink-0">
                            <img src={activeChatUser?.avatar_url} className="w-full h-full object-cover" alt="Avatar"/>
                        </div>
                    )}

                    {/* Delete Button (Left side of bubble for sender) */}
                    {isMe && (
                        <button 
                            onClick={() => deleteMessage(msg.id)}
                            className="mr-2 mb-3 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Unsend"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}

                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                        
                        {/* Sender Label */}
                        <span className="font-montserrat font-black italic text-white text-[14px] mb-1 px-3 uppercase tracking-widest">
    {isMe ? 'ME' : activeChatUser?.username.split(' ')[0]}
</span>

                        {/* Message Bubble */}
                        <div 
                            className={`
                                px-4 py-3 relative shadow-sm
                                ${isMe 
                                    ? 'bg-east-light text-black rounded-[22px] rounded-br-[4px]' 
                                    : 'bg-[#262626] text-white rounded-[22px] rounded-bl-[4px] border border-gray-800' 
                                }
                            `}
                        >
                           {msg.shared_event_id ? (
                                <div className={`flex flex-col gap-2 pb-1 ${isMe ? 'border-l-2 border-black/20 pl-2' : 'border-l-2 border-white/20 pl-2'}`}>
                                    <p className="text-[8px] font-black uppercase opacity-70">SHARED EVENT</p>
                                    <p className="font-montserrat font-bold italic text-sm leading-tight">{msg.content}</p>
                                </div>
                           ) : (
                                <p className="font-montserrat font-bold italic text-sm leading-snug whitespace-pre-wrap">
                                    {msg.content}
                                </p>
                           )}
                        </div>
                    </div>
                </div>
              );
           })}
           <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className="p-4 bg-black shrink-0 pb-32">
            <div className="bg-[#262626] rounded-full p-1.5 flex items-center pr-2 border border-gray-800">
                <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center text-gray-400 ml-1 shrink-0">
                    <div className="w-6 h-6 rounded-full bg-east-light flex items-center justify-center">
                        <span className="text-black font-bold text-xs">+</span>
                    </div>
                </div>
                
                <input 
                    className="flex-1 bg-transparent text-white font-montserrat font-medium text-sm px-3 outline-none placeholder:text-gray-500 min-w-0"
                    placeholder="Message..."
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                
                {inputMsg.length > 0 ? (
                    <button onClick={sendMessage} className="text-east-light font-black text-sm px-3 py-1 hover:scale-105 transition-transform shrink-0">
                        Send
                    </button>
                ) : (
                    <div className="flex gap-3 px-2 shrink-0">
                        <Send size={20} className="text-white" />
                    </div>
                )}
            </div>
        </div>
    </div>
  );

  const renderFeed = () => (
    <div className="h-full flex flex-col relative animate-fadeIn">
       <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1555685812-8b9c85c7954c" className="w-full h-full object-cover opacity-30 grayscale" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black" />
       </div>
       <div className="relative z-10 px-4 pt-6 flex-1 overflow-y-auto pb-32 no-scrollbar">
         <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => setViewMode('messenger-list')}>
             <h1 className="font-montserrat font-black italic text-3xl text-white">FEED</h1>
             <ChevronDown className="text-white" />
         </div>
         <div className="flex gap-4 mb-8">
             {['GENERAL', 'TEAM', 'LEAGUE'].map(tab => (
                <button key={tab} onClick={() => setActiveChannel(tab.toLowerCase())} className={`font-montserrat font-bold italic text-xs px-6 py-2 rounded-full uppercase transition-all ${activeChannel === tab.toLowerCase() ? 'bg-white text-black' : 'bg-transparent border border-gray-600 text-gray-400'}`}>{tab}</button>
             ))}
         </div>
         <div className="mb-8 bg-[#1a1a1a] p-4 rounded-2xl border border-gray-800">
            <input className="w-full bg-transparent text-sm font-bold text-white placeholder:text-gray-600 outline-none mb-3" placeholder="SHARE SOMETHING..." value={caption} onChange={(e) => setCaption(e.target.value)} />
            <div className="flex justify-end"><button onClick={sendPost} className="bg-east-light text-black font-black italic text-[10px] px-4 py-1.5 rounded uppercase">POST</button></div>
         </div>
         <div className="space-y-8">
            {posts.map(post => (
                <div key={post.id} className="rounded-3xl overflow-hidden bg-[#1a1a1a] border border-gray-800 shadow-2xl">
                    <div className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white"><img src={post.profiles?.avatar_url} className="w-full h-full object-cover" /></div>
                        <div><h3 className="font-montserrat font-black italic text-white text-sm uppercase">{post.profiles?.username}</h3><p className="font-bold text-[9px] text-gray-400 uppercase">HONG KONG WARRIORS</p></div>
                    </div>
                    <div className="aspect-video w-full relative"><img src={post.image_url} className="w-full h-full object-cover" /></div>
                    <div className="p-4"><p className="font-montserrat font-bold italic text-xs text-gray-300 leading-relaxed uppercase">{post.caption}</p></div>
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