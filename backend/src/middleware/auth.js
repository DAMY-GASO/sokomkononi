const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Tafadhali login kwanza" });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token si sahihi au imeisha muda" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Huna ruhusa ya kufanya hii" });
    }
    next();
  };
}

module.exports = { authRequired, requireRole };
