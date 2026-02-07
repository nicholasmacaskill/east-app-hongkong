
import { format, parseISO, isValid } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';

export const APP_TIMEZONE = 'Asia/Hong_Kong';
const HK_TZ = APP_TIMEZONE;

/**
 * Safely parses a date string, handling iOS/Safari specific format issues.
 * Replaces space separators with 'T' for ISO-8601 compliance.
 * 
 * @param dateString The date string to parse
 * @returns A Date object, or null if invalid
 */
export function safeDate(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;

    // If it's already a Date object, return it if valid
    if (Object.prototype.toString.call(dateString) === '[object Date]') {
        return isValid(dateString as any) ? (dateString as any) : null;
    }

    if (typeof dateString !== 'string') {
        // If it's a number (timestamp), try to parse it
        if (typeof dateString === 'number') {
            const d = new Date(dateString);
            return isValid(d) ? d : null;
        }
        return null;
    }

    // Fix "YYYY-MM-DD HH:mm:ss" format for Safari which demands "YYYY-MM-DDTHH:mm:ss"
    let cleanString = dateString.trim();

    // Check if it matches approximate SQL timestamp format "YYYY-MM-DD HH:..."
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:/.test(cleanString)) {
        cleanString = cleanString.replace(' ', 'T');
    }

    const parsed = new Date(cleanString);

    // If native parsing fails, try date-fns parseISO which is more robust
    if (!isValid(parsed)) {
        try {
            const isoParsed = parseISO(cleanString);
            if (isValid(isoParsed)) return isoParsed;
        } catch (e) {
            console.warn("safeDate: Failed to parse", dateString);
        }
        return null; // Return null instead of Invalid Date to allow checks
    }

    return parsed;
}

/**
 * Safely formats a date, returning a fallback string on error instead of throwing.
 * 
 * @param date The date to format (Date object or string)
 * @param formatStr The date-fns format string
 * @param fallback Fallback string if parsing fails
 */
export function formatDateSafe(
    date: string | Date | null | undefined,
    formatStr: string = 'PP',
    fallback: string = 'Invalid Date'
): string {
    if (!date) return fallback;

    const dateObj = typeof date === 'string' ? safeDate(date) : date;

    if (!dateObj || !isValid(dateObj)) {
        return fallback;
    }

    try {
        return format(dateObj, formatStr);
    } catch (error) {
        console.warn(`formatDateSafe: Error formatting date`, error);
        return fallback;
    }
}

/**
 * Safely formats a date using toLocaleDateString, handling invalid inputs gracefully.
 * 
 * @param date The date to format (Date object, string, or null/undefined)
 * @param locales Optional locales argument for toLocaleDateString
 * @param options Optional options argument for toLocaleDateString
 * @param fallback Fallback string if parsing fails (default: '')
 */
export function safetoLocaleDateString(
    date: string | Date | null | undefined,
    locales?: string | string[],
    options?: Intl.DateTimeFormatOptions,
    fallback: string = ''
): string {
    if (!date) return fallback;

    const dateObj = typeof date === 'string' ? safeDate(date) : date;

    if (!dateObj || !isValid(dateObj)) {
        return fallback;
    }

    try {
        return dateObj.toLocaleDateString(locales, options);
    } catch (error) {
        console.warn(`safetoLocaleDateString: Error formatting date`, error);
        return fallback;
    }
}

/**
 * Specifically formats a date string into HK time for display.
 */
export function formatHK(date: string | Date, formatStr: string = 'p'): string {
    const d = typeof date === 'string' ? safeDate(date) : date;
    if (!d || !isValid(d)) return '';
    return formatInTimeZone(d, HK_TZ, formatStr);
}

/**
 * Converts a date (potentially naive from a picker) into a UTC ISO string, 
 * treating naive inputs as being in Hong Kong time.
 */
export function toHKISO(dateStr: string): string {
    // If it's already an ISO with Z or offset, we parse it as is then ensure it's ISO.
    if (dateStr.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr)) {
        const d = safeDate(dateStr);
        return d ? d.toISOString() : dateStr;
    }

    // Otherwise, treat as naive HK time (e.g. from datetime-local)
    try {
        // toDate handles the timezone conversion if we provide the zone
        // Actually toDate parses it, but we want to assert it IS HKT.
        const d = toDate(dateStr, { timeZone: HK_TZ });
        return d.toISOString();
    } catch (e) {
        console.error("toHKISO failed for", dateStr, e);
        return new Date(dateStr).toISOString();
    }
}

/**
 * Converts a UTC ISO string to the format needed for <input type="datetime-local"> 
 * in Asia/Hong_Kong timezone.
 */
export function toHKPickerValue(date: string | Date | null | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? safeDate(date) : date;
    if (!d || !isValid(d)) return '';
    return formatInTimeZone(d, HK_TZ, "yyyy-MM-dd'T'HH:mm");
}

export function formatAuditHK(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    // Simple ISO return for audit logs to ensure consistency
    return d.toISOString();
}
