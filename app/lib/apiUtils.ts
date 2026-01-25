
/**
 * Result type for safeFetch operations
 */
export type SafeFetchResult<T> = {
    success: boolean;
    data?: T;
    error?: string;
    status?: number;
};

/**
 * A wrapper around fetch that handles timeouts, networking errors, and JSON parsing.
 * Prevents unhandled promise rejections from crashing the app.
 * 
 * @param url The URL to fetch
 * @param options Fetch options (method, headers, body, etc.)
 * @param timeoutMs Timeout in milliseconds (default 10000ms)
 */
export async function safeFetch<T = any>(
    url: string,
    options?: RequestInit,
    timeoutMs: number = 10000
): Promise<SafeFetchResult<T>> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(id);

        // Handle non-200 responses
        if (!response.ok) {
            let errorMessage = `HTTP Error ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                // Response wasn't JSON, ignore
            }
            return {
                success: false,
                status: response.status,
                error: errorMessage,
            };
        }

        // Parse JSON
        try {
            const data = await response.json();
            return { success: true, data, status: response.status };
        } catch (e) {
            return {
                success: false,
                status: response.status,
                error: "Invalid JSON response",
            };
        }

    } catch (error: any) {
        clearTimeout(id);

        // Handle AbortError (Timeout)
        if (error.name === 'AbortError') {
            return {
                success: false,
                error: "Request timed out. Please check your connection.",
                status: 408 // Request Timeout
            };
        }

        // Handle Network Errors (Offline, DNS, etc)
        // Note: TypeError is commonly thrown by fetch for network issues
        const isNetworkError = error.message === 'Failed to fetch' || error.name === 'TypeError';

        return {
            success: false,
            error: isNetworkError ? "Network error. Please check your connection." : (error.message || "Unknown error"),
            status: 0
        };
    }
}
