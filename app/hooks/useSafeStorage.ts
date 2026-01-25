
'use client';

import { useState, useEffect } from 'react';

type StorageType = 'localStorage' | 'sessionStorage';

/**
 * Result of the useSafeStorage hook
 */
type SafeStorageResult<T> = {
    value: T | null;
    setValue: (newValue: T) => void;
    removeItem: () => void;
    isAvailable: boolean;
};

/**
 * A hook to safely access storage APIs.
 * Handles SecurityErrors (Private Mode) and hydration mismatches.
 * 
 * @param key The storage key
 * @param initialValue Initial value if key not found
 * @param type Storage type (localStorage or sessionStorage)
 */
export function useSafeStorage<T>(
    key: string,
    initialValue: T,
    type: StorageType = 'localStorage'
): SafeStorageResult<T> {
    // State to store the value
    // Initialize with initialValue to avoid hydration mismatch, then update in useEffect
    const [storedValue, setStoredValue] = useState<T | null>(initialValue);
    const [isAvailable, setIsAvailable] = useState<boolean>(true);

    // Helper to get the storage object safely
    const getStorage = (): Storage | null => {
        try {
            if (typeof window === 'undefined') return null;
            return window[type];
        } catch (e) {
            return null;
        }
    };

    // Load from storage on mount
    useEffect(() => {
        const storage = getStorage();
        if (!storage) {
            setIsAvailable(false);
            return;
        }

        try {
            const item = storage.getItem(key);
            // Parse stored json or if none return initialValue
            const valueToStore = item ? JSON.parse(item) : initialValue;
            setStoredValue(valueToStore);
        } catch (error) {
            // If error (e.g. parsing or security), fallback to initialValue
            console.warn(`useSafeStorage: Error reading key "${key}":`, error);
            setStoredValue(initialValue);

            // Check if it's a security error (private browsing)
            if (error instanceof DOMException && error.name === 'SecurityError') {
                setIsAvailable(false);
            }
        }
    }, [key, initialValue, type]);

    // Return a wrapped setValue function
    const setValue = (value: T) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // Save state
            setStoredValue(valueToStore);

            // Save to local storage
            const storage = getStorage();
            if (storage) {
                storage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.warn(`useSafeStorage: Error setting key "${key}":`, error);
            if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'SecurityError')) {
                // Handle quota or security errors gracefully
            }
        }
    };

    const removeItem = () => {
        try {
            // Save state
            setStoredValue(initialValue);

            const storage = getStorage();
            if (storage) {
                storage.removeItem(key);
            }
        } catch (error) {
            console.warn(`useSafeStorage: Error removing key "${key}":`, error);
        }
    };

    return { value: storedValue, setValue, removeItem, isAvailable };
}
