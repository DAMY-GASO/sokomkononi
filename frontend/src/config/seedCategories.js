// ============================================================
// seedCategories.js
// Categories za awali za SokoMkononi (11).
//
// Hii ni file TOFAUTI na categoriesStore.js kwa sababu:
//   1. Store inabaki safi — haina data ya kubuni.
//   2. Backend halisi ikiwepo, store itapata categories kutoka API.
//   3. Kama unataka kubadilisha categories za awali, unabadilisha
//      file hii moja tu.
//
// Kutumia: ita initializeCategories(SEED_CATEGORIES) kwenye App.jsx
// MARA MOJA tu (kama getCategories().length === 0).
//
// Kila category ina:
//   key, imageUrl, label { sw, en }, description { sw, en },
//   iconKey, isPopular, active, extra[]
//
// extra[] ina fields zenye:
//   key, label { sw, en }, type, placeholder { sw, en },
//   options[] (kwa type === "select")
// ============================================================

// ============================================================
// OPTIONS ZENYE BILINGUAL — reusable
// ============================================================
const TITLE_STATUS_OPTIONS = [
  { value: "Hati Miliki", label: { sw: "Hati Miliki", en: "Freehold Title" } },
  { value: "Hati ya Kimila", label: { sw: "Hati ya Kimila", en: "Customary Title" } },
  { value: "Inasubiri Hati", label: { sw: "Inasubiri Hati", en: "Title Pending" } },
  { value: "Hakuna Hati", label: { sw: "Hakuna Hati", en: "No Title" } },
];

const LAND_USE_OPTIONS = [
  { value: "Makazi", label: { sw: "Makazi", en: "Residential" } },
  { value: "Makazi na Biashara", label: { sw: "Makazi na Biashara", en: "Residential and Commercial" } },
  { value: "Kilimo", label: { sw: "Kilimo", en: "Agricultural" } },
  { value: "Biashara", label: { sw: "Biashara", en: "Commercial" } },
  { value: "Viwanda", label: { sw: "Viwanda", en: "Industrial" } },
];

const TRANSMISSION_OPTIONS = [
  { value: "Automatic", label: { sw: "Automatic", en: "Automatic" } },
  { value: "Manual", label: { sw: "Manual", en: "Manual" } },
];

const FUEL_OPTIONS = [
  { value: "Petrol", label: { sw: "Petrol", en: "Petrol" } },
  { value: "Diesel", label: { sw: "Diesel", en: "Diesel" } },
  { value: "Hybrid", label: { sw: "Hybrid", en: "Hybrid" } },
  { value: "Umeme (EV)", label: { sw: "Umeme (EV)", en: "Electric (EV)" } },
];

const CONDITION_OPTIONS = [
  { value: "Mpya", label: { sw: "Mpya", en: "New" } },
  { value: "Nzuri Sana", label: { sw: "Nzuri Sana", en: "Excellent" } },
  { value: "Nzuri", label: { sw: "Nzuri", en: "Good" } },
  {
    value: "Inahitaji Matengenezo",
    label: { sw: "Inahitaji Matengenezo", en: "Needs Repair" },
  },
];

