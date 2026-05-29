import { usePostHog } from 'posthog-js/react';

export type TrackingEvent =
    | 'session_booked'
    | 'session_cancelled'
    | 'schedule_viewed'
    | 'credits_purchased'
    | 'membership_subscribed'
    | 'checkout_started'
    | 'drill_viewed'
    | 'drill_created'
    | 'session_plan_created'
    | 'whiteboard_used'
    | 'account_created'
    | 'child_added'
    | 'profile_updated'
    | 'news_article_read'
    | 'leaderboard_viewed'
    | 'booking_abandoned';

export function useTracking() {
    const posthog = usePostHog();

    const track = (eventName: TrackingEvent, properties?: Record<string, any>) => {
        if (posthog) {
            posthog.capture(eventName, properties);
        }
    };

    return { track };
}
