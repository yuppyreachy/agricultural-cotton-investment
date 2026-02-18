const express = require("express");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const mailer = require("../utils/mailer"); // adjust path if needed

module.exports = (db) => {
    const router = express.Router();

    // ===== Multer setup (for ID/passport upload) =====
    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, "uploads/"),
        filename: (req, file, cb) => cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname))
    });
    const upload = multer({ storage });

    // ===== Terminal counter =====
    let totalRegistered = 0;

    // ================= REGISTER =================
    router.post("/register", upload.fields([
        { name: "id_card", maxCount: 1 },
        { name: "passport_photo", maxCount: 1 }
    ]), async (req, res) => {
        const { fullname, dob, email, phone, gender, marital_status,
                pin, farmer, investor, password, confirm_password, source } = req.body;

        // ✅ Validate input
        if(!fullname || !dob || !email || !phone || !gender || !marital_status ||
           !pin || !farmer || !investor || !password || !confirm_password || !source){
            return res.status(400).send("❌ All fields are required!");
        }

        if(password !== confirm_password){
            return res.status(400).send("❌ Passwords do not match!");
        }

        const idCardFile = req.files["id_card"] ? req.files["id_card"][0].filename : null;
        const passportFile = req.files["passport_photo"] ? req.files["passport_photo"][0].filename : null;

        if(!idCardFile || !passportFile){
            return res.status(400).send("❌ Please upload your ID card and passport photo.");
        }

        try {
            const hashed = await bcrypt.hash(password, 10);

            db.run(
                `INSERT INTO users (fullname, email, password, balance) VALUES (?,?,?,?)`,
                [fullname, email, hashed, 100], // 💰 $100 welcome bonus
                (err) => {
                    if(err){
                        console.log(`❌ DB error for ${email}: ${err.message}`);
                        return res.status(500).send("❌ Database error");
                    }

                    totalRegistered++;
                    console.log(`✅ New user registered: ${fullname} (${email})`);
                    console.log(`💰 Bonus $100 credited`);
                    console.log(`📈 Total registered users: ${totalRegistered}`);
                    console.log(`📂 Uploaded files: ${idCardFile}, ${passportFile}`);

                    // Send welcome email
                    mailer.sendWelcomeEmail(email, fullname);

                    // Redirect to success page
                    res.redirect("/success");
                }
            );
        } catch(err){
            console.log(`❌ Server error for ${email}: ${err.message}`);
            res.status(500).send("❌ Server error");
        }
    });

    // ================= LOGIN =================
    router.post("/login", (req, res) => {
        const { email, password } = req.body;
        if(!email || !password) return res.status(400).send("All fields required");

        db.get("SELECT * FROM users WHERE email=?", [email], async (err, user) => {
            if(err) return res.status(500).send("Database error");
            if(!user) return res.status(404).send("User not found");

            const match = await bcrypt.compare(password, user.password);
            if(!match) return res.status(401).send("Invalid password");

            req.session.userId = user.id;
            res.redirect("/dashboard");
        });
    });

    // ================= FORGOT PASSWORD =================
    router.get("/forgot-password", (req,res) => {
        res.sendFile(path.join(__dirname,"../public/forgot-password.html"));
    });

    router.post("/forgot-password", (req,res) => {
        const { email } = req.body;
        if(!email) return res.status(400).send("Email required");

        db.get("SELECT * FROM users WHERE email=?", [email], (err, user) => {
            if(err || !user) return res.status(404).send("Email not registered");

            const otp = Math.floor(100000 + Math.random()*900000);
            req.session.otp = otp;
            req.session.otpEmail = email;

            mailer.sendOTP(email, otp);

            res.redirect(`/verify-otp.html?email=${encodeURIComponent(email)}`);
        });
    });

    // ================= VERIFY OTP =================
    router.post("/verify-otp", (req,res) => {
        const { email, otp } = req.body;
        if(!email || !otp) return res.status(400).send("All fields required");

        if(req.session.otp && req.session.otpEmail === email && req.session.otp == otp){
            delete req.session.otp;
            delete req.session.otpEmail;
            res.redirect(`/reset-password.html?email=${encodeURIComponent(email)}`);
        } else {
            return res.status(400).send("Invalid OTP");
        }
    });

    // ================= RESET PASSWORD =================
    router.post("/reset-password", async (req,res) => {
        const { email, password } = req.body;
        if(!email || !password) return res.status(400).send("All fields required");

        const hashed = await bcrypt.hash(password, 10);
        db.run("UPDATE users SET password=? WHERE email=?", [hashed, email], (err) => {
            if(err) return res.status(500).send("Error resetting password");
            res.send("✅ Password reset successful! <a href='/login'>Login</a>");
        });
    });

    // ================= LOGOUT =================
    router.get("/logout", (req,res) => {
        req.session.destroy(() => res.redirect("/login"));
    });

    // ================= GET LOGIN PAGE =================
    router.get("/login", (req,res) => {
        res.sendFile(path.join(__dirname,"../public/login.html"));
    });

    return router;
};
