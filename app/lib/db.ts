// File: east-app-recent/app/lib/db.ts (Updated for lazy initialization)

import { Pool } from 'pg';

// Use a global variable to cache the Pool instance between server requests/reloads
let cachedPool: Pool | null = null;

// Function to get the PostgreSQL Pool instance, creating it only if necessary
export default function getDbPool(): Pool {
  if (cachedPool) {
    return cachedPool;
  }

  // Pool is only created when this function is called (lazy)
  const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '5432', 10),
  });

  pool.on('error', (err) => {
    // This prevents connection errors from crashing the Node.js process
    console.error('Unexpected error on idle PostgreSQL client', err);
  });
  
  cachedPool = pool;
  return pool;
}