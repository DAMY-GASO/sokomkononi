const o = (sw, en = sw) => ({ value: sw, label: { sw, en } });
const ph = (sw, en = sw) => ({ sw, en });
const F = (key, sw, en, type = "text", rest = {}) => ({
  key,
  label: { sw, en },
  type,
  ...rest,
});

// ── Chaguo zinazotumika mara nyingi ─────────────────────────
export const YES_NO = [o("Ndio", "Yes"), o("Hapana", "No")];
const YES_NO_PARTIAL = [o("Ndio", "Yes"), o("Hapana", "No"), o("Nusu", "Partly")];

export const TITLE_STATUS_OPTIONS = [
  o("Hati Miliki", "Freehold Title"),
  o("Hati ya Kimila", "Customary Title"),
  o("Inasubiri Hati", "Title Pending"),
  o("Hakuna Hati", "No Title"),
];
const LAND_USE_OPTIONS = [
  o("Makazi", "Residential"),
  o("Makazi na Biashara", "Residential and Commercial"),
  o("Kilimo", "Agricultural"),
  o("Biashara", "Commercial"),
  o("Viwanda", "Industrial"),
];
const TRANSMISSION_OPTIONS = [o("Automatic"), o("Manual")];
const FUEL_OPTIONS = [
  o("Petrol"),
  o("Diesel"),
  o("Hybrid"),
  o("Umeme (EV)", "Electric (EV)"),
];
const CONDITION_OPTIONS = [
  o("Mpya", "New"),
  o("Nzuri Sana", "Excellent"),
  o("Nzuri", "Good"),
  o("Inahitaji Matengenezo", "Needs Repair"),
];
const CAR_CONDITION_OPTIONS = [
  o("Mpya", "Brand New"),
  o("Foreign Used"),
  o("Local Used", "Locally Used"),
  o("Inahitaji Matengenezo", "Needs Repair"),
];
const PROFESSIONAL_OPTIONS = [
  o("Professional", "Professional"),
  o("Non-Professional", "Non-Professional"),
];
const EXPERIENCE_OPTIONS = [
  o("Chini ya mwaka 1", "Less than 1 year"),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) =>
    o(n === 1 ? "Mwaka 1" : `Miaka ${n}`, n === 1 ? "1 year" : `${n} years`)
  ),
  o("Miaka 10+", "10+ years"),
];

// ── Mikoa ya Tanzania (31) ──────────────────────────────────
export const TZ_REGIONS = [
  "Arusha", "Dar es Salaam", "Dodoma", "Geita", "Iringa", "Kagera",
  "Katavi", "Kigoma", "Kilimanjaro", "Lindi", "Manyara", "Mara",
  "Mbeya", "Morogoro", "Mtwara", "Mwanza", "Njombe", "Pwani",
  "Rukwa", "Ruvuma", "Shinyanga", "Simiyu", "Singida", "Songwe",
  "Tabora", "Tanga", "Kaskazini Unguja", "Kusini Unguja",
  "Mjini Magharibi", "Kaskazini Pemba", "Kusini Pemba",
];
// Mapendekezo ya wilaya (si lazima — mtumiaji anaweza kuandika yoyote)
export const WILAYA_SUGGESTIONS = {
  "Dar es Salaam": ["Ilala", "Kinondoni", "Temeke", "Ubungo", "Kigamboni"],
};

// ── Mapendekezo ya brand ────────────────────────────────────
const CAR_BRANDS = [
  "Toyota", "Nissan", "Suzuki", "Mitsubishi", "Honda", "Mazda", "Subaru",
  "Isuzu", "Hyundai", "Kia", "Ford", "Mercedes-Benz", "BMW", "Land Rover",
  "Volkswagen", "Audi", "Lexus",
];
const MOTO_BRANDS = ["Boxer", "TVS", "Honda", "Yamaha", "Haojue", "SanLG", "Sinoray", "Bajaj", "Kinglion"];
const MACHINE_BRANDS = ["Caterpillar", "Komatsu", "JCB", "Volvo", "Hitachi", "Kubota", "John Deere", "Bobcat", "Sany", "XCMG"];
const BUS_BRANDS = ["Toyota", "Scania", "Yutong", "Higer", "King Long", "Mitsubishi", "Isuzu", "Mercedes-Benz", "Golden Dragon"];
const ELECTRONICS_BRANDS = ["Samsung", "Apple", "Tecno", "Infinix", "Xiaomi", "Huawei", "HP", "Dell", "Lenovo", "LG", "Sony", "Hisense"];

