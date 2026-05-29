import pkg from 'pg';
const { Client } = pkg;
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local from the root of the project
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('Missing DATABASE_URL environment variable. Please check .env.local');
}

const client = new Client({
    connectionString,
});

async function addForeignKeys() {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();

    console.log('Adding foreign key relationships to messages table...');

    const sql = `
        ALTER TABLE messages
        ADD CONSTRAINT fk_messages_sender
        FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

        ALTER TABLE messages
        ADD CONSTRAINT fk_messages_receiver
        FOREIGN KEY (receiver_id) REFERENCES profiles(id) ON DELETE CASCADE;
    `;

    try {
        await client.query(sql);
        console.log('Successfully added foreign key relationships to messages table.');
    } catch (error) {
        // If the constraint already exists, we can ignore the error
        console.error('Failed to add foreign keys (they may already exist):', error);
    } finally {
        await client.end();
    }
}

addForeignKeys();
