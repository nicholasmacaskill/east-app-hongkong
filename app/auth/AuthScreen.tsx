'use client';
import React, { useState, useCallback } from 'react';
import { User, Mail, Lock, Phone, LogIn, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase'; 
import type { UserRole } from '../types';

type AuthStep = 'login' | 'register_step_1' | 'register_step_2' | 'success';

interface FormData {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
    role: 'player' | 'parent';
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
}

const AuthHeader = ({ title }: { title: string }) => (
    <div className="text-center mb-8">
        <h1 className="font-montserrat font-black italic text-5xl text-white tracking-tighter drop-shadow-md">
            E<span className="text-east-light">A</span>ST
        </h1>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{title}</h2>
    </div>
);

const InputField: React.FC<{ label: string; name: keyof FormData; type: string; value: string; icon: React.ElementType; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; }> = ({ label, name, type, value, icon: Icon, onChange, placeholder }) => (
    <div className="relative mb-6">
        <label htmlFor={name} className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</label>
        <div className="relative">
            <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-east-light" />
            <input type={type} id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} required className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:border-east-light focus:ring-1 focus:ring-east-light transition-colors placeholder:text-gray-500" />
        </div>
    </div>
);

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
    const [step, setStep] = useState<AuthStep>('login');
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [loading, setLoading] = useState(false);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
        });
        if (error) {
            alert(error.message);
            setLoading(false);
        } else {
            onAuthSuccess('player');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        // This creates the user in Supabase Auth
        // The Database Trigger in run_sql.ts will automatically create their Profile row!
        const { error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    // We save these to metadata, which the trigger can read if you enhance it later
                    full_name: formData.fullName, 
                    mobile: formData.phone
                }
            }
        });

        setLoading(false);
        if (error) alert(error.message);
        else setStep('success');
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#1e1e1e] rounded-2xl p-6 shadow-2xl border border-gray-800 animate-fadeIn">
                
                {/* --- LOGIN --- */}
                {step === 'login' && (
                    <>
                        <AuthHeader title="Member Login" />
                        <form onSubmit={handleLogin}>
                            <InputField label="Email Address" name="email" type="email" value={formData.email} icon={Mail} onChange={handleChange} placeholder="Enter your email" />
                            <InputField label="Password" name="password" type="password" value={formData.password} icon={Lock} onChange={handleChange} placeholder="Enter your password" />
                            <button type="submit" disabled={loading} className="w-full bg-east-light text-black font-montserrat font-black italic text-lg py-3 rounded-full uppercase tracking-wider shadow-lg hover:bg-east-dark hover:text-white transition-all disabled:opacity-50 mt-2">
                                {loading ? 'LOGGING IN...' : 'LOGIN'}
                            </button>
                        </form>
                        <div className="text-center mt-6 space-y-3">
                            <p className="text-sm text-gray-400">Need an account? <button onClick={() => setStep('register_step_1')} className="text-east-light underline font-bold hover:text-white transition-colors">Register Now</button></p>
                            <Link href="/forgot-password" className="text-[10px] text-gray-500 hover:text-east-light transition-colors uppercase tracking-wider block">Forgot Password?</Link>
                        </div>
                    </>
                )}

                {/* --- REGISTER STEP 1 --- */}
                {step === 'register_step_1' && (
                    <>
                        <AuthHeader title="Create Account" />
                        <form onSubmit={(e) => { e.preventDefault(); setStep('register_step_2'); }}>
                            <InputField label="Full Name" name="fullName" type="text" value={formData.fullName} icon={User} onChange={handleChange} placeholder="First and Last Name" />
                            <InputField label="Mobile Number" name="phone" type="tel" value={formData.phone} icon={Phone} onChange={handleChange} placeholder="+852 1234 5678" />
                            <button type="submit" className="w-full bg-east-light text-black font-montserrat font-black italic text-lg py-3 rounded-full uppercase tracking-wider shadow-lg hover:bg-east-dark hover:text-white transition-all mt-2">NEXT</button>
                        </form>
                        <button onClick={() => setStep('login')} className="w-full text-center text-gray-500 text-xs mt-4 hover:text-white uppercase tracking-widest">Back to Login</button>
                    </>
                )}

                {/* --- REGISTER STEP 2 --- */}
                {step === 'register_step_2' && (
                    <>
                        <AuthHeader title="Secure Account" />
                        <form onSubmit={handleRegister}>
                            <InputField label="Email Address" name="email" type="email" value={formData.email} icon={Mail} onChange={handleChange} placeholder="Enter email" />
                            <InputField label="Password" name="password" type="password" value={formData.password} icon={Lock} onChange={handleChange} placeholder="Create password" />
                            <button type="submit" disabled={loading} className="w-full bg-east-light text-black font-montserrat font-black italic text-lg py-3 rounded-full uppercase tracking-wider shadow-lg hover:bg-east-dark hover:text-white transition-all disabled:opacity-50 mt-2">
                                {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
                            </button>
                        </form>
                        <button onClick={() => setStep('register_step_1')} className="w-full text-center text-gray-500 text-xs mt-4 hover:text-white uppercase tracking-widest">Back</button>
                    </>
                )}

                {/* --- SUCCESS --- */}
                {step === 'success' && (
                    <div className="text-center py-4">
                        <CheckCircle size={80} className="text-east-light mx-auto mb-6 animate-bounce" />
                        <h2 className="font-montserrat font-black italic text-2xl text-white tracking-tighter mb-4 uppercase">WELCOME TO EAST</h2>
                        <p className="text-sm text-gray-400 mb-8">Your account has been created! Please check your email to confirm your address before logging in.</p>
                        <button onClick={() => setStep('login')} className="w-full bg-east-light text-black font-montserrat font-black italic text-lg py-3 rounded-full uppercase tracking-wider shadow-lg hover:bg-east-dark hover:text-white transition-all">
                            GO TO LOGIN
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}