import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export type AuditAction =
    | 'USER_CREATED'
    | 'USER_UPDATED'
    | 'USER_DELETED'
    | 'CREDIT_ADJUSTMENT'
    | 'SUBSCRIPTION_CHANGED'
    | 'ANNOUNCEMENT_CREATED'
    | 'ANNOUNCEMENT_UPDATED'
    | 'ANNOUNCEMENT_DELETED'
    | 'LOGIN_FAILED';

export interface AuditLogEntry {
    action: AuditAction;
    actorId: string; // User ID performing the action
    targetId?: string; // ID of the entity being acted upon
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Logs a critical system action for audit purposes.
 * Currently logs to console/Sentry, but designed to write to an audit_logs table.
 */
export async function logAudit(entry: AuditLogEntry) {
    const timestamp = new Date().toISOString();

    // 1. Structural Logging (picked up by Sentry/Datadog/Vercel)
    console.log(JSON.stringify({
        level: 'info',
        event: 'audit_log',
        timestamp,
        ...entry
    }));

    // 2. (Future) Database Persistence
    // const supabaseAdmin = getSupabaseAdmin();
    // await supabaseAdmin.from('audit_logs').insert({ ... });
}
