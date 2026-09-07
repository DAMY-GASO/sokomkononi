const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  // Categories za MVP — tazama muongozo 3.2
  const categories = [
    { name: "Nyumba & Majengo", slug: "nyumba-majengo", extraFields: { bedrooms: "number", bathrooms: "number", size: "text", titleStatus: "text" } },
    { name: "Viwanja & Mashamba", slug: "viwanja-mashamba", extraFields: { size: "text", titleStatus: "text", landUse: "text" } },
    { name: "Magari", slug: "magari", extraFields: { make: "text", model: "text", year: "number", mileage: "number", transmission: "text", fuelType: "text" } },
    { name: "Biashara Zinazouzwa", slug: "biashara", extraFields: { businessType: "text", monthlyRevenue: "number", yearsActive: "number" } },
    { name: "Mashine/Heavy Equipment", slug: "mashine", extraFields: { equipmentType: "text", hoursUsed: "number", condition: "text" } },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  // Admin wa default
  const adminPassword = await bcrypt.hash("Admin@12345", 10);
  await prisma.user.upsert({
    where: { email: "[email protected]" },
    update: {},
    create: {
      name: "SokoMkononi Admin",
      email: "[email protected]",
      phone: "255700000000",
      password: adminPassword,
      role: "admin",
      isVerified: true,
    },
  });

  // Fee settings za default — tazama muongozo 5
  const feeSettings = [
    { key: "listing_fee_tiers", value: { tiers: [{ maxPrice: 1000000, fee: 20000 }, { maxPrice: 10000000, fee: 15000 }, { maxPrice: null, fee: 10000 }] } },
    { key: "reservation_fee_hours", value: { "24": 10000, "48": 18000, "72": 25000 } },
    { key: "boost_fee", value: { amount: 15000 } },
    { key: "leading_fee", value: { amount: 10000 } },
  ];

  for (const f of feeSettings) {
    await prisma.feeSetting.upsert({
      where: { key: f.key },
      update: {},
      create: f,
    });
  }

  console.log("Seed imekamilika ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
