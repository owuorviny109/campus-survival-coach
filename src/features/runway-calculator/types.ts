import { z } from 'zod';

// Income Event
export const IncomeEventSchema = z.object({
    id: z.string().uuid(),
    amount: z.number().positive("Income must be positive"),
    date: z.date(),
    source: z.string().min(1, "Source is required"),
    reliability: z.enum(['certain', 'likely', 'uncertain']),
    isReceived: z.boolean().optional().default(false),
});
export type IncomeEvent = z.infer<typeof IncomeEventSchema>;

// Fixed Expense (Rent, Netflix, etc.)
export const FixedExpenseSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, "Name is required"),
    amount: z.number().positive("Expense must be positive"),
    dueDay: z.number().min(1).max(31), // Day of month
    category: z.enum(['housing', 'transport', 'utilities', 'subscriptions', 'other']),
});
export type FixedExpense = z.infer<typeof FixedExpenseSchema>;

// The Calculation Result
export const RunwayResultSchema = z.object({
    daysRemaining: z.number(),
    safeDailySpend: z.number(),
    brokeDate: z.date(),
    status: z.enum(['good', 'warning', 'critical']),
    projectedBalance: z.array(z.object({
        date: z.string(), // ISO String for UI
        balance: z.number()
    }))
});
export type RunwayResult = z.infer<typeof RunwayResultSchema>;
