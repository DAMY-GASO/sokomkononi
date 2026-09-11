// Creates a new listing record from a submitted post-form payload.
// Ina-export kila category extra kama top-level field kunapofaa, ili
// listing mpya ifanane kabisa na SEED_LISTINGS (na PropertyDetail/
// CategoryPage/BrowseProperties zote zinaweza kuisoma kwa uthabiti).
export function buildListingFromSubmission({ categoryKey, base, extra, photoCount }) {
  const feeInfo = calculateListingFee(categoryKey, base.price);

  // Hoist helpers: kama `extra.title` ipo, inaenda kwenye `titleStatus`
  // (jina linalotumika kwenye seeds).
  const hoisted = {
    titleStatus: extra?.title || undefined,
    // Nyumba
    bedrooms: extra?.vyumba ? Number(extra.vyumba) : undefined,
    bathrooms: extra?.bafu ? Number(extra.bafu) : undefined,
    area: extra?.ukubwa || undefined,
    // Magari
    make: extra?.make_model?.split(" ")?.[0] || undefined,
    model: extra?.make_model?.split(" ")?.slice(1).join(" ") || undefined,
    mileage: extra?.mileage ? `${extra.mileage} km` : undefined,
    // Biashara
    type: extra?.aina || undefined,
    // Mashine
    hours: extra?.hours ? `${extra.hours} hrs` : undefined,
  };

  // Ondoa fields zilizo undefined ili listing isiwe na keys tupu.
  Object.keys(hoisted).forEach((k) => hoisted[k] === undefined && delete hoisted[k]);

  return {
    id: `l_${Date.now()}`,
    title: base.title,
    category: categoryKey,
    price: feeInfo.price,
    location: base.location,
    description: base.description,
    seller_name: base.seller_name,
    contact_pref: base.contact_pref,
    extra,
    ...hoisted,          // <-- hapa fields zinaingia kama top-level
    photoCount,
    status: "pending_payment",
    postedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(), // 30d
    listingFee: feeInfo.fee,
    views: 0,
    inquiries: 0,
  };
}