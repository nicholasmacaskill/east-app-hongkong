const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function main() {
    // 1. STAGING
    const stagingUrl = 'https://lzqnviblkcnjsxutqeht.supabase.co';
    const stagingKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6cW52aWJsa2NuanN4dXRxZWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDgyMjEyMSwiZXhwIjoyMDkwMzk4MTIxfQ.zkfbtc7Bv_Dsswe9Nwtzf9Yq4ZO4JdLzDRSuGxGq9uk';
    const stagingClient = createClient(stagingUrl, stagingKey);

    const { data: stagingData, error: stagingErr } = await stagingClient
        .from('engineering_tickets')
        .select('*')
        .order('created_at', { ascending: false });

    if (stagingErr) console.error('Staging Err:', stagingErr.message);

    // 2. PRODUCTION
    const prodUrl = 'https://ktlicvvczrlppqkcqedv.supabase.co';
    const prodKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0bGljdnZjenJscHBxa2NxZWR2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI4NjUzOSwiZXhwIjoyMDg0ODYyNTM5fQ.FwP2etidl41nG9THvtuu7-jg7MtBNtCNxzupwq_HNu8';
    const prodClient = createClient(prodUrl, prodKey);

    const { data: prodData, error: prodErr } = await prodClient
        .from('engineering_tickets')
        .select('*')
        .order('created_at', { ascending: false });

    if (prodErr) console.error('Prod Err:', prodErr.message);

    const output = {
        staging: stagingData || [],
        production: prodData || []
    };

    fs.writeFileSync('/tmp/all_tickets.json', JSON.stringify(output, null, 2));
    console.log('Saved to /tmp/all_tickets.json');
}

main();
