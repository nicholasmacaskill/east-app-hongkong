;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="b06a5b42-8225-ea5d-331a-5d66a7ad476b")}catch(e){}}();
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
"[project]/app/api/my-schedule/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/supabaseAdmin.ts [app-route] (ecmascript)");
;
;
async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '12'; // Default to 12 for testing
    // 1. Get Children IDs (Family View)
    // Check BOTH player_relationships table AND profiles.parent_id column for max compatibility
    const familyIds = [
        userId
    ];
    // A. Check Profiles Table (Legacy/Direct Link)
    const supabaseAdmin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseAdmin"])();
    const { data: profileChildren } = await supabaseAdmin.from('profiles').select('id').eq('parent_id', userId);
    if (profileChildren) {
        profileChildren.forEach((row)=>{
            if (!familyIds.includes(row.id)) familyIds.push(row.id);
        });
    }
    // B. Check Player Relationships Table (New Standard)
    const { data: relationshipChildren } = await supabaseAdmin.from('player_relationships').select('child_id').eq('parent_id', userId);
    if (relationshipChildren) {
        relationshipChildren.forEach((row)=>{
            if (!familyIds.includes(row.child_id)) familyIds.push(row.child_id);
        });
    }
    const { data, error } = await supabaseAdmin.from('registrations').select(`
      session_id,
      user_id,
      status,
      sessions (
        id, title, start_time, end_time, instructor, category, description, credit_cost, image_url, status
      ),
      profiles!registrations_user_id_fkey (
        id, first_name, last_name, role
      )
    `).in('user_id', familyIds) // Fetch for whole family
    .neq('status', 'cancelled');
    if (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message
        }, {
            status: 500
        });
    }
    // Flatten and Add "Who is this for?" metadata
    const schedule = (data || []).map((reg)=>{
        if (!reg.sessions) return null;
        // CRITICAL: Double-check both registration status AND session status
        if (reg.status === 'cancelled' || reg.sessions.status === 'cancelled') return null;
        const profiles = reg.profiles;
        const attendee = Array.isArray(profiles) ? profiles[0] : profiles;
        return {
            ...reg.sessions,
            attendee: attendee // Attach attendee info safely
        };
    }).filter((s)=>s && s.id);
    // Sort by date (earliest first)
    schedule.sort((a, b)=>new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    console.log(`[MY-SCHEDULE API] User ${userId} requested family schedule. familyIds [${familyIds.join(', ')}]. Found ${schedule.length} active non-cancelled classes.`);
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(schedule);
}
}),
];

//# debugId=b06a5b42-8225-ea5d-331a-5d66a7ad476b
//# sourceMappingURL=%5Broot-of-the-server%5D__f9a178bf._.js.map