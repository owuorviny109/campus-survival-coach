import { useRunwayCalculation } from '../hooks';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { cn } from '../../../lib/utils';
import { format } from 'date-fns';

export function RunwayDashboard() {
    const runway = useRunwayCalculation();

    if (!runway) return <div>Loading...</div>;

    const { daysRemaining, safeDailySpend, status, brokeDate, estimatedDailySpend } = runway;

    // Visual status map
    const statusColors = {
        good: 'bg-green-100 text-green-800 border-green-200',
        warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        critical: 'bg-red-50 text-red-800 border-red-200',
    };

    const statusMessage = {
        good: "You're safe for now! Keep it up.",
        warning: "Tighten your belt a bit.",
        critical: "Emergency Mode! Action needed."
    };

    return (
        <div className="space-y-6">
            {/* Hero Card: The Big Number */}
            <Card className={cn("border-l-4 shadow-md", {
                'border-l-green-500': status === 'good',
                'border-l-yellow-500': status === 'warning',
                'border-l-red-500': status === 'critical',
            })}>
                <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                                Survival Runway
                            </p>
                            <h1 className="text-5xl font-extrabold mt-2 text-slate-900">
                                {daysRemaining} <span className="text-2xl font-semibold text-slate-600">days</span>
                            </h1>
                            <p className="text-slate-600 mt-2">
                                Until you hit <span className="font-mono text-red-600 font-bold">0 KSh</span> on {format(brokeDate, 'MMM do')}
                            </p>
                        </div>
                        <div className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase", statusColors[status])}>
                            {status}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Detailed Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Safe Daily Spend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {safeDailySpend} <span className="text-sm font-normal text-slate-500">KSh/day</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            To survive 30 days
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Estimated Actual Cost</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {estimatedDailySpend} <span className="text-sm font-normal text-slate-500">KSh/day</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Based on your food habits
                        </p>
                        {estimatedDailySpend > safeDailySpend && (
                            <p className="text-xs text-red-600 font-semibold mt-1">
                                Warning: You are overspending by {estimatedDailySpend - safeDailySpend} KSh
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Actionable Insight */}
            <div className={cn("p-4 rounded-lg border", statusColors[status])}>
                <div className="flex gap-2">
                    <span className="text-xl">💡</span>
                    <div>
                        <h3 className="font-bold text-sm uppercase opacity-90">Coach's Verdict</h3>
                        <p className="text-sm mt-1">{statusMessage[status]}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
