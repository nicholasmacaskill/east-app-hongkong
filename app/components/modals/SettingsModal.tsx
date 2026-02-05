'use client';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import {
    X, ChevronLeft, ChevronRight, Edit2, ToggleLeft, ToggleRight,
    User as UserIcon, Bell, CreditCard, FileText, HelpCircle, Shield, LogOut, UserCog,
    ChevronDown, Save, Camera
} from 'lucide-react';
import { useToast } from '@/app/components/ui/Toast';
import { compressImage } from '@/app/lib/image-utils';

// Define UserRole locally or import from types if available, but to be safe and avoid circular dep issues in this modal:
// We will treat role as string for UI purposes, but ideally it matches the main app types.
export interface UserProfileData {
    name: string;
    surname: string;
    first_name: string;
    last_name: string;
    username: string;
    bio: string;
    email: string;
    mobile: string;
    avatar_url?: string;
    credits: number;
    gallery_images: string[];
    role?: any; // Loosened type to avoid conflict with Page's UserRole
}

// Removed: UserPreferences interface and initialPreferences (Preferences screen removed)

// --- UI Components ---
const SettingsContainer = ({ children }: { children: React.ReactNode }) => {
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 text-white p-6 animate-fadeIn overflow-y-auto select-none overscroll-y-none">
            <div className="max-w-md mx-auto h-full flex flex-col">
                {children}
            </div>
        </div>
    );
};

const SettingsHeader = ({ title, onBack, isClose = false }: { title: string, onBack: () => void, isClose?: boolean }) => (
    <div className="flex items-center justify-between mb-8 shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors p-2 -ml-2">
            {isClose ? <X size={24} /> : <ChevronLeft size={24} />}
        </button>
        <h2 className="font-montserrat font-bold text-xl tracking-tight">{title}</h2>
        <div className="w-8"></div>
    </div>
);

const SettingsSectionTitle = ({ title }: { title: string }) => (
    <h3 className="font-montserrat font-bold text-sm text-gray-500 uppercase tracking-wider mb-3 mt-8 px-2">{title}</h3>
);

const SettingsMenuItem = ({ icon: Icon, label, onClick, isDestructive = false, testId }: { icon: any, label: string, onClick: () => void, isDestructive?: boolean, testId?: string }) => (
    <button data-testid={testId} onClick={onClick} className="flex items-center justify-between w-full py-4 px-2 border-b border-gray-800 group hover:bg-white/5 transition-colors rounded-lg">
        <div className="flex items-center gap-4">
            <Icon size={20} className={isDestructive ? "text-red-500" : "text-gray-300 group-hover:text-east-light"} />
            <span className={`font-montserrat font-bold text-sm ${isDestructive ? "text-red-500" : "text-white"}`}>{label}</span>
        </div>
        {!isDestructive && <ChevronRight size={18} className="text-gray-600 group-hover:text-east-light transition-colors" />}
    </button>
);

const SettingsInput = ({ label, value, onChange, type = "text", placeholder }: { label: string, value: string, onChange: (val: string) => void, type?: string, placeholder?: string }) => (
    <div className="mb-6 relative">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
        <div className="relative border-b border-gray-700 pb-2 transition-colors focus-within:border-east-light">
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-transparent text-white font-montserrat font-bold text-lg focus:outline-none pr-8 placeholder:text-gray-700"
                placeholder={placeholder || "Enter " + label.toLowerCase()}
            />
            <Edit2 size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
        </div>
    </div>
);

const SettingsTextArea = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
    <div className="mb-6 relative">
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
        <div className="relative border-b border-gray-700 pb-2 transition-colors focus-within:border-east-light">
            <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full bg-transparent text-white font-montserrat font-bold text-sm focus:outline-none pr-8 placeholder:text-gray-700 resize-none leading-relaxed" placeholder={"Enter " + label.toLowerCase()} />
            <Edit2 size={16} className="absolute right-0 top-4 text-gray-600 pointer-events-none" />
        </div>
    </div>
);

const SettingsToggle = ({ label, isActive, onToggle }: { label: string, isActive: boolean, onToggle: () => void }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-800">
        <span className="font-montserrat font-bold text-sm text-white">{label}</span>
        <button onClick={onToggle} className="transition-colors p-1 -mr-1 relative">
            {isActive ? <ToggleRight size={36} className="text-east-light fill-current" /> : <ToggleLeft size={36} className="text-gray-600" />}
        </button>
    </div>
);

const SettingsDropdown = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: { label: string, value: string }[] }) => (
    <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-white text-black font-montserrat font-bold text-sm py-4 px-6 rounded-full focus:outline-none appearance-none shadow-lg relative z-10">
            <option value="" disabled>Choose your favourite Items</option>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-black z-20 pointer-events-none" size={20} />
    </div>
);

// --- Sub Screens ---

