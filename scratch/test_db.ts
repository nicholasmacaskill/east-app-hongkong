import { Client } from 'pg';

const connectionString = 'postgresql://postgres.ktlicvvczrlppqkcqedv:[Oak7-Gloomily7-Nearness5-Friction9-Shell3]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log('Connected! (ap-southeast-1)');
    } catch(e) {
        console.log('Failed ap-southeast-1');
        
        const client2 = new Client({
            connectionString: 'postgresql://postgres.ktlicvvczrlppqkcqedv:[Oak7-Gloomily7-Nearness5-Friction9-Shell3]@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
            ssl: { rejectUnauthorized: false }
        });
        
        try {
            await client2.connect();
            console.log('Connected! (us-east-1)');
        } catch(e2) {
            console.log('Failed us-east-1', e2);
        }
    } finally {
        await client.end();
    }
}
run();
