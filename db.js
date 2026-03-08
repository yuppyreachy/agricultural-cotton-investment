// database.js
const { Pool } = require("pg");  // Import PostgreSQL client

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Your database URL
  ssl: {
    rejectUnauthorized: false // Needed for some cloud hosts
  }
});

module.exports = pool; // Export it so you can use it elsewhere