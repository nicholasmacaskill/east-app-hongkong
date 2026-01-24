/**
 * Safely parses a date string that might be in SQL format (YYYY-MM-DD HH:MM:SS)
 * or ISO format. Handles Safari's strict parsing requirements.
 */
export function safeDate(dateInput: string | Date | null | undefined): Date | null {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;

    let dateStr = dateInput as string;

    // Fix SQL format "2023-01-01 10:00:00" -> "2023-01-01T10:00:00"
    if (dateStr.includes(' ') && !dateStr.includes('T')) {
        dateStr = dateStr.replace(' ', 'T');
    }

    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

export function safeISO(dateInput: string | Date | null | undefined): string {
    const d = safeDate(dateInput);
    if (!d) return '';
    return d.toISOString();
}

/**
 * Returns YYYY-MM-DD for input[type="date"]
 */
export function safeDateFiles(dateInput: string | Date | null | undefined): string {
    const d = safeDate(dateInput);
    if (!d) return '';
    return d.toISOString().split('T')[0];
}

/**
 * Safe wrapper for toLocaleDateString
 */
export function safetoLocaleDateString(dateInput: string | Date | null | undefined, locale?: string | string[], options?: Intl.DateTimeFormatOptions): string {
    const d = safeDate(dateInput);
    if (!d) return 'N/A';
    try {
        return d.toLocaleDateString(locale, options);
    } catch (e) {
        return 'Invalid Date';
    }
}
