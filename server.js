require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const session = require("express-session");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();

const multer = require("multer");

const app = express();
const server = http.createServer(app);
const otpStore = {}; // temporarily stores OTPs




// ======================
// DATABASE
// ======================
const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) console.error(err);
  else console.log("✅ SQLite connected");
});

// users table
db.run(`
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 username TEXT,
 email TEXT UNIQUE,
 password TEXT,
 otp TEXT,
 otp_expiry INTEGER
)`);

// chat table
db.run(`
CREATE TABLE IF NOT EXISTS chat (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 uid TEXT,
 sender TEXT,
 message TEXT
)`);

// ================= USERS =================
db.run(`
CREATE TABLE IF NOT EXISTS users (
id INTEGER PRIMARY KEY AUTOINCREMENT,
fullname TEXT,
email TEXT,
password TEXT,
balance REAL DEFAULT 0,
kyc_status TEXT DEFAULT 'Pending',
otp TEXT
)
`);

// ================= ADMIN =================
db.run(`
CREATE TABLE IF NOT EXISTS admin (
id INTEGER PRIMARY KEY AUTOINCREMENT,
username TEXT,
password TEXT
)
`);





const myNewUser = "Justusalways";          // ← your username
const myNewPass = "12345Just67890Us@";    // ← your password

db.get("SELECT * FROM admin WHERE username = ?", [myNewUser], async (err, admin) => {
    if (err) {
        console.log("DB error:", err);
        return;
    }

    const hashed = await bcrypt.hash(myNewPass, 10);

    if (!admin) {
        // Admin does not exist → create
        db.run(
            "INSERT INTO admin (username, password) VALUES (?, ?)",
            [myNewUser, hashed],
            (err) => {
                if (err) console.log("Insert error:", err);
                else console.log("🔥 NEW ADMIN CREATED →", myNewUser);
            }
        );
    } else {
        // Admin exists → update credentials
        db.run(
            "UPDATE admin SET username=?, password=? WHERE id=?",
            [myNewUser, hashed, admin.id],
            (err) => {
                if (err) console.log("Update error:", err);
                else console.log("🔥 ADMIN LOGIN UPDATED →", myNewUser);
            }
        );
    }
});




// ================= DEPOSITS =================
db.run(`
CREATE TABLE IF NOT EXISTS deposits (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER,
amount REAL,
status TEXT DEFAULT 'Pending',
created_at TEXT
)
`);

// ================= WITHDRAW =================
db.run(`
CREATE TABLE IF NOT EXISTS withdraw (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER,
amount REAL,
status TEXT DEFAULT 'Pending',
created_at TEXT
)
`);

// ================= LOANS =================
db.run(`
CREATE TABLE IF NOT EXISTS loans (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER,
amount REAL,
status TEXT DEFAULT 'Pending',
created_at TEXT
)
`);

// ================= INVESTMENTS =================
db.run(`
CREATE TABLE IF NOT EXISTS investments (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER,
plan TEXT,
amount REAL,
status TEXT DEFAULT 'Active',
created_at TEXT
)
`);

// ================= ADMIN POSTS =================
db.run(`
CREATE TABLE IF NOT EXISTS admin_posts (
id INTEGER PRIMARY KEY AUTOINCREMENT,
title TEXT,
message TEXT,
created_at TEXT
)
`);

// ================= PAYMENTS =================
db.run(`
CREATE TABLE IF NOT EXISTS payments (
id INTEGER PRIMARY KEY AUTOINCREMENT,
title TEXT,
wallet TEXT,
amount TEXT,
created_at TEXT
)
`);

// ================= EMAIL NOTIFICATIONS =================
db.run(`
CREATE TABLE IF NOT EXISTS notifications (
id INTEGER PRIMARY KEY AUTOINCREMENT,
title TEXT,
message TEXT,
created_at TEXT
)
`);

