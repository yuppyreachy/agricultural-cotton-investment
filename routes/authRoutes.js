const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");

// ===== Multer setup for file uploads =====
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "uploads/"); // Make sure this folder exists
    },
    filename: function(req, file, cb){
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + Date.now() + ext);
    }
});
const upload = multer({ storage });

// ===== LOGIN PAGE =====
router.get("/login", (req,res)=>{
    res.sendFile(path.join(__dirname,"../public/login.html"));
});
// ===== REGISTER USER =====
router.post("/register", upload.fields([
    { name: "id_card", maxCount: 1 },
    { name: "passport_photo", maxCount: 1 }
]), async (req, res) => {

    const {
        fullname, dob, email, phone, gender, marital_status,
        pin, farmer, investor, password, confirm_password, source
    } = req.body;

    // ===== 1️⃣ Validate input =====
    if(!fullname || !dob || !email || !phone || !gender || !marital_status ||
       !pin || !farmer || !investor || !password || !confirm_password || !source){
        console.log("❌ Registration failed: Missing fields");
        return res.status(400).send("❌ All fields are required!");
    }

    if(password !== confirm_password){
        console.log(`❌ Registration failed for ${email}: Passwords do not match`);
        return res.status(400).send("❌ Passwords do not match!");
    }

    const idCardFile = req.files["id_card"] ? req.files["id_card"][0].filename : null;
    const passportFile = req.files["passport_photo"] ? req.files["passport_photo"][0].filename : null;

    if(!idCardFile || !passportFile){
        console.log(`❌ Registration failed for ${email}: Missing files`);
        return res.status(400).send("❌ Please upload your ID card and passport photo.");
    }

    try {
        // ===== 2️⃣ Hash password =====
        const hashed = await bcrypt.hash(password, 10);

        // ===== 3️⃣ Insert into DB =====
        db.run(
            `INSERT INTO users (fullname, email, password, balance) VALUES (?,?,?,?)`,
            [fullname, email, hashed, 100], // 💰 $100 welcome bonus
            (err) => {
                if(err){
                    console.log(`❌ Database error for ${email}: ${err.message}`);
                    return res.status(500).send("❌ Database error: " + err.message);
                }

                // ===== 4️⃣ Log successful registration =====
                console.log(`✅ New user registered: ${fullname} (${email}) | Files: ${idCardFile}, ${passportFile}`);
                res.redirect("/success");
            }
        );
    } catch(err){
        console.log(`❌ Server error for ${email}: ${err.message}`);
        res.status(500).send("❌ Server error: " + err.message);
    }
});

let totalRegistered = 0; // put this at the top of your server.js

// Inside your db.run callback after successful insert:
db.run(
  "INSERT INTO users (fullname, email, password, balance) VALUES (?,?,?,?)",
  [fullname, email, hashed, 100],
  (err) => {
    if(err) return res.send("Database error");

    totalRegistered++; // increase counter
    console.log(`✅ New user registered: ${fullname} (${email})`);
    console.log(`📈 Total registered users: ${totalRegistered}`);

    mailer.sendWelcomeEmail(email, fullname);
    res.redirect("/success"); // only one response
  }
);



// ===== FORGOT PASSWORD =====
router.get("/forgot-password",(req,res)=>{
    res.sendFile(path.join(__dirname,"../public/forgot-password.html"));
});

// ===== OTP VERIFY =====
router.get("/verify-otp",(req,res)=>{
    res.sendFile(path.join(__dirname,"../public/verify-otp.html"));
});

// ===== RESET PASSWORD =====
router.get("/reset-password",(req,res)=>{
    res.sendFile(path.join(__dirname,"../public/reset-password.html"));
});

// ===== LOGOUT =====
router.get("/logout",(req,res)=>{
    req.session.destroy(()=>{
        res.redirect("/login");
    });
});

module.exports = router;
