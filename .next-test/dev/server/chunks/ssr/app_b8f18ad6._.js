;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="9ba00dde-2a79-8344-da86-b37ad83efe6b")}catch(e){}}();
module.exports = [
"[project]/app/lib/dateUtils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/date-fns/format.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$parseISO$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/parseISO.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/isValid.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2d$tz$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/date-fns-tz/dist/esm/index.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2d$tz$2f$dist$2f$esm$2f$formatInTimeZone$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns-tz/dist/esm/formatInTimeZone/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2d$tz$2f$dist$2f$esm$2f$toDate$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns-tz/dist/esm/toDate/index.js [app-ssr] (ecmascript)");
;
;
const APP_TIMEZONE = 'Asia/Hong_Kong';
const HK_TZ = APP_TIMEZONE;
function safeDate(dateString) {
    if (!dateString) return null;
    // If it's already a Date object, return it if valid
    if (Object.prototype.toString.call(dateString) === '[object Date]') {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValid"])(dateString) ? dateString : null;
    }
    if (typeof dateString !== 'string') {
        // If it's a number (timestamp), try to parse it
        if (typeof dateString === 'number') {
            const d = new Date(dateString);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValid"])(d) ? d : null;
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
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValid"])(parsed)) {
        try {
            const isoParsed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$parseISO$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["parseISO"])(cleanString);
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValid"])(isoParsed)) return isoParsed;
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
    if (!dateObj || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValid"])(dateObj)) {
        return fallback;
    }
    try {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["format"])(dateObj, formatStr);
    } catch (error) {
        console.warn(`formatDateSafe: Error formatting date`, error);
        return fallback;
    }
}
function safetoLocaleDateString(date, locales, options, fallback = '') {
    if (!date) return fallback;
    const dateObj = typeof date === 'string' ? safeDate(date) : date;
    if (!dateObj || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValid"])(dateObj)) {
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
    if (!d || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValid"])(d)) return '';
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2d$tz$2f$dist$2f$esm$2f$formatInTimeZone$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatInTimeZone"])(d, HK_TZ, formatStr);
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
        const d = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2d$tz$2f$dist$2f$esm$2f$toDate$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toDate"])(dateStr, {
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
    if (!d || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isValid$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValid"])(d)) return '';
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2d$tz$2f$dist$2f$esm$2f$formatInTimeZone$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatInTimeZone"])(d, HK_TZ, "yyyy-MM-dd'T'HH:mm");
}
function formatAuditHK(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    // Simple ISO return for audit logs to ensure consistency
    return d.toISOString();
}
}),
"[project]/app/admin-ops/schedule/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdminOpsSchedulePage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/supabase.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-left.js [app-ssr] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-ssr] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [app-ssr] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/refresh-cw.js [app-ssr] (ecmascript) <export default as RefreshCw>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-ssr] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-ssr] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/save.js [app-ssr] (ecmascript) <export default as Save>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/star.js [app-ssr] (ecmascript) <export default as Star>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/date-fns/format.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$addDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/addDays.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$subDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/subDays.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$startOfWeek$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/startOfWeek.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isSameDay$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns/isSameDay.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/dateUtils.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$Toast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/ui/Toast.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
function ScheduleContent() {
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const autoInstructor = searchParams?.get('instructor');
    const hasAutoOpened = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].useRef(false);
    const { addToast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$Toast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useToast"])();
    const [sessions, setSessions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [availability, setAvailability] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [coaches, setCoaches] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [services, setServices] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [coachServices, setCoachServices] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [selectedDate, setSelectedDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatHK"])(new Date(), 'yyyy-MM-dd'));
    const [viewStartDate, setViewStartDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$startOfWeek$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["startOfWeek"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["safeDate"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatHK"])(new Date(), 'yyyy-MM-dd')) || new Date(), {
        weekStartsOn: 1
    }));
    const [activeCategory, setActiveCategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(searchParams?.get('category')?.toUpperCase() || 'ALL');
    const [filterCoachId, setFilterCoachId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('ALL');
    const [filterFacilityId, setFilterFacilityId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('ALL');
    const weekDays = Array.from({
        length: 7
    }, (_, i)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$addDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDays"])(viewStartDate, i));
    const handlePrevWeek = ()=>setViewStartDate((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$subDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["subDays"])(viewStartDate, 7));
    const handleNextWeek = ()=>setViewStartDate((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$addDays$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["addDays"])(viewStartDate, 7));
    // UI States
    const [showModal, setShowModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [modalAction, setModalAction] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('CREATE');
    const [editingSession, setEditingSession] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [recurring, setRecurring] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [repeatDays, setRepeatDays] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [repeatWeeks, setRepeatWeeks] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(4);
    const [registrations, setRegistrations] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (autoInstructor && !hasAutoOpened.current) {
            hasAutoOpened.current = true;
            setModalAction('CREATE');
            const now = new Date();
            now.setMinutes(0, 0, 0);
            const start = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
            const end = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
            setEditingSession({
                title: `${autoInstructor} - Session`,
                category: 'PRIVATE',
                instructor: autoInstructor,
                start_time: start,
                end_time: end,
                total_facility_bays: 0,
                max_capacity: 1,
                credit_cost: 100,
                session_type_id: undefined,
                lockInstructor: true,
                description: '',
                image_url: ''
            });
            setShowModal(true);
        }
    }, [
        autoInstructor
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        fetchSchedule();
        fetchCoaches();
        fetchServices();
        fetchCoachServices();
    }, [
        viewStartDate,
        activeCategory
    ]);
    const fetchSchedule = async ()=>{
        setLoading(true);
        const startOfView = new Date(viewStartDate);
        startOfView.setHours(0, 0, 0, 0);
        const endOfView = new Date(viewStartDate);
        endOfView.setDate(endOfView.getDate() + 7);
        endOfView.setHours(23, 59, 59, 999);
        try {
            let start = startOfView.toISOString();
            let end = endOfView.toISOString();
            if (activeCategory === 'EVENT') {
                const now = new Date();
                start = now.toISOString();
            }
            const { data: { session } } = await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
            const token = session?.access_token;
            const res = await fetch(`/api/admin/schedule?start=${start}&end=${end}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.error) {
                addToast("Failed to load schedule", "error");
            } else {
                setSessions(data.sessions || []);
                setAvailability(data.availability || []);
            }
        } catch (e) {
            console.error('Fetch schedule error:', e);
        } finally{
            setLoading(false);
        }
    };
    const fetchCoaches = async ()=>{
        const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('profiles').select('id, first_name, last_name').eq('role', 'coach');
        if (data) setCoaches(data.map((c)=>({
                ...c,
                first_name: c.first_name?.trim() || '',
                last_name: c.last_name?.trim() || ''
            })));
    };
    const fetchServices = async ()=>{
        const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('session_types').select('*').order('title');
        setServices(data || []);
    };
    const fetchCoachServices = async ()=>{
        const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('coach_services').select('*');
        setCoachServices(data || []);
    };
    const fetchRegistrations = async (sessionId)=>{
        const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('registrations').select('*, profiles(first_name, last_name)').eq('session_id', sessionId);
        setRegistrations(data || []);
    };
    const handleCellClick = (timeSlot)=>{
        const start = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toHKISO"])(`${selectedDate}T${timeSlot}:00`);
        const nextHourNum = parseInt(timeSlot.split(':')[0]) + 1;
        const nextHour = nextHourNum.toString().padStart(2, '0');
        const end = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toHKISO"])(`${selectedDate}T${nextHour}:00`);
        setModalAction('CREATE');
        setEditingSession({
            title: autoInstructor ? `${autoInstructor} - Session` : '',
            category: autoInstructor ? 'PRIVATE' : 'FACILITY',
            instructor: autoInstructor || '',
            start_time: start,
            end_time: end,
            total_facility_bays: 0,
            max_capacity: autoInstructor ? 1 : 4,
            credit_cost: 100,
            session_type_id: undefined,
            lockInstructor: !!autoInstructor,
            description: '',
            image_url: ''
        });
        setShowModal(true);
        setRegistrations([]);
    };
    const handleSessionClick = (session)=>{
        setModalAction('EDIT');
        setEditingSession({
            ...session,
            lockInstructor: !!session.instructor
        });
        setShowModal(true);
        if (session.registrations && session.registrations.length > 0) {
            setRegistrations(session.registrations);
        } else if (session.id) {
            fetchRegistrations(session.id);
        } else {
            setRegistrations([]);
        }
    };
    const handleSaveSession = async ()=>{
        if (!editingSession.title || !editingSession.start_time || !editingSession.end_time) {
            addToast("Title and times are required.", "warning");
            return;
        }
        try {
            const { lockInstructor, ...cleanSessionData } = editingSession;
            let sessionsToCreate = [
                cleanSessionData
            ];
            if (recurring && modalAction === 'CREATE') {
                const start = new Date((0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toHKISO"])(cleanSessionData.start_time));
                const end = new Date((0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toHKISO"])(cleanSessionData.end_time));
                sessionsToCreate = [];
                for(let w = 0; w < repeatWeeks; w++){
                    for (const day of repeatDays){
                        const targetDate = new Date(start);
                        targetDate.setDate(start.getDate() + w * 7 + (day - start.getDay()));
                        if (targetDate < start && w === 0) continue;
                        const diff = targetDate.getTime() - start.getTime();
                        sessionsToCreate.push({
                            ...cleanSessionData,
                            start_time: new Date(start.getTime() + diff).toISOString(),
                            end_time: new Date(end.getTime() + diff).toISOString()
                        });
                    }
                }
            } else {
                sessionsToCreate = [
                    {
                        ...cleanSessionData,
                        start_time: (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toHKISO"])(cleanSessionData.start_time),
                        end_time: (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toHKISO"])(cleanSessionData.end_time)
                    }
                ];
            }
            const res = await fetch('/api/admin/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: modalAction,
                    id: editingSession.id,
                    sessionData: sessionsToCreate.length > 1 ? sessionsToCreate : sessionsToCreate[0]
                })
            });
            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                setRecurring(false);
                setRepeatDays([]);
                fetchSchedule();
            } else {
                addToast(data.error, "error");
            }
        } catch (e) {
            console.error(e);
        }
    };
    const handleDeleteSession = async ()=>{
        if (!confirm("Are you sure you want to CANCEL this session? It will remain visible in the schedule but marked as cancelled.")) return;
        try {
            const res = await fetch('/api/admin/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'DELETE',
                    id: editingSession.id
                })
            });
            if ((await res.json()).success) {
                setShowModal(false);
                fetchSchedule();
            }
        } catch (e) {
            console.error(e);
        }
    };
    const normalizeName = (name)=>name?.replace(/\s+/g, ' ').trim().toLowerCase() || '';
    // Filter Logic
    const rawItems = [
        ...sessions.map((s)=>({
                ...s,
                type: 'session',
                session_type_title: services.find((svc)=>svc.id === s.session_type_id)?.title || s.title
            })),
        ...availability.map((a)=>{
            const isFacility = !a.coach_id || a.facility_category;
            return {
                id: a.id,
                title: isFacility ? a.facility_category || 'Facility Hours' : 'Open Slot',
                category: isFacility ? 'FACILITY' : a.category || 'PRIVATE',
                instructor: a.profiles ? `${a.profiles.first_name} ${a.profiles.last_name || ''}`.trim() : 'Facility',
                start_time: a.start_time,
                end_time: a.end_time,
                type: 'slot',
                coach_id: a.coach_id,
                facility_category: a.facility_category,
                session_type_title: a.facility_category || 'Facility Hours'
            };
        })
    ];
    const filteredItems = rawItems.filter((item)=>{
        const sDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["safeDate"])(item.start_time);
        if (!sDate || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isSameDay$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isSameDay"])(sDate, new Date(selectedDate))) return false;
        if (activeCategory !== 'ALL' && item.category !== activeCategory) return false;
        if (filterCoachId !== 'ALL') {
            if (item.type === 'slot') return item.coach_id === filterCoachId;
            const coach = coaches.find((c)=>c.id === filterCoachId);
            if (coach) {
                const instrName = normalizeName(item.instructor || '');
                const coachName = normalizeName(`${coach.first_name} ${coach.last_name}`);
                if (instrName !== coachName && instrName !== `coach ${coachName}`) return false;
            }
        }
        if (filterFacilityId !== 'ALL') {
            if (item.category !== 'FACILITY') return false;
            let isMatch = item.session_type_title === filterFacilityId || item.title === filterFacilityId || item.facility_category === filterFacilityId;
            if (item.type === 'slot') {
                if (!item.facility_category || item.facility_category === 'ALL') isMatch = true;
                else if (item.facility_category === filterFacilityId) isMatch = true;
            }
            if (!isMatch) return false;
        }
        return true;
    });
    const TOTAL_BAYS = 4;
    const mergedItems = filteredItems.map((item)=>{
        if (item.type === 'slot' && item.category === 'FACILITY') {
            const slotStart = new Date(item.start_time).getTime();
            const slotEnd = new Date(item.end_time).getTime();
            const overlappingSessions = filteredItems.filter((s)=>{
                if (s.type !== 'session' || s.status === 'cancelled') return false;
                const sStart = new Date(s.start_time).getTime();
                const sEnd = new Date(s.end_time).getTime();
                return slotStart < sEnd && sStart < slotEnd;
            });
            const baysUsed = overlappingSessions.reduce((sum, s)=>sum + (s.total_facility_bays || 0), 0);
            return {
                ...item,
                availableBays: Math.max(0, TOTAL_BAYS - baysUsed),
                totalBays: TOTAL_BAYS
            };
        }
        return item;
    }).sort((a, b)=>{
        const hasRegsA = a.type === 'session' && a.registrations && a.registrations.length > 0;
        const hasRegsB = b.type === 'session' && b.registrations && b.registrations.length > 0;
        const priorityA = hasRegsA ? 1 : a.type === 'session' ? 2 : 3;
        const priorityB = hasRegsB ? 1 : b.type === 'session' ? 2 : 3;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return ((0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["safeDate"])(a.start_time)?.getTime() || 0) - ((0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["safeDate"])(b.start_time)?.getTime() || 0);
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-8 animate-in fade-in duration-700",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col md:flex-row md:items-center justify-between gap-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-4xl font-black italic uppercase tracking-tighter mb-2",
                                children: [
                                    "Master ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[#28D160]",
                                        children: "Schedule"
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                        lineNumber: 367,
                                        columnNumber: 32
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                lineNumber: 366,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-400 text-sm font-medium",
                                children: "Coordinate the entire facility's timeline and coach deployments."
                            }, void 0, false, {
                                fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                lineNumber: 369,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                        lineNumber: 365,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between bg-[#1a1a1a] rounded-2xl px-2 py-1 border border-white/5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handlePrevWeek,
                                        className: "p-3 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                                            size: 20
                                        }, void 0, false, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 374,
                                            columnNumber: 29
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                        lineNumber: 373,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "px-4 py-1 flex flex-col items-center min-w-[140px]",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[10px] font-black uppercase tracking-widest text-[#28D160]",
                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["format"])(new Date(selectedDate), 'MMMM yyyy')
                                        }, void 0, false, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 377,
                                            columnNumber: 29
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                        lineNumber: 376,
                                        columnNumber: 25
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleNextWeek,
                                        className: "p-3 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                            size: 20
                                        }, void 0, false, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 380,
                                            columnNumber: 29
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                        lineNumber: 379,
                                        columnNumber: 25
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                lineNumber: 372,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: fetchSchedule,
                                className: "p-4 bg-[#1a1a1a] rounded-2xl hover:bg-white/5 transition-colors border border-white/5 group",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                                    size: 22,
                                    className: loading ? 'animate-spin text-[#28D160]' : 'text-gray-600 group-hover:text-[#28D160]'
                                }, void 0, false, {
                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                    lineNumber: 384,
                                    columnNumber: 25
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                lineNumber: 383,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                        lineNumber: 371,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/admin-ops/schedule/page.tsx",
                lineNumber: 364,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-[#1a1a1a] p-3 rounded-[2rem] border border-white/5 shadow-2xl",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-7 gap-3",
                    children: weekDays.map((day, i)=>{
                        const dateStr = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["format"])(day, 'yyyy-MM-dd');
                        const isSelected = dateStr === selectedDate;
                        const isToday = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$isSameDay$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isSameDay"])(day, new Date());
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setSelectedDate(dateStr),
                            className: `flex flex-col items-center justify-center py-5 rounded-3xl transition-all border ${isSelected ? 'bg-[#28D160] border-transparent text-black shadow-xl shadow-[#28D160]/20 scale-105 z-10' : 'bg-black/20 border-white/5 text-gray-500 hover:border-white/20 hover:bg-white/5'}`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: `text-[10px] font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-black/60' : 'text-gray-700'}`,
                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["format"])(day, 'EEE')
                                }, void 0, false, {
                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                    lineNumber: 398,
                                    columnNumber: 33
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xl font-black italic leading-none",
                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2f$format$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["format"])(day, 'd')
                                }, void 0, false, {
                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                    lineNumber: 399,
                                    columnNumber: 33
                                }, this),
                                isToday && !isSelected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-2 w-1.5 h-1.5 bg-[#28D160] rounded-full animate-pulse"
                                }, void 0, false, {
                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                    lineNumber: 400,
                                    columnNumber: 60
                                }, this)
                            ]
                        }, i, true, {
                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                            lineNumber: 397,
                            columnNumber: 29
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                    lineNumber: 391,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/admin-ops/schedule/page.tsx",
                lineNumber: 390,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col lg:flex-row gap-6 items-center justify-between pb-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex overflow-x-auto no-scrollbar gap-2 w-full lg:w-auto p-1",
                        children: [
                            'ALL',
                            'PRIVATE',
                            'FACILITY',
                            'CLASS',
                            'EVENT'
                        ].map((cat)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setActiveCategory(cat),
                                className: `px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeCategory === cat ? 'bg-[#28D160] border-transparent text-black shadow-lg shadow-[#28D160]/20' : 'bg-[#1a1a1a] border-white/5 text-gray-500 hover:border-[#28D160]/30'}`,
                                children: cat === 'ALL' ? 'Universe' : cat.replace('_', ' ')
                            }, cat, false, {
                                fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                lineNumber: 411,
                                columnNumber: 25
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                        lineNumber: 409,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-3 w-full lg:w-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: filterFacilityId,
                                onChange: (e)=>setFilterFacilityId(e.target.value),
                                className: "bg-[#1a1a1a] border border-white/5 text-white text-[10px] font-black uppercase p-4 rounded-xl outline-none focus:border-[#28D160] flex-1 lg:w-56 appearance-none cursor-pointer",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "ALL",
                                        children: "All Facilities"
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                        lineNumber: 418,
                                        columnNumber: 25
                                    }, this),
                                    Array.from(new Set(services.filter((s)=>s.category === 'FACILITY').map((s)=>s.title))).map((title)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: title,
                                            children: title
                                        }, title, false, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 420,
                                            columnNumber: 29
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                lineNumber: 417,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: filterCoachId,
                                onChange: (e)=>setFilterCoachId(e.target.value),
                                className: "bg-[#1a1a1a] border border-white/5 text-white text-[10px] font-black uppercase p-4 rounded-xl outline-none focus:border-[#28D160] flex-1 lg:w-56 appearance-none cursor-pointer",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "ALL",
                                        children: "All Coaches"
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                        lineNumber: 424,
                                        columnNumber: 25
                                    }, this),
                                    coaches.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: c.id,
                                            children: [
                                                c.first_name,
                                                " ",
                                                c.last_name
                                            ]
                                        }, c.id, true, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 425,
                                            columnNumber: 43
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                lineNumber: 423,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                        lineNumber: 416,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/admin-ops/schedule/page.tsx",
                lineNumber: 408,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-4",
                children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col items-center justify-center py-32 bg-[#1a1a1a] rounded-[3rem] border border-white/5",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                            size: 56,
                            className: "animate-spin mb-6 text-[#28D160]/20"
                        }, void 0, false, {
                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                            lineNumber: 434,
                            columnNumber: 25
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "font-black uppercase tracking-[0.2em] text-[10px] text-gray-600 italic",
                            children: "Syncing Temporal Roster..."
                        }, void 0, false, {
                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                            lineNumber: 435,
                            columnNumber: 25
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                    lineNumber: 433,
                    columnNumber: 21
                }, this) : mergedItems.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center py-32 bg-[#1a1a1a] rounded-[3rem] border border-dashed border-white/10 group",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                            size: 64,
                            className: "mx-auto mb-6 text-gray-800 group-hover:text-[#28D160] transition-colors"
                        }, void 0, false, {
                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                            lineNumber: 439,
                            columnNumber: 25
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "text-2xl font-black italic uppercase text-gray-700",
                            children: "No active deployments"
                        }, void 0, false, {
                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                            lineNumber: 440,
                            columnNumber: 25
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>handleCellClick("09:00"),
                            className: "mt-6 bg-[#28D160] text-black px-10 py-4 rounded-2xl font-black text-xs uppercase italic tracking-widest hover:bg-white transition-all shadow-xl active:scale-95",
                            children: "Initialize Schedule"
                        }, void 0, false, {
                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                            lineNumber: 441,
                            columnNumber: 25
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                    lineNumber: 438,
                    columnNumber: 21
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-3",
                    children: mergedItems.map((item, idx)=>{
                        const isSlot = item.type === 'slot';
                        const startTime = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatHK"])(item.start_time, 'h:mm a').toLowerCase();
                        const duration = Math.round((((0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["safeDate"])(item.end_time)?.getTime() || 0) - ((0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["safeDate"])(item.start_time)?.getTime() || 0)) / 60000);
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            onClick: ()=>isSlot ? handleCellClick((0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatHK"])(item.start_time, 'HH:mm')) : handleSessionClick(item),
                            className: `group flex gap-6 p-5 rounded-3xl transition-all cursor-pointer border ${isSlot ? 'bg-black/20 border-white/5 border-dashed hover:border-[#28D160]/30' : 'bg-[#1a1a1a] border-white/10 hover:border-[#28D160] hover:shadow-2xl hover:shadow-[#28D160]/5'} ${item.status === 'cancelled' ? 'opacity-30 grayscale' : ''}`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col items-center justify-center min-w-[90px] border-r border-white/5 pr-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: `text-xl font-black italic leading-none ${isSlot ? 'text-gray-700' : 'text-white'}`,
                                            children: startTime
                                        }, void 0, false, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 452,
                                            columnNumber: 41
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[10px] font-black text-gray-700 uppercase mt-2",
                                            children: [
                                                duration,
                                                " MIN"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 453,
                                            columnNumber: 41
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                    lineNumber: 451,
                                    columnNumber: 37
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex-1 py-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex justify-between items-start mb-2",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                        className: `font-black uppercase italic tracking-tighter text-lg ${isSlot ? 'text-gray-700' : item.status === 'cancelled' ? 'text-gray-600 line-through' : 'text-white'}`,
                                                        children: item.title
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                        lineNumber: 458,
                                                        columnNumber: 49
                                                    }, this),
                                                    !isSlot && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `${item.category === 'FACILITY' ? 'bg-[#28D160]/10 text-[#28D160]' : 'bg-blue-500/10 text-blue-400'} text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest`,
                                                        children: item.category
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                        lineNumber: 459,
                                                        columnNumber: 61
                                                    }, this),
                                                    isSlot && item.category === 'FACILITY' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${item.availableBays > 0 ? 'bg-orange-500/10 text-orange-400' : 'bg-red-500/10 text-red-500'}`,
                                                        children: [
                                                            item.availableBays,
                                                            " / ",
                                                            item.totalBays,
                                                            " Bays Free"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                        lineNumber: 461,
                                                        columnNumber: 53
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                lineNumber: 457,
                                                columnNumber: 45
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 456,
                                            columnNumber: 41
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-between",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex flex-col gap-1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center gap-3",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                                                        size: 12,
                                                                        className: isSlot ? 'text-gray-800' : 'text-[#28D160]'
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                                        lineNumber: 471,
                                                                        columnNumber: 57
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                                    lineNumber: 470,
                                                                    columnNumber: 53
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: `text-xs font-black uppercase italic tracking-tight ${isSlot ? 'text-gray-700' : 'text-gray-400'}`,
                                                                    children: item.instructor || 'Staff Command'
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                                    lineNumber: 473,
                                                                    columnNumber: 53
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                            lineNumber: 469,
                                                            columnNumber: 49
                                                        }, this),
                                                        item.registrations && item.registrations.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center gap-2 ml-8 mt-1",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"], {
                                                                    size: 10,
                                                                    className: "text-[#28D160] fill-[#28D160]"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                                    lineNumber: 477,
                                                                    columnNumber: 57
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-[10px] text-[#28D160] font-black uppercase italic tracking-widest",
                                                                    children: [
                                                                        item.registrations.length,
                                                                        " Active Duty Athletes"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                                    lineNumber: 478,
                                                                    columnNumber: 57
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                            lineNumber: 476,
                                                            columnNumber: 53
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                    lineNumber: 468,
                                                    columnNumber: 45
                                                }, this),
                                                !isSlot && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-6",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-right",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-[10px] font-black text-gray-700 uppercase leading-none",
                                                                children: "Price"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                                lineNumber: 485,
                                                                columnNumber: 57
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-sm font-black italic text-[#28D160] leading-none mt-1",
                                                                children: item.credit_cost
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                                lineNumber: 486,
                                                                columnNumber: 57
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                        lineNumber: 484,
                                                        columnNumber: 53
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                    lineNumber: 483,
                                                    columnNumber: 49
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 467,
                                            columnNumber: 41
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                    lineNumber: 455,
                                    columnNumber: 37
                                }, this)
                            ]
                        }, item.id || idx, true, {
                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                            lineNumber: 450,
                            columnNumber: 33
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                    lineNumber: 444,
                    columnNumber: 21
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/admin-ops/schedule/page.tsx",
                lineNumber: 431,
                columnNumber: 13
            }, this),
            showModal && editingSession && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-[#1a1a1a] p-10 rounded-[3rem] w-full max-w-xl border border-white/10 shadow-[0_0_100px_rgba(40,209,96,0.1)] overflow-y-auto max-h-[90vh] no-scrollbar",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between items-center mb-10",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "font-black italic text-4xl uppercase tracking-tighter text-[#28D160]",
                                            children: modalAction === 'CREATE' ? 'New Deployment' : 'Review Session'
                                        }, void 0, false, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 505,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-gray-600 text-[10px] font-black uppercase tracking-[0.2em] mt-2 px-1",
                                            children: "Resource Allocation Protocol"
                                        }, void 0, false, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 506,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                    lineNumber: 504,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setShowModal(false),
                                    className: "p-3 bg-white/5 border border-white/5 rounded-full hover:bg-white/10 transition-colors text-gray-500 hover:text-white",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                        size: 24
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                        lineNumber: 508,
                                        columnNumber: 202
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                    lineNumber: 508,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                            lineNumber: 503,
                            columnNumber: 25
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-6 bg-black/40 p-8 rounded-[2rem] border border-white/5 shadow-inner",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "text-[10px] font-black text-[#28D160] uppercase tracking-widest px-2 mb-3 block italic",
                                                    children: "Template Alignment"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                    lineNumber: 514,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                    value: editingSession.session_type_id || '',
                                                    onChange: (e)=>{
                                                        const svc = services.find((s)=>s.id === e.target.value);
                                                        if (svc) setEditingSession({
                                                            ...editingSession,
                                                            session_type_id: svc.id,
                                                            category: svc.category,
                                                            title: svc.title,
                                                            credit_cost: svc.credit_cost || 100
                                                        });
                                                        else setEditingSession({
                                                            ...editingSession,
                                                            session_type_id: undefined,
                                                            category: 'FACILITY'
                                                        });
                                                    },
                                                    className: "w-full bg-black/80 border border-white/5 p-5 rounded-2xl text-white outline-none focus:border-[#28D160]/50 text-sm font-black italic appearance-none cursor-pointer",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: "",
                                                            children: "-- CUSTOM PROTOCOL --"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                            lineNumber: 520,
                                                            columnNumber: 41
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("optgroup", {
                                                            label: "CLASSES",
                                                            children: services.filter((s)=>s.category === 'CLASS').map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                    value: s.id,
                                                                    children: s.title
                                                                }, s.id, false, {
                                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                                    lineNumber: 521,
                                                                    columnNumber: 122
                                                                }, this))
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                            lineNumber: 521,
                                                            columnNumber: 41
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("optgroup", {
                                                            label: "PRIVATE LESSONS",
                                                            children: services.filter((s)=>s.category === 'PRIVATE').map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                    value: s.id,
                                                                    children: s.title
                                                                }, s.id, false, {
                                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                                    lineNumber: 522,
                                                                    columnNumber: 132
                                                                }, this))
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                            lineNumber: 522,
                                                            columnNumber: 41
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("optgroup", {
                                                            label: "FACILITIES",
                                                            children: services.filter((s)=>s.category === 'FACILITY').map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                    value: s.id,
                                                                    children: s.title
                                                                }, s.id, false, {
                                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                                    lineNumber: 523,
                                                                    columnNumber: 128
                                                                }, this))
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                            lineNumber: 523,
                                                            columnNumber: 41
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                    lineNumber: 515,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 513,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            className: "text-[10px] font-black text-gray-700 uppercase tracking-widest px-2 mb-3 block",
                                                            children: "Display Identity"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                            lineNumber: 528,
                                                            columnNumber: 41
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            value: editingSession.title,
                                                            onChange: (e)=>setEditingSession({
                                                                    ...editingSession,
                                                                    title: e.target.value
                                                                }),
                                                            className: "w-full bg-black/80 border border-white/5 p-5 rounded-2xl text-white outline-none focus:border-[#28D160]/50 font-black italic text-sm"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                            lineNumber: 529,
                                                            columnNumber: 41
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                    lineNumber: 527,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            className: "text-[10px] font-black text-gray-700 uppercase tracking-widest px-2 mb-3 block",
                                                            children: "Deployment Lead"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                            lineNumber: 532,
                                                            columnNumber: 41
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                            value: editingSession.instructor,
                                                            onChange: (e)=>setEditingSession({
                                                                    ...editingSession,
                                                                    instructor: e.target.value
                                                                }),
                                                            disabled: editingSession.lockInstructor,
                                                            className: `w-full bg-black/80 border border-white/5 p-5 rounded-2xl text-xs font-black italic outline-none focus:border-[#28D160]/50 appearance-none cursor-pointer ${editingSession.lockInstructor ? 'opacity-50 grayscale' : ''}`,
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                    value: "",
                                                                    children: "COMMAND STAFF"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                                    lineNumber: 534,
                                                                    columnNumber: 45
                                                                }, this),
                                                                coaches.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                        value: `${c.first_name} ${c.last_name}`,
                                                                        children: [
                                                                            c.first_name,
                                                                            " ",
                                                                            c.last_name
                                                                        ]
                                                                    }, c.id, true, {
                                                                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                                        lineNumber: 535,
                                                                        columnNumber: 63
                                                                    }, this))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                            lineNumber: 533,
                                                            columnNumber: 41
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                    lineNumber: 531,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 526,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-2 md:grid-cols-3 gap-6",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "md:col-span-1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            className: "text-[10px] font-black text-gray-700 uppercase tracking-widest px-2 mb-3 block",
                                                            children: "Credit Cost"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                            lineNumber: 541,
                                                            columnNumber: 42
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "number",
                                                            value: editingSession.credit_cost,
                                                            onChange: (e)=>setEditingSession({
                                                                    ...editingSession,
                                                                    credit_cost: parseInt(e.target.value) || 0
                                                                }),
                                                            className: "w-full bg-black/80 border border-white/5 p-5 rounded-2xl text-white font-black italic text-center"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                            lineNumber: 542,
                                                            columnNumber: 42
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                    lineNumber: 540,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            className: "text-[10px] font-black text-gray-700 uppercase tracking-widest px-2 mb-3 block",
                                                            children: "Max Load"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                            lineNumber: 545,
                                                            columnNumber: 42
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "number",
                                                            value: editingSession.max_capacity,
                                                            onChange: (e)=>setEditingSession({
                                                                    ...editingSession,
                                                                    max_capacity: parseInt(e.target.value) || 1
                                                                }),
                                                            className: "w-full bg-black/80 border border-white/5 p-5 rounded-2xl text-white font-black italic text-center"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                            lineNumber: 546,
                                                            columnNumber: 42
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                    lineNumber: 544,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "col-span-2 md:col-span-1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            className: "text-[10px] font-black text-orange-500/80 uppercase tracking-widest px-2 mb-3 block",
                                                            children: "Facility Bays"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                            lineNumber: 549,
                                                            columnNumber: 42
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "number",
                                                            value: editingSession.total_facility_bays,
                                                            onChange: (e)=>setEditingSession({
                                                                    ...editingSession,
                                                                    total_facility_bays: parseInt(e.target.value) || 0
                                                                }),
                                                            className: "w-full bg-black/80 border border-white/5 p-5 rounded-2xl text-orange-500 font-black italic text-center outline-none focus:border-orange-500"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                            lineNumber: 550,
                                                            columnNumber: 42
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                    lineNumber: 548,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 539,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                    lineNumber: 512,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/40 p-8 rounded-[2rem] border border-white/5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "text-[10px] font-black text-gray-700 uppercase tracking-widest px-2 mb-3 block",
                                                    children: "Mission Start"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                    lineNumber: 557,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "datetime-local",
                                                    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toHKPickerValue"])(editingSession.start_time),
                                                    onChange: (e)=>setEditingSession({
                                                            ...editingSession,
                                                            start_time: e.target.value
                                                        }),
                                                    className: "w-full bg-black/80 border border-white/5 p-4 rounded-xl text-[11px] text-white font-black uppercase tracking-widest outline-none shadow-inner",
                                                    style: {
                                                        colorScheme: 'dark'
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                    lineNumber: 558,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 556,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "text-[10px] font-black text-gray-700 uppercase tracking-widest px-2 mb-3 block",
                                                    children: "Mission End"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                    lineNumber: 561,
                                                    columnNumber: 37
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "datetime-local",
                                                    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toHKPickerValue"])(editingSession.end_time),
                                                    onChange: (e)=>setEditingSession({
                                                            ...editingSession,
                                                            end_time: e.target.value
                                                        }),
                                                    className: "w-full bg-black/80 border border-white/5 p-4 rounded-xl text-[11px] text-white font-black uppercase tracking-widest outline-none shadow-inner",
                                                    style: {
                                                        colorScheme: 'dark'
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                    lineNumber: 562,
                                                    columnNumber: 37
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 560,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                    lineNumber: 555,
                                    columnNumber: 29
                                }, this),
                                modalAction === 'CREATE' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-black/40 p-8 rounded-[2rem] border border-white/5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-between mb-6",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    className: "text-[10px] font-black text-gray-500 uppercase tracking-widest italic flex items-center gap-3",
                                                    children: "Recurring Protocol"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                    lineNumber: 569,
                                                    columnNumber: 41
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>setRecurring(!recurring),
                                                    className: `w-12 h-6 rounded-full transition-all relative ${recurring ? 'bg-[#28D160]' : 'bg-white/5 border border-white/10'}`,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: `absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${recurring ? 'right-1 shadow-lg' : 'left-1'}`
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                        lineNumber: 571,
                                                        columnNumber: 45
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                    lineNumber: 570,
                                                    columnNumber: 41
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 568,
                                            columnNumber: 37
                                        }, this),
                                        recurring && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-6 animate-fadeIn",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex justify-between gap-1",
                                                    children: [
                                                        'S',
                                                        'M',
                                                        'T',
                                                        'W',
                                                        'T',
                                                        'F',
                                                        'S'
                                                    ].map((day, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>setRepeatDays(repeatDays.includes(i) ? repeatDays.filter((d)=>d !== i) : [
                                                                    ...repeatDays,
                                                                    i
                                                                ]),
                                                            className: `flex-1 h-12 rounded-xl text-[10px] font-black transition-all border ${repeatDays.includes(i) ? 'bg-[#28D160] border-transparent text-black shadow-xl shadow-[#28D160]/20' : 'bg-black/80 border-white/5 text-gray-800 hover:text-white'}`,
                                                            children: day
                                                        }, i, false, {
                                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                            lineNumber: 578,
                                                            columnNumber: 53
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                    lineNumber: 576,
                                                    columnNumber: 45
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex justify-between gap-2",
                                                    children: [
                                                        1,
                                                        2,
                                                        4,
                                                        8,
                                                        12
                                                    ].map((w)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>setRepeatWeeks(w),
                                                            className: `flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${repeatWeeks === w ? 'bg-white text-black' : 'bg-black/40 text-gray-700 hover:text-white'}`,
                                                            children: [
                                                                w,
                                                                " WEEK CYCLE"
                                                            ]
                                                        }, w, true, {
                                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                            lineNumber: 582,
                                                            columnNumber: 76
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                    lineNumber: 581,
                                                    columnNumber: 45
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 575,
                                            columnNumber: 41
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                    lineNumber: 567,
                                    columnNumber: 33
                                }, this),
                                modalAction === 'EDIT' && registrations?.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-black/40 p-8 rounded-[2rem] border border-white/5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 block italic",
                                            children: [
                                                "Deployed Athletes (",
                                                registrations.length,
                                                ")"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 591,
                                            columnNumber: 37
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-3 max-h-[150px] overflow-y-auto no-scrollbar",
                                            children: registrations.map((reg)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex justify-between items-center bg-black/60 p-4 rounded-2xl border border-white/5 transition-hover hover:border-[#28D160]/30",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-4",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "w-10 h-10 rounded-xl bg-[#28D160]/10 flex items-center justify-center text-[10px] font-black text-[#28D160] border border-[#28D160]/20 italic",
                                                                children: [
                                                                    reg.profiles?.first_name?.[0],
                                                                    reg.profiles?.last_name?.[0]
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                                lineNumber: 596,
                                                                columnNumber: 53
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-sm font-black italic uppercase tracking-tight text-white",
                                                                        children: [
                                                                            reg.profiles?.first_name,
                                                                            " ",
                                                                            reg.profiles?.last_name
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                                        lineNumber: 598,
                                                                        columnNumber: 57
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-[8px] text-gray-600 font-black uppercase tracking-widest",
                                                                        children: reg.status
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                                        lineNumber: 599,
                                                                        columnNumber: 57
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                                lineNumber: 597,
                                                                columnNumber: 53
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                        lineNumber: 595,
                                                        columnNumber: 49
                                                    }, this)
                                                }, reg.id, false, {
                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                    lineNumber: 594,
                                                    columnNumber: 45
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 592,
                                            columnNumber: 37
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                    lineNumber: 590,
                                    columnNumber: 33
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex gap-4 pt-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: handleSaveSession,
                                            className: "flex-1 bg-[#28D160] text-black font-black italic uppercase text-sm py-6 rounded-2xl hover:bg-white transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                                                    size: 20
                                                }, void 0, false, {
                                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                    lineNumber: 609,
                                                    columnNumber: 261
                                                }, this),
                                                " Deploy Changes"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 609,
                                            columnNumber: 33
                                        }, this),
                                        modalAction === 'EDIT' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: handleDeleteSession,
                                            className: "bg-red-600/10 text-red-500 border border-red-500/20 px-8 rounded-2xl hover:bg-red-600 hover:text-white transition-all",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                size: 24
                                            }, void 0, false, {
                                                fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                                lineNumber: 610,
                                                columnNumber: 228
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                            lineNumber: 610,
                                            columnNumber: 60
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                                    lineNumber: 608,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/admin-ops/schedule/page.tsx",
                            lineNumber: 511,
                            columnNumber: 25
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                    lineNumber: 502,
                    columnNumber: 21
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/admin-ops/schedule/page.tsx",
                lineNumber: 501,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/admin-ops/schedule/page.tsx",
        lineNumber: 362,
        columnNumber: 9
    }, this);
}
function AdminOpsSchedulePage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Suspense"], {
        fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col items-center justify-center py-32 opacity-50",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$refresh$2d$cw$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__RefreshCw$3e$__["RefreshCw"], {
                    size: 56,
                    className: "animate-spin mb-6 text-[#28D160]/20"
                }, void 0, false, {
                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                    lineNumber: 624,
                    columnNumber: 17
                }, void 0),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "font-black uppercase tracking-[0.2em] text-[10px] text-gray-600 italic",
                    children: "Initializing Schedule Module..."
                }, void 0, false, {
                    fileName: "[project]/app/admin-ops/schedule/page.tsx",
                    lineNumber: 625,
                    columnNumber: 17
                }, void 0)
            ]
        }, void 0, true, {
            fileName: "[project]/app/admin-ops/schedule/page.tsx",
            lineNumber: 623,
            columnNumber: 13
        }, void 0),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ScheduleContent, {}, void 0, false, {
            fileName: "[project]/app/admin-ops/schedule/page.tsx",
            lineNumber: 628,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/admin-ops/schedule/page.tsx",
        lineNumber: 622,
        columnNumber: 9
    }, this);
}
}),
];

//# debugId=9ba00dde-2a79-8344-da86-b37ad83efe6b
//# sourceMappingURL=app_b8f18ad6._.js.map