// ================= INVESTMENT CONTROL =================
db.run(`
CREATE TABLE IF NOT EXISTS investment_control (
id INTEGER PRIMARY KEY AUTOINCREMENT,
roi_percent TEXT,
profit TEXT,
updated_at TEXT
)
`);


// then routes
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);
// server.js
const io = require("socket.io")(server);

setInterval(() => {
  const roi = (Math.random() * 10 + 90).toFixed(2); // 90–100%
  const profit = (Math.random() * 5 + 10).toFixed(2); // 10–15M
  io.emit("liveData", { roi, profit });
}, 1000);

// ======================
// MIDDLEWARE
// ======================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, "public")));



function adminAuth(req, res, next){
    if(!req.session.admin){
        console.log("⚠️ Unauthorized admin access attempt");
        return res.redirect("/admin"); // your admin login page
    }
    next();
}

// ======================
// MULTER (UPLOAD)
// ======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });



// ======================
// MAILER
// ======================


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your Gmail
    pass: process.env.EMAIL_PASS  // App password
  }
});

// Optional: test connection
transporter.verify((error, success) => {
  if(error) console.log("SMTP Error:", error);
  else console.log("SMTP ready to send emails");
});


// Track online admins ( demo, can use DB)
let adminOnline = false;

// ======================
// OTP STORE
// ======================


// ======================
// PAGE ROUTES
// ======================
const sendPage = (res, file) =>
  res.sendFile(path.join(__dirname, "public", file));

app.get("/", (req,res)=> res.redirect("/login"));
app.get("/login", (req,res)=> sendPage(res,"login.html"));
app.get("/register", (req,res)=> sendPage(res,"register.html"));

app.get("/deposit",(req,res)=> sendPage(res,"deposit.html"));
app.get("/withdraw",(req,res)=> sendPage(res,"withdraw.html"));
app.get("/kyc",(req,res)=> sendPage(res,"kyc.html"));
app.get("/loan",(req,res)=> sendPage(res,"loan.html"));
app.get("/settings",(req,res)=> sendPage(res,"settings.html"));
app.get("/investment",(req,res)=> sendPage(res,"investment.html"));
app.get("/transaction",(req,res)=> sendPage(res,"transaction.html"));
app.get("/about",(req,res)=> sendPage(res,"about.html"));
app.get("/privacy",(req,res)=> sendPage(res,"privacy.html"));
app.get("/terms",(req,res)=> sendPage(res,"terms.html"));
app.get("/contact",(req,res)=> sendPage(res,"contact.html"));
app.get("/confirmation",(req,res)=> sendPage(res,"confirmation.html"));
app.get("/crypto-pending",(req,res)=> sendPage(res,"crypto-pending.html"));
app.get("/kyc-confirmation",(req,res)=> sendPage(res,"kyc-confirmation.html"));
app.get("/kyc-final",(req,res)=> sendPage(res,"kyc-final.html"));
app.get("/loan-confirmation",(req,res)=> sendPage(res,"loan-confirmation.html"));
app.get("/forgot-password",(req,res)=> sendPage(res,"forgot-password.html"));
app.get("/payment-wait",(req,res)=> sendPage(res,"payment-wait.html"));
app.get("/otp",(req,res)=> sendPage(res,"otp.html"));
app.get("/rest-password-successful",(req,res)=> sendPage(res,"reset-password-successful.html"));
app.get("/reset-password",(req,res)=> sendPage(res,"rest-password.html"));
app.get("/rest-successful",(req,res)=> sendPage(res,"rest-successful.html"));
app.get("/verify",(req,res)=> sendPage(res,"verify.html"));
app.get("/verify-otp",(req,res)=> sendPage(res,"verify-otp.html"));
app.get("/withdraw-confirmation",(req,res)=> sendPage(res,"withdraw-confirmation.html"));
app.get("/success", (req, res) => {
    res.sendFile(__dirname + "/public/success.html");
});
app.get("/login", (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
});
app.get("/logout",(req,res)=>{
  req.session.destroy();
  res.redirect("/login");
});


