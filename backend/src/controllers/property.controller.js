const prisma = require("../config/prisma");
const { createPropertySchema } = require("../validators/property.validator");

// GET /api/properties  (Buyer feed - public, status=active tu, filters za msingi)
async function listProperties(req, res) {
  const { category, location, minPrice, maxPrice, search } = req.query;

  const where = {
    status: "active",
    ...(category && { category: { slug: category } }),
    ...(location && { location: { contains: location, mode: "insensitive" } }),
    ...(search && { title: { contains: search, mode: "insensitive" } }),
    ...(minPrice || maxPrice
      ? {
          price: {
            ...(minPrice && { gte: Number(minPrice) }),
            ...(maxPrice && { lte: Number(maxPrice) }),
          },
        }
      : {}),
  };

  const properties = await prisma.property.findMany({
    where,
    include: { category: true, seller: { select: { id: true, name: true } } },
    // TODO: Leading Fee logic — isLeading za kwanza, kisha isBoosted, kisha createdAt desc
    orderBy: [{ isLeading: "desc" }, { isBoosted: "desc" }, { createdAt: "desc" }],
  });

  res.json({ success: true, data: properties });
}

// GET /api/properties/:id
async function getProperty(req, res) {
  const property = await prisma.property.findUnique({
    where: { id: req.params.id },
    include: { category: true, seller: { select: { id: true, name: true } }, reviews: true },
  });

  if (!property) {
    return res.status(404).json({ success: false, message: "Mali haijapatikana" });
  }

  // TODO: ongeza view_count += 1 (fanya async, isizuie response)
  res.json({ success: true, data: property });
}

// GET /api/properties/mine (Seller — My Listings)
async function myListings(req, res) {
  const properties = await prisma.property.findMany({
    where: { sellerId: req.user.id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, data: properties });
}

// POST /api/properties (Seller — Weka Mali Yako)
async function createProperty(req, res) {
  const data = createPropertySchema.parse(req.body);

  // TODO: Awamu 3 — hesabu na uhitaji malipo ya Listing Fee kabla ya kuunda
  // (fee inapungua kadri price inavyoongezeka — tazama muongozo 5)

  const property = await prisma.property.create({
    data: {
      ...data,
      sellerId: req.user.id,
      status: "pending_approval", // admin lazima aidhinishe kabla haijaonekana (muongozo 4.3)
    },
  });

  res.status(201).json({
    success: true,
    message: "Mali imewekwa, inasubiri idhini ya admin",
    data: property,
  });
}

module.exports = { listProperties, getProperty, myListings, createProperty };
