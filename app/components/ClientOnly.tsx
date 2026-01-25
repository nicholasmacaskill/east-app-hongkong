'use client';

import { useEffect, useState } from 'react';

export default function ClientOnly({ children, placeholder = null }: { children: React.ReactNode, placeholder?: React.ReactNode }) {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return placeholder;
    }

    return <>{children}</>;
}
