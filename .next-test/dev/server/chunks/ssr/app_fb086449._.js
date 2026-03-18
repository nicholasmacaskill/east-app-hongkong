;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="0c46b707-2879-1b91-0581-40bbc0befcd1")}catch(e){}}();
module.exports = [
"[project]/app/lib/supabase.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createBrowserClient.js [app-ssr] (ecmascript)");
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://ktlicvvczrlppqkcqedv.supabase.co") || 'https://placeholder.supabase.co';
const supabaseKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0bGljdnZjenJscHBxa2NxZWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyODY1MzksImV4cCI6MjA4NDg2MjUzOX0.dc3GJmGVXM8WscM3jOFaChUroGtacwEVH1n35EUbGPU") || 'placeholder-key';
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createBrowserClient"])(supabaseUrl, supabaseKey);
}),
"[project]/app/lib/stripe-config.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/app/top-up/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TopUpPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/supabase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$Toast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/ui/Toast.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.js [app-ssr] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-ssr] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$stripe$2d$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/stripe-config.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
function TopUpPage() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const { addToast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$Toast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useToast"])();
    // --- DYNAMIC PRICE RESOLUTION ---
    const TOPUP_OPTIONS = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useMemo(()=>[
            {
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$stripe$2d$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStripePriceId"])('TOPUP_STARTER'),
                credits: 500,
                price: 'HKD $500',
                label: 'Starter',
                color: 'bg-gray-800'
            },
            {
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$stripe$2d$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStripePriceId"])('TOPUP_STANDARD'),
                credits: 1000,
                price: 'HKD $1,000',
                label: 'Standard',
                color: 'bg-gray-800'
            },
            {
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$stripe$2d$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStripePriceId"])('TOPUP_PRO'),
                credits: 2500,
                price: 'HKD $2,500',
                label: 'Pro',
                color: 'bg-east-blue/20 border-east-blue'
            },
            {
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$stripe$2d$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStripePriceId"])('TOPUP_ELITE'),
                credits: 5000,
                price: 'HKD $5,000',
                label: 'Elite',
                color: 'bg-gray-800'
            },
            {
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$stripe$2d$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStripePriceId"])('TOPUP_ULTIMATE'),
                credits: 10000,
                price: 'HKD $10,000',
                label: 'Ultimate',
                color: 'bg-east-light text-black',
                textColor: 'text-black',
                highlight: true
            }
        ], []);
    const handleCheckout = async (priceId)=>{
        try {
            const { data: { user } } = await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            const { data: profile } = await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('profiles').select('contact_email').eq('id', user.id).single();
            const email = profile?.contact_email || user.email;
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    priceId,
                    userId: user.id,
                    userEmail: email,
                    successUrl: `${window.location.origin}/?success=true`,
                    cancelUrl: `${window.location.origin}/top-up`
                })
            });
            const data = await res.json();
            if (data.url) window.location.replace(data.url);
            else throw new Error(data.error || 'Checkout failed');
        } catch (e) {
            addToast(e.message, 'error');
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-black text-white p-6 pb-24",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-4 mb-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>router.back(),
                        className: "p-2 hover:bg-white/10 rounded-full transition-colors",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                            size: 24
                        }, void 0, false, {
                            fileName: "[project]/app/top-up/page.tsx",
                            lineNumber: 92,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/top-up/page.tsx",
                        lineNumber: 91,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "font-montserrat font-black text-2xl uppercase italic tracking-wider",
                                children: "Top Up Credits"
                            }, void 0, false, {
                                fileName: "[project]/app/top-up/page.tsx",
                                lineNumber: 95,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-400 text-sm font-medium",
                                children: "1 Credit = 1 HKD"
                            }, void 0, false, {
                                fileName: "[project]/app/top-up/page.tsx",
                                lineNumber: 96,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/top-up/page.tsx",
                        lineNumber: 94,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/top-up/page.tsx",
                lineNumber: 90,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto",
                children: TOPUP_OPTIONS.map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>handleCheckout(opt.id),
                        className: `relative group p-6 rounded-2xl border transition-all duration-300 text-left hover:scale-[1.02] active:scale-95 ${opt.highlight ? 'bg-east-light border-east-light text-black shadow-[0_0_30px_rgba(200,255,0,0.3)]' : 'bg-white/5 border-white/10 hover:border-east-light hover:bg-white/10'}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between items-start mb-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-baseline gap-1",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `font-montserrat font-black text-4xl italic tracking-tighter ${opt.highlight ? 'text-black' : 'text-white'}`,
                                                    children: opt.credits.toLocaleString()
                                                }, void 0, false, {
                                                    fileName: "[project]/app/top-up/page.tsx",
                                                    lineNumber: 115,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `text-xs font-bold ${opt.highlight ? 'text-black/60' : 'text-gray-500'}`,
                                                    children: "CREDITS"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/top-up/page.tsx",
                                                    lineNumber: 118,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/top-up/page.tsx",
                                            lineNumber: 114,
                                            columnNumber: 33
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/top-up/page.tsx",
                                        lineNumber: 112,
                                        columnNumber: 29
                                    }, this),
                                    opt.highlight && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-black text-east-light p-2 rounded-full",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"], {
                                            size: 20
                                        }, void 0, false, {
                                            fileName: "[project]/app/top-up/page.tsx",
                                            lineNumber: 125,
                                            columnNumber: 37
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/top-up/page.tsx",
                                        lineNumber: 124,
                                        columnNumber: 33
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/top-up/page.tsx",
                                lineNumber: 111,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `mt-4 pt-4 border-t flex items-center justify-between ${opt.highlight ? 'border-black/10' : 'border-white/10'}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `font-montserrat font-bold text-lg ${opt.highlight ? 'text-black' : 'text-white'}`,
                                        children: opt.price
                                    }, void 0, false, {
                                        fileName: "[project]/app/top-up/page.tsx",
                                        lineNumber: 131,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${opt.highlight ? 'bg-black text-east-light' : 'bg-east-light/10 text-east-light group-hover:bg-east-light group-hover:text-black'}`,
                                        children: "Purchase"
                                    }, void 0, false, {
                                        fileName: "[project]/app/top-up/page.tsx",
                                        lineNumber: 134,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/top-up/page.tsx",
                                lineNumber: 130,
                                columnNumber: 25
                            }, this)
                        ]
                    }, opt.id, true, {
                        fileName: "[project]/app/top-up/page.tsx",
                        lineNumber: 103,
                        columnNumber: 21
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/top-up/page.tsx",
                lineNumber: 101,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/top-up/page.tsx",
        lineNumber: 88,
        columnNumber: 9
    }, this);
}
}),
];

//# debugId=0c46b707-2879-1b91-0581-40bbc0befcd1
//# sourceMappingURL=app_fb086449._.js.map