// ADMIN LOGIN PAGE
app.get("/admin", (req,res)=>{
  res.sendFile(__dirname + "/public/admin-login.html");

});app.get("/admin/dashboard", (req, res) => {
    if (!req.session.admin) return res.redirect("/admin-login");

    // get admin info
    db.get("SELECT * FROM admin WHERE id = ?", [req.session.admin], (err, admin) => {
        if (err || !admin) return res.send("Admin not found");

        // get all users
        db.all("SELECT * FROM users", (err, users) => {
            if (err) users = [];

            // get posts (if you have posts table)
            db.all("SELECT * FROM posts", (err, posts) => {
                if (err) posts = [];

                res.render("admin-dashboard", {
                    admin: admin,
                    users: users || [],
                    posts: posts || []
                });
            });
        });
    });
});



// GET ALL USERS
app.get("/admin/all-users",(req,res)=>{
  if(!req.session.admin) return res.send("Not allowed");
  db.all("SELECT * FROM users ORDER BY id DESC", (err,rows)=>{
    res.json(rows);
  });
});
// ================= ADMIN DASHBOARD
app.get("/admin/dashboard", adminAuth, (req,res)=>{
    db.get("SELECT * FROM admin WHERE id=?", [req.session.admin], (err, admin) => {
        if(err || !admin) return res.send("Admin not found");

        db.all("SELECT * FROM users ORDER BY id DESC", (err, users)=>{
            if(err) users = [];
            db.all("SELECT * FROM admin_posts ORDER BY id DESC", (err2, posts)=>{
                if(err2) posts = [];
                res.render("admin-dashboard", { admin, users, posts });
            });
        });
    });
});



// ===== USER DASHBOARD =====
app.get("/dashboard", (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  db.get("SELECT * FROM users WHERE id = ?", [req.session.userId], (err, user) => {
    if (err || !user) return res.send("User not found");

    res.render("dashboard", { user }); // user_dashboard.ejs
  });
});





// set EJS as view engine (only this, no custom folder)
app.set("view engine", "ejs");

// ======================
// REGISTER
// ======================
app.post("/auth/register", async (req,res) => {
    const { email, password, fullname } = req.body;
    if(!email || !password || !fullname) return res.send("All fields required");

    db.get("SELECT * FROM users WHERE email=?", [email], async (err,row) => {
        if(err) return res.send("Database error");
        if(row) return res.send("Email already exists");

        const hashed = await bcrypt.hash(password, 10);

        db.run("INSERT INTO users (fullname, email, password, balance) VALUES (?,?,?,?)",
        [fullname, email, hashed, 100], (err) => {
            if(err) return res.send("Database error");
            console.log(`✅ New user registered: ${fullname} (${email})`);
            mailer.sendWelcomeEmail(email, fullname);
            res.redirect("/success"); // only one response
        });
    });
});



// ===== LOGIN ROUTE =====
app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.send("All fields required");

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) return res.send("Database error");
    if (!user) return res.send("User not found");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send("Invalid password");

    // Store session info
    req.session.userId = user.id;
    req.session.isAdmin = user.role === "admin"; // make sure your users table has 'role'

    // Redirect based on role
    if (req.session.isAdmin) {
      return res.redirect("/admin/dashboard");
    } else {
      return res.redirect("/dashboard");
    }
  });
});

app.post("/admin-login", async (req, res) => {
    const { username, password } = req.body;
    if(!username || !password) return res.send("Enter credentials");

    db.get("SELECT * FROM admin WHERE username=?", [username], async (err, admin) => {
        if(err) return res.send("Database error");
        if(!admin) return res.send("Admin not found");

        const match = await bcrypt.compare(password, admin.password);
        if(!match) return res.send("Wrong password");

        req.session.admin = admin.id; // store admin ID
        console.log(`🔥 Admin logged in: ${username}`);
        res.redirect("/admin/dashboard");
    });
});





