"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var pg_1 = require("pg");
var dotenv = require("dotenv");
var path = require("path");
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
var dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('Missing DATABASE_URL in .env.local');
    process.exit(1);
}
var client = new pg_1.Client({
    host: 'aws-1-us-east-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.lzqnviblkcnjsxutqeht',
    password: 'FNjB8Ca3Ar0Yg816mY%9',
    ssl: { rejectUnauthorized: false }
});
function runMigration() {
    return __awaiter(this, void 0, void 0, function () {
        var sql, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 6]);
                    return [4 /*yield*/, client.connect()];
                case 1:
                    _a.sent();
                    console.log('--- Connected to DB. Starting Training Plans Schema Setup ---');
                    sql = "\n            CREATE TABLE IF NOT EXISTS public.training_plans (\n                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,\n                coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,\n                title text NOT NULL,\n                description text,\n                created_at timestamp with time zone DEFAULT now(),\n                updated_at timestamp with time zone DEFAULT now()\n            );\n\n            CREATE TABLE IF NOT EXISTS public.training_plan_drills (\n                id uuid DEFAULT gen_random_uuid() PRIMARY KEY,\n                plan_id uuid REFERENCES public.training_plans(id) ON DELETE CASCADE,\n                drill_id uuid REFERENCES public.coach_drills(id) ON DELETE CASCADE,\n                order_index integer DEFAULT 0,\n                created_at timestamp with time zone DEFAULT now()\n            );\n\n            -- Add RLS Policies\n            ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;\n            ALTER TABLE public.training_plan_drills ENABLE ROW LEVEL SECURITY;\n\n            DO $$ \n            BEGIN\n                -- training_plans policies\n                IF NOT EXISTS (\n                    SELECT FROM pg_policies WHERE tablename = 'training_plans' AND policyname = 'Anyone can view training plans'\n                ) THEN\n                    CREATE POLICY \"Anyone can view training plans\" ON public.training_plans FOR SELECT USING (true);\n                END IF;\n\n                IF NOT EXISTS (\n                    SELECT FROM pg_policies WHERE tablename = 'training_plans' AND policyname = 'Coaches can manage their own training plans'\n                ) THEN\n                    CREATE POLICY \"Coaches can manage their own training plans\" ON public.training_plans \n                    FOR ALL \n                    USING (auth.uid() = coach_id);\n                END IF;\n\n                -- training_plan_drills policies\n                IF NOT EXISTS (\n                    SELECT FROM pg_policies WHERE tablename = 'training_plan_drills' AND policyname = 'Anyone can view training plan drills'\n                ) THEN\n                    CREATE POLICY \"Anyone can view training plan drills\" ON public.training_plan_drills FOR SELECT USING (true);\n                END IF;\n\n                IF NOT EXISTS (\n                    SELECT FROM pg_policies WHERE tablename = 'training_plan_drills' AND policyname = 'Coaches can manage drills in their plans'\n                ) THEN\n                    CREATE POLICY \"Coaches can manage drills in their plans\" ON public.training_plan_drills \n                    FOR ALL \n                    USING (\n                        EXISTS (\n                            SELECT 1 FROM public.training_plans \n                            WHERE training_plans.id = plan_id \n                            AND training_plans.coach_id = auth.uid()\n                        )\n                    );\n                END IF;\n            END $$;\n\n            -- Grants\n            GRANT ALL ON public.training_plans TO service_role;\n            GRANT SELECT ON public.training_plans TO authenticated;\n            GRANT INSERT, UPDATE, DELETE ON public.training_plans TO authenticated;\n\n            GRANT ALL ON public.training_plan_drills TO service_role;\n            GRANT SELECT ON public.training_plan_drills TO authenticated;\n            GRANT INSERT, UPDATE, DELETE ON public.training_plan_drills TO authenticated;\n        ";
                    return [4 /*yield*/, client.query(sql)];
                case 2:
                    _a.sent();
                    console.log('✅ Successfully created training_plans and training_plan_drills tables.');
                    return [3 /*break*/, 6];
                case 3:
                    e_1 = _a.sent();
                    console.error('❌ Migration failed:', e_1);
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, client.end()];
                case 5:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
runMigration();
