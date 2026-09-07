const express = require("express");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/", authRequired, (req, res) => {
  // Tazama muongozo 8 — EVENT -> NOTIFICATION -> ACTION -> STATUS UPDATE
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: list my notifications" });
});

router.patch("/:id/read", authRequired, (req, res) => {
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: mark as read" });
});

module.exports = router;
