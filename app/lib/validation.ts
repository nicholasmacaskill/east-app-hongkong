import { z } from 'zod';

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================

export const announcementSchema = z.object({
    id: z.string().uuid().optional(),
    title: z.string().min(1, "Title is required").max(100, "Title is too long"),
    content: z.string().min(1, "Content is required").max(5000, "Content is too long"),
    type: z.enum(['news', 'event']),
    published: z.boolean(),
    event_date: z.string().datetime().optional().nullable(),
    image_url: z.string().url("Invalid image URL").optional().nullable().or(z.literal('')),
});

// ============================================================================
// ADMIN ACTIONS
// ============================================================================

export const creditAdjustmentSchema = z.object({
    userId: z.string().uuid(),
    amount: z.number().int(), // ALLOW NEGATIVE for deductions
    reason: z.string().min(3).max(255),
    type: z.enum(['topup', 'transfer', 'refund', 'booking', 'membership', 'manual'])
});

export const userUpdateSchema = z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    bio: z.string().max(1000).optional(),
    membershipStart: z.string().datetime().optional().nullable(),
    membershipExpires: z.string().datetime().optional().nullable(),
});

// ============================================================================
// HELPER FOR API ROUTE VALIDATION
// ============================================================================

export function validateInput<T>(schema: z.Schema<T>, data: any): { success: true, data: T } | { success: false, error: string } {
    const result = schema.safeParse(data);
    if (!result.success) {
        return { success: false, error: result.error.issues.map((e) => e.message).join(', ') };
    }
    return { success: true, data: result.data };
}
