const { createClient } = require('@supabase/supabase-js');

try {
    console.log("Testing createClient with placeholder strings...");
    // A valid-looking URL but garbage key
    const client = createClient("https://placeholder.supabase.co", "placeholder");
    console.log("Client created successfully!");
} catch (e) {
    console.error("Caught expected error:", e.message);
    process.exit(1);
}
