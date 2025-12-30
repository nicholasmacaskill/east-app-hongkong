// File: east-app-hongkong/app/lib/db.ts (Updated to use DB_PORT from environment)

import { Pool } from 'pg';

// Use a global variable to cache the Pool instance between server requests/reloads
let cachedPool: Pool | null = null;

// Function to get the PostgreSQL Pool instance, creating it only if necessary
export default function getDbPool(): Pool {
  if (cachedPool) {
    return cachedPool;
  }

  const dbPort = process.env.DB_PORT;
  
  if (!dbPort) {
    // This is a safety check, though DB_PORT should be defined in .env.local
    console.warn("DB_PORT environment variable is missing. Defaulting to 54322.");
  }
  
  // Pool is only created when this function is called (lazy)
  const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'postgres',
    // CRITICAL FIX: Ensure the port is read as a number, defaulting to 54322 for local setup
    port: parseInt(dbPort || '54322', 10),
  });

  pool.on('error', (err) => {
    // This prevents connection errors from crashing the Node.js process
    console.error('Unexpected error on idle PostgreSQL client', err);
  });
  
  cachedPool = pool;
  return pool;
}