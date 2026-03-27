
/**
 * WhatsApp Notification Utility
 * Uses a Gateway service for fast integration with WhatsApp Groups.
 */

export async function sendWhatsAppNotification(ticket: {
    id: number | string;
    title: string;
    priority: string;
    reporter_name?: string;
}) {
    const API_KEY = process.env.WHATSAPP_GATEWAY_API_KEY;
    const GROUP_ID = process.env.WHATSAPP_GROUP_ID;

    if (!API_KEY || !GROUP_ID) {
        console.warn('[WHATSAPP_NOTIFY] Missing credentials, skipping notification.');
        return;
    }

    const message = `🚨 *EAST BACKLOG ALERT*
    
*Ticket:* #${ticket.id} - ${ticket.title}
*Priority:* ${ticket.priority.toUpperCase()}
*Reporter:* ${ticket.reporter_name || 'Engineering Agent'}

View Dashboard: https://test-branch-east.vercel.app/sys-admin/tickets`;

    try {
        // Example for Whapi.cloud or similar Gateway
        const response = await fetch(`https://gate.whapi.cloud/messages/text`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: GROUP_ID,
                body: message
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('[WHATSAPP_NOTIFY] Gateway Error:', error);
        } else {
            console.log('[WHATSAPP_NOTIFY] Notification sent successfully.');
        }
    } catch (error) {
        console.error('[WHATSAPP_NOTIFY] Unexpected Error:', error);
    }
}
