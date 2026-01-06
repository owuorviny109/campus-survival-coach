function App() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="max-w-2xl w-full mx-4 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
                <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                    Campus Survival Coach
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                    Initial setup complete. System Architecture ready.
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h3 className="font-semibold text-blue-900">Runway Calculator</h3>
                        <p className="text-sm text-blue-700">Module Initialized</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <h3 className="font-semibold text-purple-900">AI Advisor</h3>
                        <p className="text-sm text-purple-700">Module Initialized</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App