const EditProfileScreen = ({ onBack, profileData, setProfileData, onSave }: {
    onBack: () => void,
    profileData: UserProfileData,
    setProfileData: (data: UserProfileData) => void,
    onSave: (data: UserProfileData) => void
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(profileData.avatar_url || null);

    const [fullName, setFullName] = useState(`${profileData.first_name || ''} ${profileData.last_name || ''}`.trim());
    const [newPassword, setNewPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (field: keyof UserProfileData, value: string) => setProfileData({ ...profileData, [field]: value });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSaveWithUpload = async () => {
        if (isSaving) return;
        setIsSaving(true);

        // Password Change with Confirmation
        if (newPassword.trim().length > 0) {
            const confirmed = window.confirm("Are you sure you want to change your password?");
            if (!confirmed) {
                setIsSaving(false);
                return;
            }

            const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
            if (pwError) {
                addToast("Error updating password: " + pwError.message, 'error');
                setIsSaving(false);
                return;
            }
            addToast("Password updated successfully!", 'success');
        }

        let finalAvatarUrl = profileData.avatar_url;
        if (selectedFile) {
            // Compress image before upload
            const compressedFile = await compressImage(selectedFile);

            const fileExt = compressedFile.name.split('.').pop();
            const fileName = `avatar-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;
            const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, compressedFile);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                addToast('Failed to upload image. Saving text only.', 'error');
            } else {
                const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
                finalAvatarUrl = data.publicUrl;
            }
        }

        // Split Full Name
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        onSave({
            ...profileData,
            first_name: firstName,
            last_name: lastName,
            // Keep legacy name/surname fields in sync if they exist on the object
            name: firstName,
            surname: lastName,
            avatar_url: finalAvatarUrl
        });

        setNewPassword('');
        // No explicit success toast here as onSave usually handles it or closes modal, 
        // but adding one for clarity if onSave is silent.
        // Assuming onSave does the DB update.
        // addToast("Profile saved!", 'success'); // Optional, leaving to onSave logic

        setIsSaving(false);
    };

    return (
        <SettingsContainer>
            <SettingsHeader title="Edit Profile" onBack={onBack} />
            <div className="flex-1 overflow-y-auto no-scrollbar">

                {/* Profile Picture */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-28 h-28 rounded-full relative mb-4 cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-full h-full rounded-full border-2 border-white flex items-center justify-center overflow-hidden bg-[#1a1a1a]">
                            {previewUrl ? (
                                <img src={previewUrl} className="w-full h-full object-cover" alt="Profile" />
                            ) : (
                                <UserIcon size={48} className="text-white" />
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border-2 border-black group-hover:bg-gray-200 transition-colors">
                            <Camera size={14} className="text-black" />
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tap image to change</span>
                </div>

                <form onSubmit={(e) => e.preventDefault()} className="px-2 pb-12">
                    <SettingsTextArea label="Profile Bio" value={profileData.bio} onChange={(v) => handleChange('bio', v)} />

                    <SettingsInput
                        label="Full Name"
                        value={fullName}
                        onChange={(v) => setFullName(v)}
                        placeholder="e.g. John Doe"
                    />

                    <SettingsInput label="Username" value={profileData.username} onChange={(v) => handleChange('username', v)} />

                    <SettingsInput
                        label="New Password"
                        value={newPassword}
                        type="password"
                        placeholder="Change Password"
                        onChange={(v) => setNewPassword(v)}
                    />

                    <SettingsInput label="Email Address" value={profileData.email} onChange={(v) => handleChange('email', v)} />
                    <SettingsInput label="Mobile Number" value={profileData.mobile} onChange={(v) => handleChange('mobile', v)} />

                    <button
                        onClick={handleSaveWithUpload}
                        disabled={isSaving}
                        className="w-full bg-east-light text-black font-montserrat font-black italic text-lg py-3 rounded-full uppercase tracking-wider shadow-lg hover:bg-white transition-all mt-8 mb-4 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? 'SAVING...' : <><Save size={20} /> SAVE CHANGES</>}
                    </button>
                </form>
            </div>
        </SettingsContainer>
    );
};

// Removed: PreferencesScreen component (preferences managed via ParentProfile availability calendar instead)

export default function SettingsModal({ onClose, onLogout, profileData, setProfileData, onSave, onShowHistory }: {
    onClose: () => void,
    onLogout: () => void,
    profileData: UserProfileData,
    setProfileData: (data: UserProfileData) => void,
    onSave: (data: UserProfileData) => void,
    onShowHistory: () => void
}) {
    const router = useRouter();
    const [view, setView] = useState<'menu' | 'edit'>('menu');
    const { addToast } = useToast();

    if (view === 'edit') return <EditProfileScreen onBack={() => setView('menu')} profileData={profileData} setProfileData={setProfileData} onSave={onSave} />;

    return (
        <SettingsContainer>
            <SettingsHeader title="Settings" onBack={onClose} isClose={true} />
            <div className="flex-1 overflow-y-auto no-scrollbar pb-12">
                <SettingsSectionTitle title="My Profile" />
                <SettingsMenuItem icon={UserCog} label="Personal Details" onClick={() => setView('edit')} />
                <SettingsMenuItem icon={CreditCard} label="Membership" onClick={() => router.push('/membership')} testId="menu-item-membership" />
                <SettingsMenuItem
                    icon={CreditCard}
                    label="Top Up Credits"
                    onClick={() => router.push('/top-up')}
                />
                <SettingsMenuItem
                    icon={FileText}
                    label="Transaction History"
                    onClick={onShowHistory}
                />
                <SettingsSectionTitle title="Help" />
                <SettingsMenuItem icon={FileText} label="FAQ's" onClick={() => router.push('/faq')} />
                <SettingsMenuItem icon={HelpCircle} label="Support" onClick={() => router.push('/support')} />
                <SettingsSectionTitle title="About" />
                <SettingsMenuItem icon={Shield} label="Privacy Policy" onClick={() => router.push('/privacy')} />
                <SettingsMenuItem icon={FileText} label="Terms & conditions" onClick={() => router.push('/terms')} />
                <div className="mt-12 px-2">
                    <button onClick={onLogout} className="flex items-center gap-4 w-full py-4 text-red-500 hover:bg-red-500/10 transition-colors rounded-lg px-4">
                        <LogOut size={20} />
                        <span className="font-montserrat font-bold text-sm">Log Out</span>
                    </button>
                </div>
            </div>
        </SettingsContainer>
    );
}