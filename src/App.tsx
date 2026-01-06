import { useStudentProfile } from './features/user-profile/hooks';
import { OnboardingFlow } from './features/user-profile/components';

function App() {
    const { hasProfile } = useStudentProfile();

    if (!hasProfile) {
        return <OnboardingFlow />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-2xl w-full mx-4 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
                <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                    Welcome Back!
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                    Your dashboard is coming next.
                </p>
            </div>
        </div>
    );
}

export default App;
