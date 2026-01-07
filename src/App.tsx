import { useProfile } from './features/user-profile/ProfileContext';
import { OnboardingFlow } from './features/user-profile/components';
import { RunwayDashboard } from './features/runway-calculator/components';
import { StorageQuotaWarning } from './components/StorageQuotaWarning';
import { Toaster } from 'sonner';

function App() {
    const { hasProfile } = useProfile();

    if (!hasProfile) {
        return (
            <>
                <Toaster richColors position="top-center" />
                <StorageQuotaWarning />
                <OnboardingFlow />
            </>
        );
    }

    return (
        <>
            <Toaster richColors position="top-center" />
            <StorageQuotaWarning />
            <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10">
                <div className="max-w-md w-full mx-4 space-y-8">
                    <header className="flex justify-between items-center px-1">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Survival Coach</h1>
                            <p className="text-xs text-slate-500">Student Edition</p>
                        </div>
                        {/* Placeholder for menu */}
                        <div className="h-8 w-8 rounded-full bg-slate-200"></div>
                    </header>

                    <main>
                        <RunwayDashboard />
                    </main>
                </div>
            </div>
        </>
    );
}

export default App;

