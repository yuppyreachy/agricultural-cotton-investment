// database.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Database file location
const dbFile = path.join(__dirname, "database.sqlite");

const db = new sqlite3.Database(dbFile, (err) => {
  if (err) console.error("❌ SQLite Error:", err);
  else console.log("✅ SQLite Connected");
});


// =====================
// CREATE TABLES
// =====================

db.serialize(() => {

 // ================= USERS =================
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
    gender TEXT DEFAULT NULL,
    kyc_status TEXT DEFAULT 'pending',
    role TEXT DEFAULT 'user',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);


  // ================= DEPOSITS =================
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

  // ================= WITHDRAWALS =================
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

  // ================= INVESTMENTS =================
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

  // ================= LOANS =================
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


  // ================= KYC =================
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

  // ================= CHAT =================
  db.run(`
    CREATE TABLE IF NOT EXISTS chat(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid TEXT,
      sender TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ================= ADMIN =================
  db.run(`
    CREATE TABLE IF NOT EXISTS admin(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      password TEXT
    )
  `);

  // ================= POSTS =================
  db.run(`
    CREATE TABLE IF NOT EXISTS posts(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

});

module.exports = db;
