'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PHProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
        if (typeof window !== 'undefined' && key) {
            posthog.init(key, {
                api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
                capture_pageview: false, // Managed manually for Next.js App Router
                persistence: 'localStorage',
                autocapture: true,
            })
        }
    }, [])

    return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
