// ============================================================
// fieldLibrary.js — Maktaba kamili ya fields za fomu ya kuweka tangazo
//
// Admin anachagua (tick/untick) fields kwa kila category kupitia CategoryForm.
// Uchaguzi unahifadhiwa kama: extra.fields_config = [{ key, required }]
//
// KANUNI:
//  1. `key` HAIBADILIKI kamwe (backend + buildDetailBody zinategemea).
//  2. Field mpya = ongeza tu kwenye FIELD_LIBRARY, usibadilishe zilizopo.
//  3. Fields zote zinaenda kwenye `attributes` (JSON) — hakuna migration.
// ============================================================

const o = (sw, en = sw) => ({ value: sw, label: { sw, en } });
const ph = (sw, en = sw) => ({ sw, en });
const thisYear = new Date().getFullYear();

const F = (key, group, sw, en, type = "text", rest = {}) => ({
  key,
  group,
  label: { sw, en },
  type,
  ...rest,
});

// ── Chaguo zinazotumika mara nyingi ─────────────────────────
const YES_NO = [o("Ndio", "Yes"), o("Hapana", "No")];
const YES_NO_PARTLY = [o("Ndio", "Yes"), o("Hapana", "No"), o("Nusu", "Partly")];
const CONDITION = [
  o("Mpya", "New"),
  o("Nzuri Sana", "Excellent"),
  o("Nzuri", "Good"),
  o("Inahitaji Matengenezo", "Needs Repair"),
];
const CONDITION_USED_NEW = [
  o("Mpya", "Brand New"),
  o("Imetumika", "Used"),
  o("Imerekebishwa (Refurbished)", "Refurbished"),
];
const CAR_CONDITION = [
  o("Mpya", "Brand New"),
  o("Foreign Used"),
  o("Local Used", "Locally Used"),
  o("Inahitaji Matengenezo", "Needs Repair"),
];
const TITLE_STATUS = [
  o("Hati Miliki", "Freehold Title"),
  o("Hati ya Kimila", "Customary Title"),
  o("Inasubiri Hati", "Title Pending"),
  o("Hakuna Hati", "No Title"),
];
const FUEL = [o("Petrol"), o("Diesel"), o("Hybrid"), o("Umeme (EV)", "Electric (EV)"), o("Gesi (CNG/LPG)", "Gas (CNG/LPG)")];
const TRANSMISSION = [o("Automatic"), o("Manual")];
const GENDER_TARGET = [o("Wanaume", "Men"), o("Wanawake", "Women"), o("Watoto", "Kids"), o("Unisex", "Unisex")];
const EXPERIENCE = [
  o("Chini ya mwaka 1", "Less than 1 year"),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) =>
    o(n === 1 ? "Mwaka 1" : `Miaka ${n}`, n === 1 ? "1 year" : `${n} years`)
  ),
  o("Miaka 10+", "10+ years"),
];
const POWER_SOURCE = [
  o("Umeme", "Electric"), o("Petrol"), o("Diesel"), o("Solar"),
  o("Betri", "Battery"), o("Mkono (Manual)", "Manual"), o("Nyingine", "Other"),
];

// ── Makundi (kwa kupanga UI ya admin) ───────────────────────
export const FIELD_GROUPS = [
  { key: "general",   label: { sw: "Za Jumla (zinafaa bidhaa yoyote)", en: "General (fits any item)" } },
  { key: "vehicle",   label: { sw: "Vyombo vya Usafiri", en: "Vehicles" } },
  { key: "property",  label: { sw: "Nyumba & Majengo", en: "Houses & Buildings" } },
  { key: "land",      label: { sw: "Viwanja & Mashamba", en: "Land & Plots" } },
  { key: "electronics", label: { sw: "Elektroniki & Kompyuta", en: "Electronics & Computing" } },
  { key: "fashion",   label: { sw: "Mavazi, Viatu & Urembo", en: "Fashion, Shoes & Beauty" } },
  { key: "home",      label: { sw: "Samani & Vifaa vya Nyumbani", en: "Furniture & Home Appliances" } },
  { key: "business",  label: { sw: "Biashara", en: "Business" } },
  { key: "machinery", label: { sw: "Mashine & Vifaa Vizito", en: "Machinery & Heavy Equipment" } },
  { key: "agri",      label: { sw: "Kilimo & Mifugo", en: "Agriculture & Livestock" } },
  { key: "food",      label: { sw: "Chakula & Vinywaji", en: "Food & Drinks" } },
  { key: "health",    label: { sw: "Afya & Dawa", en: "Health & Medical" } },
  { key: "kids",      label: { sw: "Watoto & Wajawazito", en: "Baby & Kids" } },
  { key: "books",     label: { sw: "Vitabu & Elimu", en: "Books & Education" } },
  { key: "sports",    label: { sw: "Michezo, Burudani & Sanaa", en: "Sports, Leisure & Arts" } },
  { key: "building",  label: { sw: "Vifaa vya Ujenzi", en: "Building Materials" } },
  { key: "services",  label: { sw: "Huduma", en: "Services" } },
  { key: "events",    label: { sw: "Matukio & Usafiri wa Kitalii", en: "Events & Travel" } },
  { key: "jobs",      label: { sw: "Ajira", en: "Jobs" } },
];

