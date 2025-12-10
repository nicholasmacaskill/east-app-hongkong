'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { User, Mail, Lock, Phone, ChevronLeft, LogIn, UserPlus, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase'; // Import Supabase
import type { UserRole } from '../types';

// --- Types ---
type AuthStep = 'login' | 'register_step_1' | 'register_step_2' | 'otp_verification' | 'success';

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

// --- Step Components ---

const StepLogin: React.FC<{ formData: FormData; handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onSwitchToRegister: () => void; onAuthSuccess: (role: UserRole) => void; }> = ({ formData, handleChange, onSwitchToRegister, onAuthSuccess }) => {
    const [loading, setLoading] = useState(false);

    const handleRealLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // 1. Call Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
        });

        if (error) {
            alert(error.message);
            setLoading(false);
        } else {
            // 2. Success! Trigger parent refresh
            onAuthSuccess('player'); 
        }
    };

    return (
        <div className="animate-fadeIn">
            <AuthHeader title="Member Login" />
            <form onSubmit={handleRealLogin}>
                <InputField label="Email Address" name="email" type="email" value={formData.email} icon={Mail} onChange={handleChange} placeholder="Enter your email" />
                <InputField label="Password" name="password" type="password" value={formData.password} icon={Lock} onChange={handleChange} placeholder="Enter your password" />
                <button type="submit" disabled={loading} className="w-full bg-east-light text-black font-montserrat font-black italic text-lg py-3 rounded-full uppercase tracking-wider shadow-lg shadow-east-light/20 hover:bg-east-dark hover:text-white transition-all duration-200 mt-4">
                    <div className="flex items-center justify-center gap-2">
                        {loading ? 'LOGGING IN...' : <><LogIn size={20} /> LOGIN</>}
                    </div>
                </button>
            </form>
            <div className="text-center mt-6 space-y-2">
                <p className="text-sm text-gray-400">Need an account? <button onClick={onSwitchToRegister} className="text-east-light underline font-bold">Register Now</button></p>
                <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-east-light transition-colors">Forgot Username or Password?</Link>
            </div>
        </div>
    );
};

// ... (StepRegister1 and StepRegister2 remain strictly UI, so skipping for brevity, but YOU SHOULD KEEP THEM if you want registration to work later)

// --- Main Controller ---

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
    const [step, setStep] = useState<AuthStep>('login');
    const [formData, setFormData] = useState<FormData>(initialFormData);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleNextStep = (nextStep: AuthStep) => setStep(nextStep);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm bg-east-card rounded-2xl p-6 shadow-2xl border border-gray-800">
                {step === 'login' ? (
                    <StepLogin formData={formData} handleChange={handleChange} onSwitchToRegister={() => handleNextStep('register_step_1')} onAuthSuccess={onAuthSuccess} />
                ) : (
                    // Placeholder for registration flow
                    <div className="text-center">
                        <p>Registration temporarily disabled for this test.</p>
                        <button onClick={() => setStep('login')} className="text-east-light mt-4">Back to Login</button>
                    </div>
                )}
            </div>
        </div>
    );
}