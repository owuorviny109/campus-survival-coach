import { addDays, isSameDay, getDate } from 'date-fns';
import { FixedExpense, IncomeEvent, RunwayResult } from './types';

export class RunwayLogic {
    /**
     * Safe version of calculateRunway that returns errors instead of throwing
     */
    static calculateRunwaySafe(params: Parameters<typeof RunwayLogic.calculateRunway>[0]): { success: true; result: RunwayResult } | { success: false; error: string } {
        try {
            const result = RunwayLogic.calculateRunway(params);
            return { success: true, result };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Calculates how long the student survives based on current spending.
     */
    static calculateRunway(params: {
        currentBalance: number;
        startDate: Date;
        fixedExpenses: FixedExpense[];
        incomeEvents: IncomeEvent[];
        dailyVariableSpend: number;
    }): RunwayResult {
        const { currentBalance, startDate, fixedExpenses, incomeEvents, dailyVariableSpend } = params;

        // ===== INPUT VALIDATION =====

        // Validate balance
        if (!Number.isFinite(currentBalance)) {
            throw new Error(`Invalid balance: must be a finite number, got ${currentBalance}`);
        }
        if (currentBalance < -1000000) {
            throw new Error(`Balance too low: ${currentBalance} (minimum: -1,000,000)`);
        }
        if (currentBalance > 100000000) {
            throw new Error(`Balance too high: ${currentBalance} (maximum: 100,000,000)`);
        }

        // Validate daily spend
        if (!Number.isFinite(dailyVariableSpend)) {
            throw new Error(`Invalid daily spend: must be a finite number, got ${dailyVariableSpend}`);
        }
        if (dailyVariableSpend < 0) {
            throw new Error(`Daily spend cannot be negative: ${dailyVariableSpend}`);
        }
        if (dailyVariableSpend > 100000) {
            throw new Error(`Daily spend unrealistically high: ${dailyVariableSpend} (maximum: 100,000)`);
        }

        // Validate start date
        if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
            throw new Error(`Invalid start date: ${startDate}`);
        }

        // Validate fixed expenses
        for (const expense of fixedExpenses) {
            if (!Number.isFinite(expense.amount) || expense.amount <= 0) {
                throw new Error(`Invalid expense amount for "${expense.name}": ${expense.amount}`);
            }
            if (!Number.isInteger(expense.dueDay) || expense.dueDay < 1 || expense.dueDay > 31) {
                throw new Error(`Invalid dueDay for "${expense.name}": ${expense.dueDay} (must be 1-31)`);
            }
        }

        // Validate income events
        for (const income of incomeEvents) {
            if (!Number.isFinite(income.amount) || income.amount <= 0) {
                throw new Error(`Invalid income amount for "${income.source}": ${income.amount}`);
            }
            if (!(income.date instanceof Date) || isNaN(income.date.getTime())) {
                throw new Error(`Invalid income date for "${income.source}": ${income.date}`);
            }
        }

        // ===== END VALIDATION =====

        // Safety check (redundant but kept for backwards compat logic)
        if (currentBalance < 0) {
            return {
                daysRemaining: 0,
                safeDailySpend: 0,
                brokeDate: startDate,
                status: 'critical',
                projectedBalance: []
            };
        }

        let balance = currentBalance;
        let currentDate = startDate;
        let daysResult = 0;
        const maxDays = 365; // Don't project beyond a year
        const projection = [];

        // Simulate day by day
        while (daysResult < maxDays) {
            // 1. Add Income for today
            const todaysIncome = incomeEvents
                .filter(e => isSameDay(e.date, currentDate))
                .reduce((sum, e) => sum + e.amount, 0);

            balance += todaysIncome;

            // 2. Subtract Fixed Expenses for today
            const currentDayOfMonth = getDate(currentDate);
            const todaysFixedExpenses = fixedExpenses
                .filter(e => e.dueDay === currentDayOfMonth)
                .reduce((sum, e) => sum + e.amount, 0);

            balance -= todaysFixedExpenses;

            // 3. Subtract Daily Variable Cost (Food, etc.)
            balance -= dailyVariableSpend;

            // Record state
            projection.push({
                date: currentDate.toISOString(),
                balance: Math.floor(balance)
            });

            // Check failure
            if (balance < 0) {
                break;
            }

            // Advance
            currentDate = addDays(currentDate, 1);
            daysResult++;
        }

        // Calculate Status
        let status: 'good' | 'warning' | 'critical' = 'good';
        if (daysResult < 7) status = 'critical';
        else if (daysResult < 30) status = 'warning';

        // Calculate Safe Daily Spend (to last 30 days or max realized days)
        // Formula: (Current Balance + Future Income - Future Fixed) / Days
        // This is complex because 'Days' is variable. 
        // Simplified: "To survive 30 days, what can I spend?"
        const safeSpend = this.calculateSafeSpendForTarget(30, params);

        return {
            daysRemaining: daysResult,
            brokeDate: currentDate,
            safeDailySpend: safeSpend,
            status,
            projectedBalance: projection
        };
    }

    /**
     * Helper: Calculates max daily spend to reach a target day count.
     */
    private static calculateSafeSpendForTarget(targetDays: number, params: {
        currentBalance: number;
        startDate: Date;
        fixedExpenses: FixedExpense[];
        incomeEvents: IncomeEvent[];
    }): number {
        let availableMoney = params.currentBalance;
        const targetDate = addDays(params.startDate, targetDays);

        // Add all income in range
        const relevantIncome = params.incomeEvents
            .filter(e => e.date <= targetDate && e.date >= params.startDate)
            .reduce((sum, e) => sum + e.amount, 0);

        availableMoney += relevantIncome;

        // Subtract all fixed expenses in range
        let tempDate = params.startDate;
        let totalFixed = 0;
        for (let i = 0; i < targetDays; i++) {
            const dayOfMonth = getDate(tempDate);
            const dailyFixed = params.fixedExpenses
                .filter(e => e.dueDay === dayOfMonth)
                .reduce((sum, e) => sum + e.amount, 0);
            totalFixed += dailyFixed;
            tempDate = addDays(tempDate, 1);
        }

        availableMoney -= totalFixed;

        if (availableMoney <= 0) return 0;
        return Math.floor(availableMoney / targetDays);
    }
}
