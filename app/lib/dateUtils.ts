
import { format, parseISO, isValid } from 'date-fns';

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

export function formatAuditHK(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    // Simple ISO return for audit logs to ensure consistency
    return d.toISOString();
}
