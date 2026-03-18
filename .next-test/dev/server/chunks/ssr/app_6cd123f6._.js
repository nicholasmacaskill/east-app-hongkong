;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="f7cb7c02-d918-a4b2-c218-baab8645640c")}catch(e){}}();
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
"[project]/app/lib/authProfile.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fetchProfileResilient",
    ()=>fetchProfileResilient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/supabase.ts [app-ssr] (ecmascript)");
;
async function fetchProfileResilient(userId, options = {}) {
    const { maxRetries = 3, delayMs = 300, select = '*' } = options;
    let lastError = null;
    for(let i = 0; i < maxRetries; i++){
        try {
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('profiles').select(select).eq('id', userId).single();
            if (error) {
                lastError = error;
                // If it's a "PGRST116" (JSON object requested, but no rows returned), 
                // it means the profile doesn't exist yet. Retry.
                if (error.code === 'PGRST116') {
                    console.log(`[AUTH_PROFILE] Profile not found for ${userId}, retry ${i + 1}/${maxRetries}...`);
                    await new Promise((resolve)=>setTimeout(resolve, delayMs * (i + 1))); // Exponential-ish backoff
                    continue;
                }
                throw error;
            }
            if (data) {
                return data;
            }
        } catch (err) {
            console.error(`[AUTH_PROFILE] Attempt ${i + 1} failed:`, err);
            await new Promise((resolve)=>setTimeout(resolve, delayMs * (i + 1)));
        }
    }
    console.error(`[AUTH_PROFILE] Permanent failure fetching profile for ${userId} after ${maxRetries} retries.`);
    return null;
}
}),
"[project]/app/faq/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HelpCenterPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.js [app-ssr] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-ssr] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-up.js [app-ssr] (ecmascript) <export default as ChevronUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [app-ssr] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-ssr] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$dumbbell$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Dumbbell$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/dumbbell.js [app-ssr] (ecmascript) <export default as Dumbbell>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shield.js [app-ssr] (ecmascript) <export default as Shield>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$question$2d$mark$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__HelpCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-question-mark.js [app-ssr] (ecmascript) <export default as HelpCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/supabase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$authProfile$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/authProfile.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
// ─── Player Content ─────────────────────────────────────────────────
const playerSections = [
    {
        title: 'Getting Started',
        items: [
            {
                q: 'How do I log in?',
                a: 'Open the app and enter your registered email address and password. Tap LOGIN. If this is your first time, tap JOIN NOW to create a new account with your full name, email, mobile number and a password.'
            },
            {
                q: 'I forgot my password. What do I do?',
                a: 'On the login screen, tap "Forgot Password?" below the login button. Enter your email and we\'ll send you a reset link. Check your spam folder if it doesn\'t arrive within a few minutes.'
            },
            {
                q: 'My account says LOCKED. What does this mean?',
                a: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: [
                        "A ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                            children: "LOCKED"
                        }, void 0, false, {
                            fileName: "[project]/app/faq/page.tsx",
                            lineNumber: 39,
                            columnNumber: 27
                        }, ("TURBOPACK compile-time value", void 0)),
                        " account means you don't have an active membership. You can still browse the app, but you cannot book sessions. To unlock your account:",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                            className: "list-decimal list-inside mt-2 space-y-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: [
                                        "Go to your ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Wallet tab"
                                        }, void 0, false, {
                                            fileName: "[project]/app/faq/page.tsx",
                                            lineNumber: 41,
                                            columnNumber: 44
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        " (middle tab in the nav)"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/faq/page.tsx",
                                    lineNumber: 41,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: [
                                        "Tap ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: '"View Membership Options"'
                                        }, void 0, false, {
                                            fileName: "[project]/app/faq/page.tsx",
                                            lineNumber: 42,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/faq/page.tsx",
                                    lineNumber: 42,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: "Choose a plan and complete checkout via Stripe"
                                }, void 0, false, {
                                    fileName: "[project]/app/faq/page.tsx",
                                    lineNumber: 43,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/faq/page.tsx",
                            lineNumber: 40,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        "Once your membership is active, the LOCKED indicator will disappear."
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/faq/page.tsx",
                    lineNumber: 38,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }
        ]
    },
    {
        title: 'Booking Sessions',
        items: [
            {
                q: 'How do I book a class?',
                a: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                        className: "list-decimal list-inside space-y-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "From the ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Home screen"
                                    }, void 0, false, {
                                        fileName: "[project]/app/faq/page.tsx",
                                        lineNumber: 59,
                                        columnNumber: 42
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    ", scroll to the ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Classes"
                                    }, void 0, false, {
                                        fileName: "[project]/app/faq/page.tsx",
                                        lineNumber: 59,
                                        columnNumber: 86
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    " section"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 59,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: 'Tap a class tile (e.g. "Inline Hockey")'
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 60,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: "A booking modal will open — select your preferred date and time slot"
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 61,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "Tap ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: '"PAY X CREDITS"'
                                    }, void 0, false, {
                                        fileName: "[project]/app/faq/page.tsx",
                                        lineNumber: 62,
                                        columnNumber: 37
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    " to confirm"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 62,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: "Your credits are deducted and the booking is confirmed"
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 63,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/faq/page.tsx",
                        lineNumber: 58,
                        columnNumber: 25
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/app/faq/page.tsx",
                    lineNumber: 57,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            },
            {
                q: 'How do I book a private lesson?',
                a: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                        className: "list-decimal list-inside space-y-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "From the ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Home screen"
                                    }, void 0, false, {
                                        fileName: "[project]/app/faq/page.tsx",
                                        lineNumber: 73,
                                        columnNumber: 42
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    ", scroll to ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Private Lessons"
                                    }, void 0, false, {
                                        fileName: "[project]/app/faq/page.tsx",
                                        lineNumber: 73,
                                        columnNumber: 82
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    " or ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Our Coaches"
                                    }, void 0, false, {
                                        fileName: "[project]/app/faq/page.tsx",
                                        lineNumber: 73,
                                        columnNumber: 118
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 73,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: "Tap a coach or lesson type"
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 74,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: "Select your preferred time slot in the modal"
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 75,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "Tap ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: '"PAY X CREDITS"'
                                    }, void 0, false, {
                                        fileName: "[project]/app/faq/page.tsx",
                                        lineNumber: 76,
                                        columnNumber: 37
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    " to confirm"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 76,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/faq/page.tsx",
                        lineNumber: 72,
                        columnNumber: 25
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/app/faq/page.tsx",
                    lineNumber: 71,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            },
            {
                q: 'How do I book a facility?',
                a: 'From the Home screen, scroll to Facilities and tap a tile (e.g. "Ice Rink"). Select an available time and confirm with your credits.'
            },
            {
                q: 'How do I see my upcoming bookings?',
                a: 'Tap the Schedule tab (Activity icon) in the bottom navigation. All your confirmed upcoming sessions are listed here by date.'
            },
            {
                q: 'Why can\'t I tap the "PAY CREDITS" button?',
                a: 'There are two possible reasons: (1) Your account is LOCKED — you need an active membership. (2) You don\'t have enough credits — top up your balance first. Both issues can be resolved from the Wallet tab.'
            }
        ]
    },
    {
        title: 'Credits & Payments',
        items: [
            {
                q: 'What are credits?',
                a: 'Credits are the in-app currency used to pay for sessions. Every session type costs a set number of credits. Credits are added to your account when you purchase or top up, and deducted each time you book.'
            },
            {
                q: 'How do I top up my credits?',
                a: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                        className: "list-decimal list-inside space-y-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "Tap the ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Wallet tab"
                                    }, void 0, false, {
                                        fileName: "[project]/app/faq/page.tsx",
                                        lineNumber: 107,
                                        columnNumber: 41
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    " (middle bottom icon)"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 107,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "Tap your credit balance or the ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: '"TOP UP CREDITS"'
                                    }, void 0, false, {
                                        fileName: "[project]/app/faq/page.tsx",
                                        lineNumber: 108,
                                        columnNumber: 64
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    " button"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 108,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: "Select a top-up package"
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 109,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: "Complete the secure Stripe checkout"
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 110,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: "Credits are added to your balance immediately"
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 111,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/faq/page.tsx",
                        lineNumber: 106,
                        columnNumber: 25
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/app/faq/page.tsx",
                    lineNumber: 105,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            },
            {
                q: 'My top-up payment went through but credits didn\'t appear. What do I do?',
                a: 'Credits are usually added within 30 seconds of a successful payment via Stripe. If they haven\'t appeared after 5 minutes, please contact your admin or support team via the contact details in the app footer.'
            },
            {
                q: 'Do my credits expire?',
                a: 'Credits are tied to your account and do not expire while your membership is active. Please check with your admin for any specific expiry policies.'
            }
        ]
    },
    {
        title: 'Membership',
        items: [
            {
                q: 'What does a membership unlock?',
                a: 'An active membership removes the LOCKED status from your account, allowing you to book sessions. Members also receive bonus credits on purchase, access to priority booking windows, and discounts on facilities, classes, and F&B.'
            },
            {
                q: 'How do I purchase a membership?',
                a: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                            className: "list-decimal list-inside space-y-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: [
                                        "Tap the ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Wallet tab"
                                        }, void 0, false, {
                                            fileName: "[project]/app/faq/page.tsx",
                                            lineNumber: 138,
                                            columnNumber: 41
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/faq/page.tsx",
                                    lineNumber: 138,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: [
                                        "Tap ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: '"View Membership Options"'
                                        }, void 0, false, {
                                            fileName: "[project]/app/faq/page.tsx",
                                            lineNumber: 139,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/faq/page.tsx",
                                    lineNumber: 139,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: "Choose Monthly or Yearly billing"
                                }, void 0, false, {
                                    fileName: "[project]/app/faq/page.tsx",
                                    lineNumber: 140,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: [
                                        "Tap ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "ACTIVATE"
                                        }, void 0, false, {
                                            fileName: "[project]/app/faq/page.tsx",
                                            lineNumber: 141,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        " and complete Stripe checkout"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/faq/page.tsx",
                                    lineNumber: 141,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/faq/page.tsx",
                            lineNumber: 137,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        "Monthly and Yearly plans are available. Yearly gives you bonus credits."
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/faq/page.tsx",
                    lineNumber: 136,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            },
            {
                q: 'How do I cancel my membership?',
                a: 'Tap "Contact us on WhatsApp to cancel" on the membership screen, or reach out to your admin directly. A 30-day advance notice cancellation policy applies.'
            }
        ]
    },
    {
        title: 'Cancellations',
        items: [
            {
                q: 'How do I cancel a booking?',
                a: 'Go to the Schedule tab, find the session you want to cancel, and tap on it. Inside the session detail, tap "CANCEL BOOKING". Your credits will be refunded immediately.'
            },
            {
                q: 'Is there a cancellation penalty?',
                a: 'Cancellations made less than 24 hours before the session start time may be subject to a penalty (e.g., partial credit deduction). Check with your admin for the specific policy.'
            }
        ]
    },
    {
        title: 'QR Wallet & Check-In',
        items: [
            {
                q: 'What is the QR code for?',
                a: 'Your QR code is your digital membership card. When you arrive at the facility, show it to staff or let them scan it to verify your identity and membership status quickly.'
            },
            {
                q: 'Where do I find my QR code?',
                a: 'Tap the Wallet tab (middle icon in the bottom nav). Your unique QR code is displayed prominently at the top of that screen.'
            }
        ]
    },
    {
        title: 'Profile & Stats',
        items: [
            {
                q: 'How do I view my stats?',
                a: 'Tap the Profile tab (person icon). Your season and career stats (Goals, Assists, Games Played, etc.) are displayed on your profile card.'
            },
            {
                q: 'How do I update my profile photo or details?',
                a: 'Tap the Profile tab, then tap the Settings gear icon in the top right corner to open your account settings where you can update your details.'
            }
        ]
    }
];
// ─── Parent Content ─────────────────────────────────────────────────
const parentSections = [
    {
        title: 'Managing Your Family',
        items: [
            {
                q: 'How do I register a child athlete?',
                a: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                        className: "list-decimal list-inside space-y-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "Tap the ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Profile tab"
                                    }, void 0, false, {
                                        fileName: "[project]/app/faq/page.tsx",
                                        lineNumber: 204,
                                        columnNumber: 41
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 204,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "Tap the ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Athletes tab"
                                    }, void 0, false, {
                                        fileName: "[project]/app/faq/page.tsx",
                                        lineNumber: 205,
                                        columnNumber: 41
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    " on your profile"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 205,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "Tap ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: '"+ Register New Athlete"'
                                    }, void 0, false, {
                                        fileName: "[project]/app/faq/page.tsx",
                                        lineNumber: 206,
                                        columnNumber: 37
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 206,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: "Enter your child's name and details"
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 207,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: "Tap Save — your child now appears on your profile"
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 208,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/faq/page.tsx",
                        lineNumber: 203,
                        columnNumber: 25
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/app/faq/page.tsx",
                    lineNumber: 202,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            },
            {
                q: 'How do I switch between children?',
                a: 'On your Profile, tap the Athletes tab and tap on a child\'s card to select them. Their info and stats will update accordingly.'
            }
        ]
    },
    {
        title: 'Booking for Your Child',
        items: [
            {
                q: 'How do I book a session for my child (not myself)?',
                a: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                            className: "list-decimal list-inside space-y-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: "Tap a session from the Home or Schedule screen"
                                }, void 0, false, {
                                    fileName: "[project]/app/faq/page.tsx",
                                    lineNumber: 227,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: [
                                        "In the booking modal, look for the ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: '"WHO IS THIS FOR?"'
                                        }, void 0, false, {
                                            fileName: "[project]/app/faq/page.tsx",
                                            lineNumber: 228,
                                            columnNumber: 68
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        " selector"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/faq/page.tsx",
                                    lineNumber: 228,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: "Select your child's name from the dropdown"
                                }, void 0, false, {
                                    fileName: "[project]/app/faq/page.tsx",
                                    lineNumber: 229,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: [
                                        "Tap ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: '"PAY X CREDITS"'
                                        }, void 0, false, {
                                            fileName: "[project]/app/faq/page.tsx",
                                            lineNumber: 230,
                                            columnNumber: 37
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        " to confirm"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/faq/page.tsx",
                                    lineNumber: 230,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/faq/page.tsx",
                            lineNumber: 226,
                            columnNumber: 25
                        }, ("TURBOPACK compile-time value", void 0)),
                        "The booking will be registered under your child's account. Your credits are used for payment."
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/faq/page.tsx",
                    lineNumber: 225,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            },
            {
                q: 'Can I book for multiple children at once?',
                a: 'Currently each booking is made individually. To book for two children in the same session, complete one booking, then return and repeat the process selecting the second child.'
            }
        ]
    },
    {
        title: 'Credits & Membership',
        items: [
            {
                q: 'Does my membership cover my children?',
                a: 'Family memberships (PRO FAMILY) cover multiple members. When selecting a membership, choose the "Family" plan and the appropriate member count (1, 2, or 3+). Each family member gets access and credits.'
            },
            {
                q: 'How do I top up credits for my family?',
                a: 'Credits are tied to your parent account and shared for family bookings. Top up from your Wallet tab — the top-up amount is added to your balance and used when booking for any of your children.'
            }
        ]
    },
    {
        title: 'Cancellations',
        items: [
            {
                q: 'How do I cancel a booking I made for my child?',
                a: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: [
                        "Go to the ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                            children: "Schedule tab"
                        }, void 0, false, {
                            fileName: "[project]/app/faq/page.tsx",
                            lineNumber: 262,
                            columnNumber: 35
                        }, ("TURBOPACK compile-time value", void 0)),
                        ", find the session, and tap it. You will see the cancellation option. Credits are refunded immediately if the cancellation is made within the allowed window."
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/faq/page.tsx",
                    lineNumber: 261,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }
        ]
    }
];
// ─── Coach Content ─────────────────────────────────────────────────
const coachSections = [
    {
        title: 'Your Profile',
        items: [
            {
                q: 'How do I see my upcoming sessions?',
                a: 'After logging in, your Coach Dashboard shows all upcoming sessions you are assigned to. Tap "My Schedule" to see a full calendar view.'
            },
            {
                q: 'How do I update my availability?',
                a: 'Go to your Profile and tap the Availability section. Toggle time slots on or off to let admin know when you are available for private sessions.'
            }
        ]
    },
    {
        title: 'Sessions & Check-In',
        items: [
            {
                q: 'How do I check in a member at a session?',
                a: 'Use the QR scan tool in the Wallet/QR tab. Point the scanner at the member\'s QR code to verify their booking and membership status.'
            }
        ]
    }
];
// ─── Admin Content ─────────────────────────────────────────────────
const adminSections = [
    {
        title: 'Dashboard (/sys-admin)',
        items: [
            {
                q: 'What does the Admin Dashboard show?',
                a: 'The main dashboard shows a high-level summary: total members, active memberships, pending payments, and recent activity. Use it as your daily starting point.'
            }
        ]
    },
    {
        title: 'Schedule (/sys-admin/schedule)',
        items: [
            {
                q: 'How do I create a new session?',
                a: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                        className: "list-decimal list-inside space-y-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "Go to ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Schedule"
                                    }, void 0, false, {
                                        fileName: "[project]/app/faq/page.tsx",
                                        lineNumber: 315,
                                        columnNumber: 39
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    " in the admin nav"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 315,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "Tap ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: '"+ Add Session"'
                                    }, void 0, false, {
                                        fileName: "[project]/app/faq/page.tsx",
                                        lineNumber: 316,
                                        columnNumber: 37
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 316,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: "Fill in the title, category (Class/Private/Facility), date, time, capacity, credit cost, and instructor"
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 317,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: "Tap Save — the session appears immediately on the member-facing Home screen"
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 318,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/faq/page.tsx",
                        lineNumber: 314,
                        columnNumber: 25
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/app/faq/page.tsx",
                    lineNumber: 313,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            },
            {
                q: 'How do I edit or delete a session?',
                a: 'Find the session in the Schedule list and tap the edit (pencil) icon. Make your changes and save. To delete, tap the trash icon — this also cancels all existing bookings for that session and refunds credits.'
            },
            {
                q: 'How do I view who has booked a session?',
                a: 'Tap any session in the Schedule view to expand it. A list of registered members is shown beneath the session details.'
            }
        ]
    },
    {
        title: 'Directory (/sys-admin/directory)',
        items: [
            {
                q: 'How do I find a specific member?',
                a: 'Use the search bar at the top of the Directory page. You can filter by name, email, or role (Player, Parent, Coach). Tap a member card for their full profile.'
            },
            {
                q: 'How do I manually activate or lock a member\'s account?',
                a: 'Find the member in the Directory, open their profile, and look for the Account Status toggle. You can manually set their status to Active (bypassing Stripe) or Locked.'
            },
            {
                q: 'How do I add credits to a member\'s account?',
                a: 'Open the member\'s profile in the Directory. Use the "Adjust Credits" field to add or subtract credits manually and save. This is useful for comps or corrections.'
            },
            {
                q: 'How do I register a child under a parent?',
                a: 'Go to the Directory and find the parent\'s profile. In their profile, tap "Add Child Athlete" and fill in the child\'s details. The child is then linked to the parent\'s account and can be booked for sessions.'
            }
        ]
    },
    {
        title: 'Services (/sys-admin/services)',
        items: [
            {
                q: 'What is a Service vs a Session?',
                a: 'A Service is a template (e.g. "Inline Hockey Class"). A Session is a specific occurrence of that service at a particular date and time. Managing Services lets you control what appears as tiles on the Home screen.'
            },
            {
                q: 'How do I add a new service type?',
                a: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                        className: "list-decimal list-inside space-y-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "Go to ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Services"
                                    }, void 0, false, {
                                        fileName: "[project]/app/faq/page.tsx",
                                        lineNumber: 366,
                                        columnNumber: 39
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    " in the admin nav"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 366,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "Tap ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: '"Add Service"'
                                    }, void 0, false, {
                                        fileName: "[project]/app/faq/page.tsx",
                                        lineNumber: 367,
                                        columnNumber: 37
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 367,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: "Set the title, category (Class/Private/Facility), image URL, and description"
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 368,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: "Save — it will appear as a tile on the member Home screen once sessions are linked to it"
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 369,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/faq/page.tsx",
                        lineNumber: 365,
                        columnNumber: 25
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/app/faq/page.tsx",
                    lineNumber: 364,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            },
            {
                q: 'How do I bulk-generate session slots for a service?',
                a: 'On any service card, tap "Generate Slots". Set a start date, end date, days of the week, time, and duration. The system will create individual sessions for every matching slot.'
            }
        ]
    },
    {
        title: 'News & Events (/sys-admin/news)',
        items: [
            {
                q: 'How do I post a news announcement?',
                a: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                        className: "list-decimal list-inside space-y-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "Go to ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "News"
                                    }, void 0, false, {
                                        fileName: "[project]/app/faq/page.tsx",
                                        lineNumber: 388,
                                        columnNumber: 39
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    " in the admin nav"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 388,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "Tap ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: '"+ Add Announcement"'
                                    }, void 0, false, {
                                        fileName: "[project]/app/faq/page.tsx",
                                        lineNumber: 389,
                                        columnNumber: 37
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 389,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: "Set the title, body text, image URL, type (news or event), and publish date"
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 390,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: "Save — it appears immediately in the Breaking News section on the member Home screen"
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 391,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/faq/page.tsx",
                        lineNumber: 387,
                        columnNumber: 25
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/app/faq/page.tsx",
                    lineNumber: 386,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            },
            {
                q: 'How do I remove an outdated news post?',
                a: 'Find the post in the News list and tap the delete (trash) icon. The post is immediately removed from all member-facing screens.'
            }
        ]
    },
    {
        title: 'Check-In / QR (/sys-admin/qr)',
        items: [
            {
                q: 'How do I scan a member\'s QR code for check-in?',
                a: 'Go to the Check-In section in the admin nav. Grant camera access when prompted. Point the scanner at the member\'s QR code — their name, photo, and membership status will appear instantly. Green = valid, Red = invalid/expired.'
            },
            {
                q: 'What happens if a member doesn\'t have their QR code?',
                a: 'Use the manual search field on the Check-In screen to find them by name or email and verify their status that way.'
            }
        ]
    },
    {
        title: 'Booking Logs (/sys-admin/bookings)',
        items: [
            {
                q: 'How do I see all bookings for a specific session or date?',
                a: 'Use the filter and search tools at the top of the Booking Logs page to narrow by session name, date, or member. Each row shows the member, session, booking time, credit cost, and status.'
            },
            {
                q: 'How do I manually cancel a booking on behalf of a member?',
                a: 'Find the booking in the Booking Logs list and tap the cancel action. The credits are refunded to the member\'s account immediately.'
            }
        ]
    },
    {
        title: 'Transactions (/sys-admin/transactions)',
        items: [
            {
                q: 'How do I see payment history?',
                a: 'The Transactions page shows all Stripe payments — membership purchases and credit top-ups — with the member name, amount, date, and status (paid/failed/refunded).'
            }
        ]
    },
    {
        title: 'Metrics (/sys-admin/metrics)',
        items: [
            {
                q: 'What does the Metrics dashboard show?',
                a: 'Metrics shows key health indicators: Monthly Active Users (MAU), total bookings, revenue trends, member retention, and "at-risk" members who haven\'t booked recently.'
            }
        ]
    },
    {
        title: 'Audit Logs (/sys-admin/audit)',
        items: [
            {
                q: 'What are Audit Logs?',
                a: 'The Audit Logs are a tamper-resistant record of every significant admin action — who created, edited, or deleted a session, member, or booking. Use this to track down changes or investigate discrepancies.'
            },
            {
                q: 'How far back do Audit Logs go?',
                a: 'Logs are retained indefinitely. You can filter by date range, action type, or admin user to narrow your search.'
            }
        ]
    },
    {
        title: 'Coaches (/sys-admin/coaches)',
        items: [
            {
                q: 'How do I manage a coach\'s availability?',
                a: 'Go to the Coaches section, find the coach, and tap their availability card. You can view and edit their available time slots on their behalf — useful if they\'re having trouble with the app.'
            },
            {
                q: 'How do I assign a coach to a session?',
                a: 'When creating or editing a session in the Schedule, select the coach from the Instructor dropdown. All coaches with a "coach" role appear in that list.'
            }
        ]
    },
    {
        title: 'Player Stats (/sys-admin/player-stats)',
        items: [
            {
                q: 'How do I update a player\'s stats?',
                a: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                        className: "list-decimal list-inside space-y-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    "Go to ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "Player Stats"
                                    }, void 0, false, {
                                        fileName: "[project]/app/faq/page.tsx",
                                        lineNumber: 480,
                                        columnNumber: 39
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    " in the admin nav"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 480,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: "Search for the player by name"
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 481,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: "Enter their stats (Goals, Assists, Games Played, PIM, etc.)"
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 482,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: "Save — the stats appear immediately on the player's profile"
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 483,
                                columnNumber: 29
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/faq/page.tsx",
                        lineNumber: 479,
                        columnNumber: 25
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/app/faq/page.tsx",
                    lineNumber: 478,
                    columnNumber: 21
                }, ("TURBOPACK compile-time value", void 0))
            }
        ]
    }
];
// ─── Tab Configuration ─────────────────────────────────────────────
const TABS = [
    {
        id: 'player',
        label: 'Player',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"],
        sections: playerSections
    },
    {
        id: 'parent',
        label: 'Parent',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"],
        sections: parentSections
    },
    {
        id: 'coach',
        label: 'Coach',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$dumbbell$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Dumbbell$3e$__["Dumbbell"],
        sections: coachSections
    },
    {
        id: 'admin',
        label: 'Admin',
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shield$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Shield$3e$__["Shield"],
        sections: adminSections
    }
];
// ─── Accordion Item ────────────────────────────────────────────────
function AccordionItem({ item }) {
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "border border-white/8 rounded-2xl overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>setOpen(!open),
                className: "w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/5 transition-colors",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-bold text-sm text-white/90 leading-snug",
                        children: item.q
                    }, void 0, false, {
                        fileName: "[project]/app/faq/page.tsx",
                        lineNumber: 509,
                        columnNumber: 17
                    }, this),
                    open ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__["ChevronUp"], {
                        size: 16,
                        className: "text-east-light shrink-0"
                    }, void 0, false, {
                        fileName: "[project]/app/faq/page.tsx",
                        lineNumber: 511,
                        columnNumber: 23
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                        size: 16,
                        className: "text-gray-500 shrink-0"
                    }, void 0, false, {
                        fileName: "[project]/app/faq/page.tsx",
                        lineNumber: 512,
                        columnNumber: 23
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/faq/page.tsx",
                lineNumber: 505,
                columnNumber: 13
            }, this),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-5 pb-5 text-sm text-gray-400 font-opensans leading-relaxed border-t border-white/5",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "pt-4",
                    children: item.a
                }, void 0, false, {
                    fileName: "[project]/app/faq/page.tsx",
                    lineNumber: 517,
                    columnNumber: 21
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/faq/page.tsx",
                lineNumber: 516,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/faq/page.tsx",
        lineNumber: 504,
        columnNumber: 9
    }, this);
}
// ─── Page ─────────────────────────────────────────────────────────
function HelpCenterContent() {
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const tabParam = searchParams.get('tab');
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(tabParam || 'player');
    const [userRole, setUserRole] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(undefined);
    const [loadingRole, setLoadingRole] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let mounted = true;
        async function updateRole(userId) {
            if (!userId) {
                if (mounted) {
                    setUserRole(undefined);
                    setLoadingRole(false);
                }
                return;
            }
            try {
                const profile = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$authProfile$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fetchProfileResilient"])(userId);
                if (mounted && profile?.role) {
                    setUserRole(profile.role);
                }
            } catch (err) {
                console.error('[HELP_CENTRE] Role fetch failed:', err);
            } finally{
                if (mounted) setLoadingRole(false);
            }
        }
        // Initial check
        __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.getUser().then(({ data: { user } })=>{
            if (user) updateRole(user.id);
            else updateRole(null);
        });
        // Listen for changes
        const { data: { subscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange((event, session)=>{
            if (session?.user) updateRole(session.user.id);
            else updateRole(null);
        });
        return ()=>{
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);
    // Filter tabs based on role
    const allowedTabs = TABS.filter((tab)=>{
        if (!userRole) return tab.id === 'player'; // Guest/Loading default
        if (userRole === 'admin' || userRole === 'sys-admin') return true;
        if (userRole === 'parent') return tab.id === 'player' || tab.id === 'parent';
        if (userRole === 'coach') return tab.id === 'player' || tab.id === 'coach';
        if (userRole === 'player') return tab.id === 'player';
        return tab.id === 'player';
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (tabParam && allowedTabs.find((t)=>t.id === tabParam)) {
            setActiveTab(tabParam);
        } else if (allowedTabs.length > 0 && !allowedTabs.find((t)=>t.id === activeTab)) {
            // If current tab is not allowed (e.g. role changed or refreshed on forbidden tab), reset to first allowed
            setActiveTab(allowedTabs[0].id);
        }
    }, [
        tabParam,
        userRole,
        loadingRole
    ]);
    const activeSections = allowedTabs.find((t)=>t.id === activeTab)?.sections || [];
    const showTabs = allowedTabs.length > 1;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-black text-white font-montserrat pb-24 animate-fadeIn",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-2xl mx-auto px-5 pt-6",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-4 mb-8",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "/",
                            className: "text-gray-400 hover:text-white transition-colors p-1",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                                size: 26
                            }, void 0, false, {
                                fileName: "[project]/app/faq/page.tsx",
                                lineNumber: 603,
                                columnNumber: 25
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/faq/page.tsx",
                            lineNumber: 602,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$question$2d$mark$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__HelpCircle$3e$__["HelpCircle"], {
                                    size: 22,
                                    className: "text-east-light"
                                }, void 0, false, {
                                    fileName: "[project]/app/faq/page.tsx",
                                    lineNumber: 606,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    className: "text-2xl font-black italic uppercase tracking-tight",
                                    children: "Help Centre"
                                }, void 0, false, {
                                    fileName: "[project]/app/faq/page.tsx",
                                    lineNumber: 607,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/faq/page.tsx",
                            lineNumber: 605,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/faq/page.tsx",
                    lineNumber: 601,
                    columnNumber: 17
                }, this),
                loadingRole ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-4 gap-1.5 bg-white/5 p-1.5 rounded-2xl mb-8 border border-white/8 animate-pulse",
                    children: [
                        1,
                        2,
                        3,
                        4
                    ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-12 bg-white/5 rounded-xl"
                        }, i, false, {
                            fileName: "[project]/app/faq/page.tsx",
                            lineNumber: 615,
                            columnNumber: 29
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/app/faq/page.tsx",
                    lineNumber: 613,
                    columnNumber: 21
                }, this) : showTabs && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: `grid ${allowedTabs.length === 2 ? 'grid-cols-2' : 'grid-cols-4'} gap-1.5 bg-white/5 p-1.5 rounded-2xl mb-8 border border-white/8`,
                    children: allowedTabs.map((tab)=>{
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setActiveTab(tab.id),
                            className: `flex flex-col items-center gap-1.5 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${isActive ? 'bg-east-light text-black shadow-lg' : 'text-gray-500 hover:text-white'}`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                    size: 15
                                }, void 0, false, {
                                    fileName: "[project]/app/faq/page.tsx",
                                    lineNumber: 632,
                                    columnNumber: 37
                                }, this),
                                tab.label
                            ]
                        }, tab.id, true, {
                            fileName: "[project]/app/faq/page.tsx",
                            lineNumber: 624,
                            columnNumber: 33
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/app/faq/page.tsx",
                    lineNumber: 619,
                    columnNumber: 21
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-8",
                    children: activeSections.map((section, si)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-east-light font-black italic text-xs uppercase tracking-[0.2em] mb-3 px-1",
                                    children: section.title
                                }, void 0, false, {
                                    fileName: "[project]/app/faq/page.tsx",
                                    lineNumber: 644,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-2",
                                    children: section.items.map((item, ii)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AccordionItem, {
                                            item: item
                                        }, ii, false, {
                                            fileName: "[project]/app/faq/page.tsx",
                                            lineNumber: 649,
                                            columnNumber: 37
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/app/faq/page.tsx",
                                    lineNumber: 647,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, si, true, {
                            fileName: "[project]/app/faq/page.tsx",
                            lineNumber: 643,
                            columnNumber: 25
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/app/faq/page.tsx",
                    lineNumber: 641,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-12 bg-white/5 border border-white/10 rounded-2xl p-6 text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-400 text-xs font-bold uppercase tracking-widest mb-3",
                            children: "Still need help?"
                        }, void 0, false, {
                            fileName: "[project]/app/faq/page.tsx",
                            lineNumber: 658,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            href: "https://wa.link/b2y0sa",
                            target: "_blank",
                            rel: "noopener noreferrer",
                            className: "inline-block bg-[#25D366] text-black font-black italic text-sm px-6 py-3 rounded-xl hover:bg-white transition-colors uppercase tracking-wider",
                            children: "Contact us on WhatsApp"
                        }, void 0, false, {
                            fileName: "[project]/app/faq/page.tsx",
                            lineNumber: 659,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/faq/page.tsx",
                    lineNumber: 657,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/faq/page.tsx",
            lineNumber: 598,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/faq/page.tsx",
        lineNumber: 597,
        columnNumber: 9
    }, this);
}
function HelpCenterPage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Suspense"], {
        fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-black flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-6 h-6 border-2 border-east-light border-t-transparent rounded-full animate-spin"
            }, void 0, false, {
                fileName: "[project]/app/faq/page.tsx",
                lineNumber: 677,
                columnNumber: 17
            }, void 0)
        }, void 0, false, {
            fileName: "[project]/app/faq/page.tsx",
            lineNumber: 676,
            columnNumber: 13
        }, void 0),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(HelpCenterContent, {}, void 0, false, {
            fileName: "[project]/app/faq/page.tsx",
            lineNumber: 680,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/faq/page.tsx",
        lineNumber: 675,
        columnNumber: 9
    }, this);
}
}),
];

//# debugId=f7cb7c02-d918-a4b2-c218-baab8645640c
//# sourceMappingURL=app_6cd123f6._.js.map