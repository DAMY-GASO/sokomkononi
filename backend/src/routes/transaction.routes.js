const express = require("express");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/mine", authRequired, (req, res) => {
  // My Transactions — tazama muongozo 3.7
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: my transactions" });
});

module.exports = router;
