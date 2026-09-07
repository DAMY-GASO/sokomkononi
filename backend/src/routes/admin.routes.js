const express = require("express");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(authRequired, requireRole("admin"));

// Tazama muongozo 4 — Overview, Users, Listings, Deal Rooms, Revenue, System Settings
router.get("/overview", (req, res) => {
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: admin overview stats" });
});

router.get("/users", (req, res) => {
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: list users" });
});

router.patch("/users/:id/suspend", (req, res) => {
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: suspend user" });
});

router.get("/properties/pending", (req, res) => {
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: listings pending approval" });
});

router.patch("/properties/:id/approve", (req, res) => {
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: approve listing" });
});

router.patch("/properties/:id/reject", (req, res) => {
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: reject listing" });
});

router.get("/fee-settings", (req, res) => {
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: get fee settings" });
});

router.put("/fee-settings/:key", (req, res) => {
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: update fee setting" });
});

module.exports = router;
