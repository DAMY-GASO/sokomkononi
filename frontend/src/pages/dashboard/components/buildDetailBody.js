// ============================================================
// buildDetailBody.js  (v2 — imeandikwa kulingana na listings/models.py)
//
// Mabadiliko makuu:
//  - Hakuna tena kunakili attributes zote kama zilivyo. Kila field ya model
//    inajazwa kwa mapping ya wazi (dhamana: DRF BooleanField ilikataa "Ndio").
//  - Booleans: "Ndio"/"Hapana" -> true/false.
//  - Required fields za model (property_type, land_type, vehicle_type,
//    fuel_type, condition...) zinashughulikiwa; kama hazipo, warning inatoka.
//  - Inakubali keys za FIELD_LIBRARY (aina_nyumba, aina_gari, aina_mashine,
//    aina_biashara, umeme_ardhi, maji_ardhi...) pamoja na za seed (aina...).
//  - Hakuna import ya categorySchemas (check ya `visibleFields` haikuwahi
//    kufanya kazi — POSTING_CONFIG haina field hiyo).
//
// Attributes ambazo si sehemu ya model hubaki kwenye `Listing.attributes`
// (JSON) — zinahifadhiwa na create-with-images, si hapa.
// ============================================================

const DETAIL_ENDPOINTS = {
  nyumba: "property-details",
  viwanja: "land-details",
  magari: "vehicle-details",
  biashara: "business-details",
  mashine: "equipment-details",
};

// ── Enum maps (thamani za fomu -> Django TextChoices) ────────
const PROPERTY_TYPE_MAP = {
  "Nyumba ya Kawaida": "HOUSE",
  "Villa": "HOUSE",
  "Townhouse": "HOUSE",
  "Apartment": "APARTMENT",
  "Studio / Chumba": "APARTMENT",
  "Ofisi": "OFFICE",
  "Duka": "SHOP",
  "Fremu / Duka": "SHOP",
  "Ghala": "WAREHOUSE",
  "Godown / Ghala": "WAREHOUSE",
  "Hoteli": "HOTEL",
};

const LAND_TYPE_BY_USE = {
  "Makazi": "RESIDENTIAL",
  "Makazi na Biashara": "PLOT",
  "Kilimo": "AGRICULTURAL",
  "Biashara": "COMMERCIAL",
  "Viwanda": "OTHER",
};
const LAND_TYPE_LEGACY = {
  "Kiwanja": "PLOT",
  "Shamba": "FARM",
  "Ardhi ya Kilimo": "AGRICULTURAL",
  "Ardhi ya Biashara": "COMMERCIAL",
  "Ardhi ya Makazi": "RESIDENTIAL",
};
const SIZE_UNIT_MAP = { "Sqm": "SQM", "Ekari": "ACRE", "Hekta": "HECTARE" };

const VEHICLE_TYPE_MAP = {
  // body types (FIELD_LIBRARY.aina_gari)
  "Sedan": "CAR",
  "Hatchback": "CAR",
  "Station Wagon": "CAR",
  "Coupe": "CAR",
  "SUV": "SUV",
  "Pickup / Double Cabin": "PICKUP",
  "Van / Noah / Hiace": "VAN",
  "Lori / Truck": "TRUCK",
  // legacy
  "Gari": "CAR",
  "Pickup": "PICKUP",
  "Van": "VAN",
  "Lori": "TRUCK",
  "Basi": "BUS",
  "Pikipiki": "MOTORCYCLE",
  "Nyingine": "OTHER",
};
const FUEL_MAP = {
  "Petrol": "PETROL",
  "Diesel": "DIESEL",
  "Hybrid": "HYBRID",
  "Umeme (EV)": "ELECTRIC",
  "Gesi (CNG/LPG)": "OTHER",
};
const TRANSMISSION_MAP = {
  "Automatic": "AUTOMATIC",
  "Manual": "MANUAL",
  "Semi-Automatic": "SEMI_AUTOMATIC",
};

const EQUIPMENT_CONDITION_MAP = {
  "Mpya": "NEW",
  "Nzuri Sana": "USED",
  "Nzuri": "USED",
  "Inahitaji Matengenezo": "USED",
  "Imetumika": "USED",
  "Imerekebishwa": "REFURBISHED",
  "Imerekebishwa (Refurbished)": "REFURBISHED",
};

// ── Helpers ──────────────────────────────────────────────────
const isEmpty = (v) => v === undefined || v === null || String(v).trim() === "";

/** Thamani ya kwanza isiyo tupu kutoka kwa keys zilizotajwa. */
const pick = (obj, ...keys) => {
  for (const k of keys) if (!isEmpty(obj?.[k])) return obj[k];
  return undefined;
};

