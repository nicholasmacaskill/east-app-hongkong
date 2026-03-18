;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="f4d021cf-10ad-af12-575e-028df051b6a3")}catch(e){}}();
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
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/child_process [external] (child_process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("child_process", () => require("child_process"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

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
"[project]/app/lib/stripe-config.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Stripe Configuration Manager
 * Handles dynamic switching between Test and Live modes.
 */ __turbopack_context__.s([
    "getStripeMode",
    ()=>getStripeMode,
    "getStripePriceId",
    ()=>getStripePriceId,
    "getStripePublishableKey",
    ()=>getStripePublishableKey,
    "getStripeSecretKey",
    ()=>getStripeSecretKey,
    "getStripeWebhookSecret",
    ()=>getStripeWebhookSecret
]);
function getStripeMode() {
    // 1. Check for manual override
    const override = ("TURBOPACK compile-time value", "test");
    if ("TURBOPACK compile-time truthy", 1) {
        return override;
    }
    //TURBOPACK unreachable
    ;
}
function getStripeSecretKey() {
    const mode = getStripeMode();
    const key = mode === 'live' ? process.env.STRIPE_SECRET_KEY_LIVE : process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY;
    if (!key) {
        console.error(`CRITICAL: Stripe Secret Key missing for ${mode} mode.`);
    }
    return key || '';
}
function getStripePublishableKey() {
    const mode = getStripeMode();
    const key = mode === 'live' ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE : ("TURBOPACK compile-time value", "pk_test_51STHbA12ap1SCxToZm28lKZZQlXvja0XCI91GtTlUAPcaigHqcpB15ckbCm15245bIqmXq9cG3kD3ObaxMuwVw2y00D0SehcPf") || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    return key || '';
}
function getStripeWebhookSecret() {
    const mode = getStripeMode();
    const key = mode === 'live' ? process.env.STRIPE_WEBHOOK_SECRET_LIVE : process.env.STRIPE_WEBHOOK_SECRET_TEST || process.env.STRIPE_WEBHOOK_SECRET;
    return key || '';
}
function getStripePriceId(key) {
    const mode = getStripeMode();
    // Client-side Next.js requires explicit property access for NEXT_PUBLIC_ variables
    // Dynamic indexing process.env[string] only works on the server
    const testPrices = {
        'MONTHLY': ("TURBOPACK compile-time value", "price_1SkIZy12ap1SCxTogENbLLlN"),
        'YEARLY': ("TURBOPACK compile-time value", "price_1SkImq12ap1SCxTo7NWXMK3g"),
        'STARTER': process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_TEST,
        'STANDARD': process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD_TEST,
        'PRO': process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_TEST,
        'ELITE': process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_TEST,
        'ULTIMATE': process.env.NEXT_PUBLIC_STRIPE_PRICE_ULTIMATE_TEST,
        'FAMILY_1_MONTHLY': ("TURBOPACK compile-time value", "price_1SkIZy12ap1SCxTogENbLLlN"),
        'FAMILY_1_YEARLY': ("TURBOPACK compile-time value", "price_1SkImq12ap1SCxTo7NWXMK3g"),
        'FAMILY_2_MONTHLY': ("TURBOPACK compile-time value", "price_1SmlLo12ap1SCxToOvQC8I0l"),
        'FAMILY_2_YEARLY': ("TURBOPACK compile-time value", "price_1SmlKh12ap1SCxTog9fNuhuE"),
        'FAMILY_3_MONTHLY': ("TURBOPACK compile-time value", "price_1SmlOT12ap1SCxToNrHP5Uqp"),
        'FAMILY_3_YEARLY': ("TURBOPACK compile-time value", "price_1SmlN812ap1SCxTo3SKzuxL5")
    };
    const livePrices = {
        'MONTHLY': ("TURBOPACK compile-time value", "price_1SuxcY1xd62IoClxe1kbgS6M"),
        'YEARLY': ("TURBOPACK compile-time value", "price_1SuxcX1xd62IoClxwsByYtDV"),
        'FAMILY_2_MONTHLY': process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_MONTHLY_LIVE,
        'FAMILY_2_YEARLY': process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_YEARLY_LIVE,
        'FAMILY_3_MONTHLY': process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_MONTHLY_LIVE,
        'FAMILY_3_YEARLY': process.env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_YEARLY_LIVE
    };
    const priceId = mode === 'test' ? testPrices[key.toUpperCase()] : livePrices[key.toUpperCase()];
    if (!priceId) {
        console.warn(`⚠️ Stripe Price ID missing for ${key} in ${mode} mode.`);
    }
    return priceId || '';
}
}),
"[project]/app/api/checkout/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
// app/api/checkout/route.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$stripe$2f$esm$2f$stripe$2e$esm$2e$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/stripe/esm/stripe.esm.node.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$email$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/email.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$stripe$2d$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/stripe-config.ts [app-route] (ecmascript)");
;
;
;
;
async function POST(request) {
    try {
        const { priceId, userId, userEmail, successUrl, cancelUrl } = await request.json();
        const secretKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$stripe$2d$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getStripeSecretKey"])();
        if (!secretKey) {
            console.error("CRITICAL: Stripe Secret Key is missing for the current mode.");
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Server Error: Stripe configuration error.'
            }, {
                status: 500
            });
        }
        const stripe = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$stripe$2f$esm$2f$stripe$2e$esm$2e$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"](secretKey);
        console.log("---- CHECKOUT REQUEST RECEIVED ----");
        console.log("Price ID:", priceId);
        console.log("User ID:", userId);
        console.log("Email:", userEmail);
        if (!priceId || !userId) {
            console.error("Missing Params - Price:", priceId, "User:", userId);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Missing priceId or userId'
            }, {
                status: 400
            });
        }
        // Determine mode based on Price ID (Top Up is one-time payment)
        const TOPUP_RATES = {};
        const topupKeys = {
            STARTER: 500,
            STANDARD: 1000,
            PRO: 2500,
            ELITE: 5000,
            ULTIMATE: 10000,
            TOPUP: 1200 // Legacy support
        };
        Object.entries(topupKeys).forEach(([key, amount])=>{
            const priceIdFromEnv = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$stripe$2d$config$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getStripePriceId"])(key);
            if (priceIdFromEnv) {
                TOPUP_RATES[priceIdFromEnv] = amount;
            }
        });
        const topUpAmount = TOPUP_RATES[priceId];
        const isTopUp = !!topUpAmount;
        const mode = isTopUp ? 'payment' : 'subscription';
        console.log("Session Mode:", mode, "Credit Amount:", topUpAmount);
        // Default URLs if not provided
        const baseUrl = __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$email$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["BASE_URL"];
        let defaultSuccessPath = '/?success=true';
        if (mode === 'subscription') {
            defaultSuccessPath = '/membership/success';
        }
        const finalSuccessUrl = successUrl || `${baseUrl}${defaultSuccessPath}`;
        const finalCancelUrl = cancelUrl || `${baseUrl}/?canceled=true`;
        // Create a Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: mode,
            payment_method_types: [
                'card'
            ],
            line_items: [
                {
                    price: priceId,
                    quantity: 1
                }
            ],
            // Redirect URLs
            success_url: finalSuccessUrl,
            cancel_url: finalCancelUrl,
            // Pre-fill user email to simplify checkout
            customer_email: userEmail,
            // For subscriptions, ensure metadata is passed to the subscription object
            ...mode === 'subscription' && {
                subscription_data: {
                    metadata: {
                        userId: userId
                    }
                }
            },
            // Metadata allows us to match the payment to the user in the Webhook
            // ✅ UPDATED: Dynamic credit_amount from map
            metadata: {
                userId: userId,
                target_user_id: userId,
                credit_amount: isTopUp ? topUpAmount.toString() : '0'
            }
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            url: session.url
        });
    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message
        }, {
            status: 500
        });
    }
}
}),
];

//# debugId=f4d021cf-10ad-af12-575e-028df051b6a3
//# sourceMappingURL=%5Broot-of-the-server%5D__7e8831e0._.js.map