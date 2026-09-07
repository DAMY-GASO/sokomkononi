const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const generateToken = require("../utils/generateToken");
const { registerSchema, loginSchema } = require("../validators/auth.validator");

async function register(req, res) {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { phone: data.phone }] },
  });
  if (existing) {
    return res.status(409).json({ success: false, message: "Email au namba ya simu tayari imesajiliwa" });
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: hashedPassword,
      // role haichaguliwi hapa: akaunti moja inaweza Buy + Sell (tazama muongozo 3.1)
    },
  });

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: "Umesajiliwa kikamilifu",
    data: { token, user: sanitizeUser(user) },
  });
}

async function login(req, res) {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.emailOrPhone }, { phone: data.emailOrPhone }],
    },
  });

  if (!user) {
    return res.status(401).json({ success: false, message: "Taarifa za kuingia si sahihi" });
  }

  if (user.isSuspended) {
    return res.status(403).json({ success: false, message: "Akaunti yako imesimamishwa. Wasiliana na admin." });
  }

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Taarifa za kuingia si sahihi" });
  }

  const token = generateToken(user);

  res.json({
    success: true,
    message: "Umeingia kikamilifu",
    data: { token, user: sanitizeUser(user) },
  });
}

async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    return res.status(404).json({ success: false, message: "Mtumiaji hajapatikana" });
  }
  res.json({ success: true, data: sanitizeUser(user) });
}

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

module.exports = { register, login, me };
