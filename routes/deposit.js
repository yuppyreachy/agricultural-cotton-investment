const express = require("express");
const router = express.Router();
const db = require("../db/database");
const multer = require("multer");
const path = require("path");

// ================= UPLOAD CONFIG =================
const storage = multer.diskStorage({
 destination: "public/proofs",
 filename: (req, file, cb) => {
   cb(null, Date.now() + path.extname(file.originalname));
 }
});
const upload = multer({ storage });

// ================= DEPOSIT PAGE =================
router.get("/", (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  db.all(
    "SELECT * FROM deposits WHERE user_id=? ORDER BY id DESC",
    [req.session.user.id],
    (err, deposits) => {
      if (err) {
        console.error(err);
        deposits = []; // fallback to empty array
      }
      // render with deposits array
      res.render("deposit", { deposits: deposits || [] });
    }
  );
});


// ================= CREATE REQUEST =================
router.post("/create", (req, res) => {
 const { method, amount } = req.body;
 const userId = req.session.user.id;

 db.run(
   "INSERT INTO deposits (user_id, method, amount) VALUES (?,?,?)",
   [userId, method, amount],
   () => {
     res.redirect("/deposit");
   }
 );
});

// ================= USER CONFIRM PAYMENT =================
router.post("/paid/:id", upload.single("proof"), (req, res) => {
 const proof = req.file ? req.file.filename : null;

 db.run(
   "UPDATE deposits SET status='paid', proof=? WHERE id=?",
   [proof, req.params.id],
   () => {
     res.redirect("/deposit");
   }
 );

});

module.exports = router;