// ============================================================
// SEED_CATEGORIES (11) — bilingual kamili
// ============================================================
export const SEED_CATEGORIES = [
  // 1. NYUMBA
  {
    key: "nyumba",
    imageUrl: null,
    label: { sw: "Nyumba & Majengo", en: "Houses & Buildings" },
    description: {
      sw: "Pata nyumba, apartments, na majengo yote Tanzania",
      en: "Find houses, apartments, and buildings across Tanzania",
    },
    iconKey: "Home",
    isPopular: true,
    active: true,
    extra: [
      {
        key: "vyumba",
        label: { sw: "Vyumba vya kulala", en: "Bedrooms" },
        type: "number",
        placeholder: { sw: "mfano: 3", en: "e.g. 3" },
      },
      {
        key: "bafu",
        label: { sw: "Bafu", en: "Bathrooms" },
        type: "number",
        placeholder: { sw: "mfano: 2", en: "e.g. 2" },
      },
      {
        key: "ukubwa",
        label: { sw: "Ukubwa (sqm)", en: "Size (sqm)" },
        type: "text",
        placeholder: { sw: "mfano: 250 sqm", en: "e.g. 250 sqm" },
      },
      {
        key: "title",
        label: { sw: "Hati (Title Status)", en: "Title Status" },
        type: "select",
        options: TITLE_STATUS_OPTIONS,
      },
    ],
  },

  // 2. VIWANJA
  {
    key: "viwanja",
    imageUrl: null,
    label: { sw: "Viwanja & Mashamba", en: "Plots & Land" },
    description: {
      sw: "Viwanja vya makazi, kilimo, na biashara",
      en: "Residential, agricultural, and commercial plots",
    },
    iconKey: "Trees",
    isPopular: true,
    active: true,
    extra: [
      {
        key: "ukubwa",
        label: { sw: "Ukubwa wa Eneo", en: "Plot Size" },
        type: "text",
        placeholder: { sw: "mfano: nusu ekari", en: "e.g. half acre" },
      },
      {
        key: "title",
        label: { sw: "Hati / Title Status", en: "Title Status" },
        type: "select",
        options: TITLE_STATUS_OPTIONS,
      },
      {
        key: "matumizi",
        label: { sw: "Matumizi ya Ardhi", en: "Land Use" },
        type: "select",
        options: LAND_USE_OPTIONS,
      },
    ],
  },

  // 3. MAGARI
  {
    key: "magari",
    imageUrl: null,
    label: { sw: "Magari", en: "Cars" },
    description: {
      sw: "Magari mapya na yaliyotumika Tanzania",
      en: "New and used cars in Tanzania",
    },
    iconKey: "Car",
    isPopular: true,
    active: true,
    extra: [
      {
        key: "make_model",
        label: { sw: "Make / Model / Mwaka", en: "Make / Model / Year" },
        type: "text",
        placeholder: { sw: "mfano: Toyota Harrier 2016", en: "e.g. Toyota Harrier 2016" },
      },
      {
        key: "mileage",
        label: { sw: "Mileage (km)", en: "Mileage (km)" },
        type: "number",
        placeholder: { sw: "mfano: 85000", en: "e.g. 85000" },
      },
      {
        key: "transmission",
        label: { sw: "Transmission", en: "Transmission" },
        type: "select",
        options: TRANSMISSION_OPTIONS,
      },
      {
        key: "mafuta",
        label: { sw: "Aina ya Mafuta", en: "Fuel Type" },
        type: "select",
        options: FUEL_OPTIONS,
      },
    ],
  },

  // 4. BIASHARA
  {
    key: "biashara",
    imageUrl: null,
    label: { sw: "Biashara Zinazouzwa", en: "Businesses for Sale" },
    description: {
      sw: "Biashara zinazouzwa - maduka, migahawa, n.k.",
      en: "Businesses for sale - shops, restaurants, etc.",
    },
    iconKey: "Briefcase",
    isPopular: true,
    active: true,
    extra: [
      {
        key: "aina",
        label: { sw: "Aina ya Biashara", en: "Business Type" },
        type: "text",
        placeholder: { sw: "mfano: Duka la vifaa vya ujenzi", en: "e.g. Hardware store" },
      },
      {
        key: "mapato",
        label: { sw: "Mapato ya Wastani (kwa mwezi)", en: "Average Monthly Revenue" },
        type: "text",
        placeholder: { sw: "TZS ...", en: "TZS ..." },
      },
      {
        key: "muda",
        label: { sw: "Muda Biashara Ikiwepo", en: "Business Age" },
        type: "text",
        placeholder: { sw: "mfano: miaka 4", en: "e.g. 4 years" },
      },
    ],
  },

  // 5. MASHINE
  {
    key: "mashine",
    imageUrl: null,
    label: { sw: "Mashine / Heavy Equipment", en: "Machinery / Heavy Equipment" },
    description: {
      sw: "Mashine za ujenzi, kilimo, na viwanda",
      en: "Construction, agricultural, and industrial machinery",
    },
    iconKey: "Wrench",
    isPopular: true,
    active: true,
    extra: [
      {
        key: "aina",
        label: { sw: "Aina ya Mashine", en: "Machine Type" },
        type: "text",
        placeholder: { sw: "mfano: Excavator", en: "e.g. Excavator" },
      },
      {
        key: "hours",
        label: { sw: "Saa za Matumizi", en: "Usage Hours" },
        type: "number",
        placeholder: { sw: "mfano: 3200", en: "e.g. 3200" },
      },
      {
        key: "hali",
        label: { sw: "Hali", en: "Condition" },
        type: "select",
        options: CONDITION_OPTIONS,
      },
    ],
  },

  // 6. PIKIPIKI
  {
    key: "pikipiki",
    imageUrl: null,
    label: { sw: "Pikipiki", en: "Motorcycles" },
    description: {
      sw: "Pikipiki za aina zote Tanzania",
      en: "All types of motorcycles in Tanzania",
    },
    iconKey: "Bike",
    isPopular: true,
    active: true,
    extra: [],
  },

  // 7. MABASI
  {
    key: "mabasi",
    imageUrl: null,
    label: { sw: "Mabasi", en: "Buses" },
    description: {
      sw: "Mabasi ya abiria na mizigo",
      en: "Passenger and cargo buses",
    },
    iconKey: "Bus",
    isPopular: true,
    active: true,
    extra: [],
  },

  // 8. SAMANI
  {
    key: "samani",
    imageUrl: null,
    label: { sw: "Samani", en: "Furniture" },
    description: {
      sw: "Samani za nyumbani na ofisi",
      en: "Home and office furniture",
    },
    iconKey: "Sofa",
    isPopular: true,
    active: true,
    extra: [],
  },

  // 9. VIFAA VYA ELEKTRONIKI
  {
    key: "vifaa-vya-elektroniki",
    imageUrl: null,
    label: { sw: "Vifaa vya Elektroniki", en: "Electronics" },
    description: {
      sw: "Simu, kompyuta, TV na vifaa vingine vya elektroniki",
      en: "Phones, computers, TVs and other electronics",
    },
    iconKey: "Tv",
    isPopular: true,
    active: true,
    extra: [],
  },

  // 10. MIFUGO
  {
    key: "mifugo",
    imageUrl: null,
    label: { sw: "Mifugo", en: "Livestock" },
    description: {
      sw: "Ng'ombe, mbuzi, kuku na mifugo mingine",
      en: "Cows, goats, chickens and other livestock",
    },
    iconKey: "PawPrint",
    isPopular: true,
    active: true,
    extra: [],
  },

  // 11. VIFAA VYA NYUMBANI
  {
    key: "vifaa-vya-nyumbani",
    imageUrl: null,
    label: { sw: "Vifaa vya Nyumbani", en: "Home Appliances" },
    description: {
      sw: "Friji, jiko, mashine za kufulia na vifaa vingine",
      en: "Fridges, stoves, washing machines and other appliances",
    },
    iconKey: "Refrigerator",
    isPopular: true,
    active: true,
    extra: [],
  },
];