const thisYear = new Date().getFullYear();

// ============================================================
// FIELDS za kila kategoria (extra)
// ============================================================
export const CATEGORY_EXTRA = {
  // ── Magari: Brand → Model → Year → Transmission → Fuel → Mileage → Engine → Condition
  magari: [
    F("brand", "Brand (Chapa)", "Brand", "text", { required: true, suggestions: CAR_BRANDS, placeholder: ph("mfano: Toyota", "e.g. Toyota") }),
    F("model", "Model", "Model", "text", { required: true, placeholder: ph("mfano: Harrier", "e.g. Harrier") }),
    F("year", "Mwaka", "Year", "number", { required: true, min: 1970, max: thisYear + 1, placeholder: ph("mfano: 2016", "e.g. 2016") }),
    F("transmission", "Transmission", "Transmission", "select", { required: true, options: TRANSMISSION_OPTIONS }),
    F("mafuta", "Aina ya Mafuta", "Fuel Type", "select", { required: true, options: FUEL_OPTIONS }),
    F("mileage", "Mileage (km)", "Mileage (km)", "number", { required: true, min: 0, placeholder: ph("mfano: 85000", "e.g. 85000") }),
    F("engine", "Injini (Engine)", "Engine", "text", { placeholder: ph("mfano: 2.0L au 1800cc", "e.g. 2.0L or 1800cc") }),
    F("hali", "Hali", "Condition", "select", { required: true, options: CAR_CONDITION_OPTIONS }),
  ],

  // ── Nyumba: Sale/Rent → Type → Bedrooms → Bathrooms → Plot size → Floor → Parking → Water → Electricity → Furnished
  nyumba: [
    F("lengo", "Kuuza au Kupangisha", "Sale or Rent", "select", { required: true, options: [o("Kuuza", "For Sale"), o("Kupangisha", "For Rent")] }),
    F("aina", "Aina ya Nyumba", "Property Type", "select", {
      required: true,
      options: [
        o("Nyumba ya Kawaida", "House"),
        o("Apartment", "Apartment"),
        o("Villa", "Villa"),
        o("Studio / Chumba", "Studio / Room"),
        o("Townhouse", "Townhouse"),
      ],
    }),
    F("vyumba", "Vyumba vya Kulala", "Bedrooms", "number", { required: true, min: 0, placeholder: ph("mfano: 3", "e.g. 3") }),
    F("bafu", "Bafu", "Bathrooms", "number", { required: true, min: 0, placeholder: ph("mfano: 2", "e.g. 2") }),
    F("ukubwa", "Ukubwa wa Kiwanja (sqm)", "Plot Size (sqm)", "number", { min: 0, placeholder: ph("mfano: 600", "e.g. 600") }),
    F("ghorofa", "Ghorofa / Sakafu", "Floor", "text", { placeholder: ph("mfano: Sakafu ya 3 au Ghorofa 2", "e.g. 3rd floor or 2 storeys") }),
    F("parking", "Maegesho (Parking)", "Parking", "select", {
      options: [o("Hakuna", "None"), o("Gari 1", "1 car"), o("Magari 2", "2 cars"), o("Magari 3+", "3+ cars")],
    }),
    F("maji", "Maji", "Water", "select", {
      options: [o("Bomba (Mamlaka ya Maji)", "Piped (Water Authority)"), o("Kisima / Borehole", "Well / Borehole"), o("Zote mbili", "Both"), o("Hakuna", "None")],
    }),
    F("umeme", "Umeme", "Electricity", "select", {
      options: [o("Upo (LUKU)", "Available (LUKU)"), o("Solar", "Solar"), o("Hakuna", "None")],
    }),
    F("furnished", "Samani (Furnished)", "Furnished", "select", { options: YES_NO_PARTIAL }),
    F("title", "Hati (Title Status)", "Title Status", "select", {
      options: TITLE_STATUS_OPTIONS,
      showIf: { key: "lengo", value: "Kuuza" },
    }),
  ],

  // ── Viwanja: Size → Surveyed? → Title deed? → Road → Electricity → Water → Land use
  viwanja: [
    F("ukubwa", "Ukubwa", "Size", "number", { required: true, min: 0, placeholder: ph("mfano: 800", "e.g. 800") }),
    F("kipimo", "Kipimo", "Unit", "select", {
      required: true,
      options: [o("Sqm", "Sqm"), o("Ekari", "Acres"), o("Hekta", "Hectares")],
    }),
    F("surveyed", "Kimepimwa (Surveyed)?", "Surveyed?", "select", { required: true, options: YES_NO }),
    F("title", "Hati (Title Deed)", "Title Deed", "select", { required: true, options: TITLE_STATUS_OPTIONS }),
    F("barabara", "Barabara", "Road Access", "select", {
      options: [o("Lami", "Tarmac"), o("Changarawe", "Gravel"), o("Udongo", "Dirt road"), o("Hakuna barabara", "No road")],
    }),
    F("umeme", "Umeme", "Electricity", "select", {
      options: [o("Upo", "Available"), o("Karibu", "Nearby"), o("Hakuna", "None")],
    }),
    F("maji", "Maji", "Water", "select", {
      options: [o("Yapo", "Available"), o("Karibu", "Nearby"), o("Hakuna", "None")],
    }),
    F("matumizi", "Matumizi ya Ardhi", "Land Use", "select", { required: true, options: LAND_USE_OPTIONS }),
  ],

  // ── Mashine: Type → Brand → Model → Year → Capacity → Condition → Hours used
  mashine: [
    F("aina", "Aina ya Mashine", "Machine Type", "text", { required: true, placeholder: ph("mfano: Mashine ya kudarizi", "e.g. Embroidery machine") }),
    F("brand", "Brand", "Brand", "text", { suggestions: MACHINE_BRANDS }),
    F("model", "Model", "Model", "text"),
    F("year", "Mwaka", "Year", "number", { min: 1970, max: thisYear + 1, placeholder: ph("mfano: 2019", "e.g. 2019") }),
    F("capacity", "Uwezo (Capacity)", "Capacity", "text", { placeholder: ph("mfano: tani 5 / 200 pcs kwa saa", "e.g. 5 tons / 200 pcs per hour") }),
    F("hali", "Hali", "Condition", "select", { required: true, options: CONDITION_OPTIONS }),
    F("hours", "Saa za Matumizi", "Hours Used", "number", { min: 0, placeholder: ph("mfano: 3200", "e.g. 3200") }),
  ],

  "vifaa-vizito": [
    F("aina", "Aina ya Kifaa", "Equipment Type", "text", { required: true, placeholder: ph("mfano: Excavator", "e.g. Excavator") }),
    F("brand", "Brand", "Brand", "text", { suggestions: MACHINE_BRANDS }),
    F("model", "Model", "Model", "text"),
    F("year", "Mwaka", "Year", "number", { min: 1970, max: thisYear + 1 }),
    F("capacity", "Uwezo (Capacity)", "Capacity", "text", { placeholder: ph("mfano: tani 20", "e.g. 20 tons") }),
    F("hali", "Hali", "Condition", "select", { required: true, options: CONDITION_OPTIONS }),
    F("hours", "Saa za Matumizi", "Hours Used", "number", { min: 0 }),
  ],

  // ── Huduma
  huduma: [
    F("service_type", "Aina ya Huduma", "Service Type", "select", {
      required: true,
      options: [o("Professional", "Professional"), o("General", "General")],
    }),
    F("service_category", "Kundi la Huduma", "Service Category", "select", {
      required: true,
      options: [
        o("Umeme", "Electrical"), o("Mabomba", "Plumbing"), o("Usafi", "Cleaning"),
        o("IT / Kompyuta", "IT"), o("Useremala", "Carpentry"), o("Upakaji Rangi", "Painting"),
        o("Ufundi Magari", "Auto Mechanic"), o("Usafiri / Usafirishaji", "Transport"),
        o("Urembo", "Beauty"), o("Elimu / Masomo", "Education / Tutoring"),
        o("Ujenzi", "Construction"), o("Nyingine", "Other"),
      ],
    }),
    F("service_category_other", "Taja Huduma", "Specify Service", "text", {
      required: true,
      showIf: { key: "service_category", value: "Nyingine" },
    }),
    F("experience", "Uzoefu", "Experience", "select", { required: true, options: EXPERIENCE_OPTIONS }),
    F("aina_bei", "Aina ya Bei", "Price Type", "select", {
      required: true,
      options: [
        o("Bei Maalum", "Fixed"),
        o("Inajadiliwa", "Negotiable"),
        o("Kwa Saa", "Per hour"),
        o("Kwa Siku", "Per day"),
        o("Omba Quote", "Request a quote"),
      ],
    }),
    F("availability", "Upatikanaji", "Availability", "select", {
      required: true,
      options: [o("Anapatikana", "Available"), o("Ana Shughuli", "Busy")],
    }),
  ],

  // ── Biashara zinazouzwa
  biashara: [
    F("aina", "Aina ya Biashara", "Business Type", "text", { required: true, placeholder: ph("mfano: Duka la vifaa vya ujenzi", "e.g. Hardware store") }),
    F("mapato", "Mapato ya Wastani (kwa mwezi)", "Average Monthly Revenue", "text", { placeholder: ph("TZS ...", "TZS ...") }),
    F("muda", "Muda Biashara Ikiwepo", "Business Age", "text", { placeholder: ph("mfano: miaka 4", "e.g. 4 years") }),
    F("leseni", "Ina Leseni / TIN?", "Licensed / TIN?", "select", { options: YES_NO }),
    F("ajira", "Idadi ya Wafanyakazi", "Number of Employees", "number", { min: 0 }),
    F("inajumuisha", "Bei Inajumuisha", "Sale Includes", "select", {
      options: [o("Stock na vifaa", "Stock and equipment"), o("Vifaa tu", "Equipment only"), o("Jina na wateja tu", "Name and clients only")],
    }),
    F("sababu", "Sababu ya Kuuza", "Reason for Selling", "text"),
  ],

  // ── Pikipiki
  pikipiki: [
    F("aina", "Aina", "Type", "select", {
      required: true,
      options: [o("Boda boda / Kawaida", "Standard / Commuter"), o("Sport", "Sport"), o("Scooter", "Scooter"), o("Bajaji / Guta", "Tricycle")],
    }),
    F("brand", "Brand", "Brand", "text", { required: true, suggestions: MOTO_BRANDS }),
    F("model", "Model", "Model", "text"),
    F("year", "Mwaka", "Year", "number", { min: 1980, max: thisYear + 1 }),
    F("cc", "Ukubwa wa Injini (cc)", "Engine Size (cc)", "number", { min: 0, placeholder: ph("mfano: 150", "e.g. 150") }),
    F("mileage", "Mileage (km)", "Mileage (km)", "number", { min: 0 }),
    F("hali", "Hali", "Condition", "select", { required: true, options: CONDITION_OPTIONS }),
    F("registered", "Imesajiliwa (Plate)?", "Registered?", "select", { options: YES_NO }),
  ],

  // ── Mabasi
  mabasi: [
    F("brand", "Brand", "Brand", "text", { required: true, suggestions: BUS_BRANDS }),
    F("model", "Model", "Model", "text"),
    F("year", "Mwaka", "Year", "number", { min: 1980, max: thisYear + 1 }),
    F("seats", "Idadi ya Viti", "Seats", "number", { required: true, min: 1 }),
    F("mafuta", "Aina ya Mafuta", "Fuel Type", "select", { options: FUEL_OPTIONS }),
    F("mileage", "Mileage (km)", "Mileage (km)", "number", { min: 0 }),
    F("hali", "Hali", "Condition", "select", { required: true, options: CONDITION_OPTIONS }),
    F("route_permit", "Ina Leseni ya Njia?", "Route Permit?", "select", { options: YES_NO }),
  ],

  // ── Samani
  samani: [
    F("aina", "Aina ya Samani", "Furniture Type", "text", { required: true, placeholder: ph("mfano: Sofa, Kitanda, Meza", "e.g. Sofa, Bed, Table") }),
    F("material", "Malighafi", "Material", "select", {
      options: [o("Mbao", "Wood"), o("Chuma", "Metal"), o("Kioo", "Glass"), o("Kitambaa / Ngozi", "Fabric / Leather"), o("Plastiki", "Plastic"), o("Nyingine", "Other")],
    }),
    F("idadi", "Idadi", "Quantity", "number", { min: 1, placeholder: ph("mfano: 1", "e.g. 1") }),
    F("hali", "Hali", "Condition", "select", { required: true, options: CONDITION_OPTIONS }),
  ],

  // ── Vifaa vya Elektroniki
  "vifaa-vya-elektroniki": [
    F("aina", "Aina ya Kifaa", "Device Type", "select", {
      required: true,
      options: [o("Simu", "Phone"), o("Kompyuta / Laptop", "Computer / Laptop"), o("TV", "TV"), o("Kamera", "Camera"), o("Audio / Spika", "Audio / Speakers"), o("Console / Games", "Console / Games"), o("Nyingine", "Other")],
    }),
    F("brand", "Brand", "Brand", "text", { required: true, suggestions: ELECTRONICS_BRANDS }),
    F("model", "Model", "Model", "text"),
    F("specs", "Specs (RAM/Storage/Inchi)", "Specs (RAM/Storage/Size)", "text", { placeholder: ph("mfano: 8GB / 256GB", "e.g. 8GB / 256GB") }),
    F("hali", "Hali", "Condition", "select", { required: true, options: CONDITION_OPTIONS }),
    F("dhamana", "Ina Dhamana (Warranty)?", "Warranty?", "select", { options: YES_NO }),
  ],

  // ── Mifugo
  mifugo: [
    F("aina", "Aina ya Mfugo", "Livestock Type", "select", {
      required: true,
      options: [o("Ng'ombe", "Cattle"), o("Mbuzi", "Goats"), o("Kondoo", "Sheep"), o("Kuku", "Chickens"), o("Nguruwe", "Pigs"), o("Bata / Batamzinga", "Ducks / Turkeys"), o("Nyingine", "Other")],
    }),
    F("idadi", "Idadi", "Quantity", "number", { required: true, min: 1 }),
    F("kuzaliana", "Kuzaliana (Breed)", "Breed", "text", { placeholder: ph("mfano: Friesian, Boer", "e.g. Friesian, Boer") }),
    F("jinsia", "Jinsia", "Sex", "select", { options: [o("Dume", "Male"), o("Jike", "Female"), o("Mchanganyiko", "Mixed")] }),
    F("umri", "Umri", "Age", "text", { placeholder: ph("mfano: miezi 8", "e.g. 8 months") }),
    F("chanjo", "Wamechanjwa?", "Vaccinated?", "select", { options: YES_NO }),
  ],

  // ── Vifaa vya Nyumbani
  "vifaa-vya-nyumbani": [
    F("aina", "Aina ya Kifaa", "Appliance Type", "text", { required: true, placeholder: ph("mfano: Friji, Jiko, Mashine ya kufulia", "e.g. Fridge, Cooker, Washing machine") }),
    F("brand", "Brand", "Brand", "text", { suggestions: ELECTRONICS_BRANDS }),
    F("model", "Model", "Model", "text"),
    F("hali", "Hali", "Condition", "select", { required: true, options: CONDITION_OPTIONS }),
    F("dhamana", "Ina Dhamana (Warranty)?", "Warranty?", "select", { options: YES_NO }),
  ],

  // ── Fashion
  fashion: [
    F("aina", "Aina ya Bidhaa", "Item Type", "select", {
      required: true,
      options: [o("Nguo", "Clothes"), o("Viatu", "Shoes"), o("Mikoba", "Bags"), o("Saa", "Watches"), o("Vito / Urembo", "Jewellery / Accessories"), o("Nyingine", "Other")],
    }),
    F("kwa", "Kwa Ajili ya", "For", "select", {
      options: [o("Wanaume", "Men"), o("Wanawake", "Women"), o("Watoto", "Kids"), o("Unisex", "Unisex")],
    }),
    F("brand", "Brand", "Brand", "text"),
    F("saizi", "Saizi", "Size", "text", { placeholder: ph("mfano: 42 / L", "e.g. 42 / L") }),
    F("rangi", "Rangi", "Colour", "text"),
    F("hali", "Hali", "Condition", "select", { required: true, options: CONDITION_OPTIONS }),
  ],

  // ── Mali Nyinginezo
  "mali-nyinginezo": [
    F("aina", "Aina ya Bidhaa", "Item Type", "text", { required: true, placeholder: ph("mfano: Vifaa vya michezo", "e.g. Sports equipment") }),
    F("brand", "Brand (kama ipo)", "Brand (if any)", "text"),
    F("hali", "Hali", "Condition", "select", { required: true, options: CONDITION_OPTIONS }),
  ],

  // Jobs: fields ziko ndani ya modes (tazama POSTING_CONFIG.jobs)
  jobs: [],
};

