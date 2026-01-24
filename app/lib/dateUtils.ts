import { format, toZonedTime } from 'date-fns-tz';

const HK_TIMEZONE = 'Asia/Hong_Kong';

/**
 * Safely parses a date string that might be in SQL format (YYYY-MM-DD HH:MM:SS)
 * or ISO format. Handles Safari's strict parsing requirements.
 */
export function safeDate(dateInput: string | number | Date | null | undefined): Date | null {
    if (!dateInput && dateInput !== 0) return null;
    if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;

    let d: Date;
    if (typeof dateInput === 'number') {
        d = new Date(dateInput);
    } else {
        let dateStr = dateInput as string;
        // Fix SQL format "2023-01-01 10:00:00" -> "2023-01-01T10:00:00"
        if (dateStr.includes(' ') && !dateStr.includes('T')) {
            dateStr = dateStr.replace(' ', 'T');
        }
        d = new Date(dateStr);
    }

    return isNaN(d.getTime()) ? null : d;
}

/**
 * Gets the current time in Hong Kong
 */
export function getNowHK(): Date {
    return toZonedTime(new Date(), HK_TIMEZONE);
}

/**
 * Converts a UTC date to Hong Kong time
 */
export function toHKTime(date: Date | string | number | null | undefined): Date {
    const d = safeDate(date) || new Date();
    return toZonedTime(d, HK_TIMEZONE);
}

/**
 * Formats a date for Hong Kong display
 * Default: 'h:mm aa' (e.g., 2:30 PM)
 */
export function formatHK(date: Date | string | number | null | undefined, pattern: string = 'h:mm aa'): string {
    const zonedDate = toHKTime(date);
    return format(zonedDate, pattern, { timeZone: HK_TIMEZONE });
}

/**
 * Formats a date for Audit Logs in Hong Kong
 * Format: 'yyyy-MM-dd HH:mm:ss'
 */
export function formatAuditHK(date: Date | string | number | null | undefined): string {
    return formatHK(date, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Formats a date for readable session display
 */
export function formatSessionHK(date: Date | string | number | null | undefined): string {
    return formatHK(date, 'EEEE, MMM do @ h:mm aa');
}

export function safeISO(dateInput: string | number | Date | null | undefined): string {
    const d = safeDate(dateInput);
    if (!d) return '';
    return d.toISOString();
}

/**
 * Returns YYYY-MM-DD for input[type="date"]
 */
export function safeDateFiles(dateInput: string | number | Date | null | undefined): string {
    const d = safeDate(dateInput);
    if (!d) return '';
    return d.toISOString().split('T')[0];
}

/**
 * Safe wrapper for toLocaleDateString
 */
export function safetoLocaleDateString(dateInput: string | number | Date | null | undefined, locale?: string | string[], options?: Intl.DateTimeFormatOptions): string {
    const d = safeDate(dateInput);
    if (!d) return 'N/A';
    try {
        return d.toLocaleDateString(locale, options);
    } catch (e) {
        return 'Invalid Date';
    }
}
