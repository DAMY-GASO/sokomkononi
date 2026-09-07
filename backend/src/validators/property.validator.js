const { z } = require("zod");

const createPropertySchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.number().positive(),
  location: z.string().min(2),
  images: z.array(z.string().url()).min(1, "Weka picha angalau moja"),
  attributes: z.record(z.any()).optional(), // fields za ziada kulingana na category
  contactHidden: z.boolean().optional(),
});

module.exports = { createPropertySchema };
