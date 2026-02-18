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
]), (req,res)=>{

    const {
        fullname,
        dob,
        email,
        phone,
        gender,
        marital_status,
        pin,
        farmer,
        investor,
        password,
        confirm_password,
        source
    } = req.body;

    // Check required
    if(!fullname || !dob || !email || !phone || !gender || !marital_status || !pin || !farmer || !investor || !password || !confirm_password || !source){
        return res.send("❌ All fields are required!");
    }

    if(password !== confirm_password){
        return res.send("❌ Passwords do not match!");
    }

    const idCardFile = req.files["id_card"] ? req.files["id_card"][0].filename : null;
    const passportFile = req.files["passport_photo"] ? req.files["passport_photo"][0].filename : null;

    if(!idCardFile || !passportFile){
        return res.send("❌ Please upload your ID card and passport photo.");
    }

    db.run(
  `INSERT INTO users (fullname, email, password, balance) VALUES (?,?,?,?)`,
  [fullname, email, hashed, 100], // 🔥 $100 welcome bonus
  (err) => {
      if(err) return res.send("Database error");
      res.redirect("/success");
  }
);
});



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
