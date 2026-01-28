'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Menu, X, ArrowRight } from 'lucide-react';
import { useCart } from '@/app/context/CartContext';
import { cn } from '@/app/components/ui/GlassCard';

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { toggleCart, itemCount } = useCart();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
                scrolled ? "bg-black/80 backdrop-blur-xl border-white/10 py-4" : "bg-transparent py-6"
            )}
        >
            <div className="container mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-east-light rounded-sm rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                    <span className="font-montserrat font-bold text-xl tracking-widest text-white">EAST</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    <NavLink href="/programs">Programs</NavLink>
                    <NavLink href="/golf">Golf</NavLink>
                    <NavLink href="/hpc">HPC</NavLink>
                    <NavLink href="/team">Team</NavLink>
                </nav>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-6">
                    <button
                        onClick={toggleCart}
                        className="relative p-2 hover:bg-white/10 rounded-full transition-colors group"
                    >
                        <ShoppingBag className="w-5 h-5 text-white/80 group-hover:text-white" />
                        {itemCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-east-light text-black text-[10px] font-bold flex items-center justify-center rounded-full">
                                {itemCount}
                            </span>
                        )}
                    </button>

                    <Link
                        href="http://localhost:3000/portal"
                        className="bg-white text-black px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-east-light hover:scale-105 transition-all flex items-center gap-2"
                    >
                        Client Portal <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="md:hidden text-white"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-50 flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-bottom-10">
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="absolute top-6 right-6 text-white/50 hover:text-white"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <MobileLink href="/programs" onClick={() => setMobileMenuOpen(false)}>Programs</MobileLink>
                    <MobileLink href="/golf" onClick={() => setMobileMenuOpen(false)}>Golf</MobileLink>
                    <MobileLink href="/hpc" onClick={() => setMobileMenuOpen(false)}>HPC</MobileLink>
                    <MobileLink href="/team" onClick={() => setMobileMenuOpen(false)}>The Team</MobileLink>
                    <button
                        onClick={() => { toggleCart(); setMobileMenuOpen(false); }}
                        className="text-2xl font-montserrat font-bold text-white/80 hover:text-east-light"
                    >
                        Cart ({itemCount})
                    </button>
                    <Link
                        href="http://localhost:3000/portal"
                        className="mt-8 bg-east-light text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest"
                    >
                        Client Portal
                    </Link>
                </div>
            )}
        </header>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="text-sm font-bold uppercase tracking-wider text-white/60 hover:text-east-light transition-colors"
        >
            {children}
        </Link>
    );
}

function MobileLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="text-3xl font-montserrat font-black italic uppercase text-white hover:text-east-light tracking-tighter"
        >
            {children}
        </Link>
    );
}
