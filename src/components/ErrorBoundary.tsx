import { Component, ReactNode } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: any;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        // Log to console in all environments
        console.error('React Error Boundary caught error:', error, errorInfo);

        // Store in localStorage for debugging
        try {
            const errorLog = {
                timestamp: new Date().toISOString(),
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack
            };
            const logs = JSON.parse(localStorage.getItem('app_error_logs') || '[]');
            logs.push(errorLog);
            if (logs.length > 10) logs.shift(); // Keep last 10
            localStorage.setItem('app_error_logs', JSON.stringify(logs));
        } catch {
            // Silent fail - don't break error boundary
        }

        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    handleClearData = () => {
        if (confirm('This will clear all your data and reload the app. Continue?')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
                    <Card className="max-w-lg w-full">
                        <CardHeader>
                            <CardTitle className="text-red-600 text-xl">
                                ⚠️ Something Went Wrong
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-slate-700">
                                The app encountered an unexpected error. This might be due to:
                            </p>
                            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                <li>Corrupted data in your browser</li>
                                <li>A bug in the application</li>
                                <li>Browser compatibility issue</li>
                            </ul>

                            {import.meta.env.DEV && this.state.error && (
                                <details className="text-xs bg-slate-100 p-3 rounded overflow-auto max-h-48">
                                    <summary className="cursor-pointer font-medium text-red-600">
                                        🐛 Error Details (Development Mode)
                                    </summary>
                                    <pre className="mt-2 whitespace-pre-wrap text-slate-800">
                                        {this.state.error.toString()}
                                        {'\n\n'}
                                        {this.state.error.stack}
                                    </pre>
                                </details>
                            )}

                            <div className="flex gap-2 pt-2">
                                <Button
                                    onClick={this.handleReset}
                                    className="flex-1"
                                    variant="default"
                                >
                                    🔄 Reload App
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={this.handleClearData}
                                    className="flex-1"
                                >
                                    🗑️ Clear Data
                                </Button>
                            </div>

                            <p className="text-xs text-slate-500 text-center pt-2">
                                If this persists, try using a different browser or clearing your browser cache.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
