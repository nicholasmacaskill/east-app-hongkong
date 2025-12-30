
'use client';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, Check, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed bottom-0 left-0 right-0 z-[100] flex flex-col items-center gap-2 p-4 pointer-events-none">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(toast.id);
        }, 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    const bgColors = {
        success: 'bg-east-light text-black',
        error: 'bg-red-600 text-white',
        info: 'bg-blue-600 text-white',
        warning: 'bg-yellow-500 text-black',
    };

    const Icons = {
        success: Check,
        error: AlertTriangle,
        info: Info,
        warning: AlertTriangle,
    };

    const Icon = Icons[toast.type];

    return (
        <div className={`pointer-events-auto animate-slideUp min-w-[300px] max-w-sm rounded-[1.5rem] p-4 shadow-2xl flex items-center justify-between gap-4 font-montserrat font-bold italic text-sm uppercase tracking-wide border-2 border-black/10 ${bgColors[toast.type]}`}>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center shrink-0">
                    <Icon size={16} strokeWidth={3} />
                </div>
                <span>{toast.message}</span>
            </div>
            <button onClick={() => onDismiss(toast.id)} className="p-1 hover:bg-black/10 rounded-full transition-colors">
                <X size={16} />
            </button>
        </div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
