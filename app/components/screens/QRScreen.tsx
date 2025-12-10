'use client';
import { useRouter } from 'next/navigation';
import { QrCode, User as UserIcon } from 'lucide-react';

export default function QRScreen() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 animate-fadeIn pb-24 relative">
       <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1000" 
            alt="Gym Background" 
            className="w-full h-full object-cover opacity-20 blur-sm"
          />
          <div className="absolute inset-0 bg-black/60" />
       </div>

      <div className="w-full max-w-xs bg-white text-black rounded-3xl overflow-hidden shadow-2xl relative z-10">
        <div className="h-3 w-full bg-gradient-to-r from-east-light to-east-dark" />
        
        <div className="p-8 flex flex-col items-center">
           <h2 className="font-montserrat font-black italic text-3xl mb-1 uppercase tracking-tighter text-black">CHECK IN</h2>
           <p className="font-bold text-[10px] text-gray-400 uppercase mb-8 tracking-widest">SCAN AT FRONT DESK</p>

           <div className="relative p-4 border-[6px] border-black rounded-2xl mb-8 bg-white shadow-xl">
             <QrCode size={160} strokeWidth={2} className="text-black" />
             {/* Accents */}
             <div className="absolute -top-2 -left-2 w-6 h-6 border-t-[6px] border-l-[6px] border-east-light rounded-tl-lg" />
             <div className="absolute -top-2 -right-2 w-6 h-6 border-t-[6px] border-r-[6px] border-east-light rounded-tr-lg" />
             <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-[6px] border-l-[6px] border-east-light rounded-bl-lg" />
             <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-[6px] border-r-[6px] border-east-light rounded-br-lg" />
           </div>

           <div className="text-center w-full mb-6">
             <div className="font-montserrat font-black italic text-2xl uppercase">LEE</div>
             <div className="font-bold text-[10px] text-east-dark uppercase tracking-wider mt-1 flex items-center justify-center gap-1 mb-4">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               ACTIVE MEMBER
             </div>
             <button onClick={() => router.push('/membership')} className="bg-black text-white font-montserrat font-bold italic text-[10px] px-6 py-2 rounded-full uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg border border-gray-800">
                MANAGE MEMBERSHIP
             </button>
           </div>

           <div className="pt-6 border-t-2 border-dashed border-gray-200 w-full flex justify-between items-center">
             <div>
                 <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">MEMBER ID</div>
                 <div className="font-montserrat font-black text-lg tracking-widest">#8821-XJ</div>
             </div>
             <div className="h-10 w-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg">
                 <UserIcon size={18} />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}