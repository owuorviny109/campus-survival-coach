import { createContext, useContext, ReactNode } from 'react';
import { useStudentProfile } from './hooks';

type ProfileContextType = ReturnType<typeof useStudentProfile>;

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
    const profileState = useStudentProfile();
    return (
        <ProfileContext.Provider value={profileState}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile() {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within ProfileProvider');
    }
    return context;
}
