;!function(){try { var e="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof global?global:"undefined"!=typeof window?window:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&((e._debugIds|| (e._debugIds={}))[n]="864f23b8-786f-2929-20c8-2c5528dd5581")}catch(e){}}();
module.exports=[1007,e=>{"use strict";var t=e.i(24389);let i=null;e.s(["getSupabaseAdmin",0,()=>{if(i)return i;let e=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!e)throw Error("❌ Missing SUPABASE_SERVICE_ROLE_KEY. Cannot initialize Admin client.");return i=(0,t.createClient)("https://ktlicvvczrlppqkcqedv.supabase.co",e,{auth:{autoRefreshToken:!1,persistSession:!1}})}])}];

//# debugId=864f23b8-786f-2929-20c8-2c5528dd5581
//# sourceMappingURL=app_lib_supabaseAdmin_ts_7883fed3._.js.map