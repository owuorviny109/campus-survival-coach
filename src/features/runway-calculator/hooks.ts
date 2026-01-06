import { z } from 'zod';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { FixedExpenseSchema, IncomeEventSchema, FixedExpense, IncomeEvent } from './types';
import { RunwayLogic } from './logic';
import { useStudentProfile } from '../user-profile/hooks';

// Consolidated Schema for all financial data
export const FinancialDataSchema = z.object({
    fixedExpenses: z.array(FixedExpenseSchema),
    incomeEvents: z.array(IncomeEventSchema),
});

export type FinancialData = z.infer<typeof FinancialDataSchema>;

export function useFinancials() {
    const [data, setData] = useLocalStorage<FinancialData>(
        'csc_financials_v1',
        FinancialDataSchema as z.ZodType<FinancialData>,
        { fixedExpenses: [], incomeEvents: [] as IncomeEvent[] }
    );

    const addFixedExpense = (expense: FixedExpense) => {
        setData(prev => ({
            ...prev,
            fixedExpenses: [...prev.fixedExpenses, expense]
        }));
    };

    const removeFixedExpense = (id: string) => {
        setData(prev => ({
            ...prev,
            fixedExpenses: prev.fixedExpenses.filter(e => e.id !== id)
        }));
    };

    const addIncomeEvent = (income: IncomeEvent) => {
        setData(prev => ({
            ...prev,
            incomeEvents: [...prev.incomeEvents, income]
        }));
    };

    const removeIncomeEvent = (id: string) => {
        setData(prev => ({
            ...prev,
            incomeEvents: prev.incomeEvents.filter(e => e.id !== id)
        }));
    };

    return {
        fixedExpenses: data.fixedExpenses,
        incomeEvents: data.incomeEvents,
        addFixedExpense,
        removeFixedExpense,
        addIncomeEvent,
        removeIncomeEvent
    };
}

/**
 * Hook that combines Profile + Financials to give the final Runway Result.
 */
export function useRunwayCalculation() {
    const { profile } = useStudentProfile();
    const { fixedExpenses, incomeEvents } = useFinancials();

    if (!profile) return null;

    // Use current date
    const today = new Date();

    // Estimate daily variable spend based on food habits
    // Simple heuristic for now: Cost of cheapest meal * 2.5 (Lunch + Dinner + Breakfast/Snack)
    // If they cook, maybe cheaper.
    let dailyVariableMultiplier = 2.5;
    if (profile.foodHabits === 'mostly-cook') dailyVariableMultiplier = 1.8;
    if (profile.foodHabits === 'mostly-buy') dailyVariableMultiplier = 3.0;

    const estimatedDailySpend = Math.ceil(profile.cheapestMealCost * dailyVariableMultiplier);

    // Run Calculation
    const result = RunwayLogic.calculateRunway({
        currentBalance: profile.currentBalance,
        startDate: today, // Use 'now'
        fixedExpenses,
        incomeEvents,
        dailyVariableSpend: estimatedDailySpend
    });

    return {
        ...result,
        estimatedDailySpend
    };
}
