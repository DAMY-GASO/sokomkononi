const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().min(2, "Jina fupi sana"),
  email: z.string().email("Email si sahihi"),
  phone: z.string().min(9, "Namba ya simu si sahihi"),
  password: z.string().min(6, "Password iwe na herufi 6 au zaidi"),
});

const loginSchema = z.object({
  emailOrPhone: z.string().min(3),
  password: z.string().min(1),
});

module.exports = { registerSchema, loginSchema };
