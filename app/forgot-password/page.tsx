'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ChevronLeft, CheckCircle, Smartphone, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase'; // ✅ IMPORT SUPABASE

// --- Types ---
type ResetStep = 'request' | 'otp' | 'new_password' | 'success';

// --- Reusable UI ---
const AuthHeader = ({ title }: { title: string }) => (
    <div className="text-center mb-8">
        <h1 className="font-montserrat font-black italic text-5xl text-white tracking-tighter drop-shadow-md">
            E<span className="text-east-light">A</span>ST
        </h1>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{title}</h2>
    </div>
);

const InputField: React.FC<{ 
    label: string; 
    type: string; 
    value: string;
    icon: React.ElementType;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
}> = ({ label, type, value, icon: Icon, onChange, placeholder }) => (
    <div className="relative mb-6">
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            {label}
        </label>
        <div className="relative">
            <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-east-light" />
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:border-east-light focus:ring-1 focus:ring-east-light transition-colors placeholder:text-gray-500"
            />
        </div>
    </div>
);

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<ResetStep>('request');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // --- Step 1: Request Reset ---
    const handleRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        // ✅ SUPABASE LOGIC: Send OTP instead of Link
        const { error } = await supabase.auth.signInWithOtp({ email });
        
        setLoading(false);
        if (error) {
            alert(error.message);
        } else {
            setStep('otp');
        }
    };

    // --- Step 2: OTP Logic ---
    const handleOtpChange = (index: number, value: string) => {
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value.length === 1 && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };
    const otpComplete = otp.every(d => d.length === 1);

    const handleVerifyOtp = async () => {
        setLoading(true);
        const token = otp.join('');
        
        // ✅ SUPABASE LOGIC: Verify the 6-digit code
        const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email', // Verifies the OTP for email login
        });

        setLoading(false);
        if (error) {
            alert('Invalid Code: ' + error.message);
        } else {
            // Success! The user is now "Logged In" securely.
            setStep('new_password');
        }
    };

    // --- Step 3: New Password Logic ---
    const isPasswordValid = useMemo(() => 
        password.length >= 6 && password === confirmPassword,
        [password, confirmPassword]
    );

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // ✅ SUPABASE LOGIC: Update the user's password
        const { error } = await supabase.auth.updateUser({ password });

        setLoading(false);
        if (error) {
            alert('Error updating password: ' + error.message);
        } else {
            setStep('success');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#1e1e1e] rounded-2xl p-6 shadow-2xl border border-gray-800 animate-fadeIn">
                
                {/* Back Button (Only show if not success) */}
                {step !== 'success' && (
                    <div className="mb-4">
                        <Link href="/login" className="text-east-light hover:text-white transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                            <ChevronLeft size={16} /> Back to Login
                        </Link>
                    </div>
                )}

                {/* --- VIEW: REQUEST EMAIL --- */}
                {step === 'request' && (
                    <>
                        <AuthHeader title="Reset Password" />
                        <p className="text-sm text-gray-400 mb-6 text-center">
                            Enter the email associated with your account and we'll send you a verification code.
                        </p>
                        <form onSubmit={handleRequestSubmit}>
                            <InputField 
                                label="Email Address"
                                type="email"
                                value={email}
                                icon={Mail}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                            />
                            <button type="submit" disabled={loading} className="w-full bg-east-light text-black font-montserrat font-black italic text-lg py-3 rounded-full uppercase tracking-wider shadow-lg shadow-east-light/20 hover:bg-east-dark hover:text-white transition-all duration-200 disabled:opacity-50">
                                {loading ? 'SENDING...' : 'SEND RESET CODE'}
                            </button>
                        </form>
                    </>
                )}

                {/* --- VIEW: ENTER OTP --- */}
                {step === 'otp' && (
                    <div className="text-center">
                        <AuthHeader title="Check Your Email" />
                        <Smartphone size={48} className="text-east-light mx-auto mb-4" />
                        <p className="text-sm text-gray-400 mb-2">We sent a 6-digit code to:</p>
                        <p className="font-montserrat font-bold text-white mb-6">{email}</p>

                        <div className="flex justify-center gap-2 mb-8">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`otp-${index}`}
                                    type="tel"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    className="w-10 h-12 text-2xl text-center bg-gray-800 border-2 border-gray-700 rounded-lg text-white font-montserrat font-black focus:border-east-light focus:ring-0"
                                />
                            ))}
                        </div>

                        <button 
                            onClick={handleVerifyOtp}
                            disabled={!otpComplete || loading}
                            className="w-full bg-east-light text-black font-montserrat font-black italic text-lg py-3 rounded-full uppercase tracking-wider disabled:opacity-50 transition-all duration-200"
                        >
                            {loading ? 'VERIFYING...' : 'VERIFY CODE'}
                        </button>

                        <button 
                            onClick={() => setStep('request')}
                            className="text-[10px] text-gray-600 underline mt-6 hover:text-east-light transition-colors font-bold uppercase tracking-widest block mx-auto"
                        >
                            Resend Code
                        </button>
                    </div>
                )}

                {/* --- VIEW: NEW PASSWORD --- */}
                {step === 'new_password' && (
                    <>
                        <AuthHeader title="Set New Password" />
                        <form onSubmit={handlePasswordUpdate}>
                            <InputField 
                                label="New Password (min 6 chars)"
                                type="password"
                                value={password}
                                icon={Lock}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                            />
                            <InputField 
                                label="Confirm New Password"
                                type="password"
                                value={confirmPassword}
                                icon={Lock}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                            />
                            
                            {!isPasswordValid && password.length > 0 && (
                                <p className="text-xs text-red-500 mb-4 ml-2">Passwords must match and be 6+ characters.</p>
                            )}

                            <button 
                                type="submit" 
                                disabled={!isPasswordValid || loading}
                                className="w-full bg-east-light text-black font-montserrat font-black italic text-lg py-3 rounded-full uppercase tracking-wider shadow-lg shadow-east-light/20 disabled:opacity-50 hover:bg-east-dark hover:text-white transition-all duration-200"
                            >
                                {loading ? 'UPDATING...' : 'UPDATE PASSWORD'}
                            </button>
                        </form>
                    </>
                )}

                {/* --- VIEW: SUCCESS --- */}
                {step === 'success' && (
                    <div className="text-center py-8">
                        <CheckCircle size={80} className="text-east-light mx-auto mb-6 animate-bounce" />
                        <h2 className="font-montserrat font-black italic text-2xl text-white tracking-tighter mb-4 uppercase">
                            PASSWORD UPDATED
                        </h2>
                        <p className="text-sm text-gray-400 mb-8">
                            Your password has been changed successfully. You can now login with your new credentials.
                        </p>
                        <button 
                            onClick={() => router.push('/login')}
                            className="w-full bg-east-light text-black font-montserrat font-black italic text-lg py-3 rounded-full uppercase tracking-wider shadow-lg shadow-east-light/20 hover:bg-east-dark hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            RETURN TO LOGIN <ArrowRight size={20} />
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}