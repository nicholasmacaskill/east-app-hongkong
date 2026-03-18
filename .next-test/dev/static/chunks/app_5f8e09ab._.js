;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="9f472fbf-b8d6-3814-1c03-8eedf91fb905")}catch(e){}}();
(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/lib/supabase.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createBrowserClient.js [app-client] (ecmascript)");
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://ktlicvvczrlppqkcqedv.supabase.co") || 'https://placeholder.supabase.co';
const supabaseKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0bGljdnZjenJscHBxa2NxZWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyODY1MzksImV4cCI6MjA4NDg2MjUzOX0.dc3GJmGVXM8WscM3jOFaChUroGtacwEVH1n35EUbGPU") || 'placeholder-key';
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createBrowserClient"])(supabaseUrl, supabaseKey);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/lib/dateUtils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "APP_TIMEZONE",
    ()=>APP_TIMEZONE,
    "formatAuditHK",
    ()=>formatAuditHK,
    "formatDateSafe",
    ()=>formatDateSafe,
    "formatHK",
    ()=>formatHK,
    "safeDate",
    ()=>safeDate,
    "safetoLocaleDateString",
    ()=>safetoLocaleDateString,
    "toHKISO",
    ()=>toHKISO,
    "toHKPickerValue",
    ()=>toHKPickerValue
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/date-fns/format.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$parseISO$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/parseISO.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/isValid.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2d$tz$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/date-fns-tz/dist/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2d$tz$2f$dist$2f$esm$2f$formatInTimeZone$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns-tz/dist/esm/formatInTimeZone/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2d$tz$2f$dist$2f$esm$2f$toDate$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns-tz/dist/esm/toDate/index.js [app-client] (ecmascript)");
;
;
const APP_TIMEZONE = 'Asia/Hong_Kong';
const HK_TZ = APP_TIMEZONE;
function safeDate(dateString) {
    if (!dateString) return null;
    // If it's already a Date object, return it if valid
    if (Object.prototype.toString.call(dateString) === '[object Date]') {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValid"])(dateString) ? dateString : null;
    }
    if (typeof dateString !== 'string') {
        // If it's a number (timestamp), try to parse it
        if (typeof dateString === 'number') {
            const d = new Date(dateString);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValid"])(d) ? d : null;
        }
        return null;
    }
    // Fix "YYYY-MM-DD HH:mm:ss" format for Safari which demands "YYYY-MM-DDTHH:mm:ss"
    let cleanString = dateString.trim();
    // Check if it matches approximate SQL timestamp format "YYYY-MM-DD HH:..."
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:/.test(cleanString)) {
        cleanString = cleanString.replace(' ', 'T');
    }
    const parsed = new Date(cleanString);
    // If native parsing fails, try date-fns parseISO which is more robust
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValid"])(parsed)) {
        try {
            const isoParsed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$parseISO$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseISO"])(cleanString);
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValid"])(isoParsed)) return isoParsed;
        } catch (e) {
            console.warn("safeDate: Failed to parse", dateString);
        }
        return null; // Return null instead of Invalid Date to allow checks
    }
    return parsed;
}
function formatDateSafe(date, formatStr = 'PP', fallback = 'Invalid Date') {
    if (!date) return fallback;
    const dateObj = typeof date === 'string' ? safeDate(date) : date;
    if (!dateObj || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValid"])(dateObj)) {
        return fallback;
    }
    try {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["format"])(dateObj, formatStr);
    } catch (error) {
        console.warn(`formatDateSafe: Error formatting date`, error);
        return fallback;
    }
}
function safetoLocaleDateString(date, locales, options, fallback = '') {
    if (!date) return fallback;
    const dateObj = typeof date === 'string' ? safeDate(date) : date;
    if (!dateObj || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValid"])(dateObj)) {
        return fallback;
    }
    try {
        return dateObj.toLocaleDateString(locales, options);
    } catch (error) {
        console.warn(`safetoLocaleDateString: Error formatting date`, error);
        return fallback;
    }
}
function formatHK(date, formatStr = 'p') {
    const d = typeof date === 'string' ? safeDate(date) : date;
    if (!d || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValid"])(d)) return '';
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2d$tz$2f$dist$2f$esm$2f$formatInTimeZone$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatInTimeZone"])(d, HK_TZ, formatStr);
}
function toHKISO(dateStr) {
    // If it's already an ISO with Z or offset, we parse it as is then ensure it's ISO.
    if (dateStr.includes('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr)) {
        const d = safeDate(dateStr);
        return d ? d.toISOString() : dateStr;
    }
    // Otherwise, treat as naive HK time (e.g. from datetime-local)
    try {
        // toDate handles the timezone conversion if we provide the zone
        // Actually toDate parses it, but we want to assert it IS HKT.
        const d = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2d$tz$2f$dist$2f$esm$2f$toDate$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toDate"])(dateStr, {
            timeZone: HK_TZ
        });
        return d.toISOString();
    } catch (e) {
        console.error("toHKISO failed for", dateStr, e);
        return new Date(dateStr).toISOString();
    }
}
function toHKPickerValue(date) {
    if (!date) return '';
    const d = typeof date === 'string' ? safeDate(date) : date;
    if (!d || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValid"])(d)) return '';
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2d$tz$2f$dist$2f$esm$2f$formatInTimeZone$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatInTimeZone"])(d, HK_TZ, "yyyy-MM-dd'T'HH:mm");
}
function formatAuditHK(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    // Simple ISO return for audit logs to ensure consistency
    return d.toISOString();
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/lib/stripe-config.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
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
    const key = mode === 'live' ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.STRIPE_SECRET_KEY_LIVE : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.STRIPE_SECRET_KEY_TEST || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.STRIPE_SECRET_KEY;
    if (!key) {
        console.error(`CRITICAL: Stripe Secret Key missing for ${mode} mode.`);
    }
    return key || '';
}
function getStripePublishableKey() {
    const mode = getStripeMode();
    const key = mode === 'live' ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE : ("TURBOPACK compile-time value", "pk_test_51STHbA12ap1SCxToZm28lKZZQlXvja0XCI91GtTlUAPcaigHqcpB15ckbCm15245bIqmXq9cG3kD3ObaxMuwVw2y00D0SehcPf") || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    return key || '';
}
function getStripeWebhookSecret() {
    const mode = getStripeMode();
    const key = mode === 'live' ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.STRIPE_WEBHOOK_SECRET_LIVE : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.STRIPE_WEBHOOK_SECRET_TEST || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.STRIPE_WEBHOOK_SECRET;
    return key || '';
}
function getStripePriceId(key) {
    const mode = getStripeMode();
    // Client-side Next.js requires explicit property access for NEXT_PUBLIC_ variables
    // Dynamic indexing process.env[string] only works on the server
    const testPrices = {
        'MONTHLY': ("TURBOPACK compile-time value", "price_1SkIZy12ap1SCxTogENbLLlN"),
        'YEARLY': ("TURBOPACK compile-time value", "price_1SkImq12ap1SCxTo7NWXMK3g"),
        'STARTER': __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_TEST,
        'STANDARD': __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD_TEST,
        'PRO': __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_STRIPE_PRICE_PRO_TEST,
        'ELITE': __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_STRIPE_PRICE_ELITE_TEST,
        'ULTIMATE': __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_STRIPE_PRICE_ULTIMATE_TEST,
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
        'FAMILY_2_MONTHLY': __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_MONTHLY_LIVE,
        'FAMILY_2_YEARLY': __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_2_YEARLY_LIVE,
        'FAMILY_3_MONTHLY': __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_MONTHLY_LIVE,
        'FAMILY_3_YEARLY': __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_STRIPE_PRICE_FAMILY_3_YEARLY_LIVE
    };
    const priceId = mode === 'test' ? testPrices[key.toUpperCase()] : livePrices[key.toUpperCase()];
    if (!priceId) {
        console.warn(`⚠️ Stripe Price ID missing for ${key} in ${mode} mode.`);
    }
    return priceId || '';
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/membership/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>MembershipPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/styled-jsx/style.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.js [app-client] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check-big.js [app-client] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-client] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/supabase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$Toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/ui/Toast.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/dateUtils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$stripe$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/stripe-config.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
;
const BENEFITS = [
    {
        title: 'ACCESS',
        items: [
            {
                label: 'GYM & LOUNGE',
                value: 'YES'
            },
            {
                label: 'EVENTS',
                value: 'YES'
            },
            {
                label: 'LOCKERS',
                value: 'YES'
            },
            {
                label: 'PRIORITY',
                value: 'YES'
            }
        ]
    },
    {
        title: 'BOOKINGS',
        items: [
            {
                label: 'FACILITY',
                value: '7D'
            },
            {
                label: 'COACH',
                value: '7D'
            },
            {
                label: 'CLASS',
                value: '7D'
            }
        ]
    },
    {
        title: 'DISCOUNTS',
        items: [
            {
                label: 'LOCKER',
                value: '20%'
            },
            {
                label: 'CLASS',
                value: '50%'
            },
            {
                label: 'FACILITY',
                value: '50%'
            },
            {
                label: 'SKATE',
                value: '20%'
            },
            {
                label: 'F&B/MERCH',
                value: '10%'
            }
        ]
    }
];
function MembershipContent() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const { addToast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$Toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"])();
    // --- DYNAMIC PRICE RESOLUTION ---
    const plans = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useMemo({
        "MembershipContent.useMemo[plans]": ()=>{
            const INDIVIDUAL_PRICE_MONTHLY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$stripe$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStripePriceId"])('MONTHLY');
            const INDIVIDUAL_PRICE_YEARLY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$stripe$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStripePriceId"])('YEARLY');
            const FAMILY_1_PRICE_MONTHLY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$stripe$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStripePriceId"])('FAMILY_1_MONTHLY') || INDIVIDUAL_PRICE_MONTHLY;
            const FAMILY_1_PRICE_YEARLY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$stripe$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStripePriceId"])('FAMILY_1_YEARLY') || INDIVIDUAL_PRICE_YEARLY;
            const FAMILY_2_PRICE_MONTHLY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$stripe$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStripePriceId"])('FAMILY_2_MONTHLY');
            const FAMILY_2_PRICE_YEARLY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$stripe$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStripePriceId"])('FAMILY_2_YEARLY');
            const FAMILY_3_PRICE_MONTHLY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$stripe$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStripePriceId"])('FAMILY_3_MONTHLY');
            const FAMILY_3_PRICE_YEARLY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$stripe$2d$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStripePriceId"])('FAMILY_3_YEARLY');
            return {
                individual: {
                    id: 'pro',
                    name: 'PRO',
                    prices: {
                        monthly: {
                            id: INDIVIDUAL_PRICE_MONTHLY,
                            display: '2,000',
                            credits: '1,000'
                        },
                        yearly: {
                            id: INDIVIDUAL_PRICE_YEARLY,
                            display: '24,000',
                            credits: '15,000',
                            savings: '3,000 BONUS'
                        }
                    }
                },
                family: {
                    '1': {
                        id: 'family-1',
                        name: 'PRO FAMILY (1)',
                        prices: {
                            monthly: {
                                id: FAMILY_1_PRICE_MONTHLY,
                                display: '2,000',
                                credits: '1,000'
                            },
                            yearly: {
                                id: FAMILY_1_PRICE_YEARLY,
                                display: '24,000',
                                credits: '15,000',
                                savings: '3,000 BONUS'
                            }
                        }
                    },
                    '2': {
                        id: 'family-2',
                        name: 'PRO FAMILY (2)',
                        prices: {
                            monthly: {
                                id: FAMILY_2_PRICE_MONTHLY,
                                display: '4,000',
                                credits: '2,500'
                            },
                            yearly: {
                                id: FAMILY_2_PRICE_YEARLY,
                                display: '48,000',
                                credits: '33,000',
                                savings: 'SAVE 7,000'
                            }
                        }
                    },
                    '3+': {
                        id: 'family-3+',
                        name: 'PRO FAMILY (3+)',
                        prices: {
                            monthly: {
                                id: FAMILY_3_PRICE_MONTHLY,
                                display: '5,500',
                                credits: '3,500'
                            },
                            yearly: {
                                id: FAMILY_3_PRICE_YEARLY,
                                display: '66,000',
                                credits: '45,000',
                                savings: 'SAVE 10,000'
                            }
                        }
                    }
                }
            };
        }
    }["MembershipContent.useMemo[plans]"], []);
    // Selection States
    const [billingCycle, setBillingCycle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('monthly');
    const [planType, setPlanType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('individual');
    const [memberCount, setMemberCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('1');
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [currentUserId, setCurrentUserId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [userRole, setUserRole] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [hasActiveSubscription, setHasActiveSubscription] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [subscriptionInfo, setSubscriptionInfo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MembershipContent.useEffect": ()=>{
            const getUser = {
                "MembershipContent.useEffect.getUser": async ()=>{
                    const { data: { user } } = await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
                    if (user) {
                        setCurrentUserId(user.id);
                        const { data: profile } = await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('profiles').select('role, subscription_status, membership_tier, membership_expires').eq('id', user.id).single();
                        const finalRole = profile?.role || user.user_metadata?.role;
                        if (finalRole) setUserRole(finalRole);
                        // Check if user has a membership (active or in grace period)
                        if (profile?.membership_expires) {
                            const expiryDate = new Date(profile.membership_expires);
                            if (expiryDate > new Date()) {
                                setHasActiveSubscription(true);
                                setSubscriptionInfo({
                                    tier: profile.membership_tier,
                                    expires: expiryDate,
                                    status: profile.subscription_status
                                });
                            }
                        }
                    }
                }
            }["MembershipContent.useEffect.getUser"];
            getUser();
        }
    }["MembershipContent.useEffect"], []);
    const getTierLabel = (tier)=>{
        const map = {
            'individual': 'PRO MEMBERSHIP',
            'family_1': 'PRO FAMILY (1)',
            'family_2': 'PRO FAMILY (2)',
            'family_3plus': 'PRO FAMILY (3+)'
        };
        return map[tier] || tier || 'PRO MEMBERSHIP';
    };
    const activePlan = planType === 'individual' ? plans.individual : plans.family[memberCount];
    const activeDetails = billingCycle === 'monthly' ? activePlan.prices.monthly : activePlan.prices.yearly;
    const handlePurchase = async ()=>{
        if (!currentUserId) {
            addToast("Please log in to purchase.", "info");
            return;
        }
        setIsLoading(true);
        try {
            const priceId = activeDetails.id;
            const { data: { user } } = await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
            const email = user?.email;
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    priceId,
                    userId: currentUserId,
                    userEmail: email,
                    successUrl: `${window.location.origin}/?success=true`,
                    cancelUrl: `${window.location.origin}/?canceled=true`
                })
            });
            const data = await res.json();
            if (data.url) {
                window.location.replace(data.url);
            } else {
                addToast(`Checkout Failed: ${data.error || 'Unknown error'}`, "error");
            }
        } catch (e) {
            console.error(e);
            addToast(`Purchase Failed: ${e.message || 'Network error'}`, "error");
        } finally{
            setIsLoading(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "jsx-ce0fe7f2e11b25c0" + " " + "h-screen bg-black text-white font-opensans select-none flex justify-center items-center overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "jsx-ce0fe7f2e11b25c0" + " " + "fixed inset-0 z-0",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: "https://images.unsplash.com/photo-1580748141549-71748ddf0bdc?auto=format&fit=crop&q=80&w=1200",
                        alt: "Hockey Background",
                        className: "jsx-ce0fe7f2e11b25c0" + " " + "w-full h-full object-cover opacity-20 blur-sm"
                    }, void 0, false, {
                        fileName: "[project]/app/membership/page.tsx",
                        lineNumber: 204,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "jsx-ce0fe7f2e11b25c0" + " " + "absolute inset-0 bg-black/80"
                    }, void 0, false, {
                        fileName: "[project]/app/membership/page.tsx",
                        lineNumber: 209,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/membership/page.tsx",
                lineNumber: 203,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "jsx-ce0fe7f2e11b25c0" + " " + "w-full max-w-[370px] bg-white text-black h-screen sm:h-auto sm:max-h-[96vh] relative flex flex-col z-10 border border-white/20 shadow-2xl sm:rounded-[2.5rem] overflow-hidden sm:m-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "jsx-ce0fe7f2e11b25c0" + " " + "h-2.5 w-full bg-black shrink-0"
                    }, void 0, false, {
                        fileName: "[project]/app/membership/page.tsx",
                        lineNumber: 213,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "jsx-ce0fe7f2e11b25c0" + " " + "flex items-center justify-between px-7 pt-6 pb-3 shrink-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    // If user just completed purchase, go home instead of back to Stripe
                                    const justPurchased = sessionStorage.getItem('just_purchased');
                                    if (justPurchased === 'true') {
                                        sessionStorage.removeItem('just_purchased'); // Clear flag
                                        router.push('/');
                                    } else {
                                        router.back();
                                    }
                                },
                                className: "jsx-ce0fe7f2e11b25c0" + " " + "p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                                    size: 20,
                                    strokeWidth: 3
                                }, void 0, false, {
                                    fileName: "[project]/app/membership/page.tsx",
                                    lineNumber: 230,
                                    columnNumber: 25
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/membership/page.tsx",
                                lineNumber: 217,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-ce0fe7f2e11b25c0" + " " + "text-right",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "jsx-ce0fe7f2e11b25c0" + " " + "font-montserrat font-black italic text-2xl uppercase tracking-tighter leading-none",
                                        children: "MEMBERSHIP"
                                    }, void 0, false, {
                                        fileName: "[project]/app/membership/page.tsx",
                                        lineNumber: 233,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "jsx-ce0fe7f2e11b25c0" + " " + "font-bold text-[10px] text-amber-500 uppercase tracking-widest leading-none mt-1",
                                        children: "EARLY BIRD PRO PASS"
                                    }, void 0, false, {
                                        fileName: "[project]/app/membership/page.tsx",
                                        lineNumber: 234,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/membership/page.tsx",
                                lineNumber: 232,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/membership/page.tsx",
                        lineNumber: 216,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "jsx-ce0fe7f2e11b25c0" + " " + "px-7 space-y-3 mt-1 shrink-0",
                        children: [
                            (userRole === 'parent' || userRole === 'sys-admin') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-ce0fe7f2e11b25c0" + " " + "bg-gray-50 p-1 rounded-xl flex border border-gray-100 h-10",
                                children: [
                                    'individual',
                                    'family'
                                ].map((type)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            setPlanType(type);
                                            if (type === 'individual') setMemberCount('1');
                                        },
                                        className: "jsx-ce0fe7f2e11b25c0" + " " + `flex-1 rounded-lg text-[11px] font-black italic uppercase tracking-widest transition-all ${planType === type ? 'bg-black text-white shadow-md' : 'text-gray-400'}`,
                                        children: type
                                    }, type, false, {
                                        fileName: "[project]/app/membership/page.tsx",
                                        lineNumber: 244,
                                        columnNumber: 33
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/app/membership/page.tsx",
                                lineNumber: 242,
                                columnNumber: 25
                            }, this),
                            planType === 'family' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-ce0fe7f2e11b25c0" + " " + "flex items-center gap-2 bg-black/5 p-1 rounded-xl animate-fadeIn h-10",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "jsx-ce0fe7f2e11b25c0" + " " + "text-[8px] font-black text-gray-500 uppercase tracking-tighter ml-2",
                                        children: "FAMILY SIZE:"
                                    }, void 0, false, {
                                        fileName: "[project]/app/membership/page.tsx",
                                        lineNumber: 261,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-ce0fe7f2e11b25c0" + " " + "flex flex-1 gap-1",
                                        children: [
                                            '1',
                                            '2',
                                            '3+'
                                        ].map((count)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>setMemberCount(count),
                                                className: "jsx-ce0fe7f2e11b25c0" + " " + `flex-1 py-1.5 rounded-lg text-[10px] font-black italic transition-all ${memberCount === count ? 'bg-white text-black shadow-sm' : 'text-gray-400 opacity-60'}`,
                                                children: count
                                            }, count, false, {
                                                fileName: "[project]/app/membership/page.tsx",
                                                lineNumber: 264,
                                                columnNumber: 37
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/app/membership/page.tsx",
                                        lineNumber: 262,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/membership/page.tsx",
                                lineNumber: 260,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-ce0fe7f2e11b25c0" + " " + "bg-gray-100 p-1 rounded-full flex h-10",
                                children: [
                                    'monthly',
                                    'yearly'
                                ].map((cycle)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setBillingCycle(cycle),
                                        className: "jsx-ce0fe7f2e11b25c0" + " " + `flex-1 rounded-full text-[10px] font-black italic uppercase tracking-widest transition-all ${billingCycle === cycle ? 'bg-black text-white shadow-md' : 'text-gray-500'}`,
                                        children: cycle
                                    }, cycle, false, {
                                        fileName: "[project]/app/membership/page.tsx",
                                        lineNumber: 279,
                                        columnNumber: 29
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/app/membership/page.tsx",
                                lineNumber: 277,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/membership/page.tsx",
                        lineNumber: 239,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "jsx-ce0fe7f2e11b25c0" + " " + "flex-1 overflow-y-auto px-7 py-5 scrollbar-hide",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-ce0fe7f2e11b25c0" + " " + "flex items-end justify-between border-b-2 border-dashed border-gray-100 pb-5 mb-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-ce0fe7f2e11b25c0" + " " + "text-left",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-ce0fe7f2e11b25c0" + " " + "bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md inline-block mb-1.5 font-bold text-[8px] text-amber-600 uppercase tracking-widest",
                                                children: "Early Bird Rates"
                                            }, void 0, false, {
                                                fileName: "[project]/app/membership/page.tsx",
                                                lineNumber: 295,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                className: "jsx-ce0fe7f2e11b25c0" + " " + "font-montserrat font-black italic text-5xl uppercase leading-none tracking-tighter",
                                                children: "PRO"
                                            }, void 0, false, {
                                                fileName: "[project]/app/membership/page.tsx",
                                                lineNumber: 298,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "jsx-ce0fe7f2e11b25c0" + " " + "text-[9px] font-black text-east-light uppercase tracking-widest mt-1",
                                                children: planType === 'family' ? `${memberCount} MEMBER FAMILY` : 'INDIVIDUAL PASS'
                                            }, void 0, false, {
                                                fileName: "[project]/app/membership/page.tsx",
                                                lineNumber: 299,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/membership/page.tsx",
                                        lineNumber: 294,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-ce0fe7f2e11b25c0" + " " + "text-right",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-ce0fe7f2e11b25c0" + " " + "flex items-baseline justify-end gap-1",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "jsx-ce0fe7f2e11b25c0" + " " + "font-montserrat font-black italic text-4xl tracking-tight leading-none",
                                                        children: activeDetails.display
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/membership/page.tsx",
                                                        lineNumber: 305,
                                                        columnNumber: 33
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "jsx-ce0fe7f2e11b25c0" + " " + "font-montserrat font-black italic text-[10px] text-gray-400 uppercase tracking-tighter",
                                                        children: "HKD"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/membership/page.tsx",
                                                        lineNumber: 306,
                                                        columnNumber: 33
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/membership/page.tsx",
                                                lineNumber: 304,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "jsx-ce0fe7f2e11b25c0" + " " + "text-[9px] font-bold text-gray-400 uppercase mt-0.5",
                                                children: [
                                                    "PER ",
                                                    billingCycle === 'monthly' ? 'MONTH' : 'YEAR'
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/membership/page.tsx",
                                                lineNumber: 308,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/membership/page.tsx",
                                        lineNumber: 303,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/membership/page.tsx",
                                lineNumber: 293,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-ce0fe7f2e11b25c0" + " " + "flex gap-3 mb-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-ce0fe7f2e11b25c0" + " " + "flex-1 bg-gray-50 border border-gray-100 px-3 py-2.5 rounded-xl text-center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "jsx-ce0fe7f2e11b25c0" + " " + "text-[8px] font-black text-gray-400 uppercase tracking-tighter mb-0.5",
                                                children: "CREDITS"
                                            }, void 0, false, {
                                                fileName: "[project]/app/membership/page.tsx",
                                                lineNumber: 316,
                                                columnNumber: 29
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "jsx-ce0fe7f2e11b25c0" + " " + "text-[12px] font-black italic",
                                                children: [
                                                    "+",
                                                    activeDetails.credits
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/membership/page.tsx",
                                                lineNumber: 317,
                                                columnNumber: 29
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/membership/page.tsx",
                                        lineNumber: 315,
                                        columnNumber: 25
                                    }, this),
                                    billingCycle === 'yearly' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-ce0fe7f2e11b25c0" + " " + "flex-1 bg-east-light/10 border border-east-light/20 px-3 py-2.5 rounded-xl text-center shadow-sm",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "jsx-ce0fe7f2e11b25c0" + " " + "text-[8px] font-black text-east-dark uppercase tracking-tighter mb-0.5",
                                                children: "BONUS"
                                            }, void 0, false, {
                                                fileName: "[project]/app/membership/page.tsx",
                                                lineNumber: 321,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "jsx-ce0fe7f2e11b25c0" + " " + "text-[12px] font-black italic text-east-dark uppercase whitespace-nowrap",
                                                children: activeDetails.savings
                                            }, void 0, false, {
                                                fileName: "[project]/app/membership/page.tsx",
                                                lineNumber: 322,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/membership/page.tsx",
                                        lineNumber: 320,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/membership/page.tsx",
                                lineNumber: 314,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-ce0fe7f2e11b25c0" + " " + "space-y-6 mb-6",
                                children: BENEFITS.map((section, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-ce0fe7f2e11b25c0" + " " + "space-y-2.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-ce0fe7f2e11b25c0" + " " + "flex items-center gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                        className: "jsx-ce0fe7f2e11b25c0" + " " + "font-montserrat font-black italic text-[10px] text-gray-300 uppercase tracking-widest",
                                                        children: section.title
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/membership/page.tsx",
                                                        lineNumber: 332,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-ce0fe7f2e11b25c0" + " " + "h-[1px] flex-1 bg-gray-100"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/membership/page.tsx",
                                                        lineNumber: 333,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/membership/page.tsx",
                                                lineNumber: 331,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-ce0fe7f2e11b25c0" + " " + "grid grid-cols-2 gap-x-6 gap-y-2",
                                                children: section.items.map((item, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-ce0fe7f2e11b25c0" + " " + "flex justify-between items-center py-1 border-b border-gray-50 last:border-0 overflow-hidden",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "jsx-ce0fe7f2e11b25c0" + " " + "font-bold text-[11px] text-gray-700 uppercase tracking-tight truncate mr-2",
                                                                children: item.label
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/membership/page.tsx",
                                                                lineNumber: 338,
                                                                columnNumber: 45
                                                            }, this),
                                                            item.value === 'YES' || item.value === '7D' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                                                size: 14,
                                                                className: "text-[#28D160]",
                                                                strokeWidth: 4
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/membership/page.tsx",
                                                                lineNumber: 340,
                                                                columnNumber: 49
                                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "jsx-ce0fe7f2e11b25c0" + " " + "font-black text-[11px] uppercase italic text-black shrink-0",
                                                                children: item.value
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/membership/page.tsx",
                                                                lineNumber: 342,
                                                                columnNumber: 49
                                                            }, this)
                                                        ]
                                                    }, i, true, {
                                                        fileName: "[project]/app/membership/page.tsx",
                                                        lineNumber: 337,
                                                        columnNumber: 41
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/app/membership/page.tsx",
                                                lineNumber: 335,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, idx, true, {
                                        fileName: "[project]/app/membership/page.tsx",
                                        lineNumber: 330,
                                        columnNumber: 29
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/app/membership/page.tsx",
                                lineNumber: 328,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/membership/page.tsx",
                        lineNumber: 291,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "jsx-ce0fe7f2e11b25c0" + " " + "px-7 pb-8 pt-4 bg-gradient-to-t from-white via-white to-white/90 shrink-0",
                        children: [
                            hasActiveSubscription ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-ce0fe7f2e11b25c0" + " " + "w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-ce0fe7f2e11b25c0" + " " + "flex items-center justify-between mb-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "jsx-ce0fe7f2e11b25c0" + " " + "font-black italic text-xl uppercase",
                                                children: "Current Plan"
                                            }, void 0, false, {
                                                fileName: "[project]/app/membership/page.tsx",
                                                lineNumber: 357,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-ce0fe7f2e11b25c0" + " " + "flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                                        size: 12
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/membership/page.tsx",
                                                        lineNumber: 359,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "jsx-ce0fe7f2e11b25c0" + " " + "text-[10px] font-bold uppercase",
                                                        children: "Active"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/membership/page.tsx",
                                                        lineNumber: 360,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/membership/page.tsx",
                                                lineNumber: 358,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/membership/page.tsx",
                                        lineNumber: 356,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-ce0fe7f2e11b25c0" + " " + "space-y-3 mb-6",
                                        children: subscriptionInfo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "jsx-ce0fe7f2e11b25c0" + " " + "flex justify-between items-center pb-2 border-b border-gray-50",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "jsx-ce0fe7f2e11b25c0" + " " + "text-[10px] font-bold text-gray-400 uppercase tracking-wider",
                                                            children: "Plan Type"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/membership/page.tsx",
                                                            lineNumber: 368,
                                                            columnNumber: 45
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "jsx-ce0fe7f2e11b25c0" + " " + "text-xs font-black italic uppercase",
                                                            children: getTierLabel(subscriptionInfo.tier)
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/membership/page.tsx",
                                                            lineNumber: 369,
                                                            columnNumber: 45
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/membership/page.tsx",
                                                    lineNumber: 367,
                                                    columnNumber: 41
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "jsx-ce0fe7f2e11b25c0" + " " + "flex justify-between items-center pb-2 border-b border-gray-50",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "jsx-ce0fe7f2e11b25c0" + " " + "text-[10px] font-bold text-gray-400 uppercase tracking-wider",
                                                            children: "Expiry Date"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/membership/page.tsx",
                                                            lineNumber: 372,
                                                            columnNumber: 45
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "jsx-ce0fe7f2e11b25c0" + " " + "text-xs font-bold text-black",
                                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatHK"])(subscriptionInfo.expires, 'MMM dd, yyyy')
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/membership/page.tsx",
                                                            lineNumber: 373,
                                                            columnNumber: 45
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/membership/page.tsx",
                                                    lineNumber: 371,
                                                    columnNumber: 41
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "jsx-ce0fe7f2e11b25c0" + " " + "flex justify-between items-center",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "jsx-ce0fe7f2e11b25c0" + " " + "text-[10px] font-bold text-gray-400 uppercase tracking-wider",
                                                            children: "Next Billing"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/membership/page.tsx",
                                                            lineNumber: 376,
                                                            columnNumber: 45
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "jsx-ce0fe7f2e11b25c0" + " " + `text-xs font-bold ${subscriptionInfo.status === 'canceled' ? 'text-red-500/50' : 'text-black'}`,
                                                            children: subscriptionInfo.status === 'active' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatHK"])(subscriptionInfo.expires, 'MMM dd, yyyy') : subscriptionInfo.status?.toUpperCase() === 'CANCELED' ? 'CANCELED' : [
                                                                'past_due',
                                                                'unpaid',
                                                                'overdue'
                                                            ].includes(subscriptionInfo.status) ? 'OVERDUE' : subscriptionInfo.status?.toUpperCase() || 'N/A'
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/membership/page.tsx",
                                                            lineNumber: 377,
                                                            columnNumber: 45
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/membership/page.tsx",
                                                    lineNumber: 375,
                                                    columnNumber: 41
                                                }, this)
                                            ]
                                        }, void 0, true)
                                    }, void 0, false, {
                                        fileName: "[project]/app/membership/page.tsx",
                                        lineNumber: 364,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        "data-testid": "cancel-subscription-button",
                                        href: "https://wa.link/b2y0sa",
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                        className: "jsx-ce0fe7f2e11b25c0" + " " + "block w-full text-center py-3 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-400 uppercase hover:bg-gray-50 hover:text-[#25D366] hover:border-[#25D366]/20 transition-all",
                                        children: "Contact us on WhatsApp to cancel"
                                    }, void 0, false, {
                                        fileName: "[project]/app/membership/page.tsx",
                                        lineNumber: 389,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/membership/page.tsx",
                                lineNumber: 355,
                                columnNumber: 25
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handlePurchase,
                                disabled: isLoading,
                                className: "jsx-ce0fe7f2e11b25c0" + " " + "w-full bg-black text-white font-montserrat font-black italic text-[13px] py-4.5 rounded-2xl uppercase tracking-widest hover:bg-east-light hover:text-black transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 h-[60px]",
                                children: isLoading ? 'WORKING...' : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "jsx-ce0fe7f2e11b25c0",
                                            children: billingCycle === 'yearly' ? 'ACTIVATE YEARLY' : 'ACTIVATE MONTHLY'
                                        }, void 0, false, {
                                            fileName: "[project]/app/membership/page.tsx",
                                            lineNumber: 407,
                                            columnNumber: 37
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"], {
                                            size: 18
                                        }, void 0, false, {
                                            fileName: "[project]/app/membership/page.tsx",
                                            lineNumber: 408,
                                            columnNumber: 37
                                        }, this)
                                    ]
                                }, void 0, true)
                            }, void 0, false, {
                                fileName: "[project]/app/membership/page.tsx",
                                lineNumber: 400,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "jsx-ce0fe7f2e11b25c0" + " " + "text-[8px] text-center text-gray-400 mt-4 font-bold uppercase tracking-widest leading-relaxed",
                                children: [
                                    "30 day advance cancellation policy applies.",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {
                                        className: "jsx-ce0fe7f2e11b25c0"
                                    }, void 0, false, {
                                        fileName: "[project]/app/membership/page.tsx",
                                        lineNumber: 414,
                                        columnNumber: 68
                                    }, this),
                                    "Please see terms and conditions."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/membership/page.tsx",
                                lineNumber: 413,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "jsx-ce0fe7f2e11b25c0" + " " + "text-[8px] text-center text-gray-400 mt-2 font-bold uppercase tracking-widest",
                                children: "SECURE CHECKOUT VIA STRIPE"
                            }, void 0, false, {
                                fileName: "[project]/app/membership/page.tsx",
                                lineNumber: 417,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/membership/page.tsx",
                        lineNumber: 353,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/membership/page.tsx",
                lineNumber: 212,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                id: "ce0fe7f2e11b25c0",
                children: ".scrollbar-hide.jsx-ce0fe7f2e11b25c0::-webkit-scrollbar{display:none}"
            }, void 0, false, void 0, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/membership/page.tsx",
        lineNumber: 201,
        columnNumber: 9
    }, this);
}
_s(MembershipContent, "VPsNNCQf97BVYrViK1suUW0UuPQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$Toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"]
    ];
});
_c = MembershipContent;
function MembershipPage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
        fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-black h-screen text-white flex justify-center items-center font-montserrat font-bold uppercase tracking-tighter",
            children: "Loading..."
        }, void 0, false, {
            fileName: "[project]/app/membership/page.tsx",
            lineNumber: 432,
            columnNumber: 29
        }, void 0),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MembershipContent, {}, void 0, false, {
            fileName: "[project]/app/membership/page.tsx",
            lineNumber: 433,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/membership/page.tsx",
        lineNumber: 432,
        columnNumber: 9
    }, this);
}
_c1 = MembershipPage;
var _c, _c1;
__turbopack_context__.k.register(_c, "MembershipContent");
__turbopack_context__.k.register(_c1, "MembershipPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# debugId=9f472fbf-b8d6-3814-1c03-8eedf91fb905
//# sourceMappingURL=app_5f8e09ab._.js.map