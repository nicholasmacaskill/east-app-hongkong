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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var supabase_js_1 = require("@supabase/supabase-js");
var dotenv_1 = __importDefault(require("dotenv"));
var path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env.local') });
var supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
var serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
    console.error('Missing env vars');
    process.exit(1);
}
var supabase = (0, supabase_js_1.createClient)(supabaseUrl, serviceKey);
function checkSchema() {
    return __awaiter(this, void 0, void 0, function () {
        var checks, _i, checks_1, check, error, rpcs, _a, rpcs_1, rpc, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('🔍 Running Database Integrity & Schema Check...\n');
                    checks = [
                        { table: 'booking_cancellations', select: 'id' },
                        { table: 'coach_services', select: 'id' },
                        { table: 'leaderboard', select: 'id' },
                        { table: 'news', select: 'id' },
                        { table: 'player_stats', select: 'id' },
                        { table: 'stats_metadata', select: 'id' },
                        { table: 'teams', select: 'id' },
                        { table: 'rosters', select: 'id' },
                        { table: 'family_connections', select: 'id' }
                    ];
                    _i = 0, checks_1 = checks;
                    _b.label = 1;
                case 1:
                    if (!(_i < checks_1.length)) return [3 /*break*/, 4];
                    check = checks_1[_i];
                    return [4 /*yield*/, supabase.from(check.table).select(check.select).limit(1)];
                case 2:
                    error = (_b.sent()).error;
                    process.stdout.write("Table '".concat(check.table, "': "));
                    if (error) {
                        if (error.code === '42P01') { // relation does not exist
                            console.log('❌ MISSING');
                        }
                        else {
                            console.log("\u26A0\uFE0F ERROR (".concat(error.message, ")"));
                        }
                    }
                    else {
                        console.log('✅ EXISTS (Ready)');
                    }
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log('\n🔍 Checking Critical RPCs...');
                    rpcs = [
                        { name: 'add_credits', payload: { user_id_param: '00000000-0000-0000-0000-000000000000', amount: 0 } },
                        { name: 'transfer_credits', payload: { p_from_user_id: '00000000-0000-0000-0000-000000000000', p_to_user_id: '00000000-0000-0000-0000-000000000000', p_amount: 0 } }
                    ];
                    _a = 0, rpcs_1 = rpcs;
                    _b.label = 5;
                case 5:
                    if (!(_a < rpcs_1.length)) return [3 /*break*/, 8];
                    rpc = rpcs_1[_a];
                    return [4 /*yield*/, supabase.rpc(rpc.name, rpc.payload)];
                case 6:
                    error = (_b.sent()).error;
                    process.stdout.write("RPC '".concat(rpc.name, "': "));
                    if (error && error.message.includes('Could not find')) {
                        console.log('❌ MISSING');
                    }
                    else {
                        console.log('✅ EXISTS');
                    }
                    _b.label = 7;
                case 7:
                    _a++;
                    return [3 /*break*/, 5];
                case 8:
                    console.log('\nDONE.');
                    return [2 /*return*/];
            }
        });
    });
}
checkSchema();
