import { format, toZonedTime } from 'date-fns-tz';

const HK_TIMEZONE = 'Asia/Hong_Kong';

/**
 * Gets the current time in Hong Kong
 */
export function getNowHK(): Date {
    return toZonedTime(new Date(), HK_TIMEZONE);
}

/**
 * Converts a UTC date to Hong Kong time
 */
export function toHKTime(date: Date | string | number): Date {
    const d = new Date(date);
    return toZonedTime(d, HK_TIMEZONE);
}

/**
 * Formats a date for Hong Kong display
 * Default: 'h:mm aa' (e.g., 2:30 PM)
 */
export function formatHK(date: Date | string | number, pattern: string = 'h:mm aa'): string {
    const zonedDate = toHKTime(date);
    return format(zonedDate, pattern, { timeZone: HK_TIMEZONE });
}

/**
 * Formats a date for Audit Logs in Hong Kong
 * Format: 'yyyy-MM-dd HH:mm:ss'
 */
export function formatAuditHK(date: Date | string | number): string {
    return formatHK(date, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Formats a date for readable session display
 */
export function formatSessionHK(date: Date | string | number): string {
    return formatHK(date, 'EEEE, MMM do @ h:mm aa');
}