// ================= ADMIN POST
app.post("/admin/post", adminAuth, upload.single("image"), (req,res)=>{
    const {title, content} = req.body;
    const image = req.file ? "/uploads/"+req.file.filename : "";

    db.run("INSERT INTO posts (title,content,image) VALUES (?,?,?)",
    [title,content,image]);

    res.redirect("/admin/dashboard");
});

// update balance
app.post("/admin/balance", adminAuth,(req,res)=>{
    const {userId,balance} = req.body;

    db.run("UPDATE users SET balance=? WHERE id=?",
    [balance,userId]);

    res.redirect("/admin/dashboard");
});


// ================= ADMIN AUTH CHECK
function adminAuth(req,res,next){
    if(!req.session.admin) return res.redirect("/admin/login");
    next();
}

// Example: POST /admin/add-bonus
app.post("/admin/add-bonus", async (req,res)=>{
    const { userId, amount } = req.body;

    if(!userId || !amount) return res.send("Fields required");

    db.run(
        "UPDATE users SET balance = balance + ? WHERE id = ?",
        [amount, userId],
        function(err){
            if(err) return res.send("Database error");
            res.send(`✅ Added $${amount} to user ID ${userId}`);
        }
    );
});

// APPROVE KYC
app.post("/admin/approve-kyc",(req,res)=>{
  if(!req.session.admin) return res.send("Not allowed");
  const {userId} = req.body;
  db.run("UPDATE users SET kyc_status='Approved' WHERE id=?", [userId], ()=>{
    res.send("KYC Approved");
  });
});

// ADD BALANCE TO USER
app.post("/admin/add-balance",(req,res)=>{
  if(!req.session.admin) return res.send("Not allowed");
  const {userId,amount} = req.body;
  db.get("SELECT * FROM users WHERE id=?", [userId], (err,user)=>{
    if(!user) return res.send("User not found");
    const newBal = parseFloat(user.balance || 0) + parseFloat(amount);
    db.run("UPDATE users SET balance=? WHERE id=?", [newBal,userId], ()=>res.send("Balance added"));
  });
});
// APPROVE DEPOSIT
app.post("/admin/approve-deposit",(req,res)=>{
  if(!req.session.admin) return res.send("Not allowed");
  const {id} = req.body;
  db.run("UPDATE deposits SET status='Approved' WHERE id=?", [id], ()=>res.send("Deposit Approved"));
});

// APPROVE WITHDRAW
app.post("/admin/approve-withdraw",(req,res)=>{
  if(!req.session.admin) return res.send("Not allowed");
  const {id} = req.body;
  db.run("UPDATE withdraw SET status='Paid' WHERE id=?", [id], ()=>res.send("Withdraw Paid"));
});

// APPROVE LOAN
app.post("/admin/approve-loan",(req,res)=>{
  if(!req.session.admin) return res.send("Not allowed");
  const {id} = req.body;
  db.run("UPDATE loans SET status='Approved' WHERE id=?", [id], ()=>res.send("Loan Approved"));
});
// ADMIN POST TO DASHBOARD
app.post("/admin/post",(req,res)=>{
  if(!req.session.admin) return res.send("Not allowed");
  const {title,message} = req.body;
  db.run("INSERT INTO admin_posts(title,message,created_at) VALUES(?,?,?)",[title,message,new Date().toISOString()]);
  res.send("Posted successfully");
});

