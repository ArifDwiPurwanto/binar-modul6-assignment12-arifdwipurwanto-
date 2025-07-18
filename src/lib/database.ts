import { Pool, PoolConfig } from "pg";

// Database configuration - intentionally unoptimized for workshop
// Best practice: Validate required environment variables
function validateEnvVars() {
  const requiredVars = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

validateEnvVars();

// Best practice: Optimized connection pool configuration
const poolConfig: PoolConfig = {
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "workshop_db",
  password: process.env.DB_PASSWORD || "admin123",
  port: parseInt(process.env.DB_PORT || "5432"),
  // Bad practice: no connection pooling limits for demo
  // Best practice: Optimal connection pool settings for performance
  max: process.env.NODE_ENV === 'production' ? 20 : 10, // Reduced from 100 for better resource management
  min: 2, // Minimum connections to maintain
  idleTimeoutMillis: 10000, // Reduced from 30000 for faster cleanup
  connectionTimeoutMillis: 5000, // Increased from 2000 for better reliability
  // Best practice: Enable SSL in production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Best practice: Enable keep-alive for long-running connections
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

const pool = new Pool(poolConfig);

// Best practice: Add connection pool event listeners for monitoring
pool.on('connect', (client) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔗 New client connected to database');
  }
});

pool.on('error', (err, client) => {
  console.error('🚨 Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('remove', (client) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔌 Client removed from pool');
  }
});

// Log database configuration for debugging (only in development)
if (process.env.NODE_ENV === "development") {
  console.log("🔧 Database Configuration:");
  console.log("Host:", process.env.DB_HOST || "localhost");
  console.log("Port:", process.env.DB_PORT || "5432");
  console.log("User:", process.env.DB_USER || "postgres");
  console.log("Database:", process.env.DB_NAME || "workshop_db");
  console.log("Password:", process.env.DB_PASSWORD ? "***" : "admin123");
}

// Bad practice: raw SQL queries without proper error handling
// Best practice: Optimized query execution with proper error handling and connection management
export async function executeQuery(query: string, params: unknown[] = []) {
  const startTime = process.env.NODE_ENV === 'development' ? Date.now() : null;
  
  try {
    // Best practice: Use pool.query() instead of manual client management
    // This automatically handles connection acquisition and release
    const result = await pool.query(query, params);
    
    // Best practice: Log performance only in development
    if (startTime && process.env.NODE_ENV === 'development') {
      const duration = Date.now() - startTime;
      console.log(`🔍 Query executed in ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    // Best practice: Enhanced error handling with context
    const errorContext = {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      paramsCount: params.length,
      timestamp: new Date().toISOString(),
    };
    
    console.error("🚨 Database query failed:", {
      error: error instanceof Error ? error.message : error,
      context: errorContext,
    });
    
    // Best practice: Re-throw with enhanced error information
    if (error instanceof Error) {
      error.message = `Database query failed: ${error.message}`;
    }
    throw error;
  }
}

// Best practice: Add specialized query functions for better performance
export async function executeTransaction<T>(
  queries: Array<{ text: string; values?: unknown[] }>,
  callback?: (client: any) => Promise<T>
): Promise<T | void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    if (callback) {
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } else {
      // Execute all queries in transaction
      for (const { text, values } of queries) {
        await client.query(text, values);
      }
      await client.query('COMMIT');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("🚨 Transaction failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Best practice: Add query with retry logic for better reliability
export async function executeQueryWithRetry(
  query: string, 
  params: unknown[] = [], 
  maxRetries: number = 3
) {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await executeQuery(query, params);
    } catch (error) {
      lastError = error as Error;
      
      // Best practice: Only retry on connection errors, not syntax errors
      if (attempt < maxRetries && isRetryableError(error)) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
        console.warn(`🔄 Query failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      break;
    }
  }
  
  throw lastError || new Error('Query failed with unknown error');
}

// Best practice: Helper function to determine if error is retryable
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const retryableErrors = [
    'ECONNRESET',
    'ECONNREFUSED', 
    'ETIMEDOUT',
    'connection terminated unexpectedly'
  ];
  
  return retryableErrors.some(errType => 
    error.message.includes(errType) || (error as any).code === errType
  );
}

// Best practice: Add query timeout wrapper for better control
export async function executeQueryWithTimeout(
  query: string, 
  params: unknown[] = [], 
  timeoutMs: number = 30000
) {
  return Promise.race([
    executeQuery(query, params),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

// Bad practice: no connection pooling management
// Best practice: handle connection pooling properly
export async function closePool() {
  try {
    await pool.end();
    console.log("Database pool closed.");
  } catch (error) {
    console.error("Error closing database pool:", error);
    throw error;
  }
}

// Initialize database tables
export async function initializeDatabase() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      birth_date DATE,
      bio TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await executeQuery(createUsersTable);
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}
