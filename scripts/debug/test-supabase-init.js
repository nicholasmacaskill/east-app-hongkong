const { createClient } = require('@supabase/supabase-js');

try {
    console.log("Testing createClient with empty strings...");
    const client = createClient("", "");
    console.log("Client created successfully (unexpected if it should fail validation)");
} catch (e) {
    console.error("Caught expected error:", e.message);
    process.exit(1);
}
