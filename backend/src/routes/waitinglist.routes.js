const express = require("express");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.post("/", authRequired, (req, res) => {
  // { propertyId } — buyer anajiunga waiting list ya mali iliyo RESERVED
  res.status(501).json({ success: false, message: "Bado haijatengenezwa: join waiting list" });
});

module.exports = router;
