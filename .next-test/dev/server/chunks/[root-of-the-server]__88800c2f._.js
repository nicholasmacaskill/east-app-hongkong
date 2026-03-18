;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="f3791d70-da5c-1181-fac9-b96c3fa609d9")}catch(e){}}();
module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/lib/supabaseAdmin.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSupabaseAdmin",
    ()=>getSupabaseAdmin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
;
let supabaseAdmin = null;
const getSupabaseAdmin = ()=>{
    if (supabaseAdmin) return supabaseAdmin;
    const supabaseUrl = ("TURBOPACK compile-time value", "https://ktlicvvczrlppqkcqedv.supabase.co");
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        throw new Error('❌ Missing SUPABASE_SERVICE_ROLE_KEY. Cannot initialize Admin client.');
    }
    supabaseAdmin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
    return supabaseAdmin;
};
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/app/lib/email.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BASE_URL",
    ()=>BASE_URL,
    "sendEmail",
    ()=>sendEmail,
    "wrapEmailHtml",
    ()=>wrapEmailHtml
]);
// app/lib/email.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$resend$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/resend/dist/index.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/supabaseAdmin.ts [app-route] (ecmascript)");
;
;
const BASE_URL = ("TURBOPACK compile-time value", "http://localhost:3000") || 'https://MISSING-BASE-URL';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
// Log email to database for Playwright testing
async function logEmailToDatabase(params) {
    if (process.env.LOG_EMAILS_TO_DB !== 'true') {
        return; // Skip if not enabled
    }
    try {
        const supabaseAdmin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseAdmin"])();
        await supabaseAdmin.from('test_emails').insert({
            to_address: params.to,
            subject: params.subject,
            html_body: params.html,
            trigger_source: params.source || 'unknown'
        });
    } catch (err) {
        console.error('Failed to log email to database:', err);
    // Don't fail the email send if logging fails
    }
}
function wrapEmailHtml(content, title) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title || 'EAST App'}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0c0c0c; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <div style="background-color: #0c0c0c; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
                <!-- Header / Logo Area -->
                <div style="padding: 40px 40px 20px 40px; text-align: left;">
                    <div style="display: inline-block;">
                        <img src="${BASE_URL}/east-logo-transparent.png" alt="EAST Logo" style="height: 64px; width: auto; display: block;" />
                    </div>
                </div>

                <!-- Main Content -->
                <div style="padding: 0 40px 40px 40px;">
                    ${content}
                </div>

                <!-- Footer -->
                <div style="padding: 30px 40px; background-color: #111111; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: left;">
                    <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6;">
                        &copy; ${new Date().getFullYear()} EAST Sports Group. All rights reserved.<br/>
                        Hong Kong's Premier Athletic Training Platform.
                    </p>
                </div>
            </div>
            
            <div style="max-width: 600px; margin: 30px auto 0; text-align: center;">
                <p style="font-size: 12px; color: #888888;">
                    If you didn't expect this email, please ignore it.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}
