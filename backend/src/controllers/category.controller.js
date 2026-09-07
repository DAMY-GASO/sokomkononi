const prisma = require("../config/prisma");

async function listCategories(req, res) {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  res.json({ success: true, data: categories });
}

module.exports = { listCategories };