// ============================================================
// FIELD_LIBRARY — kila field mara MOJA
// ============================================================
export const FIELD_LIBRARY = Object.fromEntries(
  [
    // ───────────── ZA JUMLA ─────────────
    F("aina", "general", "Aina", "Type", "text", { placeholder: ph("mfano: Sofa, Mswaki, Friji", "e.g. Sofa, Toothbrush, Fridge") }),
    F("brand", "general", "Brand (Chapa)", "Brand", "text", { placeholder: ph("mfano: Samsung", "e.g. Samsung") }),
    F("model", "general", "Model", "Model", "text"),
    F("hali", "general", "Hali", "Condition", "select", { options: CONDITION }),
    F("hali_mpya_used", "general", "Mpya / Imetumika", "New / Used", "select", { options: CONDITION_USED_NEW }),
    F("idadi", "general", "Idadi", "Quantity", "number", { min: 1, placeholder: ph("mfano: 1", "e.g. 1") }),
    F("rangi", "general", "Rangi", "Colour", "text"),
    F("saizi", "general", "Saizi", "Size", "text", { placeholder: ph("mfano: 42 / L / XL", "e.g. 42 / L / XL") }),
    F("material", "general", "Malighafi", "Material", "select", {
      options: [o("Mbao", "Wood"), o("Chuma", "Metal"), o("Kioo", "Glass"), o("Kitambaa / Ngozi", "Fabric / Leather"), o("Plastiki", "Plastic"), o("Pamba", "Cotton"), o("Nyingine", "Other")],
    }),
    F("year", "general", "Mwaka", "Year", "number", { min: 1950, max: thisYear + 1, placeholder: ph("mfano: 2020", "e.g. 2020") }),
    F("dhamana", "general", "Ina Dhamana (Warranty)?", "Warranty?", "select", { options: YES_NO }),
    F("dhamana_muda", "general", "Muda wa Dhamana", "Warranty Period", "text", { placeholder: ph("mfano: miezi 12", "e.g. 12 months"), showIf: { key: "dhamana", value: "Ndio" } }),
    F("uzito", "general", "Uzito (kg)", "Weight (kg)", "number", { min: 0 }),
    F("urefu", "general", "Urefu (cm)", "Length (cm)", "number", { min: 0 }),
    F("upana", "general", "Upana (cm)", "Width (cm)", "number", { min: 0 }),
    F("kimo", "general", "Kimo (cm)", "Height (cm)", "number", { min: 0 }),
    F("nchi_asili", "general", "Nchi Ilikotengenezwa", "Made In", "text", { placeholder: ph("mfano: China, Japan, Tanzania", "e.g. China, Japan, Tanzania") }),
    F("risiti", "general", "Ina Risiti / Box Asili?", "Has Receipt / Original Box?", "select", { options: YES_NO }),
    F("delivery", "general", "Delivery Inapatikana?", "Delivery Available?", "select", { options: YES_NO }),
    F("inajadiliwa", "general", "Bei Inajadiliwa?", "Negotiable?", "select", { options: YES_NO }),
    F("sababu_kuuza", "general", "Sababu ya Kuuza", "Reason for Selling", "text"),
    F("vipengele_vingine", "general", "Maelezo ya Ziada", "Other Details", "textarea"),

    // ───────────── VYOMBO VYA USAFIRI ─────────────
    F("aina_gari", "vehicle", "Aina ya Mwili (Body)", "Body Type", "select", {
      options: [o("Sedan"), o("SUV"), o("Hatchback"), o("Pickup / Double Cabin"), o("Van / Noah / Hiace"), o("Station Wagon"), o("Coupe"), o("Lori / Truck", "Truck"), o("Nyingine", "Other")],
    }),
    F("transmission", "vehicle", "Transmission", "Transmission", "select", { options: TRANSMISSION }),
    F("mafuta", "vehicle", "Aina ya Mafuta", "Fuel Type", "select", { options: FUEL }),
    F("mileage", "vehicle", "Mileage (km)", "Mileage (km)", "number", { min: 0, placeholder: ph("mfano: 85000", "e.g. 85000") }),
    F("engine", "vehicle", "Injini (Engine)", "Engine", "text", { placeholder: ph("mfano: 2.0L au 1800cc", "e.g. 2.0L or 1800cc") }),
    F("cc", "vehicle", "Ukubwa wa Injini (cc)", "Engine Size (cc)", "number", { min: 0, placeholder: ph("mfano: 150", "e.g. 150") }),
    F("hali_gari", "vehicle", "Hali ya Gari", "Vehicle Condition", "select", { options: CAR_CONDITION }),
    F("drive", "vehicle", "Drive (2WD/4WD)", "Drive", "select", { options: [o("2WD"), o("4WD"), o("AWD")] }),
    F("milango", "vehicle", "Idadi ya Milango", "Doors", "number", { min: 1, max: 6 }),
    F("seats", "vehicle", "Idadi ya Viti", "Seats", "number", { min: 1 }),
    F("registered", "vehicle", "Imesajiliwa (Plate)?", "Registered?", "select", { options: YES_NO }),
    F("plate_namba", "vehicle", "Namba ya Usajili (herufi 3 za mwanzo)", "Plate Prefix", "text", { placeholder: ph("mfano: T 123", "e.g. T 123") }),
    F("kodi_bima", "vehicle", "Bima / Kodi Imelipwa?", "Insurance / Road Tax Paid?", "select", { options: YES_NO }),
    F("route_permit", "vehicle", "Ina Leseni ya Njia?", "Route Permit?", "select", { options: YES_NO }),
    F("ac", "vehicle", "Ina AC?", "Air Conditioning?", "select", { options: YES_NO }),
    F("aina_pikipiki", "vehicle", "Aina ya Pikipiki", "Motorcycle Type", "select", {
      options: [o("Boda boda / Kawaida", "Standard / Commuter"), o("Sport", "Sport"), o("Scooter", "Scooter"), o("Bajaji / Guta", "Tricycle")],
    }),
    F("aina_baiskeli", "vehicle", "Aina ya Baiskeli", "Bicycle Type", "select", {
      options: [o("Ya Mlima", "Mountain"), o("Ya Barabara", "Road"), o("Ya Kawaida", "Standard"), o("Ya Umeme", "Electric"), o("Ya Watoto", "Kids")],
    }),
    F("spare_parts_fit", "vehicle", "Inafaa Magari Gani (Spare)", "Fits Which Vehicles", "text", { placeholder: ph("mfano: Toyota Corolla 2010-2015", "e.g. Toyota Corolla 2010-2015") }),
    F("tairi_size", "vehicle", "Saizi ya Tairi", "Tyre Size", "text", { placeholder: ph("mfano: 205/55R16", "e.g. 205/55R16") }),
    F("mashua_urefu", "vehicle", "Urefu wa Chombo cha Maji (ft)", "Boat Length (ft)", "number", { min: 0 }),

    // ───────────── NYUMBA & MAJENGO ─────────────
    F("lengo", "property", "Kuuza au Kupangisha", "Sale or Rent", "select", { options: [o("Kuuza", "For Sale"), o("Kupangisha", "For Rent")] }),
    F("aina_nyumba", "property", "Aina ya Nyumba", "Property Type", "select", {
      options: [o("Nyumba ya Kawaida", "House"), o("Apartment"), o("Villa"), o("Studio / Chumba", "Studio / Room"), o("Townhouse"), o("Ofisi", "Office"), o("Fremu / Duka", "Shop Frame"), o("Godown / Ghala", "Warehouse")],
    }),
    F("vyumba", "property", "Vyumba vya Kulala", "Bedrooms", "number", { min: 0, placeholder: ph("mfano: 3", "e.g. 3") }),
    F("bafu", "property", "Bafu", "Bathrooms", "number", { min: 0, placeholder: ph("mfano: 2", "e.g. 2") }),
    F("self_contained", "property", "Self-contained?", "Self-contained?", "select", { options: YES_NO }),
    F("ukubwa_nyumba", "property", "Ukubwa wa Jengo (sqm)", "Building Size (sqm)", "number", { min: 0 }),
    F("ghorofa", "property", "Ghorofa / Sakafu", "Floor", "text", { placeholder: ph("mfano: Sakafu ya 3", "e.g. 3rd floor") }),
    F("parking", "property", "Maegesho (Parking)", "Parking", "select", {
      options: [o("Hakuna", "None"), o("Gari 1", "1 car"), o("Magari 2", "2 cars"), o("Magari 3+", "3+ cars")],
    }),
    F("maji", "property", "Maji", "Water", "select", {
      options: [o("Bomba (Mamlaka ya Maji)", "Piped (Water Authority)"), o("Kisima / Borehole", "Well / Borehole"), o("Zote mbili", "Both"), o("Hakuna", "None")],
    }),
    F("umeme", "property", "Umeme", "Electricity", "select", {
      options: [o("Upo (LUKU)", "Available (LUKU)"), o("Solar", "Solar"), o("Hakuna", "None")],
    }),
    F("furnished", "property", "Samani (Furnished)", "Furnished", "select", { options: YES_NO_PARTLY }),
    F("title", "property", "Hati (Title Status)", "Title Status", "select", { options: TITLE_STATUS, showIf: { key: "lengo", value: "Kuuza" } }),
    F("ulinzi", "property", "Ulinzi / Uzio (Security)", "Security / Fence", "select", { options: [o("Uzio + Mlinzi", "Fence + Guard"), o("Uzio tu", "Fence only"), o("Hakuna", "None")] }),
    F("kodi_muda", "property", "Kodi Inalipwa Kwa", "Rent Paid Per", "select", {
      options: [o("Mwezi", "Month"), o("Miezi 3", "3 Months"), o("Miezi 6", "6 Months"), o("Mwaka", "Year")],
      showIf: { key: "lengo", value: "Kupangisha" },
    }),
    F("umbali_barabara", "property", "Umbali kutoka Barabara Kuu", "Distance from Main Road", "text", { placeholder: ph("mfano: mita 200", "e.g. 200 metres") }),

    // ───────────── VIWANJA & MASHAMBA ─────────────
    F("ukubwa", "land", "Ukubwa", "Size", "number", { min: 0, placeholder: ph("mfano: 800", "e.g. 800") }),
    F("kipimo", "land", "Kipimo", "Unit", "select", { options: [o("Sqm", "Sqm"), o("Ekari", "Acres"), o("Hekta", "Hectares")] }),
    F("surveyed", "land", "Kimepimwa (Surveyed)?", "Surveyed?", "select", { options: YES_NO }),
    F("barabara", "land", "Barabara", "Road Access", "select", {
      options: [o("Lami", "Tarmac"), o("Changarawe", "Gravel"), o("Udongo", "Dirt road"), o("Hakuna barabara", "No road")],
    }),
    F("umeme_ardhi", "land", "Umeme (Eneo)", "Electricity (Area)", "select", { options: [o("Upo", "Available"), o("Karibu", "Nearby"), o("Hakuna", "None")] }),
    F("maji_ardhi", "land", "Maji (Eneo)", "Water (Area)", "select", { options: [o("Yapo", "Available"), o("Karibu", "Nearby"), o("Hakuna", "None")] }),
    F("matumizi", "land", "Matumizi ya Ardhi", "Land Use", "select", {
      options: [o("Makazi", "Residential"), o("Makazi na Biashara", "Residential and Commercial"), o("Kilimo", "Agricultural"), o("Biashara", "Commercial"), o("Viwanda", "Industrial")],
    }),
    F("ardhi_mazao", "land", "Mazao Yanayostawi", "Suitable Crops", "text"),
    F("mto_karibu", "land", "Chanzo cha Maji Karibu (Mto/Bwawa)?", "Water Source Nearby?", "select", { options: YES_NO }),

    // ───────────── ELEKTRONIKI & KOMPYUTA ─────────────
    F("aina_elektroniki", "electronics", "Aina ya Kifaa", "Device Type", "select", {
      options: [o("Simu", "Phone"), o("Tablet"), o("Kompyuta / Laptop", "Computer / Laptop"), o("TV", "TV"), o("Kamera", "Camera"), o("Audio / Spika", "Audio / Speakers"), o("Console / Games", "Console / Games"), o("Printer"), o("Router / Mtandao", "Router / Networking"), o("Nyingine", "Other")],
    }),
    F("ram", "electronics", "RAM (GB)", "RAM (GB)", "number", { min: 0, placeholder: ph("mfano: 8", "e.g. 8") }),
    F("storage", "electronics", "Storage (GB)", "Storage (GB)", "number", { min: 0, placeholder: ph("mfano: 256", "e.g. 256") }),
    F("specs", "electronics", "Specs Nyingine", "Other Specs", "text", { placeholder: ph("mfano: Core i5, 15.6 inch", "e.g. Core i5, 15.6 inch") }),
    F("screen_size", "electronics", "Ukubwa wa Skrini (inchi)", "Screen Size (inches)", "number", { min: 0 }),
    F("processor", "electronics", "Processor", "Processor", "text", { placeholder: ph("mfano: Intel Core i7", "e.g. Intel Core i7") }),
    F("camera_mp", "electronics", "Camera (MP)", "Camera (MP)", "number", { min: 0 }),
    F("betri_mah", "electronics", "Betri (mAh)", "Battery (mAh)", "number", { min: 0 }),
    F("os", "electronics", "Mfumo (OS)", "Operating System", "select", { options: [o("Android"), o("iOS"), o("Windows"), o("macOS"), o("Linux"), o("Nyingine", "Other")] }),
    F("sim_slots", "electronics", "Idadi ya SIM", "SIM Slots", "select", { options: [o("1"), o("2"), o("eSIM")] }),
    F("unlocked", "electronics", "Imefunguliwa (Unlocked)?", "Unlocked?", "select", { options: YES_NO }),
    F("tv_resolution", "electronics", "Resolution ya TV", "TV Resolution", "select", { options: [o("HD"), o("Full HD"), o("4K"), o("8K")] }),
    F("smart_tv", "electronics", "Smart TV?", "Smart TV?", "select", { options: YES_NO }),
    F("accessories_inc", "electronics", "Accessories Zilizomo", "Included Accessories", "text", { placeholder: ph("mfano: Chaja, Earphones, Case", "e.g. Charger, Earphones, Case") }),

    // ───────────── MAVAZI, VIATU & UREMBO ─────────────
    F("aina_fashion", "fashion", "Aina ya Bidhaa", "Item Type", "select", {
      options: [o("Nguo", "Clothes"), o("Viatu", "Shoes"), o("Mikoba", "Bags"), o("Saa", "Watches"), o("Vito / Urembo", "Jewellery / Accessories"), o("Kofia / Miwani", "Hats / Glasses"), o("Nyingine", "Other")],
    }),
    F("kwa", "fashion", "Kwa Ajili ya", "For", "select", { options: GENDER_TARGET }),
    F("saizi_viatu", "fashion", "Saizi ya Kiatu", "Shoe Size", "text", { placeholder: ph("mfano: 42", "e.g. 42") }),
    F("saizi_nguo", "fashion", "Saizi ya Nguo", "Clothing Size", "select", { options: [o("XS"), o("S"), o("M"), o("L"), o("XL"), o("XXL"), o("XXXL"), o("Saizi Moja", "One Size")] }),
    F("kitambaa", "fashion", "Kitambaa", "Fabric", "text", { placeholder: ph("mfano: Pamba, Kitenge, Jeans", "e.g. Cotton, Kitenge, Denim") }),
    F("mtindo", "fashion", "Mtindo / Style", "Style", "text", { placeholder: ph("mfano: Kiafrika, Rasmi, Kawaida", "e.g. African, Formal, Casual") }),
    F("original", "fashion", "Original au Copy?", "Original or Replica?", "select", { options: [o("Original"), o("Copy / Replica", "Replica")] }),
    F("ngozi_aina", "fashion", "Aina ya Ngozi / Ngozi ya Asili?", "Genuine Leather?", "select", { options: YES_NO }),
    F("aina_ngozi_nywele", "fashion", "Inafaa Aina ya Nywele/Ngozi", "Suitable For Hair/Skin Type", "text"),
    F("kiasi_ml", "fashion", "Kiasi (ml/g)", "Volume (ml/g)", "number", { min: 0 }),
    F("expiry_date", "fashion", "Tarehe ya Kuisha Muda (Expiry)", "Expiry Date", "date"),

    // ───────────── SAMANI & VIFAA VYA NYUMBANI ─────────────
    F("aina_samani", "home", "Aina ya Samani", "Furniture Type", "text", { placeholder: ph("mfano: Sofa, Kitanda, Meza", "e.g. Sofa, Bed, Table") }),
    F("viti_samani", "home", "Idadi ya Viti/Sehemu", "Seats / Pieces", "number", { min: 1 }),
    F("ukubwa_kitanda", "home", "Ukubwa wa Kitanda", "Bed Size", "select", { options: [o("3x6"), o("4x6"), o("5x6"), o("6x6"), o("King"), o("Queen")] }),
    F("aina_kifaa_nyumbani", "home", "Aina ya Kifaa cha Nyumbani", "Appliance Type", "text", { placeholder: ph("mfano: Friji, Jiko, Mashine ya kufulia", "e.g. Fridge, Cooker, Washing machine") }),
    F("nguvu_watts", "home", "Nguvu (Watts)", "Power (Watts)", "number", { min: 0 }),
    F("volts", "home", "Volts", "Voltage", "select", { options: [o("220-240V"), o("110-120V"), o("12V"), o("24V")] }),
    F("uwezo_lita", "home", "Uwezo (Lita)", "Capacity (Litres)", "number", { min: 0 }),
    F("uwezo_kg", "home", "Uwezo (kg)", "Capacity (kg)", "number", { min: 0 }),
    F("energy_rating", "home", "Matumizi ya Umeme (Energy Rating)", "Energy Rating", "select", { options: [o("A+++"), o("A++"), o("A+"), o("A"), o("B"), o("C")] }),
    F("burners", "home", "Idadi ya Jiko (Burners)", "Burners", "number", { min: 1, max: 8 }),
    F("chanzo_nishati", "home", "Chanzo cha Nishati", "Power Source", "select", { options: POWER_SOURCE }),
    F("vyombo_seti", "home", "Idadi ya Vipande vya Seti", "Pieces in Set", "number", { min: 1 }),

    // ───────────── BIASHARA ─────────────
    F("aina_biashara", "business", "Aina ya Biashara", "Business Type", "text", { placeholder: ph("mfano: Duka la vifaa vya ujenzi", "e.g. Hardware store") }),
    F("mapato", "business", "Mapato ya Wastani (kwa mwezi)", "Average Monthly Revenue", "text", { placeholder: ph("TZS ...", "TZS ...") }),
    F("muda_biashara", "business", "Muda Biashara Ikiwepo", "Business Age", "text", { placeholder: ph("mfano: miaka 4", "e.g. 4 years") }),
    F("leseni", "business", "Ina Leseni / TIN?", "Licensed / TIN?", "select", { options: YES_NO }),
    F("ajira", "business", "Idadi ya Wafanyakazi", "Number of Employees", "number", { min: 0 }),
    F("inajumuisha", "business", "Bei Inajumuisha", "Sale Includes", "select", {
      options: [o("Stock na vifaa", "Stock and equipment"), o("Vifaa tu", "Equipment only"), o("Jina na wateja tu", "Name and clients only")],
    }),
    F("pango_biashara", "business", "Fremu ni ya Kupanga au Mmiliki?", "Premises Rented or Owned?", "select", { options: [o("Kupanga", "Rented"), o("Mmiliki", "Owned")] }),
    F("franchise", "business", "Franchise Inapatikana?", "Franchise Available?", "select", { options: YES_NO }),
    F("minimum_order", "business", "Kiwango cha Chini cha Oda (MOQ)", "Minimum Order Qty (MOQ)", "number", { min: 1 }),
    F("bei_jumla", "business", "Bei ya Jumla Inapatikana?", "Wholesale Price Available?", "select", { options: YES_NO }),

    // ───────────── MASHINE & VIFAA VIZITO ─────────────
    F("aina_mashine", "machinery", "Aina ya Mashine / Kifaa", "Machine / Equipment Type", "text", { placeholder: ph("mfano: Mashine ya kudarizi, Excavator", "e.g. Embroidery machine, Excavator") }),
    F("capacity", "machinery", "Uwezo (Capacity)", "Capacity", "text", { placeholder: ph("mfano: tani 5 / 200 pcs kwa saa", "e.g. 5 tons / 200 pcs per hour") }),
    F("hours", "machinery", "Saa za Matumizi", "Hours Used", "number", { min: 0, placeholder: ph("mfano: 3200", "e.g. 3200") }),
    F("phase", "machinery", "Phase ya Umeme", "Electrical Phase", "select", { options: [o("Single Phase"), o("Three Phase")] }),
    F("hp_kw", "machinery", "Nguvu (HP/kW)", "Power (HP/kW)", "text", { placeholder: ph("mfano: 10 HP", "e.g. 10 HP") }),
    F("chanzo_nguvu_mashine", "machinery", "Chanzo cha Nguvu", "Power Source", "select", { options: POWER_SOURCE }),
    F("attachments", "machinery", "Vifaa vya Ziada Vilivyomo", "Included Attachments", "text"),
    F("spare_available", "machinery", "Spare Parts Zinapatikana?", "Spare Parts Available?", "select", { options: YES_NO }),
    F("installation", "machinery", "Installation / Mafunzo Yanatolewa?", "Installation / Training Offered?", "select", { options: YES_NO }),

    // ───────────── KILIMO & MIFUGO ─────────────
    F("aina_mfugo", "agri", "Aina ya Mfugo", "Livestock Type", "select", {
      options: [o("Ng'ombe", "Cattle"), o("Mbuzi", "Goats"), o("Kondoo", "Sheep"), o("Kuku", "Chickens"), o("Nguruwe", "Pigs"), o("Bata / Batamzinga", "Ducks / Turkeys"), o("Samaki", "Fish"), o("Sungura", "Rabbits"), o("Nyuki", "Bees"), o("Mbwa / Paka", "Dogs / Cats"), o("Nyingine", "Other")],
    }),
    F("kuzaliana", "agri", "Kuzaliana (Breed)", "Breed", "text", { placeholder: ph("mfano: Friesian, Boer", "e.g. Friesian, Boer") }),
    F("jinsia", "agri", "Jinsia", "Sex", "select", { options: [o("Dume", "Male"), o("Jike", "Female"), o("Mchanganyiko", "Mixed")] }),
    F("umri", "agri", "Umri", "Age", "text", { placeholder: ph("mfano: miezi 8", "e.g. 8 months") }),
    F("chanjo", "agri", "Wamechanjwa?", "Vaccinated?", "select", { options: YES_NO }),
    F("mimba", "agri", "Mjamzito / Ana Mimba?", "Pregnant?", "select", { options: YES_NO }),
    F("maziwa_lita", "agri", "Maziwa kwa Siku (Lita)", "Milk per Day (Litres)", "number", { min: 0 }),
    F("aina_zao", "agri", "Aina ya Zao / Mmea", "Crop / Plant Type", "text", { placeholder: ph("mfano: Mahindi, Mpunga, Miche ya Parachichi", "e.g. Maize, Rice, Avocado seedlings") }),
    F("kiasi_zao", "agri", "Kiasi (kg / tani / gunia)", "Quantity (kg / tons / bags)", "text"),
    F("msimu_mavuno", "agri", "Msimu wa Mavuno", "Harvest Season", "text"),
    F("organic", "agri", "Organic?", "Organic?", "select", { options: YES_NO }),
    F("mbegu_aina", "agri", "Aina ya Mbegu / Mbolea", "Seed / Fertilizer Type", "text"),
    F("pembejeo_matumizi", "agri", "Inatumika Kwa", "Used For", "text"),

    // ───────────── CHAKULA & VINYWAJI ─────────────
    F("aina_chakula", "food", "Aina ya Chakula / Kinywaji", "Food / Drink Type", "text"),
    F("uzito_pakiti", "food", "Uzito wa Pakiti (g/kg)", "Pack Weight (g/kg)", "text"),
    F("tarehe_kutengenezwa", "food", "Tarehe ya Kutengenezwa", "Manufacture Date", "date"),
    F("tbs_cert", "food", "Ina Cheti cha TBS / TMDA?", "TBS / TMDA Certified?", "select", { options: YES_NO }),
    F("viungo", "food", "Viambato / Ingredients", "Ingredients", "textarea"),
    F("chakula_maalum", "food", "Inafaa (Halal/Vegan/n.k.)", "Dietary (Halal/Vegan/etc.)", "text"),
    F("oda_mapema", "food", "Inahitaji Oda ya Mapema?", "Pre-order Required?", "select", { options: YES_NO }),

    // ───────────── AFYA & DAWA ─────────────
    F("aina_kifaa_afya", "health", "Aina ya Kifaa cha Afya", "Medical Device Type", "text", { placeholder: ph("mfano: Wheelchair, BP machine", "e.g. Wheelchair, BP machine") }),
    F("tmda_reg", "health", "Imesajiliwa TMDA?", "TMDA Registered?", "select", { options: YES_NO }),
    F("matumizi_afya", "health", "Matumizi", "Intended Use", "text"),
    F("sterile", "health", "Sterile / Disposable?", "Sterile / Disposable?", "select", { options: YES_NO }),

    // ───────────── WATOTO & WAJAWAZITO ─────────────
    F("umri_mtoto", "kids", "Umri wa Mtoto (Inafaa)", "Suitable Age", "select", {
      options: [o("0-6 miezi", "0-6 months"), o("6-12 miezi", "6-12 months"), o("Miaka 1-3", "1-3 years"), o("Miaka 3-6", "3-6 years"), o("Miaka 6-12", "6-12 years"), o("Miaka 12+", "12+ years")],
    }),
    F("aina_bidhaa_mtoto", "kids", "Aina ya Bidhaa ya Mtoto", "Baby Item Type", "text", { placeholder: ph("mfano: Stroller, Kitanda, Midoli", "e.g. Stroller, Cot, Toys") }),
    F("usalama_mtoto", "kids", "Imethibitishwa Usalama?", "Safety Certified?", "select", { options: YES_NO }),

    // ───────────── VITABU & ELIMU ─────────────
    F("kichwa_kitabu", "books", "Kichwa cha Kitabu", "Book Title", "text"),
    F("mwandishi", "books", "Mwandishi", "Author", "text"),
    F("lugha", "books", "Lugha", "Language", "select", { options: [o("Kiswahili", "Swahili"), o("Kiingereza", "English"), o("Nyingine", "Other")] }),
    F("toleo", "books", "Toleo / Edition", "Edition", "text"),
    F("ngazi_elimu", "books", "Ngazi ya Elimu", "Education Level", "select", {
      options: [o("Chekechea", "Pre-school"), o("Msingi", "Primary"), o("Sekondari", "Secondary"), o("Chuo / Chuo Kikuu", "College / University"), o("Ufundi (VETA)", "Vocational"), o("Nyingine", "Other")],
    }),
    F("somo", "books", "Somo / Fani", "Subject", "text"),
    F("aina_kozi", "books", "Aina ya Kozi / Mafunzo", "Course / Training Type", "text"),
    F("kozi_muda", "books", "Muda wa Kozi", "Course Duration", "text", { placeholder: ph("mfano: wiki 6", "e.g. 6 weeks") }),
    F("kozi_cheti", "books", "Cheti Kinatolewa?", "Certificate Offered?", "select", { options: YES_NO }),
    F("kozi_mtindo", "books", "Mtindo wa Kufundisha", "Mode of Learning", "select", { options: [o("Ana kwa Ana", "In person"), o("Mtandaoni", "Online"), o("Zote mbili", "Both")] }),

    // ───────────── MICHEZO, BURUDANI & SANAA ─────────────
    F("aina_michezo", "sports", "Aina ya Mchezo / Kifaa cha Michezo", "Sport / Gear Type", "text", { placeholder: ph("mfano: Mpira wa miguu, Gym bench", "e.g. Football, Gym bench") }),
    F("ala_muziki", "sports", "Aina ya Ala ya Muziki", "Instrument Type", "text", { placeholder: ph("mfano: Gitaa, Keyboard, Ngoma", "e.g. Guitar, Keyboard, Drum") }),
    F("aina_sanaa", "sports", "Aina ya Sanaa / Kazi ya Mkono", "Art / Craft Type", "select", {
      options: [o("Uchoraji", "Painting"), o("Uchongaji", "Carving"), o("Ufinyanzi", "Pottery"), o("Ushonaji wa Mikono", "Handcraft"), o("Picha", "Photography"), o("Nyingine", "Other")],
    }),
    F("msanii", "sports", "Msanii / Mtengenezaji", "Artist / Maker", "text"),
    F("aina_mchezo_video", "sports", "Platform ya Mchezo", "Game Platform", "select", { options: [o("PlayStation"), o("Xbox"), o("Nintendo"), o("PC"), o("Mobile"), o("Nyingine", "Other")] }),

    // ───────────── VIFAA VYA UJENZI ─────────────
    F("aina_ujenzi", "building", "Aina ya Kifaa cha Ujenzi", "Building Material Type", "text", { placeholder: ph("mfano: Saruji, Mabati, Tiles, Nondo", "e.g. Cement, Roofing sheets, Tiles, Rebar") }),
    F("unene", "building", "Unene / Gauge", "Thickness / Gauge", "text", { placeholder: ph("mfano: 28 gauge, 12mm", "e.g. 28 gauge, 12mm") }),
    F("kiasi_ujenzi", "building", "Kiasi Kinachopatikana", "Available Quantity", "text", { placeholder: ph("mfano: mifuko 500, trip 3", "e.g. 500 bags, 3 trips") }),
    F("kipimo_ujenzi", "building", "Kipimo cha Kuuzia", "Sold By", "select", { options: [o("Kipande", "Piece"), o("Mfuko", "Bag"), o("Mita", "Metre"), o("Mita ya Mraba", "Square metre"), o("Tani", "Ton"), o("Trip / Lori", "Trip / Lorry"), o("Kontena", "Container")] }),
    F("grade", "building", "Daraja / Grade", "Grade", "text", { placeholder: ph("mfano: 32.5N, 42.5N", "e.g. 32.5N, 42.5N") }),

    // ───────────── HUDUMA ─────────────
    F("service_type", "services", "Aina ya Huduma", "Service Type", "select", { options: [o("Professional", "Professional"), o("General", "General")] }),
    F("service_category", "services", "Kundi la Huduma", "Service Category", "select", {
      options: [
        o("Umeme", "Electrical"), o("Mabomba", "Plumbing"), o("Usafi", "Cleaning"),
        o("IT / Kompyuta", "IT"), o("Useremala", "Carpentry"), o("Upakaji Rangi", "Painting"),
        o("Ufundi Magari", "Auto Mechanic"), o("Usafiri / Usafirishaji", "Transport"),
        o("Urembo", "Beauty"), o("Elimu / Masomo", "Education / Tutoring"),
        o("Ujenzi", "Construction"), o("Nyingine", "Other"),
      ],
    }),
    F("service_category_other", "services", "Taja Huduma", "Specify Service", "text", { showIf: { key: "service_category", value: "Nyingine" } }),
    F("experience", "services", "Uzoefu", "Experience", "select", { options: EXPERIENCE }),
    F("aina_bei", "services", "Aina ya Bei", "Price Type", "select", {
      options: [o("Bei Maalum", "Fixed"), o("Inajadiliwa", "Negotiable"), o("Kwa Saa", "Per hour"), o("Kwa Siku", "Per day"), o("Omba Quote", "Request a quote")],
    }),
    F("availability", "services", "Upatikanaji", "Availability", "select", { options: [o("Anapatikana", "Available"), o("Ana Shughuli", "Busy")] }),
    F("masaa_kazi", "services", "Masaa ya Kazi", "Working Hours", "text", { placeholder: ph("mfano: 8:00 - 18:00", "e.g. 8:00 - 18:00") }),
    F("eneo_huduma", "services", "Anahudumia Maeneo Gani", "Areas Served", "text"),
    F("anakuja_kwako", "services", "Anakuja Mahali Ulipo?", "Travels To Client?", "select", { options: YES_NO }),
    F("vifaa_vyake", "services", "Ana Vifaa Vyake?", "Brings Own Equipment?", "select", { options: YES_NO }),
    F("portfolio_link", "services", "Link ya Kazi Zake (Portfolio)", "Portfolio Link", "text"),

    // ───────────── MATUKIO & USAFIRI WA KITALII ─────────────
    F("aina_tukio", "events", "Aina ya Tukio / Ukumbi", "Event / Venue Type", "text", { placeholder: ph("mfano: Harusi, Mkutano, Ukumbi", "e.g. Wedding, Conference, Hall") }),
    F("uwezo_watu", "events", "Uwezo wa Watu", "Guest Capacity", "number", { min: 1 }),
    F("tarehe_tukio", "events", "Tarehe ya Tukio", "Event Date", "date"),
    F("kifurushi_ni", "events", "Kifurushi Kinajumuisha", "Package Includes", "textarea"),
    F("aina_malazi", "events", "Aina ya Malazi", "Accommodation Type", "select", { options: [o("Hoteli", "Hotel"), o("Guest House"), o("Lodge"), o("Apartment ya Likizo", "Holiday Apartment"), o("Camp", "Camp")] }),
    F("usiku_idadi", "events", "Idadi ya Usiku", "Number of Nights", "number", { min: 1 }),
    F("kuondoka_kutoka", "events", "Kuondoka Kutoka / Kwenda", "Departure / Destination", "text"),

    // ───────────── AJIRA ─────────────
    F("kampuni", "jobs", "Kampuni / Mwajiri", "Company / Employer", "text", { placeholder: ph("mfano: ABC Limited", "e.g. ABC Limited") }),
    F("ngazi", "jobs", "Professional / Non-Professional", "Professional / Non-Professional", "select", {
      options: [o("Professional", "Professional"), o("Non-Professional", "Non-Professional")],
    }),
    F("sifa", "jobs", "Qualifications (Sifa zinazohitajika)", "Qualifications", "textarea", { placeholder: ph("mfano: Shahada ya Uhasibu, CPA", "e.g. Degree in Accounting, CPA") }),
    F("deadline", "jobs", "Mwisho wa Kuomba (Deadline)", "Application Deadline", "date"),
    F("aina_ajira", "jobs", "Aina ya Ajira", "Employment Type", "select", {
      options: [o("Muda Wote", "Full-time"), o("Muda Maalum (Part-time)", "Part-time"), o("Mkataba", "Contract"), o("Mafunzo kwa Vitendo", "Internship"), o("Kujitolea", "Volunteer")],
    }),
    F("jinsia_ajira", "jobs", "Jinsia Inayohitajika", "Gender Required", "select", { options: [o("Yoyote", "Any"), o("Kiume", "Male"), o("Kike", "Female")] }),
    F("elimu_ajira", "jobs", "Kiwango cha Elimu", "Education Level", "select", {
      options: [o("Darasa la 7", "Primary"), o("Kidato cha 4", "Form 4"), o("Kidato cha 6", "Form 6"), o("Cheti", "Certificate"), o("Diploma"), o("Shahada", "Degree"), o("Shahada ya Uzamili+", "Masters+")],
    }),
    F("lugha_ajira", "jobs", "Lugha Zinazohitajika", "Languages Required", "text"),
    F("njia_kuomba", "jobs", "Njia ya Kuomba (Email/Simu)", "How to Apply (Email/Phone)", "text"),
    F("malazi_posho", "jobs", "Malazi / Posho Zinatolewa?", "Housing / Allowance Offered?", "select", { options: YES_NO }),
  ].map((f) => [f.key, f])
);

