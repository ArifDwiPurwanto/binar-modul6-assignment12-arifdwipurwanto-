import { Pool } from "pg";

// Database configuration - intentionally unoptimized for workshop
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "workshop_db",
  password: process.env.DB_PASSWORD || "admin123",
  port: parseInt(process.env.DB_PORT || "5432"),
  // Bad practice: no connection pooling limits for demo
  max: 100,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
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
export async function executeQuery(query: string, params: any[] = []) {
  console.time("Database Query Execution");
  try {
    const client = await pool.connect();
    const result = await client.query(query, params);
    client.release();
    console.timeEnd("Database Query Execution");
    return result;
  } catch (error) {
    console.error("Database error:", error);
    console.timeEnd("Database Query Execution");
    throw error;
  }
}

// Bad practice: no connection pooling management
export async function closePool() {
  await pool.end();
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
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}
