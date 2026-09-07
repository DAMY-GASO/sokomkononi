const express = require("express");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

// TODO Awamu 5: implement kikamilifu — tazama muongozo 3.5 (Reservation vs Inspection period)
router.post("/", authRequired, (req, res) => {
  // { dealRoomId, durationHours } → huanzisha reservation + payment intent
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: create reservation" });
});

router.post("/:id/confirm-payment", authRequired, (req, res) => {
  // Webhook/callback ya payment gateway inaita hii (au manual confirm kwa MVP)
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: confirm reservation payment" });
});

router.post("/:id/inspection-decision", authRequired, (req, res) => {
  // { decision: ready_for_final_payment | not_as_described | request_negotiation | cancel_transaction }
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: submit inspection decision" });
});

router.post("/:id/upload-payment-proof", authRequired, (req, res) => {
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: upload payment proof" });
});

router.post("/:id/confirm-received", authRequired, (req, res) => {
  // Seller anabofya "Nimepokea Malipo" → COMPLETED, property → SOLD
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: seller confirms payment received" });
});

module.exports = router;
