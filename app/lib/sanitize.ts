import xss from 'xss';

/**
 * Sanitizes a string by removing potential XSS attacks.
 * Uses a white-list approach (defaulting to allowing safe tags only if configured, but cleaner strict for plain text).
 * 
 * @param input - The string to sanitize
 * @param strict - If true, strips ALL HTML tags (good for plain text inputs)
 */
export function sanitize(input: string, strict: boolean = true): string {
    if (!input) return input;

    // Customize whitelist if strict is false
    const options = strict ? {
        whiteList: {}, // No tags allowed
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script', 'style'] // Remove content of potentially dangerous tags
    } : undefined; // Use default whitelist for rich text

    return xss(input, options);
}

/**
 * Sanitizes all string properties of an object recursively
 * @param obj - The object to sanitize
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const result = { ...obj };

    for (const key in result) {
        if (typeof result[key] === 'string') {
            result[key] = sanitize(result[key] as string) as any;
        } else if (typeof result[key] === 'object' && result[key] !== null) {
            result[key] = sanitizeObject(result[key]);
        }
    }

    return result;
}
