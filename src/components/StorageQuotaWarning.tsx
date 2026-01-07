import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

export function StorageQuotaWarning() {
    const [showWarning, setShowWarning] = useState(false);
    const [errorKey, setErrorKey] = useState<string>('');

    useEffect(() => {
        const handleQuotaExceeded = (event: Event) => {
            const customEvent = event as CustomEvent;
            setErrorKey(customEvent.detail?.key || 'unknown');
            setShowWarning(true);
        };

        window.addEventListener('storage-quota-exceeded', handleQuotaExceeded);

        return () => {
            window.removeEventListener('storage-quota-exceeded', handleQuotaExceeded);
        };
    }, []);

    const handleClearOldData = () => {
        if (confirm('Clear old saved data to free up space?')) {
            // Keep only essential keys
            const essential = ['csc_student_profile_v1', 'csc_financials_v1'];
            const allKeys = Object.keys(localStorage);

            allKeys.forEach(key => {
                if (!essential.includes(key)) {
                    localStorage.removeItem(key);
                }
            });

            setShowWarning(false);
            toast.success('Old data cleared. Please try again.');
        }
    };

    const handleExportData = () => {
        // Export all localStorage to JSON file
        const data: Record<string, any> = {};
        Object.keys(localStorage).forEach(key => {
            try {
                data[key] = JSON.parse(localStorage.getItem(key) || '');
            } catch {
                data[key] = localStorage.getItem(key);
            }
        });

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campus-survival-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Backup file download started');
    };

    if (!showWarning) return null;

    return (
        <div className="fixed bottom-4 right-4 max-w-md z-50 animate-in slide-in-from-bottom">
            <Card className="border-red-500 bg-red-50">
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-2">
                        <span className="text-2xl">⚠️</span>
                        <div className="flex-1">
                            <h3 className="font-bold text-red-800">Storage Quota Exceeded</h3>
                            <p className="text-sm text-red-700 mt-1">
                                Your browser's storage is full. Recent changes may not have been saved.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowWarning(false)}
                            className="text-red-800 hover:text-red-900"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleExportData}
                            className="flex-1 text-xs"
                        >
                            📥 Export Data
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleClearOldData}
                            className="flex-1 text-xs"
                        >
                            🗑️ Clear Old Data
                        </Button>
                    </div>

                    {import.meta.env.DEV && (
                        <p className="text-xs text-slate-600">
                            Failed key: <code className="bg-slate-200 px-1 rounded">{errorKey}</code>
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
