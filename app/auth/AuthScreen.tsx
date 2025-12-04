'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { User, Mail, Lock, Phone, ChevronLeft, CheckCircle, Smartphone, UserPlus, LogIn, Users } from 'lucide-react';
import Link from 'next/link';
// ✅ Import from the types file we created
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
    role: 'player' as 'player' | 'parent',
};

// --- Main AuthScreen Component Props ---
interface AuthScreenProps {
    onAuthSuccess: (role: UserRole) => void;
}

// --- Reusable UI Elements ---

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
    name: keyof FormData; 
    type: string; 
    value: string;
    icon: React.ElementType;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
}> = ({ label, name, type, value, icon: Icon, onChange, placeholder }) => (
    <div className="relative mb-6">
        <label htmlFor={name} className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            {label}
        </label>
        <div className="relative">
            <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-east-light" />
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:border-east-light focus:ring-1 focus:ring-east-light transition-colors placeholder:text-gray-500"
            />
        </div>
    </div>
);

// --- Step Components ---

const StepLogin: React.FC<{
    formData: FormData;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onLoginSubmit: (e: React.FormEvent) => void;
    onSwitchToRegister: () => void;
}> = ({ formData, handleChange, onLoginSubmit, onSwitchToRegister }) => (
    <div className="animate-fadeIn">
        <AuthHeader title="Member Login" />
        <form onSubmit={onLoginSubmit}>
            <InputField 
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                icon={Mail}
                onChange={handleChange}
                placeholder="Enter your email"
            />
            <InputField 
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                icon={Lock}
                onChange={handleChange}
                placeholder="Enter your password"
            />
            <button type="submit" className="w-full bg-east-light text-black font-montserrat font-black italic text-lg py-3 rounded-full uppercase tracking-wider shadow-lg shadow-east-light/20 hover:bg-east-dark hover:text-white transition-all duration-200 mt-4">
                <div className="flex items-center justify-center gap-2">
                    <LogIn size={20} /> LOGIN
                </div>
            </button>
        </form>
        <div className="text-center mt-6 space-y-2">
            <p className="text-sm text-gray-400">
                Need an account? <button onClick={onSwitchToRegister} className="text-east-light underline font-bold">Register Now</button>
            </p>
            <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-east-light transition-colors">
                Forgot Username or Password?
            </Link>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-700">
             <button className="w-full bg-red-600 text-white font-montserrat font-bold italic py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-red-700 transition-colors">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_Google_2020_Vector.svg" alt="Google" className="w-5 h-5 invert" />
                SIGN IN WITH GOOGLE
             </button>
        </div>
    </div>
);

const StepRegister1: React.FC<{
    formData: FormData;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onNext: () => void;
    onBack: () => void;
}> = ({ formData, handleChange, onNext, onBack }) => {

    const isStepValid = useMemo(() => {
        return formData.fullName.length > 0 && 
               formData.email.includes('@') && 
               formData.phone.length >= 7;
    }, [formData.fullName, formData.email, formData.phone]);

    return (
        <div className="animate-fadeIn">
            <div className="flex items-center gap-2 mb-4">
                <button type="button" onClick={onBack} className="text-east-light hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <AuthHeader title="MANDATORY DETAILS (STEP 1 of 2)" />
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if (isStepValid) onNext(); }}>
                <InputField 
                    label="Full Name"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    icon={User}
                    onChange={handleChange}
                    placeholder="First Name Last Name"
                />
                <InputField 
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    icon={Mail}
                    onChange={handleChange}
                    placeholder="you@email.com"
                />
                <InputField 
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    icon={Phone}
                    onChange={handleChange}
                    placeholder="(123) 456-7890"
                />
                <button 
                    type="submit" 
                    disabled={!isStepValid}
                    className="w-full bg-east-light text-black font-montserrat font-black italic text-lg py-3 rounded-full uppercase tracking-wider shadow-lg shadow-east-light/20 disabled:opacity-50 hover:bg-east-dark hover:text-white transition-all duration-200 mt-6"
                >
                    NEXT: SET PASSWORD
                </button>
            </form>
        </div>
    );
};

