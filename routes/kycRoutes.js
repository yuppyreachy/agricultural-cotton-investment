const express = require("express");
const router = express.Router();
const path = require("path");

router.get("/kyc",(req,res)=>{
  if(!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname,"../public/kyc.html"));
});

module.exports = router;
