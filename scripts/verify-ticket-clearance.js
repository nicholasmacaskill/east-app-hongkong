const { createClient } = require('@supabase/supabase-js');

async function verifyTicket() {
    console.log("🔍 Starting Jira Lite Clearance Check...");

    // 1. Get commit message (passed from GitHub Actions context)
    const commitMessage = process.env.COMMIT_MESSAGE || '';
    console.log(`Commit Message: "${commitMessage}"`);

    // We look for a ticket mention like: #21, TICK-21, Ticket 21, ticket-21
    const match = commitMessage.match(/#(\d+)|TICK(?:ET)?-?(\d+)/i);

    if (!match) {
        console.log("⚠️ No explicit Ticket ID found in the commit message (e.g., #21, TICK-21).");
        console.log("Forcing deployment abort to maintain strict clearance gate protocol.");
        console.log("❌ ERROR: Your commit message MUST contain a Jira Lite Ticket ID.");
        process.exit(1);
    }

    const ticketId = match[1] || match[2];
    console.log(`🎫 Parsed Ticket ID: ${ticketId}`);

    // 2. Connect to the LIVE Supabase Database (Source of Truth)
    // We enforce checking the LIVE database even if running from test environment deployment
    const supabaseUrl = process.env.LIVE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.LIVE_SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ ERROR: Missing Supabase credentials to verify ticket.");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Validate Ticket Status
    const { data: ticket, error } = await supabase
        .from('engineering_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

    if (error || !ticket) {
        console.error(`❌ ERROR: Ticket #${ticketId} was not found in the Jira Lite database.`);
        console.error("Are you sure this ticket exists in the Live environment?");
        process.exit(1);
    }

    console.log(`📋 Ticket Found: "${ticket.title}" (Status: ${ticket.status})`);

    // 4. CEO Clearance Block
    if (ticket.status !== 'done') {
        console.error(`❌ ERROR: Ticket #${ticketId} is currently set to '${ticket.status}'. It MUST be set to 'done' (Production) to deploy.`);
        process.exit(1);
    }

    if (!ticket.ceo_approval) {
        console.error(`❌ ERROR: Ticket #${ticketId} does NOT have CEO Approval. The CEO must clear this ticket in the Admin Panel before deployment can proceed.`);
        process.exit(1);
    }

    console.log(`✅ SUCCESS: Ticket #${ticketId} is fully cleared and CEO approved.`);
    console.log(`🚀 Opening gates. Proceeding with deployment...`);
    process.exit(0);
}

verifyTicket().catch(err => {
    console.error("❌ Unexpected error during ticket verification:", err);
    process.exit(1);
});
