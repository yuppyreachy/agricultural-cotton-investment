const express = require("express");
const router = express.Router();
const path = require("path");

router.get("/admin",(req,res)=>{
  if(!req.session.admin){
    return res.redirect("/login");
  }

  res.sendFile(path.join(__dirname,"../public/justadmin.html"));
});

module.exports = router;
