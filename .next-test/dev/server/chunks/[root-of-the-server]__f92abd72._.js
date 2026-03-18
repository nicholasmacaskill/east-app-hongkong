;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="effcc2d9-a5cc-92af-b592-fda8bd85e606")}catch(e){}}();
module.exports = [
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/lib/incremental-cache/tags-manifest.external.js [external] (next/dist/server/lib/incremental-cache/tags-manifest.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/lib/incremental-cache/tags-manifest.external.js", () => require("next/dist/server/lib/incremental-cache/tags-manifest.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/proxy.ts [middleware] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "proxy",
    ()=>proxy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [middleware] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createServerClient.js [middleware] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [middleware] (ecmascript)");
;
;
async function proxy(request) {
    try {
        let response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next({
            request: {
                headers: request.headers
            }
        });
        const supabaseUrl = ("TURBOPACK compile-time value", "https://ktlicvvczrlppqkcqedv.supabase.co");
        const supabaseKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0bGljdnZjenJscHBxa2NxZWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyODY1MzksImV4cCI6MjA4NDg2MjUzOX0.dc3GJmGVXM8WscM3jOFaChUroGtacwEVH1n35EUbGPU");
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["createServerClient"])(supabaseUrl, supabaseKey, {
            cookies: {
                getAll () {
                    return request.cookies.getAll();
                },
                setAll (cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value })=>request.cookies.set(name, value));
                        response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next({
                            request
                        });
                        cookiesToSet.forEach(({ name, value, options })=>response.cookies.set(name, value, options));
                    } catch (err) {
                        console.error("Middleware: Failed to set cookies", err);
                    }
                }
            }
        });
        // Refresh session
        let { data: { user } } = await supabase.auth.getUser();
        // Fallback: Check for Bearer Token (for API routes)
        if (!user && request.headers.get('Authorization')) {
            const token = request.headers.get('Authorization')?.replace('Bearer ', '');
            if (token) {
                const { data: { user: headerUser } } = await supabase.auth.getUser(token);
                user = headerUser;
            }
        }
        // 1. GLOBAL PROTECTION (Unauthenticated)
        const isApiRequest = request.nextUrl.pathname.startsWith('/api/');
        const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/forgot-password') || request.nextUrl.pathname.startsWith('/api/auth');
        const isWebhook = request.nextUrl.pathname.startsWith('/api/webhooks');
        const isStaticAsset = /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(request.nextUrl.pathname);
        const isPublicPage = request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/public') || isAuthPage || isWebhook || isStaticAsset;
        if (!user && !isPublicPage) {
            if (isApiRequest) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'Unauthorized'
                }, {
                    status: 401
                });
            }
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/login', request.url));
        }
        // 2. ROLE-BASED PROTECTION
        if (user) {
            // BYPASS RLS: Use Service Role Key to check role securely
            const serviceRoleSupabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["createServerClient"])(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
                cookies: {
                    getAll () {
                        return request.cookies.getAll();
                    },
                    setAll () {}
                }
            });
            // DEFENSIVE: Retry profile fetch to handle race conditions for new users
            let profile = null;
            let role = null;
            for(let i = 0; i < 2; i++){
                const { data } = await serviceRoleSupabase.from('profiles').select('role').eq('id', user.id).single();
                if (data?.role) {
                    profile = data;
                    role = data.role;
                    break;
                }
                // Shorter wait for better responsiveness
                if (i < 1) await new Promise((resolve)=>setTimeout(resolve, 50));
            }
            // Admin only
            if (request.nextUrl.pathname.startsWith('/sys-admin') || request.nextUrl.pathname.startsWith('/api/admin')) {
                if (role !== 'admin' && role !== 'sys-admin') {
                    if (isApiRequest) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: 'Forbidden'
                    }, {
                        status: 403
                    });
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/', request.url));
                }
            }
            // Coach only
            if (request.nextUrl.pathname.startsWith('/coach') || request.nextUrl.pathname.startsWith('/api/coach')) {
                if (role !== 'admin' && role !== 'sys-admin' && role !== 'coach') {
                    if (isApiRequest) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: 'Forbidden'
                    }, {
                        status: 403
                    });
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/', request.url));
                }
            }
        }
        return response;
    } catch (e) {
        // FAIL OPEN: If middleware crashes, log it but don't take down the site
        console.error("CRITICAL MIDDLEWARE ERROR:", e);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__["NextResponse"].next({
            request: {
                headers: request.headers
            }
        });
    }
}
const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
    ]
};
}),
];

//# debugId=effcc2d9-a5cc-92af-b592-fda8bd85e606
//# sourceMappingURL=%5Broot-of-the-server%5D__f92abd72._.js.map