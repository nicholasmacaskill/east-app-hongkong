import getDbPool from '../../app/lib/db';

async function scanUsers() {
    const pool = getDbPool();
    const client = await pool.connect();
    
    try {
        console.log("🔍 Fetching profiles from public.profiles...");
        const result = await client.query("SELECT * FROM public.profiles ORDER BY created_at DESC");
        const profiles = result.rows;
        
        console.log(`✅ Found ${profiles.length} profiles.`);

        const testAccounts = [];
        const realUsers = [];

        const testPatterns = [
            /test/i,
            /example\.com/i,
            /placeholder/i,
            /asdf/i,
            /qwerty/i,
            /123/i,
            /dummy/i,
            /temp/i,
            /mock/i,
            /nicholasmacaskill\+/i,
            /athlete/i,
            /parent/i,
            /coach/i,
            /@east\.com/i,
        ];

        profiles.forEach(profile => {
            const email = profile.contact_email || profile.email || '';
            const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
            
            let isTest = false;
            
            if (testPatterns.some(pattern => pattern.test(email) || pattern.test(name))) {
                isTest = true;
            }

            // Additional heuristic: common test emails in this project
            if (['admin@east.com', 'coach@east.com', 'parent@east.com', 'player@east.com'].includes(email)) {
                isTest = true;
            }

            if (isTest) {
                testAccounts.push({ email, name, id: profile.id });
            } else {
                realUsers.push({ email, name, id: profile.id });
            }
        });

        console.log("\n--- POTENTIAL TEST ACCOUNTS ---");
        testAccounts.forEach(u => console.log(`- ${u.email} (${u.name}) [ID: ${u.id}]`));

        console.log("\n--- POTENTIAL REAL USERS ---");
        realUsers.forEach(u => console.log(`- ${u.email} (${u.name}) [ID: ${u.id}]`));
        
        console.log("\nSummary:");
        console.log(`Total: ${profiles.length}`);
        console.log(`Test: ${testAccounts.length}`);
        console.log(`Real: ${realUsers.length}`);

    } catch (err) {
        console.error("❌ Database error:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

scanUsers();
