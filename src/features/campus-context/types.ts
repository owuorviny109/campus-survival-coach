import { z } from 'zod';
import { CampusTypeSchema } from '../user-profile/types';

export const CampusContextSchema = z.object({
    type: CampusTypeSchema,

    // Economic Baselines (in KSh)
    costs: z.object({
        foodRange: z.tuple([z.number(), z.number()]), // [min, max]
        transportDaily: z.number(),
        housingRange: z.tuple([z.number(), z.number()]),
    }),

    // Cultural Data
    commonFoods: z.array(z.string()),
    survivalTips: z.array(z.string()),

    // Specific strategies for this environment
    strategies: z.object({
        cheapEats: z.array(z.string()),
        transportHacks: z.array(z.string()),
    })
});

export type CampusContext = z.infer<typeof CampusContextSchema>;
