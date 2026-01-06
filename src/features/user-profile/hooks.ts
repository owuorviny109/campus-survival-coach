import { StudentProfile, StudentProfileSchema } from './types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
// Native crypto.randomUUID used instead

/**
 * Custom hook to manage the student profile state.
 * Encapsulates the storage logic and provides high-level methods.
 */
export function useStudentProfile() {
    const [profile, setProfile, error] = useLocalStorage<StudentProfile | null>(
        'csc_student_profile_v1',
        StudentProfileSchema.nullable(),
        null
    );

    /**
     * Initializes a new profile.
     */
    const createProfile = (data: Omit<StudentProfile, 'id' | 'createdAt' | 'lastUpdated'>) => {
        const newProfile: StudentProfile = {
            ...data,
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`,
            createdAt: new Date(),
            lastUpdated: new Date()
        };
        setProfile(newProfile);
    };

    /**
     * Updates existing profile fields.
     */
    const updateProfile = (updates: Partial<StudentProfile>) => {
        if (!profile) return;
        setProfile(prev => {
            if (!prev) return null;
            return {
                ...prev,
                ...updates,
                lastUpdated: new Date()
            };
        });
    };

    /**
     * Clears the profile (Logout/Reset)
     */
    const resetProfile = () => {
        setProfile(null);
    }

    return {
        profile,
        isLoading: false, // LocalStorage is synchronous (mostly), but good to have for future async migration
        error,
        createProfile,
        updateProfile,
        resetProfile,
        hasProfile: !!profile
    };
}