const StepRegister2: React.FC<{
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    onNext: () => void;
    onBack: () => void;
}> = ({ formData, setFormData, onNext, onBack }) => {
    const isPlayer = formData.role === 'player';

    const handleRoleChange = (role: 'player' | 'parent') => {
        setFormData(prev => ({ ...prev, role }));
    };

    const isPasswordValid = useMemo(() => 
        formData.password.length >= 8 && formData.password === formData.confirmPassword,
        [formData.password, formData.confirmPassword]
    );

    return (
        <div className="animate-fadeIn">
            <div className="flex items-center gap-2 mb-4">
                <button type="button" onClick={onBack} className="text-east-light hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <AuthHeader title="SECURITY & ROLE (STEP 2 of 2)" />
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if (isPasswordValid) onNext(); }}>
                <InputField 
                    label="Password (min 8 characters)"
                    name="password"
                    type="password"
                    value={formData.password}
                    icon={Lock}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter new password"
                />
                <InputField 
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    icon={Lock}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                />
                {!isPasswordValid && formData.password.length > 0 && (
                    <p className="text-xs text-red-500 mb-4 ml-2">Passwords must match and be at least 8 characters long.</p>
                )}

                <div className="mb-6">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Account Type</label>
                    <div className="flex gap-4">
                        <button 
                            type="button"
                            onClick={() => handleRoleChange('player')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-montserrat font-bold italic transition-all ${isPlayer ? 'bg-east-light text-black shadow-md shadow-east-light/30' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        >
                            <UserPlus size={18} /> PLAYER
                        </button>
                        <button 
                            type="button"
                            onClick={() => handleRoleChange('parent')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-montserrat font-bold italic transition-all ${!isPlayer ? 'bg-east-light text-black shadow-md shadow-east-light/30' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        >
                            <Users size={18} /> PARENT
                        </button>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={!isPasswordValid}
                    className="w-full bg-east-light text-black font-montserrat font-black italic text-lg py-3 rounded-full uppercase tracking-wider shadow-lg shadow-east-light/20 disabled:opacity-50 transition-all duration-200"
                >
                    FINISH REGISTRATION
                </button>
            </form>
        </div>
    );
};

const StepOTP: React.FC<{
    formData: FormData;
    onVerify: () => void;
    onBack: () => void;
}> = ({ formData, onVerify, onBack }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpComplete = otp.every(digit => digit.length === 1);

    const handleOtpChange = (index: number, value: string) => {
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value.length === 1 && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    return (
        <div className="animate-fadeIn text-center">
             <div className="flex items-center justify-start gap-2 mb-4">
                <button onClick={onBack} className="text-east-light hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <AuthHeader title="Verify Account" />
            </div>

            <div className="flex flex-col items-center justify-center">
                <Smartphone size={64} className="text-east-light mb-4" />
                <p className="text-sm text-gray-400 mb-6">
                    A One-Time Password (OTP) has been sent to your email:
                </p>
                <p className="font-montserrat font-bold text-white mb-8 truncate max-w-full">{formData.email}</p>
                
                <div className="flex justify-center gap-3 mb-8">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            id={`otp-${index}`}
                            type="tel" 
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            className="w-10 h-12 text-3xl text-center bg-gray-800 border-2 border-gray-700 rounded-lg text-white font-montserrat font-black focus:border-east-light focus:ring-0"
                            inputMode="numeric"
                        />
                    ))}
                </div>

                <button 
                    onClick={onVerify}
                    disabled={!otpComplete}
                    className="w-full max-w-xs bg-east-light text-black font-montserrat font-black italic text-lg py-3 rounded-full uppercase tracking-wider disabled:opacity-50 transition-all duration-200"
                >
                    VERIFY CODE
                </button>
                
                {/* --- ADDED DEV BUTTON HERE --- */}
                <button 
                    type="button"
                    onClick={() => setOtp(['1','2','3','4','5','6'])}
                    className="text-[10px] text-gray-600 underline mt-6 hover:text-east-light transition-colors font-bold uppercase tracking-widest"
                >
                    [DEV MODE: AUTO-FILL CODE]
                </button>
                {/* ----------------------------- */}

                <p className="text-xs text-gray-500 mt-4">
                    Didn't receive the code? <button className="text-east-light underline font-bold">Resend</button>
                </p>
            </div>
        </div>
    );
};

const StepSuccess: React.FC<{
    formData: FormData;
    onAuthSuccess: (role: UserRole) => void;
}> = ({ formData, onAuthSuccess }) => (
    <div className="animate-fadeIn text-center flex flex-col items-center justify-center min-h-[50vh]">
        <CheckCircle size={80} className="text-east-light mb-6" />
        <h1 className="font-montserrat font-black italic text-3xl text-white tracking-tighter mb-4 uppercase">
            REGISTRATION SUCCESSFUL
        </h1>
        <p className="text-sm text-gray-400 mb-10">
            Welcome, {formData.fullName}. Your {formData.role.toUpperCase()} account is now active.
        </p>

        <button 
            onClick={() => onAuthSuccess(formData.role)}
            className="w-full max-w-xs bg-east-light text-black font-montserrat font-black italic text-lg py-3 rounded-full uppercase tracking-wider shadow-lg shadow-east-light/20 hover:bg-east-dark hover:text-white transition-all duration-200"
        >
            GO TO HOME SCREEN
        </button>
    </div>
);

// --- Main Controller Component ---

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
    const [step, setStep] = useState<AuthStep>('login');
    const [formData, setFormData] = useState<FormData>(initialFormData);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAuthSuccess(formData.role || 'player'); 
    };
    
    const handleNextStep = (nextStep: AuthStep) => {
        setStep(nextStep);
    };

    const renderStep = () => {
        switch (step) {
            case 'login':
                return (
                    <StepLogin 
                        formData={formData} 
                        handleChange={handleChange} 
                        onLoginSubmit={handleLoginSubmit} 
                        onSwitchToRegister={() => handleNextStep('register_step_1')}
                    />
                );
            case 'register_step_1':
                return (
                    <StepRegister1 
                        formData={formData} 
                        handleChange={handleChange} 
                        onNext={() => handleNextStep('register_step_2')}
                        onBack={() => handleNextStep('login')}
                    />
                );
            case 'register_step_2':
                return (
                    <StepRegister2 
                        formData={formData} 
                        setFormData={setFormData}
                        onNext={() => handleNextStep('otp_verification')}
                        onBack={() => handleNextStep('register_step_1')}
                    />
                );
            case 'otp_verification':
                return (
                    <StepOTP 
                        formData={formData} 
                        onVerify={() => handleNextStep('success')} 
                        onBack={() => handleNextStep('register_step_2')}
                    />
                );
            case 'success':
                return (
                    <StepSuccess 
                        formData={formData} 
                        onAuthSuccess={onAuthSuccess} 
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm bg-east-card rounded-2xl p-6 shadow-2xl border border-gray-800">
                {renderStep()}
            </div>
        </div>
    );
}