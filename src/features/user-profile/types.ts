import { z } from 'zod';

// Campus Types
export const CampusTypeSchema = z.enum(['rural', 'town', 'city']);
export type CampusType = z.infer<typeof CampusTypeSchema>;

// Living Arrangements
export const LivingArrangementSchema = z.enum([
    'on-campus',
    'off-campus-shared',
    'off-campus-alone'
]);
export type LivingArrangement = z.infer<typeof LivingArrangementSchema>;

// Food Habits
export const FoodHabitSchema = z.enum([
    'mostly-cook',
    'mostly-buy',
    'mixed'
]);
export type FoodHabit = z.infer<typeof FoodHabitSchema>;

// Transport Patterns
export const TransportPatternSchema = z.enum([
    'walking',
    'public-transport',
    'mixed'
]);
export type TransportPattern = z.infer<typeof TransportPatternSchema>;

// The Main Student Profile Schema
// This is the "Truth" of our user state
export const StudentProfileSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, "Name is required"),
    createdAt: z.coerce.date(), // Coerce handles ISO string -> Date conversion
    lastUpdated: z.coerce.date(),

    // Context
    campusType: CampusTypeSchema,
    livingArrangement: LivingArrangementSchema,

    // Preferences
    foodHabits: FoodHabitSchema,
    transportPattern: TransportPatternSchema,

    // Baseline Data (for calculations)
    cheapestMealCost: z.number().min(0, "Cost cannot be negative"),

    // Financial Snapshot (denormalized for offline speed)
    currentBalance: z.number(),
});

export type StudentProfile = z.infer<typeof StudentProfileSchema>;
