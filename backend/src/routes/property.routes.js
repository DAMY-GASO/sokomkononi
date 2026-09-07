const express = require("express");
const {
  listProperties,
  getProperty,
  myListings,
  createProperty,
} = require("../controllers/property.controller");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/", listProperties);
router.get("/mine", authRequired, myListings);
router.get("/:id", getProperty);
router.post("/", authRequired, createProperty);

// TODO: PATCH /:id (edit), DELETE /:id, POST /:id/boost

module.exports = router;