// ============================================================
// POSTING_CONFIG — mipangilio ya fomu kwa kategoria
// ============================================================
const DEFAULT_PRICE_LABEL = { sw: "Bei (TZS)", en: "Price (TZS)" };

export const POSTING_CONFIG = {
  magari: {
    titlePlaceholder: ph("Tutaijaza kutoka Brand + Model + Mwaka kama utaacha wazi", "Auto-filled from Brand + Model + Year if left empty"),
    autoTitle: (e) => [e.brand, e.model, e.year].filter(Boolean).join(" "),
  },
  nyumba: {
    titlePlaceholder: ph("mfano: Nyumba ya vyumba 3 Mbezi Beach", "e.g. 3-bedroom house in Mbezi Beach"),
    priceRules: [
      { when: { key: "lengo", value: "Kupangisha" }, label: { sw: "Kodi (TZS kwa mwezi)", en: "Rent (TZS per month)" } },
    ],
  },
  viwanja: {
    titlePlaceholder: ph("mfano: Kiwanja cha makazi Kigamboni", "e.g. Residential plot in Kigamboni"),
  },
  mashine: {
    titlePlaceholder: ph("Tutaijaza kutoka Aina + Brand + Model kama utaacha wazi", "Auto-filled from Type + Brand + Model if left empty"),
    autoTitle: (e) => [e.aina, e.brand, e.model].filter(Boolean).join(" "),
  },
  "vifaa-vizito": {
    autoTitle: (e) => [e.aina, e.brand, e.model].filter(Boolean).join(" "),
  },
  pikipiki: {
    autoTitle: (e) => [e.brand, e.model, e.year].filter(Boolean).join(" "),
  },
  mabasi: {
    autoTitle: (e) => [e.brand, e.model, e.year].filter(Boolean).join(" "),
  },
  huduma: {
    titleLabel: { sw: "Jina la Huduma", en: "Service Title" },
    titlePlaceholder: ph("mfano: Fundi umeme wa nyumba na ofisi", "e.g. Home & office electrician"),
    priceRules: [
      { when: { key: "aina_bei", value: "Kwa Saa" }, label: { sw: "Bei kwa Saa (TZS)", en: "Price per Hour (TZS)" } },
      { when: { key: "aina_bei", value: "Kwa Siku" }, label: { sw: "Bei kwa Siku (TZS)", en: "Price per Day (TZS)" } },
      { when: { key: "aina_bei", value: "Inajadiliwa" }, label: { sw: "Bei ya Kuanzia (TZS)", en: "Starting Price (TZS)" } },
    ],
    priceOptionalWhen: { key: "aina_bei", value: "Omba Quote" },
    photosOptional: true,
    locationLabel: { sw: "Eneo la Huduma", en: "Service Location" },
  },

  jobs: {
    photosOptional: true,
    modes: [
      {
        key: "seek",
        label: { sw: "Tafuta Kazi", en: "Find a Job" },
        desc: { sw: "Mimi ninatafuta ajira", en: "I'm looking for a job" },
        titleLabel: { sw: "Kazi Unayotafuta", en: "Job You're Looking For" },
        titlePlaceholder: ph("mfano: Mhasibu, Dereva, Mhudumu", "e.g. Accountant, Driver, Waiter"),
        priceLabel: { sw: "Mshahara Unaotarajia (TZS kwa mwezi)", en: "Expected Salary (TZS per month)" },
        priceOptional: true,
        locationLabel: { sw: "Eneo Unalotaka Kufanya Kazi", en: "Preferred Work Location" },
        descLabel: { sw: "Maelezo Mafupi Kukuhusu", en: "Short Bio" },
        extra: [
          F("ngazi", "Professional / Non-Professional", "Professional / Non-Professional", "select", { required: true, options: PROFESSIONAL_OPTIONS }),
          F("experience", "Uzoefu", "Experience", "select", { required: true, options: EXPERIENCE_OPTIONS }),
        ],
      },
      {
        key: "hire",
        label: { sw: "Tangaza Kazi", en: "Post a Job" },
        desc: { sw: "Ninahitaji kuajiri", en: "I'm hiring" },
        titleLabel: { sw: "Nafasi ya Kazi", en: "Job Position" },
        titlePlaceholder: ph("mfano: Mhasibu Msaidizi", "e.g. Assistant Accountant"),
        priceLabel: { sw: "Mshahara (TZS kwa mwezi)", en: "Salary (TZS per month)" },
        priceOptional: true,
        locationLabel: { sw: "Eneo la Kazi", en: "Work Location" },
        descLabel: { sw: "Maelezo Mafupi ya Kazi", en: "Short Job Description" },
        extra: [
          F("kampuni", "Kampuni / Mwajiri", "Company / Employer", "text", { placeholder: ph("mfano: ABC Limited", "e.g. ABC Limited") }),
          F("ngazi", "Professional / Non-Professional", "Professional / Non-Professional", "select", { required: true, options: PROFESSIONAL_OPTIONS }),
          F("sifa", "Qualifications (Sifa zinazohitajika)", "Qualifications", "textarea", { required: true, placeholder: ph("mfano: Shahada ya Uhasibu, CPA", "e.g. Degree in Accounting, CPA") }),
          F("experience", "Uzoefu Unaohitajika", "Experience Required", "select", { required: true, options: EXPERIENCE_OPTIONS }),
          F("deadline", "Mwisho wa Kuomba (Deadline)", "Application Deadline", "date", { required: true }),
        ],
      },
    ],
  },
};

export function getPostingConfig(key) {
  return POSTING_CONFIG[key] || {};
}

/** Fields zinazoonekana sasa (kulingana na mode na showIf). */
export function getVisibleFields(baseExtra, cfg, modeKey, values) {
  const mode = cfg?.modes?.find((m) => m.key === modeKey);
  const fields = mode ? mode.extra : baseExtra || [];
  return fields.filter(
    (f) => !f.showIf || String(values[f.showIf.key] || "") === f.showIf.value
  );
}

/** Label ya bei + je bei ni hiari? */
export function getPriceMeta(cfg, modeKey, values) {
  const mode = cfg?.modes?.find((m) => m.key === modeKey);
  let label = mode?.priceLabel || cfg?.priceLabel || DEFAULT_PRICE_LABEL;
  for (const r of cfg?.priceRules || []) {
    if (String(values[r.when.key] || "") === r.when.value) label = r.label;
  }
  const w = cfg?.priceOptionalWhen;
  const optional =
    Boolean(mode?.priceOptional || cfg?.priceOptional) ||
    Boolean(w && String(values[w.key] || "") === w.value);
  return { label, optional };
}
