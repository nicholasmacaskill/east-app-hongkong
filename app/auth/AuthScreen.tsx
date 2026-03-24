'use client';
import React, { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { User, Mail, Lock, Phone, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { useToast } from '@/app/components/ui/Toast';
import { fetchProfileResilient } from '@/app/lib/authProfile';
import type { UserRole } from '../types';

/**
 * Isolated inner component that safely reads the URL search params.
 * By isolating useSearchParams here and wrapping it in Suspense at the
 * call-site, we prevent this hook from ever suspending the parent tree.
 */
function EmailConfirmationHandler() {
    const { addToast } = useToast();
    const searchParams = useSearchParams();
    const hasNotifiedRef = useRef(false);

    useEffect(() => {
        const confirmed = searchParams.get('confirmed');
        if (confirmed === 'true' && !hasNotifiedRef.current) {
            addToast('Email verified! You can now log in.', 'success');
            hasNotifiedRef.current = true;
        }
    }, [searchParams, addToast]);

    return null; // Renders nothing, only a side-effect
}

type AuthStep = 'login' | 'register' | 'success';

interface FormData {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
    role: 'player' | 'parent' | 'coach';
}

const initialFormData: FormData = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'player',
};

interface AuthScreenProps {
    onAuthSuccess: (role: UserRole) => void;
    expectedRole?: UserRole;
    initialStep?: AuthStep;
}

const AuthHeader = ({ title }: { title: string }) => (
    <div className="flex flex-col items-center mb-10 text-center">
        <h2 className="text-sm font-black italic text-white/40 uppercase tracking-[0.3em]">{title}</h2>
    </div>
);

const InputField: React.FC<{ label: string; name: keyof FormData; type: string; value: string; icon: React.ElementType; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; }> = ({ label, name, type, value, icon: Icon, onChange, placeholder }) => (
    <div className="relative mb-5 group">
        <label htmlFor={name} className="block text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 px-1 group-focus-within:text-east-light transition-colors">{label}</label>
        <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                <Icon size={18} className="text-white/20 group-focus-within:text-east-light transition-colors" />
            </div>
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required
                className="w-full bg-white/[0.03] text-white border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-east-light/50 focus:bg-white/[0.07] focus:ring-4 focus:ring-east-light/5 outline-none transition-all duration-300 placeholder:text-white/10"
            />
        </div>
    </div>
);

export default function AuthScreen({ onAuthSuccess, expectedRole, initialStep }: AuthScreenProps) {
    const { addToast } = useToast();
    const [step, setStep] = useState<AuthStep>(initialStep || 'login');
    const [formData, setFormData] = useState<FormData>({
        ...initialFormData,
        role: (expectedRole === 'parent' || expectedRole === 'coach' || expectedRole === 'player') ? expectedRole : 'player'
    });
    const [loading, setLoading] = useState(false);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
        });

        if (error) {
            addToast(error.message, 'error');
            setLoading(false);
        } else if (data.user) {
            // Mirroring Admin Layout Logic: Check metadata first for immediate access
            const metaRole = data.user.user_metadata?.role;
            if (metaRole === 'admin' || metaRole === 'sys-admin') {
                onAuthSuccess(metaRole);
                return;
            }

            // Fetch role from profile (Resiliently)
            const profile = await fetchProfileResilient(data.user.id, { select: 'role' });
            onAuthSuccess(profile?.role || 'player');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    fullName: formData.fullName,
                    phone: formData.phone,
                    role: formData.role
                })
            });

            const result = await response.json();

            if (!response.ok) {
                addToast(result.error || 'Registration failed', 'error');
            } else {
                setStep('success');
                addToast('Account created! Please verify your email.', 'success');
            }
        } catch (err: any) {
            console.error('Registration failed:', err);
            addToast('An unexpected error occurred', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-montserrat">
            {/* Isolated Suspense wrapper: reads URL params without suspending the whole page */}
            <Suspense fallback={null}>
                <EmailConfirmationHandler />
            </Suspense>
            {/* Background Image Layer */}
            <div className="fixed inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=1200"
                    className="w-full h-full object-cover opacity-10 grayscale mix-blend-luminosity"
                    alt="bg"
                />
                {/* Visual Depth Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
            </div>

            <div className="w-full max-w-sm bg-white/[0.03] backdrop-blur-xl rounded-[2.5rem] p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 animate-fadeIn relative z-10 overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-east-light/5 blur-[50px] -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-east-light/5 blur-[50px] -ml-16 -mb-16" />


                {/* --- LOGIN --- */}
                {step === 'login' && (
                    <>
                        <AuthHeader title={
                            expectedRole === 'sys-admin' ? "Sys-Admin Login" :
                                expectedRole === 'admin' ? "Empire Admin Login" :
                                    expectedRole === 'coach' ? "Coach Login" :
                                        expectedRole === 'parent' ? "Parent Login" :
                                            "Athlete Login"
                        } />
                        <form onSubmit={handleLogin} className="space-y-2">
                            <InputField label="Email Address" name="email" type="email" value={formData.email} icon={Mail} onChange={handleChange} placeholder="Enter your email" />
                            <InputField label="Password" name="password" type="password" value={formData.password} icon={Lock} onChange={handleChange} placeholder="Enter your password" />
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative overflow-hidden w-full bg-east-light disabled:opacity-50 text-black font-black italic text-lg py-5 rounded-2xl transition-all duration-500 hover:bg-white active:scale-95 shadow-[0_10px_20px_-5px_rgba(40,209,96,0.3)]"
                                >
                                    {/* Hover Glimmer */}
                                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/50 to-transparent" />

                                    <span className="relative z-10 uppercase tracking-tighter">
                                        {loading ? 'LOGGING IN...' : 'LOGIN'}
                                    </span>
                                </button>
                            </div>
                        </form>
                        <div className="text-center mt-8 space-y-4">
                            {expectedRole !== 'admin' && expectedRole !== 'coach' && (
                                <p className="text-xs text-white/40 uppercase font-bold tracking-widest">
                                    New Member? <button onClick={() => setStep('register')} className="text-east-light hover:text-white transition-colors border-b border-east-light/30 hover:border-white">JOIN NOW</button>
                                </p>
                            )}
                            <Link href="/forgot-password" className="text-[10px] text-white/20 hover:text-east-light opacity-40 hover:opacity-100 transition-all uppercase font-bold tracking-[0.2em] block">Forgot Password?</Link>
                            <Link href="/faq" className="text-[10px] text-white/20 hover:text-east-light opacity-40 hover:opacity-100 transition-all uppercase font-bold tracking-[0.2em] block">Help Centre</Link>
                        </div>
                    </>
                )}

                {/* --- REGISTER (SINGLE STEP) --- */}
                {step === 'register' && (
                    <>
                        <AuthHeader title={
                            formData.role === 'parent' ? "Create Parent Account" :
                                formData.role === 'coach' ? "Create Coach Account" :
                                    "Create Athlete Account"
                        } />
                        <form onSubmit={handleRegister} className="space-y-4">
                            <InputField label="Full Name" name="fullName" type="text" value={formData.fullName} icon={User} onChange={handleChange} placeholder="First and Last Name" />
                            <InputField label="Mobile Number" name="phone" type="tel" value={formData.phone} icon={Phone} onChange={handleChange} placeholder="+852 1234 5678" />
                            <InputField label="Email Address" name="email" type="email" value={formData.email} icon={Mail} onChange={handleChange} placeholder="Enter email" />
                            <InputField label="Password" name="password" type="password" value={formData.password} icon={Lock} onChange={handleChange} placeholder="Create password" />
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative overflow-hidden w-full bg-east-light disabled:opacity-50 text-black font-black italic text-lg py-5 rounded-2xl transition-all duration-500 hover:bg-white active:scale-95 shadow-[0_10px_20px_-5px_rgba(40,209,96,0.3)]"
                                >
                                    {/* Hover Glimmer */}
                                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/50 to-transparent" />

                                    <span className="relative z-10 uppercase tracking-tighter">
                                        {loading ? 'CREATING ACCT...' : 'CREATE ACCOUNT'}
                                    </span>
                                </button>
                            </div>
                        </form>
                        <button onClick={() => setStep('login')} className="w-full text-center text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mt-8 hover:text-east-light transition-colors">Back to Login</button>
                    </>
                )}

                {/* --- SUCCESS --- */}
                {step === 'success' && (
                    <div className="text-center py-6">
                        <div className="w-24 h-24 bg-east-light/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(40,209,96,0.2)]">
                            <CheckCircle size={48} className="text-east-light animate-pulse" />
                        </div>
                        <h2 className="font-montserrat font-black italic text-3xl text-white tracking-tighter mb-4 uppercase leading-none">WELCOME TO EAST</h2>
                        <p className="text-xs text-white/40 uppercase font-black tracking-widest leading-relaxed mb-10 px-4">Your account has been created! Please check your email to confirm your address before logging in.</p>

                        <button
                            onClick={() => setStep('login')}
                            className="group relative overflow-hidden w-full bg-east-light text-black font-black italic text-lg py-5 rounded-2xl transition-all duration-500 hover:bg-white active:scale-95 shadow-[0_10px_20px_-5px_rgba(40,209,96,0.3)]"
                        >
                            {/* Hover Glimmer */}
                            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/50 to-transparent" />

                            <span className="relative z-10 uppercase tracking-tighter">GO TO LOGIN</span>
                        </button>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .animate-fadeIn {
                    animation: fadeIn 1s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}