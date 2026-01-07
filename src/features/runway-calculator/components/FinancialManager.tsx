import { useState } from 'react';
import { useFinancials } from '../hooks';
import { FixedExpense, IncomeEvent } from '../types';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select } from '../../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Trash2, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

export function FinancialManager() {
    const { fixedExpenses, incomeEvents, addFixedExpense, removeFixedExpense, addIncomeEvent, removeIncomeEvent } = useFinancials();
    const [activeTab, setActiveTab] = useState<'expenses' | 'income'>('expenses');

    return (
        <div className="space-y-6">
            <div className="flex space-x-2">
                <Button
                    variant={activeTab === 'expenses' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('expenses')}
                    className="flex-1 gap-2"
                >
                    <TrendingDown size={16} /> Fixed Expenses
                </Button>
                <Button
                    variant={activeTab === 'income' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('income')}
                    className="flex-1 gap-2"
                >
                    <TrendingUp size={16} /> Income Events
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {activeTab === 'expenses' ? 'Monthly Fixed Costs' : 'Expected Income'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {activeTab === 'expenses' ? (
                        <ExpenseSection list={fixedExpenses} onAdd={addFixedExpense} onDelete={removeFixedExpense} />
                    ) : (
                        <IncomeSection list={incomeEvents} onAdd={addIncomeEvent} onDelete={removeIncomeEvent} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// --- Sub-components to keep file clean ---

function ExpenseSection({ list, onAdd, onDelete }: {
    list: FixedExpense[],
    onAdd: (e: FixedExpense) => void,
    onDelete: (id: string) => void
}) {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDay, setDueDay] = useState('1');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !amount || isSubmitting) return;

        setIsSubmitting(true);

        onAdd({
            id: crypto.randomUUID(),
            name,
            amount: Number(amount),
            dueDay: Number(dueDay),
            category: 'other' // default for now
        });

        setName('');
        setAmount('');
        setDueDay('1');

        // Reset after delay to prevent rapid double-submit
        setTimeout(() => setIsSubmitting(false), 300);
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="grid gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="exp-name">Name</Label>
                        <Input id="exp-name" placeholder="Rent, Netflix..." value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="exp-amount">Amount (KSh)</Label>
                        <Input id="exp-amount" type="number" placeholder="5000" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                </div>
                <div className="flex items-end gap-4">
                    <div className="space-y-2 flex-1">
                        <Label htmlFor="exp-day">Due Day of Month</Label>
                        <Select id="exp-day" value={dueDay} onChange={e => setDueDay(e.target.value)}>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                <option key={d} value={d}>{d}{getOrdinal(d)}</option>
                            ))}
                        </Select>
                    </div>
                    <Button
                        type="submit"
                        size="sm"
                        className="flex-1"
                        disabled={isSubmitting || !name || !amount}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="animate-spin mr-1">⏳</span> Adding...
                            </>
                        ) : (
                            <>
                                <Plus size={16} className="mr-1" /> Add Expense
                            </>
                        )}
                    </Button>
                </div>
            </form>

            <div className="space-y-2">
                {list.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No expenses added yet.</p>}
                {list.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-white border rounded-md shadow-sm">
                        <div>
                            <p className="font-medium text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.amount} KSh • Due on {item.dueDay}{getOrdinal(item.dueDay)}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 size={16} />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function IncomeSection({ list, onAdd, onDelete }: {
    list: IncomeEvent[],
    onAdd: (e: IncomeEvent) => void,
    onDelete: (id: string) => void
}) {
    const [source, setSource] = useState('');
    const [amount, setAmount] = useState('');
    // Default to tomorrow
    const [date, setDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!source || !amount || isSubmitting) return;

        setIsSubmitting(true);

        onAdd({
            id: crypto.randomUUID(),
            source,
            amount: Number(amount),
            date: new Date(date),
            reliability: 'likely', // default
            isReceived: false
        });

        setSource('');
        setAmount('');

        // Reset after delay to prevent rapid double-submit
        setTimeout(() => setIsSubmitting(false), 300);
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="grid gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="inc-source">Source</Label>
                        <Input id="inc-source" placeholder="Mom, Loan..." value={source} onChange={e => setSource(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="inc-amount">Amount (KSh)</Label>
                        <Input id="inc-amount" type="number" placeholder="2000" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                </div>
                <div className="flex items-end gap-4">
                    <div className="space-y-2 flex-1">
                        <Label htmlFor="inc-date">Expected Date</Label>
                        <Input id="inc-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <Button
                        type="submit"
                        size="sm"
                        className="flex-1"
                        disabled={isSubmitting || !source || !amount}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="animate-spin mr-1">⏳</span> Adding...
                            </>
                        ) : (
                            <>
                                <Plus size={16} className="mr-1" /> Add Income
                            </>
                        )}
                    </Button>
                </div>
            </form>

            <div className="space-y-2">
                {list.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No expected income.</p>}
                {list.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-white border rounded-md shadow-sm">
                        <div>
                            <p className="font-medium text-slate-900">{item.source}</p>
                            <p className="text-xs text-slate-500">{item.amount} KSh • {format(new Date(item.date), 'MMM do')}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 size={16} />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Utility for "1st", "2nd", etc.
function getOrdinal(n: number) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}
