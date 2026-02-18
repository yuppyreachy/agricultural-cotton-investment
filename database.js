// database.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbFile = path.join(__dirname,"database.sqlite");
const db = new sqlite3.Database(dbFile, (err)=>{
    if(err) console.error("❌ SQLite Error:", err);
    else console.log("✅ SQLite Connected");
});

// =====================
// CREATE TABLES
// =====================

db.serialize(()=>{

    // Users
    db.run(`
      CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT UNIQUE,
        fullname TEXT,
        email TEXT UNIQUE,
        password TEXT,
        balance REAL DEFAULT 0,
        profit REAL DEFAULT 0,
        security_pin TEXT,
        kyc_status TEXT DEFAULT 'pending'
      )
    `);

    // Deposits
    db.run(`
      CREATE TABLE IF NOT EXISTS deposits(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT,
        method TEXT,
        amount REAL,
        proof TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Withdrawals
    db.run(`
      CREATE TABLE IF NOT EXISTS withdrawals(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT,
        method TEXT,
        amount REAL,
        info TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Investments
    db.run(`
      CREATE TABLE IF NOT EXISTS investments(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT,
        plan TEXT,
        amount REAL,
        profit REAL,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Loans
    db.run(`
      CREATE TABLE IF NOT EXISTS loans(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT,
        fullname TEXT,
        email TEXT,
        amount REAL,
        duration TEXT,
        method TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // KYC
    db.run(`
      CREATE TABLE IF NOT EXISTS kyc(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT,
        full_name TEXT,
        email TEXT,
        address TEXT,
        marital_status TEXT,
        kids INTEGER,
        id_front TEXT,
        id_back TEXT,
        ssn TEXT,
        proof_address TEXT,
        security_pin TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Chat messages
    db.run(`
      CREATE TABLE IF NOT EXISTS chat(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT,
        sender TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Admin table
db.run(`
CREATE TABLE IF NOT EXISTS admin (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 username TEXT,
 password TEXT
)
`);

// Admin posts
db.run(`
CREATE TABLE IF NOT EXISTS posts (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT,
 content TEXT,
 image TEXT,
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);


});

module.exports = db;