const str = (v) => (isEmpty(v) ? undefined : String(v).trim());

/** "85,000" / "85000 km" -> 85000 */
const num = (v) => {
  if (isEmpty(v)) return undefined;
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

const firstNum = (v) => {
  const m = String(v ?? "").match(/\d+(?:[.,]\d+)?/);
  return m ? Number(m[0].replace(",", ".")) : undefined;
};

/** "Ndio"/"Yes" -> true, "Hapana"/"No" -> false, vinginevyo undefined. */
const yn = (v) => {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "ndio" || s === "yes") return true;
  if (s === "hapana" || s === "no") return false;
  return undefined;
};

/** "miaka 4" -> 4, "miezi 18" -> 1 */
const parseYears = (v) => {
  const n = firstNum(v);
  if (n === undefined) return undefined;
  return /miezi|month/i.test(String(v)) ? Math.floor(n / 12) : Math.round(n);
};

/** "1800cc" -> 1800, "2.0L" -> 2000, "1800" -> 1800 */
const parseCc = (v) => {
  const n = firstNum(v);
  if (n === undefined) return undefined;
  if (/cc/i.test(String(v))) return Math.round(n);
  return n < 20 ? Math.round(n * 1000) : Math.round(n);
};

const put = (body, key, value) => {
  if (value !== undefined) body[key] = value;
};

/**
 * Tengeneza detail body kwa `POST|PATCH /listings/{id}/{endpoint}/`.
 * @returns {{ body: object|null, endpoint: string|null, warnings: Array }}
 */
