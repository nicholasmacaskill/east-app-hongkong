import Link from 'next/link';

export function Footer() {
    return (
        <footer className="bg-black border-t border-white/10 py-16">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <h2 className="font-montserrat font-black italic text-2xl tracking-widest">
                            EAST<span className="text-east-light">.</span>
                        </h2>
                        <p className="text-white/40 text-sm leading-relaxed">
                            Elite Athlete Specific Training. <br />
                            Hong Kong's premier performance facility.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="font-bold text-white mb-6">Programs</h3>
                        <ul className="space-y-4 text-sm text-white/60">
                            <li><Link href="/programs/hockey" className="hover:text-east-light transition-colors">Hockey</Link></li>
                            <li><Link href="/programs/dryland" className="hover:text-east-light transition-colors">Dryland Training</Link></li>
                            <li><Link href="/golf" className="hover:text-east-light transition-colors">Golf Performance</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-white mb-6">Company</h3>
                        <ul className="space-y-4 text-sm text-white/60">
                            <li><Link href="/about" className="hover:text-east-light transition-colors">Who We Are</Link></li>
                            <li><Link href="/team" className="hover:text-east-light transition-colors">Our Team</Link></li>
                            <li><Link href="/contact" className="hover:text-east-light transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-white mb-6">Legal</h3>
                        <ul className="space-y-4 text-sm text-white/60">
                            <li><a href="#" className="hover:text-east-light transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-east-light transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-white/30">
                    <p>© {new Date().getFullYear()} EAST Sports Group. All rights reserved.</p>
                    <p>Powered by <span className="text-white/50">Antigravity</span></p>
                </div>
            </div>
        </footer>
    );
}