// PAYMENT POST BY ADMIN
app.post("/admin/payment-post",(req,res)=>{
  if(!req.session.admin) return res.send("Not allowed");
  const {title,wallet,amount} = req.body;
  db.run("INSERT INTO payments(title,wallet,amount,created_at) VALUES(?,?,?,?)",[title,wallet,amount,new Date().toISOString()]);
  res.send("Payment posted");
});
app.post("/admin/send-email",(req,res)=>{
  if(!req.session.admin) return res.send("Not allowed");
  const {title,message} = req.body;
  db.all("SELECT email,fullname FROM users",(err,users)=>{
    users.forEach(u=>{
      mailer.sendMail({
        to:u.email,
        subject:title,
        html:`<h2>Hello ${u.fullname}</h2><p>${message}</p>`
      });
    });
    db.run("INSERT INTO notifications(title,message,created_at) VALUES(?,?,?)",[title,message,new Date().toISOString()]);
    res.send("Emails sent to all users");
  });
});
app.post("/admin/send-email",(req,res)=>{
  if(!req.session.admin) return res.send("Not allowed");
  const {title,message} = req.body;
  db.all("SELECT email,fullname FROM users",(err,users)=>{
    users.forEach(u=>{
      mailer.sendMail({
        to:u.email,
        subject:title,
        html:`<h2>Hello ${u.fullname}</h2><p>${message}</p>`
      });
    });
    db.run("INSERT INTO notifications(title,message,created_at) VALUES(?,?,?)",[title,message,new Date().toISOString()]);
    res.send("Emails sent to all users");
  });
});
app.post("/admin/update-profit",(req,res)=>{
  if(!req.session.admin) return res.send("Not allowed");
  const {roi,profit} = req.body;
  db.run("INSERT INTO investment_control(roi_percent,profit,updated_at) VALUES(?,?,?)",[roi,profit,new Date().toISOString()]);
  res.send("Live profit updated");
});



// Set EJS
app.set("view engine", "ejs");

// Dashboard Route
app.get("/dashboard", (req, res) => {

    if (!req.session.userId) {
        return res.redirect("/login");
    }

    db.get("SELECT * FROM users WHERE id = ?", [req.session.userId], (err, user) => {

        if (err) {
            console.log(err);
            return res.send("Database error");
        }

        if (!user) {
            return res.send("User not found");
        }

        res.render("dashboard", {
            user: user
        });

    });
});

// ============================
// POST /deposit
// ============================
app.post("/deposit", (req, res) => {
    const { userId, amount } = req.body; // amount user wants to deposit

    if (!userId || !amount) return res.status(400).send("Missing data");

    // Fetch user from DB (assuming SQLite)
    db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
        if (err || !user) return res.status(404).send("User not found");

        // Update user's balance
        const newBalance = (user.balance || 0) + parseFloat(amount);

        db.run("UPDATE users SET balance = ? WHERE id = ?", [newBalance, userId], (err2) => {
            if (err2) return res.status(500).send("Database error");

            // Send deposit email
            mailer.sendDepositEmail(user.email, user.fullname, amount, newBalance);

            // Send response
            res.send({
                message: `Deposit of $${amount} successful`,
                balance: newBalance
            });
        });
    });
});


