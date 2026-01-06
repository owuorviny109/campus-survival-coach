import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';

/**
 * A robust, type-safe hook for LocalStorage with Zod validation.
 * 
 * @template T - The TypeScript type of the data.
 * @param key - The localStorage key.
 * @param schema - The Zod schema to validate the data against.
 * @param initialValue - The default value if no data exists or validation fails.
 * 
 * @returns [value, setValue, error] - The current value, a setter, and any validation error.
 * 
 * @example
 * const [profile, setProfile] = useLocalStorage('user_profile', StudentProfileSchema, null);
 */
export function useLocalStorage<T>(
    key: string,
    schema: z.ZodType<T>,
    initialValue: T
): [T, (value: T | ((val: T) => T)) => void, Error | null] {
    // State to store our value
    // Pass initial state function to useState so logic only runs once
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            if (!item) return initialValue;

            // Parse JSON
            const parsed = JSON.parse(item);

            // Validate with Zod
            // This ensures that even if a user edits LocalStorage manually,
            // our app won't crash with invalid data types.
            const result = schema.safeParse(parsed);

            if (result.success) {
                return result.data;
            } else {
                console.error(`LocalStorage Validation Error for key "${key}":`, result.error);
                // Fallback to initial value if schema doesn't match
                return initialValue;
            }
        } catch (error) {
            console.error(`LocalStorage Read Error for key "${key}":`, error);
            return initialValue;
        }
    });

    const [error, setError] = useState<Error | null>(null);

    /**
     * Sets the value in both React state and LocalStorage.
     */
    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            // Save state
            setStoredValue(valueToStore);

            // Save to local storage
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(`LocalStorage Write Error for key "${key}":`, error);
            setError(error instanceof Error ? error : new Error(String(error)));
        }
    }, [key, storedValue]);

    // Listen for changes from other tabs/windows
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    const result = schema.safeParse(parsed);
                    if (result.success) {
                        setStoredValue(result.data);
                    }
                } catch (error) {
                    // Ignore parse errors from other tabs
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key, schema]);

    return [storedValue, setValue, error];
}
