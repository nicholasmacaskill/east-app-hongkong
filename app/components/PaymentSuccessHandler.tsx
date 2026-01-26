'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/app/components/ui/Toast';

export default function PaymentSuccessHandler() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { addToast } = useToast();
    // Use a ref to prevent double-firing in Strict Mode
    const hasFired = useRef(false);

    useEffect(() => {
        if (hasFired.current) return;

        const success = searchParams.get('success');
        const canceled = searchParams.get('canceled');

        if (success === 'true') {
            hasFired.current = true;

            // Track that purchase was successful (persists even after URL cleanup)
            sessionStorage.setItem('just_purchased', 'true');

            // Force router refresh to reload all server data (credits, profile, etc.)
            router.refresh();

            addToast('Payment Successful! Credits Added.', 'success');

            // Clean URL without refresh
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }

        if (canceled === 'true') {
            hasFired.current = true;
            addToast('Payment Cancelled.', 'info');
            // Clean URL without refresh
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }

    }, [searchParams, addToast, router]);

    return null;
}