// ============================================================
// HELPERS
// ============================================================

/** Fields zote kwa mpangilio wa makundi (kwa ajili ya UI ya admin). */
export function getFieldsByGroup() {
  return FIELD_GROUPS.map((g) => ({
    ...g,
    fields: Object.values(FIELD_LIBRARY).filter((f) => f.group === g.key),
  })).filter((g) => g.fields.length > 0);
}

/** showIf — inakubali `value` moja au `values: []`. */
export function matchShowIf(f, values = {}) {
  if (!f.showIf) return true;
  const cur = String(values[f.showIf.key] ?? "");
  return Array.isArray(f.showIf.values)
    ? f.showIf.values.includes(cur)
    : cur === f.showIf.value;
}

/**
 * fields_config ([{key, required}]) -> fields kamili.
 * `seedFields` = fields za zamani za category (kama zipo). Kama key ipo kwenye
 * seed, tunatumia ufafanuzi wake (options/placeholder za awali) ili category
 * za zamani zisibadilike zinapohaririwa.
 */
export function resolveConfiguredFields(fieldsConfig = [], seedFields = []) {
  const seedByKey = new Map((seedFields || []).map((f) => [f.key, f]));
  return (fieldsConfig || [])
    .map((c) => {
      const base = seedByKey.get(c.key) || FIELD_LIBRARY[c.key];
      return base ? { ...base, required: !!c.required } : null;
    })
    .filter(Boolean);
}

/** Kwa category ya zamani (seed): tengeneza fields_config kutoka extra yake. */
export function fieldsConfigFromExtra(extra = []) {
  return (Array.isArray(extra) ? extra : []).map((f) => ({
    key: f.key,
    required: !!f.required,
  }));
}