async function sendEmail({ to, subject, html, source }) {
    // 1. Wrap HTML if it's not already a full document
    const finalHtml = html.includes('<html') ? html : wrapEmailHtml(html, subject);
    // Log to database for testing (non-blocking)
    await logEmailToDatabase({
        to,
        subject,
        html: finalHtml,
        source
    });
    // Check for API Key first
    if (!process.env.RESEND_API_KEY) {
        if ("TURBOPACK compile-time truthy", 1) {
            console.warn('⚠️ [MOCK] RESEND_API_KEY missing in Non-Production. Simulating success.');
            return {
                id: 'mock-email-id'
            };
        }
        //TURBOPACK unreachable
        ;
    }
    // If we have a key, proceed to send
    if ("TURBOPACK compile-time truthy", 1) {
        console.log(`📧 [DEV LOG] Sending Real Email to: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`HTML Preview: ${finalHtml.substring(0, 100)}...`);
    }
    try {
        const resend = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$resend$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Resend"](process.env.RESEND_API_KEY);
        const fromAddress = process.env.EMAIL_FROM || 'EAST Sports Group <onboarding@updates.eastsportsgroup.com>';
        const { data, error } = await resend.emails.send({
            from: fromAddress,
            to,
            subject,
            html: finalHtml
        });
        // ✅ FIX: Check for API-level errors (like invalid email, domain issues)
        if (error) {
            console.error('❌ Resend API Error:', error);
            // FALLBACK: If API key is invalid in DEV, mock success
            if (("TURBOPACK compile-time value", "development") !== 'production' && (error.statusCode === 401 || error.message?.includes('API key'))) {
                console.warn('⚠️ [MOCK] Resend Key Invalid in Dev. Simulating success.');
                return {
                    success: true,
                    data: {
                        id: 'mock-fallback-id'
                    }
                };
            }
            return {
                success: false,
                error: error
            };
        }
        console.log(`📧 Email sent to ${to}:`, data);
        return {
            success: true,
            data
        };
    } catch (error) {
        // This catches network errors or code crashes
        console.error('❌ Unexpected Error sending email:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
}),
"[project]/app/api/sessions/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/supabaseAdmin.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$email$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/email.ts [app-route] (ecmascript)"); // Assume you have this utility
;
;
;
async function GET() {
    // Fetch sessions that are in the future, ordered by time
    const supabaseAdmin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseAdmin"])();
    // Enforce 7-Day Booking Window
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const { data, error } = await supabaseAdmin.from('sessions').select(`
      *,
      registrations(count)
    `).neq('status', 'cancelled') // Exclude cancelled sessions
    .gt('start_time', new Date().toISOString()).lte('start_time', sevenDaysLater.toISOString()) // 7-Day Limit
    .order('start_time', {
        ascending: true
    });
    if (error) {
        console.error("API SESSIONS ERROR:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message
        }, {
            status: 500
        });
    }
    // Filter out sessions that are full
    // Note: registrations returns as [{ count: n }] array due to PostgREST format with count
    const availableSessions = data.filter((session)=>{
        // If max_capacity is not set, assume unlimited
        if (!session.max_capacity) return true;
        const count = session.registrations?.[0]?.count || 0;
        return count < session.max_capacity;
    });
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(availableSessions);
}
async function POST(request) {
    const { sessionId, userId } = await request.json();
    if (!sessionId || !userId) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Missing sessionId or userId'
        }, {
            status: 400
        });
    }
    const COST_PER_SESSION = 100; // Define the cost
    try {
        // 1. Fetch User Profile and Credits
        const supabaseAdmin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseAdmin"])();
        const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('credits, contact_email, first_name').eq('id', userId).single();
        if (profileError || !profile) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'User profile not found.'
            }, {
                status: 404
            });
        }
        // 2. Credit Check
        if (profile.credits < COST_PER_SESSION) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Insufficient credits to book this session.'
            }, {
                status: 403
            });
        }
        // 3. Register the User (Insert into registrations table)
        const { data: registration, error: regError } = await supabaseAdmin.from('registrations').insert({
            session_id: sessionId,
            user_id: userId
        }).select().single();
        if (regError || !registration) {
            // Handle scenario where user is already registered, or other DB failure
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: regError?.message || 'Failed to register for session.'
            }, {
                status: 500
            });
        }
        // 4. Deduct Credits (Update profiles table)
        const newCredits = profile.credits - COST_PER_SESSION;
        const { error: creditError } = await supabaseAdmin.from('profiles').update({
            credits: newCredits
        }).eq('id', userId);
        if (creditError) {
            // Note: In a real-world app, you would also need to roll back the registration here.
            console.error('Failed to deduct credits:', creditError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Booking successful, but failed to deduct credits.'
            }, {
                status: 500
            });
        }
        // 5. Fetch Session Details for Email
        const { data: session, error: sessionError } = await supabaseAdmin.from('sessions').select('title, start_time').eq('id', sessionId).single();
        if (session && profile.contact_email) {
            // 6. Send Booking Confirmation Email
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$email$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sendEmail"])({
                to: profile.contact_email,
                subject: `Booking Confirmed: ${session.title}`,
                html: `
          <p>Hi ${profile.first_name || 'Member'},</p>
          <p>Your spot is successfully reserved for <strong>${session.title}</strong>.</p>
          <p><strong>Time:</strong> ${new Date(session.start_time).toLocaleString()}</p>
          <p>You now have **${newCredits}** credits remaining.</p>
          <br/>
          <p><strong>Want to bring a friend?</strong></p>
          <p>Please message us on WhatsApp to register them: <a href="https://wa.link/b2y0sa">https://wa.link/b2y0sa</a></p>
          <p><em>(Credits will be deducted from your account upon approval)</em></p>
          <br/>
          <p>See you there!</p>
        `
            });
            console.log(`Booking Confirmation Email sent to: ${profile.contact_email}`);
        }
        // Final Success Response
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            message: 'Session booked, credits deducted, and confirmation email sent.'
        });
    } catch (e) {
        console.error('API Error:', e);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'An unexpected error occurred during booking.'
        }, {
            status: 500
        });
    }
}
}),
];

//# debugId=f3791d70-da5c-1181-fac9-b96c3fa609d9
//# sourceMappingURL=%5Broot-of-the-server%5D__88800c2f._.js.map