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
    | 'LOGIN_FAILED'
    | 'CREATE_SESSION'
    | 'UPDATE_SESSION'
    | 'DELETE_SESSION'
    | 'UPDATE_CREDITS'
    | 'CREATE_PLAYER'
    | 'UPDATE_PLAYER'
    | 'DELETE_PLAYER'
    | 'CREATE_COACH'
    | 'UPDATE_COACH'
    | 'DELETE_COACH'
    | 'GENERATE_SCHEDULE'
    | 'CANCEL_BOOKING'
    | 'PORTAL_TICKET_CREATED'
    | 'PORTAL_TICKET_UPDATED';

export interface AuditLogEntry {
    action: AuditAction;
    actorId: string; // User ID performing the action
    targetId?: string; // ID of the entity being acted upon
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}

import { formatAuditHK } from './dateUtils';

/**
 * Logs a critical system action for audit purposes.
 * Currently logs to console/Sentry, but designed to write to an audit_logs table.
 */
export async function logAudit(entry: AuditLogEntry) {
    const timestamp = formatAuditHK(new Date());

    // 1. Structural Logging (picked up by Sentry/Datadog/Vercel)
    console.log(JSON.stringify({
        level: 'info',
        event: 'audit_log',
        timestamp,
        ...entry
    }));

    // 2. Database Persistence
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from('admin_audit_logs').insert({
        admin_id: entry.actorId,
        action: entry.action,
        target_type: 'system', // or infer from details
        target_id: entry.targetId,
        details: entry.details
    });
}

/**
 * Specifically for Admin actions in the Dashboard
 */
export async function logAdminAction(
    adminId: string,
    action: AuditAction,
    targetType: string,
    targetId: string | number,
    details: any = {},
    adminName?: string,
    targetName?: string
) {
    const supabase = getSupabaseAdmin();
    const enrichedDetails = {
        ...details,
        adminName,
        targetName
    };
    try {
        const { error } = await supabase
            .from('admin_audit_logs')
            .insert({
                admin_id: adminId,
                action,
                target_type: targetType,
                target_id: String(targetId),
                details: enrichedDetails
            });
        if (error) console.error('Failed to log admin action:', error);
    } catch (e) {
        console.error('Audit logging error:', e);
    }
}
