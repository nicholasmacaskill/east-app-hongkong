;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="82938785-0f97-1ba9-107a-ba9a3d5a125f")}catch(e){}}();
(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
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
"[project]/app/sys-admin/coaches/AvailabilityModal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AvailabilityModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/save.js [app-client] (ecmascript) <export default as Save>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-client] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-client] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-up.js [app-client] (ecmascript) <export default as ChevronUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-client] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/supabase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$Toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/ui/Toast.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/dateUtils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2d$tz$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/date-fns-tz/dist/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2d$tz$2f$dist$2f$esm$2f$fromZonedTime$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/date-fns-tz/dist/esm/fromZonedTime/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
// Helpers
const DAYS = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat'
];
const HOURS = Array.from({
    length: 14
}, (_, i)=>i + 7); // 7 AM to 8 PM
function AvailabilityModal({ coach, onClose }) {
    _s();
    const [slots, setSlots] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const { addToast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$Toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"])();
    const [serviceTypes, setServiceTypes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    // Tracking changes
    const [deletedSlotIds, setDeletedSlotIds] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [addedSlots, setAddedSlots] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    // View State
    const [expandedDates, setExpandedDates] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    // Selection State (for Bulk Delete)
    const [selectedSlotIds, setSelectedSlotIds] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectionMode, setSelectionMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Bulk Add State
    const [showBulkTool, setShowBulkTool] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [bulkConfig, setBulkConfig] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setDate(new Date().getDate() + 28)).toISOString().split('T')[0],
        startHour: 9,
        endHour: 17,
        selectedDays: [
            1,
            3,
            5
        ],
        selectedServiceId: '',
        creditCost: 10,
        capacity: 1
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AvailabilityModal.useEffect": ()=>{
            fetchAvailability();
            fetchServiceTypes();
        }
    }["AvailabilityModal.useEffect"], [
        coach.id
    ]);
    const fetchServiceTypes = async ()=>{
        const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('session_types').select('*').order('title');
        if (data) setServiceTypes(data);
    };
    const fetchAvailability = async ()=>{
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/coach-availability?coachId=${coach.id}`);
            const data = await res.json();
            if (data.success) {
                // Ensure IDs are strings to match selection logic
                const loadedSlots = data.data.map((s)=>({
                        ...s,
                        id: s.id.toString()
                    }));
                setSlots(loadedSlots);
            } else {
                addToast('Failed to load availability: ' + data.error, 'error');
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };
    // --- Helpers ---
    const toggleDate = (date)=>{
        setExpandedDates((prev)=>prev.includes(date) ? prev.filter((d)=>d !== date) : [
                ...prev,
                date
            ]);
    };
    const expandAll = ()=>setExpandedDates(Object.keys(groupedSlots));
    const collapseAll = ()=>setExpandedDates([]);
    const toggleSelection = (id)=>{
        setSelectedSlotIds((prev)=>prev.includes(id) ? prev.filter((x)=>x !== id) : [
                ...prev,
                id
            ]);
    };
    // --- Bulk Add Logic ---
    const generateBulkSlots = ()=>{
        const start = new Date(bulkConfig.startDate);
        const end = new Date(bulkConfig.endDate);
        const newBulkSlots = [];
        for(let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)){
            // Get correct HK day of week
            const currentHKDay = parseInt((0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatHK"])(d, 'i')) % 7;
            const hkDateStr = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatHK"])(d, 'yyyy-MM-dd');
            if (bulkConfig.selectedDays.includes(currentHKDay)) {
                for(let h = bulkConfig.startHour; h < bulkConfig.endHour; h++){
                    const naiveStr = `${hkDateStr} ${String(h).padStart(2, '0')}:00:00`;
                    const slotStart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$date$2d$fns$2d$tz$2f$dist$2f$esm$2f$fromZonedTime$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fromZonedTime"])(naiveStr, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["APP_TIMEZONE"]);
                    const slotEnd = new Date(slotStart.getTime() + 60 * 60000); // 1hr
                    // Generate a temporary ID for local management
                    const tempId = `temp_${Date.now()}_${Math.random()}`;
                    newBulkSlots.push({
                        id: tempId,
                        coach_id: coach.id,
                        start_time: slotStart.toISOString(),
                        end_time: slotEnd.toISOString(),
                        is_recurring: false,
                        status: 'available',
                        session_type_id: bulkConfig.selectedServiceId || undefined,
                        credit_cost: bulkConfig.selectedServiceId ? bulkConfig.creditCost : undefined,
                        capacity: bulkConfig.selectedServiceId ? bulkConfig.capacity : undefined
                    });
                }
            }
        }
        setAddedSlots([
            ...addedSlots,
            ...newBulkSlots
        ]);
        setShowBulkTool(false);
        addToast(`Generated ${newBulkSlots.length} items. Click Save to confirm.`, 'success');
    };
    // --- Bulk Delete Logic ---
    const handleDeleteSelected = ()=>{
        if (!confirm(`Delete ${selectedSlotIds.length} items?`)) return;
        const dbIdsToDelete = [];
        let newAddedSlots = [
            ...addedSlots
        ];
        selectedSlotIds.forEach((id)=>{
            if (id.startsWith('temp_')) {
                newAddedSlots = newAddedSlots.filter((s)=>s.id !== id);
            } else {
                dbIdsToDelete.push(id);
            }
        });
        setDeletedSlotIds([
            ...deletedSlotIds,
            ...dbIdsToDelete
        ]);
        setAddedSlots(newAddedSlots);
        setSelectedSlotIds([]);
        setSelectionMode(false);
        addToast(`Removed ${selectedSlotIds.length} items from view. Save to apply.`, 'info');
    };
    const handleSave = async ()=>{
        setSaving(true);
        try {
            const finalAddedSlots = addedSlots.map((s)=>{
                const { id, ...rest } = s;
                return rest;
            });
            const res = await fetch('/api/admin/coach-availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    coachId: coach.id,
                    slots: finalAddedSlots,
                    deletedSlots: deletedSlotIds
                })
            });
            const data = await res.json();
            if (data.success) {
                addToast('Schedule saved successfully!', 'success');
                onClose();
            } else {
                addToast('Error saving: ' + data.error, 'error');
            }
        } catch (e) {
            console.error(e);
            addToast('Error saving availability.', 'error');
        }
        setSaving(false);
    };
    // --- Grouping & Rendering ---
    const allActiveSlots = [
        ...slots,
        ...addedSlots
    ].filter((s)=>!deletedSlotIds.includes(s.id));
    const groupedSlots = allActiveSlots.reduce((acc, slot)=>{
        const dateKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["safetoLocaleDateString"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["safeDate"])(slot.start_time), undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(slot);
        return acc;
    }, {});
    const sortedDateKeys = Object.keys(groupedSlots).sort((a, b)=>{
        return new Date(a).getTime() - new Date(b).getTime();
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-[#1e1e1e] w-full max-w-5xl rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between items-center p-6 border-b border-white/10 shrink-0 bg-[#1e1e1e] z-50",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-2xl font-black italic uppercase tracking-tighter text-white",
                                    children: [
                                        "Availability: ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[#28D160]",
                                            children: [
                                                coach.first_name,
                                                " ",
                                                coach.last_name
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 227,
                                            columnNumber: 43
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 226,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1",
                                    children: "Manage monthly schedule"
                                }, void 0, false, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 229,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                            lineNumber: 225,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-4",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onClose,
                                className: "p-2 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    size: 24
                                }, void 0, false, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 233,
                                    columnNumber: 29
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                lineNumber: 232,
                                columnNumber: 25
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                            lineNumber: 231,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                    lineNumber: 224,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col md:flex-row items-center justify-between p-4 bg-[#151515] border-b border-white/5 shrink-0 gap-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: expandAll,
                                    className: "text-[10px] font-bold uppercase text-gray-400 hover:text-white flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                            size: 12
                                        }, void 0, false, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 242,
                                            columnNumber: 29
                                        }, this),
                                        " Expand All"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 241,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: collapseAll,
                                    className: "text-[10px] font-bold uppercase text-gray-400 hover:text-white flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__["ChevronUp"], {
                                            size: 12
                                        }, void 0, false, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 245,
                                            columnNumber: 29
                                        }, this),
                                        " Collapse All"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 244,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                            lineNumber: 240,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setShowBulkTool(!showBulkTool),
                                    className: `px-4 py-2 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-colors ${showBulkTool ? 'bg-[#28D160] text-black' : 'bg-white/10 text-white hover:bg-white/20'}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                                            size: 14
                                        }, void 0, false, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 254,
                                            columnNumber: 29
                                        }, this),
                                        " Bulk Add"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 250,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-6 w-px bg-white/10"
                                }, void 0, false, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 257,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>{
                                        setSelectionMode(!selectionMode);
                                        setSelectedSlotIds([]);
                                    },
                                    className: `px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors border ${selectionMode ? 'bg-east-light text-black border-east-light' : 'bg-transparent text-gray-400 border-white/10 hover:text-white'}`,
                                    children: selectionMode ? 'Done Selecting' : 'Select Multiple'
                                }, void 0, false, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 259,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                            lineNumber: 249,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                    lineNumber: 239,
                    columnNumber: 17
                }, this),
                showBulkTool && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-[#1a1a1a] p-5 border-b border-white/10 animate-fadeIn shrink-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-wrap gap-4 items-end",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "text-[9px] font-bold text-gray-500 uppercase block mb-1",
                                            children: "From"
                                        }, void 0, false, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 276,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "date",
                                            value: bulkConfig.startDate,
                                            onChange: (e)=>setBulkConfig({
                                                    ...bulkConfig,
                                                    startDate: e.target.value
                                                }),
                                            className: "bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                        }, void 0, false, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 277,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 275,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "text-[9px] font-bold text-gray-500 uppercase block mb-1",
                                            children: "To"
                                        }, void 0, false, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 280,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "date",
                                            value: bulkConfig.endDate,
                                            onChange: (e)=>setBulkConfig({
                                                    ...bulkConfig,
                                                    endDate: e.target.value
                                                }),
                                            className: "bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                        }, void 0, false, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 281,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 279,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "text-[9px] font-bold text-gray-500 uppercase block mb-1",
                                            children: "Start Hr"
                                        }, void 0, false, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 284,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "number",
                                            value: bulkConfig.startHour,
                                            onChange: (e)=>setBulkConfig({
                                                    ...bulkConfig,
                                                    startHour: parseInt(e.target.value)
                                                }),
                                            className: "bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white w-12"
                                        }, void 0, false, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 285,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 283,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "text-[9px] font-bold text-gray-500 uppercase block mb-1",
                                            children: "End Hr"
                                        }, void 0, false, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 288,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "number",
                                            value: bulkConfig.endHour,
                                            onChange: (e)=>setBulkConfig({
                                                    ...bulkConfig,
                                                    endHour: parseInt(e.target.value)
                                                }),
                                            className: "bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white w-12"
                                        }, void 0, false, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 289,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 287,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "text-[9px] font-bold text-gray-500 uppercase block mb-1",
                                            children: "Days"
                                        }, void 0, false, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 292,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex gap-1",
                                            children: [
                                                0,
                                                1,
                                                2,
                                                3,
                                                4,
                                                5,
                                                6
                                            ].map((d)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>{
                                                        const newDays = bulkConfig.selectedDays.includes(d) ? bulkConfig.selectedDays.filter((x)=>x !== d) : [
                                                            ...bulkConfig.selectedDays,
                                                            d
                                                        ];
                                                        setBulkConfig({
                                                            ...bulkConfig,
                                                            selectedDays: newDays
                                                        });
                                                    },
                                                    className: `w-6 h-6 rounded text-[9px] font-bold ${bulkConfig.selectedDays.includes(d) ? 'bg-[#28D160] text-black' : 'bg-black/50 text-gray-500'}`,
                                                    children: [
                                                        'S',
                                                        'M',
                                                        'T',
                                                        'W',
                                                        'T',
                                                        'F',
                                                        'S'
                                                    ][d]
                                                }, d, false, {
                                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                    lineNumber: 295,
                                                    columnNumber: 41
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 293,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 291,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex-1 min-w-[150px]",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "text-[9px] font-bold text-gray-500 uppercase block mb-1",
                                            children: "Service (Optional)"
                                        }, void 0, false, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 305,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            value: bulkConfig.selectedServiceId,
                                            onChange: (e)=>{
                                                const svcId = e.target.value;
                                                const svc = serviceTypes.find((s)=>s.id === svcId);
                                                setBulkConfig({
                                                    ...bulkConfig,
                                                    selectedServiceId: svcId,
                                                    creditCost: Number(svc?.credit_cost ?? bulkConfig.creditCost),
                                                    capacity: Number(svc?.category === 'CLASS' ? 10 : 1)
                                                });
                                            },
                                            className: "w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "Generic Slot"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                    lineNumber: 320,
                                                    columnNumber: 37
                                                }, this),
                                                serviceTypes.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: s.id,
                                                        children: s.title
                                                    }, s.id, false, {
                                                        fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                        lineNumber: 321,
                                                        columnNumber: 60
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 306,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 304,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-16",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "text-[9px] font-bold text-gray-500 uppercase block mb-1",
                                            children: "Credits"
                                        }, void 0, false, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 325,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "number",
                                            value: bulkConfig.creditCost,
                                            onChange: (e)=>setBulkConfig({
                                                    ...bulkConfig,
                                                    creditCost: parseInt(e.target.value) || 0
                                                }),
                                            className: "bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white w-full"
                                        }, void 0, false, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 326,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 324,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-12",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "text-[9px] font-bold text-gray-500 uppercase block mb-1",
                                            children: "Cap"
                                        }, void 0, false, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 329,
                                            columnNumber: 33
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "number",
                                            value: bulkConfig.capacity,
                                            onChange: (e)=>setBulkConfig({
                                                    ...bulkConfig,
                                                    capacity: parseInt(e.target.value) || 1
                                                }),
                                            className: "bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white w-full"
                                        }, void 0, false, {
                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                            lineNumber: 330,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 328,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                            lineNumber: 274,
                            columnNumber: 25
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: generateBulkSlots,
                            className: "bg-[#28D160] text-black font-black uppercase text-xs px-4 py-1.5 rounded hover:bg-white transition-colors",
                            children: "Generate"
                        }, void 0, false, {
                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                            lineNumber: 333,
                            columnNumber: 25
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                    lineNumber: 273,
                    columnNumber: 21
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 overflow-y-auto p-6 space-y-4",
                    children: [
                        sortedDateKeys.length === 0 && !loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-center py-20 opacity-30",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"], {
                                    size: 48,
                                    className: "mx-auto mb-4"
                                }, void 0, false, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 343,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm font-bold uppercase",
                                    children: "No availability set"
                                }, void 0, false, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 344,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                            lineNumber: 342,
                            columnNumber: 25
                        }, this),
                        sortedDateKeys.map((date)=>{
                            const daySlots = groupedSlots[date];
                            const isExpanded = expandedDates.includes(date);
                            const sortedItems = [
                                ...daySlots
                            ].sort((a, b)=>{
                                const aBooked = (a.booking_count || 0) > 0;
                                const bBooked = (b.booking_count || 0) > 0;
                                if (aBooked && !bBooked) return -1;
                                if (!aBooked && bBooked) return 1;
                                return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
                            });
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "animate-fadeIn",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2 mb-2 sticky top-0 bg-[#1e1e1e] z-10 py-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>toggleDate(date),
                                                className: `flex-1 flex items-center gap-4 bg-[#121212] p-3 rounded-xl border transition-all group ${isExpanded ? 'border-east-light/30' : 'border-white/5 hover:border-white/20'}`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: `p-1 rounded ${isExpanded ? 'bg-east-light text-black' : 'bg-white/10 text-gray-400'}`,
                                                        children: isExpanded ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronUp$3e$__["ChevronUp"], {
                                                            size: 12
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                            lineNumber: 368,
                                                            columnNumber: 59
                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                                            size: 12
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                            lineNumber: 368,
                                                            columnNumber: 85
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                        lineNumber: 367,
                                                        columnNumber: 41
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "font-black italic text-lg text-white uppercase",
                                                        children: date
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                        lineNumber: 370,
                                                        columnNumber: 41
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "h-px bg-white/5 flex-1"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                        lineNumber: 371,
                                                        columnNumber: 41
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] font-bold text-gray-500 uppercase tracking-widest",
                                                        children: [
                                                            daySlots.length,
                                                            " Items"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                        lineNumber: 372,
                                                        columnNumber: 41
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                lineNumber: 363,
                                                columnNumber: 37
                                            }, this),
                                            selectionMode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "checkbox",
                                                className: "w-5 h-5 accent-[#28D160] cursor-pointer",
                                                onChange: (e)=>{
                                                    if (e.target.checked) {
                                                        const ids = daySlots.map((s)=>s.id);
                                                        setSelectedSlotIds((prev)=>[
                                                                ...new Set([
                                                                    ...prev,
                                                                    ...ids
                                                                ])
                                                            ]);
                                                    } else {
                                                        const ids = daySlots.map((s)=>s.id);
                                                        setSelectedSlotIds((prev)=>prev.filter((x)=>!ids.includes(x)));
                                                    }
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                lineNumber: 376,
                                                columnNumber: 41
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                        lineNumber: 362,
                                        columnNumber: 33
                                    }, this),
                                    isExpanded && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-2 pl-4",
                                        children: sortedItems.map((item)=>{
                                            const duration = Math.round((new Date(item.end_time).getTime() - new Date(item.start_time).getTime()) / 60000);
                                            const isSelected = selectedSlotIds.includes(item.id);
                                            const isBooked = (item.booking_count || 0) > 0;
                                            let borderClass = 'border-l-4 border-gray-500';
                                            if (item.session_type_id) borderClass = 'border-l-4 border-blue-500';
                                            if (isBooked) borderClass = 'border-l-4 border-yellow-400';
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                onClick: ()=>selectionMode && toggleSelection(item.id),
                                                className: `
                                                        bg-[#151515] rounded-r-xl p-3 flex gap-4 ${borderClass} border-y border-r border-[#151515] 
                                                        hover:bg-[#1a1a1a] transition-all cursor-pointer group relative
                                                        ${isSelected ? 'bg-white/5 ring-1 ring-[#28D160]' : ''}
                                                    `,
                                                children: [
                                                    selectionMode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "absolute inset-y-0 left-0 w-12 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                            type: "checkbox",
                                                            checked: isSelected,
                                                            readOnly: true,
                                                            className: "w-4 h-4 accent-[#28D160]"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                            lineNumber: 415,
                                                            columnNumber: 61
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                        lineNumber: 414,
                                                        columnNumber: 57
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: `flex flex-col items-center justify-center min-w-[60px] border-r border-white/5 pr-4 ${selectionMode ? 'pl-8' : ''}`,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-sm font-black italic leading-none text-white",
                                                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatHK"])(item.start_time, 'h:mma').toLowerCase()
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                                lineNumber: 420,
                                                                columnNumber: 57
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-[9px] font-bold text-gray-600 uppercase mt-0.5",
                                                                children: [
                                                                    duration,
                                                                    " min"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                                lineNumber: 423,
                                                                columnNumber: 57
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                        lineNumber: 419,
                                                        columnNumber: 53
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex-1",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-2 mb-1",
                                                                children: isBooked ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"], {
                                                                            size: 8
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                                            lineNumber: 430,
                                                                            columnNumber: 69
                                                                        }, this),
                                                                        " ",
                                                                        item.booking_count,
                                                                        " Booked"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                                    lineNumber: 429,
                                                                    columnNumber: 65
                                                                }, this) : item.session_type_id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider",
                                                                    children: "Open Session"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                                    lineNumber: 433,
                                                                    columnNumber: 65
                                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "bg-gray-800 text-gray-500 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider",
                                                                    children: "Slot"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                                    lineNumber: 437,
                                                                    columnNumber: 65
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                                lineNumber: 427,
                                                                columnNumber: 57
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-xs font-bold text-gray-300",
                                                                children: item.session_type_id ? serviceTypes.find((s)=>s.id === item.session_type_id)?.title || 'Private Session' : 'General Availability'
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                                lineNumber: 442,
                                                                columnNumber: 57
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                        lineNumber: 426,
                                                        columnNumber: 53
                                                    }, this),
                                                    !selectionMode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: (e)=>{
                                                            e.stopPropagation();
                                                            if (confirm('Delete this slot?')) {
                                                                setDeletedSlotIds([
                                                                    ...deletedSlotIds,
                                                                    item.id
                                                                ]);
                                                                addToast('Slot removed. Save to apply.', 'info');
                                                            }
                                                        },
                                                        className: "self-center p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                            size: 16
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                            lineNumber: 458,
                                                            columnNumber: 61
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                        lineNumber: 448,
                                                        columnNumber: 57
                                                    }, this)
                                                ]
                                            }, item.id, true, {
                                                fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                lineNumber: 404,
                                                columnNumber: 49
                                            }, this);
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                        lineNumber: 393,
                                        columnNumber: 37
                                    }, this)
                                ]
                            }, date, true, {
                                fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                lineNumber: 361,
                                columnNumber: 29
                            }, this);
                        })
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                    lineNumber: 340,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-4 border-t border-white/10 flex justify-between items-center bg-[#151515] shrink-0 z-50",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: selectionMode && selectedSlotIds.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: handleDeleteSelected,
                                className: "px-6 py-3 bg-red-500 text-white font-black uppercase text-xs rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                        size: 14
                                    }, void 0, false, {
                                        fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                        lineNumber: 479,
                                        columnNumber: 33
                                    }, this),
                                    " Delete ",
                                    selectedSlotIds.length,
                                    " Selected"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                lineNumber: 475,
                                columnNumber: 29
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                            lineNumber: 473,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: onClose,
                                    className: "px-6 py-3 bg-white/5 text-white font-bold uppercase text-xs rounded-xl hover:bg-white/10 transition-colors",
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 484,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: handleSave,
                                    disabled: saving,
                                    className: "px-8 py-3 bg-[#28D160] text-black font-black uppercase italic text-xs rounded-xl hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50",
                                    children: saving ? 'Saving...' : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                                                size: 16
                                            }, void 0, false, {
                                                fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                                lineNumber: 488,
                                                columnNumber: 55
                                            }, this),
                                            " Save Changes"
                                        ]
                                    }, void 0, true)
                                }, void 0, false, {
                                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                                    lineNumber: 487,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                            lineNumber: 483,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
                    lineNumber: 472,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
            lineNumber: 221,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/sys-admin/coaches/AvailabilityModal.tsx",
        lineNumber: 220,
        columnNumber: 9
    }, this);
}
_s(AvailabilityModal, "xVZlGfzbAaqoCV2wUANPCuhN168=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$Toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"]
    ];
});
_c = AvailabilityModal;
var _c;
__turbopack_context__.k.register(_c, "AvailabilityModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/admin-ops/coaches/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AdminOpsCoachesPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/users.js [app-client] (ecmascript) <export default as Users>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/calendar.js [app-client] (ecmascript) <export default as Calendar>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/mail.js [app-client] (ecmascript) <export default as Mail>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/star.js [app-client] (ecmascript) <export default as Star>");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/lib/supabase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$sys$2d$admin$2f$coaches$2f$AvailabilityModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/sys-admin/coaches/AvailabilityModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$Toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/ui/Toast.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
function AdminOpsCoachesPage() {
    _s();
    const { addToast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$Toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"])();
    const [coaches, setCoaches] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [searchTerm, setSearchTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [selectedCoach, setSelectedCoach] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showAvailability, setShowAvailability] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminOpsCoachesPage.useEffect": ()=>{
            fetchCoaches();
        }
    }["AdminOpsCoachesPage.useEffect"], []);
    const fetchCoaches = async ()=>{
        setLoading(true);
        try {
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('profiles').select('*').eq('role', 'coach').order('first_name');
            if (error) throw error;
            setCoaches(data || []);
        } catch (err) {
            addToast("Failed to load coaches", "error");
        }
        setLoading(false);
    };
    const filteredCoaches = coaches.filter((c)=>`${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) || c.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-8 animate-in fade-in duration-700",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col md:flex-row md:items-center justify-between gap-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-4xl font-black italic uppercase tracking-tighter mb-2",
                                children: [
                                    "Coach ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[#28D160]",
                                        children: "Roster"
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                        lineNumber: 49,
                                        columnNumber: 31
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                lineNumber: 48,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-400 text-sm font-medium",
                                children: "Manage your elite team of instructors and their availability."
                            }, void 0, false, {
                                fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                lineNumber: 51,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/admin-ops/coaches/page.tsx",
                        lineNumber: 47,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                    className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-500",
                                    size: 16
                                }, void 0, false, {
                                    fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                    lineNumber: 55,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    placeholder: "Find a coach...",
                                    className: "bg-[#1a1a1a] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#28D160] transition-colors w-64",
                                    value: searchTerm,
                                    onChange: (e)=>setSearchTerm(e.target.value)
                                }, void 0, false, {
                                    fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                    lineNumber: 56,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/admin-ops/coaches/page.tsx",
                            lineNumber: 54,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/admin-ops/coaches/page.tsx",
                        lineNumber: 53,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/admin-ops/coaches/page.tsx",
                lineNumber: 46,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
                children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "col-span-full py-20 flex flex-col items-center justify-center gap-4 text-gray-500",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                            className: "animate-spin",
                            size: 32
                        }, void 0, false, {
                            fileName: "[project]/app/admin-ops/coaches/page.tsx",
                            lineNumber: 71,
                            columnNumber: 25
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-[10px] font-black uppercase tracking-widest",
                            children: "Hydrating Roster..."
                        }, void 0, false, {
                            fileName: "[project]/app/admin-ops/coaches/page.tsx",
                            lineNumber: 72,
                            columnNumber: 25
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/admin-ops/coaches/page.tsx",
                    lineNumber: 70,
                    columnNumber: 21
                }, this) : filteredCoaches.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "col-span-full py-20 bg-[#1a1a1a] border border-white/5 rounded-3xl text-center text-gray-500",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"], {
                            size: 48,
                            className: "mx-auto mb-4 opacity-10"
                        }, void 0, false, {
                            fileName: "[project]/app/admin-ops/coaches/page.tsx",
                            lineNumber: 76,
                            columnNumber: 25
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm font-medium",
                            children: "No coaches found in the roster."
                        }, void 0, false, {
                            fileName: "[project]/app/admin-ops/coaches/page.tsx",
                            lineNumber: 77,
                            columnNumber: 25
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/admin-ops/coaches/page.tsx",
                    lineNumber: 75,
                    columnNumber: 21
                }, this) : filteredCoaches.map((coach)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 flex flex-col gap-6 group hover:border-[#28D160] transition-all relative overflow-hidden shadow-xl",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-20 h-20 bg-black/40 rounded-2xl overflow-hidden flex-shrink-0 border border-white/5 relative",
                                        children: [
                                            coach.avatar_url ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                src: coach.avatar_url,
                                                alt: coach.first_name,
                                                className: "w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                            }, void 0, false, {
                                                fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                                lineNumber: 85,
                                                columnNumber: 41
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-full h-full flex items-center justify-center text-gray-700",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$users$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Users$3e$__["Users"], {
                                                    size: 32
                                                }, void 0, false, {
                                                    fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                                    lineNumber: 88,
                                                    columnNumber: 45
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                                lineNumber: 87,
                                                columnNumber: 41
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "absolute top-1 right-1",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "w-2 h-2 bg-[#28D160] rounded-full shadow-[0_0_8px_#28D160]"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                                    lineNumber: 92,
                                                    columnNumber: 41
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                                lineNumber: 91,
                                                columnNumber: 37
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                        lineNumber: 83,
                                        columnNumber: 33
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 min-w-0",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-xl font-black uppercase italic tracking-tight mb-1 group-hover:text-[#28D160] transition-colors truncate",
                                                children: [
                                                    coach.first_name,
                                                    " ",
                                                    coach.last_name
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                                lineNumber: 96,
                                                columnNumber: 37
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2 mb-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"], {
                                                        size: 10,
                                                        className: "text-[#28D160] fill-[#28D160]"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                                        lineNumber: 98,
                                                        columnNumber: 41
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] font-black text-gray-400 uppercase tracking-widest",
                                                        children: "Pro Coach"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                                        lineNumber: 99,
                                                        columnNumber: 41
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                                lineNumber: 97,
                                                columnNumber: 37
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2 text-[10px] text-gray-500 font-bold italic",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__["Mail"], {
                                                        size: 10
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                                        lineNumber: 102,
                                                        columnNumber: 41
                                                    }, this),
                                                    coach.email
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                                lineNumber: 101,
                                                columnNumber: 37
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                        lineNumber: 95,
                                        columnNumber: 33
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                lineNumber: 82,
                                columnNumber: 29
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 gap-3 pt-4 border-t border-white/5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-black/40 rounded-xl p-3 border border-white/5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[8px] font-black text-gray-600 uppercase mb-1",
                                                children: "Weekly Slots"
                                            }, void 0, false, {
                                                fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                                lineNumber: 110,
                                                columnNumber: 37
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm font-black italic",
                                                children: "--"
                                            }, void 0, false, {
                                                fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                                lineNumber: 111,
                                                columnNumber: 37
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                        lineNumber: 109,
                                        columnNumber: 33
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-black/40 rounded-xl p-3 border border-white/5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[8px] font-black text-gray-600 uppercase mb-1",
                                                children: "Efficiency"
                                            }, void 0, false, {
                                                fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                                lineNumber: 114,
                                                columnNumber: 37
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm font-black italic text-[#28D160]",
                                                children: "94%"
                                            }, void 0, false, {
                                                fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                                lineNumber: 115,
                                                columnNumber: 37
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                        lineNumber: 113,
                                        columnNumber: 33
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                lineNumber: 108,
                                columnNumber: 29
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    setSelectedCoach(coach);
                                    setShowAvailability(true);
                                },
                                className: "w-full bg-white/5 border border-white/5 hover:bg-[#28D160] hover:text-black hover:border-transparent rounded-xl py-4 px-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$calendar$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Calendar$3e$__["Calendar"], {
                                        size: 14
                                    }, void 0, false, {
                                        fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                        lineNumber: 126,
                                        columnNumber: 33
                                    }, this),
                                    " Handle Availability"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/admin-ops/coaches/page.tsx",
                                lineNumber: 119,
                                columnNumber: 29
                            }, this)
                        ]
                    }, coach.id, true, {
                        fileName: "[project]/app/admin-ops/coaches/page.tsx",
                        lineNumber: 81,
                        columnNumber: 25
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/admin-ops/coaches/page.tsx",
                lineNumber: 68,
                columnNumber: 13
            }, this),
            showAvailability && selectedCoach && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$sys$2d$admin$2f$coaches$2f$AvailabilityModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                coach: selectedCoach,
                onClose: ()=>{
                    setShowAvailability(false);
                    setSelectedCoach(null);
                    fetchCoaches(); // Refresh roster
                }
            }, void 0, false, {
                fileName: "[project]/app/admin-ops/coaches/page.tsx",
                lineNumber: 135,
                columnNumber: 17
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/admin-ops/coaches/page.tsx",
        lineNumber: 44,
        columnNumber: 9
    }, this);
}
_s(AdminOpsCoachesPage, "6/zEB3xO9ZY8QMCfo/htmvttiWw=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$Toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"]
    ];
});
_c = AdminOpsCoachesPage;
var _c;
__turbopack_context__.k.register(_c, "AdminOpsCoachesPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# debugId=82938785-0f97-1ba9-107a-ba9a3d5a125f
//# sourceMappingURL=app_f74e09df._.js.map