export function buildDetailBody({
  categoryKey,
  attributes = {},
  location,
}) {
  const warnings = [];
  const warn = (code, message) => warnings.push({ code, message });
  const endpoint = DETAIL_ENDPOINTS[categoryKey] || null;

  if (!endpoint) {
    warn("NO_ENDPOINT", `Category "${categoryKey}" haina detail endpoint — detail haitawasilishwa.`);
    return { body: null, endpoint: null, warnings };
  }

  const a = attributes || {};
  const body = {};

  // ─────────────── NYUMBA -> PropertyDetails ───────────────
  if (categoryKey === "nyumba") {
    const aina = str(pick(a, "aina_nyumba", "aina"));
    const mapped = aina ? PROPERTY_TYPE_MAP[aina] : undefined;
    if (mapped) {
      body.property_type = mapped;
    } else {
      body.property_type = "OTHER"; // required kwenye model
      warn("DEFAULTED_PROPERTY_TYPE", `Aina "${aina ?? "(haipo)"}" haina mapping — property_type = OTHER.`);
    }

    put(body, "bedrooms", num(a.vyumba));
    put(body, "bathrooms", num(a.bafu));
    put(body, "area_sqm", num(a.ukubwa_nyumba ?? a.ukubwa) !== undefined
      ? String(num(a.ukubwa_nyumba ?? a.ukubwa)) : undefined);
    put(body, "furnished", a.furnished === undefined ? undefined : yn(a.furnished) === true);

    if (!isEmpty(a.parking)) body.has_parking = a.parking !== "Hakuna";
    if (!isEmpty(a.maji)) body.has_water = a.maji !== "Hakuna";
    if (!isEmpty(a.umeme)) body.has_electricity = a.umeme !== "Hakuna";
    put(body, "ownership_document", str(a.title));

  // ─────────────── VIWANJA -> LandDetails ───────────────
  } else if (categoryKey === "viwanja") {
    const use = str(a.matumizi);
    const legacy = str(a.aina);
    const landType =
      (use && LAND_TYPE_BY_USE[use]) || (legacy && LAND_TYPE_LEGACY[legacy]);
    if (landType) {
      body.land_type = landType;
    } else {
      body.land_type = "OTHER"; // required
      warn("DEFAULTED_LAND_TYPE", `Matumizi "${use ?? "(hayapo)"}" hayana mapping — land_type = OTHER.`);
    }

    const size = num(a.ukubwa);
    if (size !== undefined) body.size = String(size);
    else warn("REQUIRED_MISSING", "Ukubwa (size) unahitajika na LandDetails.");

    const unit = SIZE_UNIT_MAP[str(a.kipimo)];
    if (unit) body.size_unit = unit;
    else warn("REQUIRED_MISSING", `Kipimo "${a.kipimo ?? ""}" hakina mapping — size_unit unahitajika.`);

    if (location?.mkoa) body.region = location.mkoa;
    else warn("REQUIRED_MISSING", "Mkoa (region) unahitajika na LandDetails.");
    put(body, "district", str(location?.wilaya));
    put(body, "village_or_street", str(location?.eneo));

    put(body, "title_document", str(a.title));
    put(body, "surveyed", a.surveyed === undefined ? undefined : yn(a.surveyed) === true);

    if (!isEmpty(a.barabara)) body.road_access = a.barabara !== "Hakuna barabara";
    const elec = pick(a, "umeme_ardhi", "umeme");
    if (elec !== undefined) body.electricity_nearby = elec === "Upo" || elec === "Karibu";
    const water = pick(a, "maji_ardhi", "maji");
    if (water !== undefined) body.water_nearby = water === "Yapo" || water === "Karibu";

  // ─────────────── MAGARI -> VehicleDetails ───────────────
  } else if (categoryKey === "magari") {
    const make = str(a.brand);
    if (make) body.make = make;
    else warn("REQUIRED_MISSING", "Brand (make) inahitajika na VehicleDetails.");
    const model = str(a.model);
    if (model) body.model = model;
    else warn("REQUIRED_MISSING", "Model inahitajika na VehicleDetails.");

    put(body, "year", num(a.year));

    const bodyType = str(pick(a, "aina_gari", "aina"));
    const vt = bodyType ? VEHICLE_TYPE_MAP[bodyType] : undefined;
    if (vt) {
      body.vehicle_type = vt;
    } else {
      body.vehicle_type = "CAR"; // fomu ya seed haina field ya body type
      warn("DEFAULTED_VEHICLE_TYPE", `Aina ya gari haikutajwa/haina mapping — vehicle_type = CAR.`);
    }

    const fuel = FUEL_MAP[str(a.mafuta)];
    if (fuel) {
      body.fuel_type = fuel;
    } else {
      body.fuel_type = "OTHER"; // required
      warn("DEFAULTED_FUEL", `Mafuta "${a.mafuta ?? "(hayapo)"}" hayana mapping — fuel_type = OTHER.`);
    }

    const tr = TRANSMISSION_MAP[str(a.transmission)];
    if (tr) body.transmission = tr;
    else warn("REQUIRED_MISSING", `Transmission "${a.transmission ?? ""}" haina mapping — inahitajika na VehicleDetails.`);

    put(body, "mileage_km", num(a.mileage));
    put(body, "engine_capacity_cc", a.cc !== undefined && !isEmpty(a.cc) ? num(a.cc) : parseCc(a.engine));
    put(body, "color", str(a.rangi));
    put(body, "seats", num(a.seats));
    put(body, "registration_number", str(a.plate_namba));
    put(body, "has_valid_insurance", yn(a.kodi_bima));

  // ─────────────── BIASHARA -> BusinessDetails ───────────────
  } else if (categoryKey === "biashara") {
    const type = str(pick(a, "aina_biashara", "aina"));
    if (type) body.business_type = type;
    else warn("REQUIRED_MISSING", "Aina ya biashara inahitajika na BusinessDetails.");

    put(body, "years_operating", parseYears(pick(a, "muda_biashara", "muda")));
    put(body, "number_of_employees", num(a.ajira));
    const rev = num(a.mapato);
    if (rev !== undefined) body.monthly_revenue = String(rev);

    // Fomu ina swali moja "Leseni / TIN?" -> inajaza leseni pekee
    put(body, "has_business_license", yn(a.leseni));

    if (!isEmpty(a.inajumuisha)) {
      body.stock_included = a.inajumuisha === "Stock na vifaa";
    }
    put(body, "reason_for_sale", str(pick(a, "sababu", "sababu_kuuza")));

  // ─────────────── MASHINE -> EquipmentDetails ───────────────
  } else if (categoryKey === "mashine") {
    const type = str(pick(a, "aina_mashine", "aina"));
    if (type) body.equipment_type = type;
    else warn("REQUIRED_MISSING", "Aina ya mashine inahitajika na EquipmentDetails.");

    put(body, "manufacturer", str(a.brand));
    put(body, "model", str(a.model));
    put(body, "year", num(a.year));
    put(body, "operating_hours", num(a.hours));
    put(body, "weight_kg", num(a.uzito) !== undefined ? String(num(a.uzito)) : undefined);
    put(body, "country_of_origin", str(a.nchi_asili));

    const cond = EQUIPMENT_CONDITION_MAP[str(pick(a, "hali", "hali_mpya_used"))];
    if (cond) body.condition = cond;
    else warn("REQUIRED_MISSING", `Hali "${a.hali ?? ""}" haina mapping — condition inahitajika na EquipmentDetails.`);
  }

  return { body, endpoint, warnings };
}

export default buildDetailBody;