app.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) return res.send("Email required");

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if(err || !user) return res.send("Email not registered");

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = otp; // store OTP temporarily

    // Send OTP via nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Password Reset",
      text: `Your OTP is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if(error){
        console.log(error);
        return res.send("Failed to send OTP");
      }
      console.log("OTP sent: " + info.response);

      // Redirect to OTP page, pass email in query string
      res.redirect(`/otp.html?email=${encodeURIComponent(email)}`);
    });
  });
});



// ======================
// SEND OTP
// ======================
app.post("/send-otp",(req,res)=>{
 if(!req.session.user) return res.redirect("/login");

 const email = req.session.user.email;
 const otp = Math.floor(100000 + Math.random()*900000);
 otpStore[email] = otp;

 transporter.sendMail({
  from: process.env.GMAIL_USER,
  to: email,
  subject:"Your OTP",
  text:`Your OTP is ${otp}`
 },(err)=>{
   if(err) return res.send("❌ Mail failed");
   console.log("OTP:",otp);
   res.send("✅ OTP sent");
 });
});

// ======================
// VERIFY OTP
// ======================
app.post("/verify-otp", (req,res) => {
  const { email, otp } = req.body;
  if(!email || !otp) return res.send("All fields required");

  if(otpStore[email] && otpStore[email] == otp){
    delete otpStore[email]; // remove OTP after success
    res.redirect(`/reset-password.html?email=${encodeURIComponent(email)}`);
  } else {
    return res.send("Invalid OTP, try again");
  }
});

app.post("/reset-password", async (req,res) => {
  const { email, password } = req.body;
  if(!email || !password) return res.send("All fields required");

  const hashed = await bcrypt.hash(password, 10);
  db.run("UPDATE users SET password = ? WHERE email = ?", [hashed, email], function(err){
    if(err) return res.send("Error resetting password");
    res.send("Password reset successful! <a href='/login'>Login</a>");
  });
});
fetch("http://localhost:3000/loan", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: 1,
    amount: 5000,
    action: "Approved" // or "Rejected"
  })
});

// ============================
// POST /invest
// ============================
app.post("/invest", (req, res) => {
    const { userId, plan, amount } = req.body;

    if (!userId || !plan || !amount) {
        return res.status(400).send("Missing investment data");
    }

    // get user
    db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
        if (err || !user) return res.status(404).send("User not found");

        const balance = parseFloat(user.balance || 0);
        const investAmount = parseFloat(amount);

        if (balance < investAmount) {
            return res.send("Insufficient balance");
        }

        // new balance after invest
        const newBalance = balance - investAmount;

        // update balance
        db.run("UPDATE users SET balance=? WHERE id=?", [newBalance, userId], (err2)=>{
            if(err2) return res.send("Database error");

            // save investment history
            db.run(`
            INSERT INTO investments (user_id, plan, amount, status, created_at)
            VALUES (?,?,?,?,?)`,
            [userId, plan, investAmount, "Active", new Date().toISOString()]
            );

            // send email
            mailer.sendInvestEmail(user.email, user.fullname, plan, investAmount);

            res.send({
                message: "Investment successful",
                balance: newBalance
            });
        });

    });
});



// ======================
// WITHDRAW
// ======================
app.post("/withdraw",(req,res)=>{
 const { amount } = req.body;
 if(!amount) return res.send("Enter amount");
 mailer.sendWithdrawEmail(user.email,user.fullname,amount,user.balance);
 res.send("Withdrawal request sent successfully");
});

// ======================
// KYC
// ======================
app.post("/submit-kyc",(req,res)=>{
 const { fullname,email } = req.body;
 console.log("KYC:",fullname,email);
 res.redirect("/kyc-confirmation.html");
 
});

// =========================
// LIVE SUPPORT SYSTEM
// =========================
let onlineUsers = {}; 
let adminSocket = null;

io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    // USER joins with their userId
    socket.on("user-join", (userId) => {
        onlineUsers[userId] = socket.id;
        io.emit("online-users", Object.keys(onlineUsers));
    });

    // ADMIN joins
    socket.on("admin-join", () => {
        adminSocket = socket.id;
        console.log("Admin connected");
    });

    // USER sends message to admin
    socket.on("user-message", data => {
        if(adminSocket){
            io.to(adminSocket).emit("receive-message", {
                userId: data.userId,
                text: data.text,
                sender: "user"
            });
        }
    });

    // ADMIN replies to user
    socket.on("admin-message", data => {
        const userSocket = onlineUsers[data.userId];
        if(userSocket){
            io.to(userSocket).emit("receive-message", {
                text: data.text,
                sender: "admin"
            });
        }
    });

    socket.on("disconnect", () => {
        for (let id in onlineUsers){
            if(onlineUsers[id] === socket.id){
                delete onlineUsers[id];
            }
        }
        io.emit("online-users", Object.keys(onlineUsers));
    });
});

// ======================
const PORT = process.env.PORT || 3000;
server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});

