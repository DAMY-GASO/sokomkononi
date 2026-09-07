const express = require("express");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

// TODO Awamu 4: implement kikamilifu — tazama muongozo 3.4 & 3.5
router.post("/", authRequired, (req, res) => {
  // Buyer anaanza Deal Room kwa property fulani (POST { propertyId })
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: create deal room" });
});

router.get("/:id", authRequired, (req, res) => {
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: get deal room + messages" });
});

router.post("/:id/messages", authRequired, (req, res) => {
  // { message, offerAmount? }
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: send negotiation message" });
});

router.post("/:id/agree", authRequired, (req, res) => {
  // Seller/Buyer wanakubali AGREED PRICE
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: agree on price" });
});

module.exports = router;
