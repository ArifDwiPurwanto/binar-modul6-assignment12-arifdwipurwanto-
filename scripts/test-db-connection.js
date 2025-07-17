const { Pool } = require("pg");

// Load environment variables from .env.local
require("dotenv").config({ path: ".env.local" });

// Log current environment variables
console.log("🔧 Environment Variables:");
console.log(
  "DB_HOST:",
  process.env.DB_HOST || "not set (using default: localhost)"
);
console.log("DB_PORT:", process.env.DB_PORT || "not set (using default: 5432)");
console.log(
  "DB_USER:",
  process.env.DB_USER || "not set (using default: postgres)"
);
console.log(
  "DB_NAME:",
  process.env.DB_NAME || "not set (using default: workshop_db)"
);
console.log(
  "DB_PASSWORD:",
  process.env.DB_PASSWORD ? "***" : "not set (using default: admin123)"
);

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "workshop_db",
  password: process.env.DB_PASSWORD || "admin123",
  port: parseInt(process.env.DB_PORT || "5432"),
});

async function testConnection() {
  console.log("\n🔍 Testing database connection...");

  try {
    const client = await pool.connect();
    console.log("✅ Successfully connected to database!");

    // Test query
    const result = await client.query(
      "SELECT current_database(), current_user, version()"
    );
    console.log("📊 Database Info:");
    console.log("  Database:", result.rows[0].current_database);
    console.log("  User:", result.rows[0].current_user);
    console.log("  Version:", result.rows[0].version.split("\n")[0]);

    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log("\n📋 Existing Tables:");
    if (tablesResult.rows.length === 0) {
      console.log("  No tables found");
    } else {
      tablesResult.rows.forEach((row) => {
        console.log(`  - ${row.table_name}`);
      });
    }

    // Check user count if auth table exists
    if (tablesResult.rows.some((row) => row.table_name === "auth")) {
      const userCount = await client.query(
        "SELECT COUNT(*) as count FROM auth"
      );
      console.log(`\n👥 Total Users: ${userCount.rows[0].count}`);
    }

    client.release();
    console.log("\n✅ Database connection test completed successfully!");
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error("  Error:", error.message);
    console.error("  Code:", error.code);

    if (error.code === "ECONNREFUSED") {
      console.log("\n💡 Troubleshooting:");
      console.log("  1. Make sure PostgreSQL is running");
      console.log("  2. Check if the port is correct");
      console.log("  3. Verify the host address");
    } else if (error.code === "28P01") {
      console.log("\n💡 Troubleshooting:");
      console.log("  1. Check username and password");
      console.log("  2. Verify database credentials");
    } else if (error.code === "3D000") {
      console.log("\n💡 Troubleshooting:");
      console.log("  1. Database doesn't exist");
      console.log("  2. Run 'npm run db-create' to create database");
    }
  } finally {
    await pool.end();
  }
}

testConnection();
