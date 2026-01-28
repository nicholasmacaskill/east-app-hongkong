import React from 'react';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { Mail, MapPin, Instagram } from 'lucide-react';

export default function ContactPage() {
    return (
        <div className="container mx-auto px-6 py-12 space-y-12">
            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white text-center">
                Contact Us
            </h1>

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
                <GlassCard className="p-8 space-y-8">
                    <h2 className="text-2xl font-bold uppercase tracking-wider text-white">Get in Touch</h2>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-5 h-5 text-east-light" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Location</h3>
                                <p className="text-white/60">Hong Kong</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                <Mail className="w-5 h-5 text-east-light" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Email</h3>
                                <a href="mailto:info@eastsportsgroup.com" className="text-white/60 hover:text-white transition-colors">
                                    info@eastsportsgroup.com
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                <Instagram className="w-5 h-5 text-east-light" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Social</h3>
                                <a href="https://instagram.com/eastsportsgroup" target="_blank" className="text-white/60 hover:text-white transition-colors">
                                    @eastsportsgroup
                                </a>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                <form className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-white/50">Name</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-east-light transition-colors" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-white/50">Email</label>
                        <input type="email" className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-east-light transition-colors" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-white/50">Message</label>
                        <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-east-light transition-colors" />
                    </div>
                    <button className="w-full bg-east-light text-black font-bold uppercase tracking-widest py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all">
                        Send Message
                    </button>
                </form>
            </div>
        </div>
    );
}
