// ============================================================
// buildDetailBody.js
// Ondoa hardcodes (W1). Tumia mapping za wazi, na ONYESHA warnings
// pale data inapokosekana (badala ya kuweka default kimya).
// ============================================================

// ⚠️ Hakikisha path ya categorySchemas ni sahihi
import { getPostingConfig } from "../../../config/categorySchemas.js";

/**
 * Endpoint za detail kwa kila category key.
 */
const DETAIL_ENDPOINTS = {
  nyumba: "property-details",
  viwanja: "land-details",
  magari: "vehicle-details",
  biashara: "business-details",
  mashine: "equipment-details",
};

/**
 * Mapping za lebo → enum (Django TextChoices).
 * Zinatumika TU kama field lipo kwenye schema.
 * Lebo zikibadilika kwenye categorySchemas, hizi zinahitaji kubadilishwa pia
 * (tutaonyesha warning kama hakuna mapping inayolingana).
 */
const PROPERTY_TYPE_MAP = {
  "Nyumba ya Kawaida": "HOUSE",
  "Apartment": "APARTMENT",
  "Ofisi": "OFFICE",
  "Duka": "SHOP",
  "Ghala": "WAREHOUSE",
  "Hoteli": "HOTEL",
};

const LAND_TYPE_MAP = {
  "Kiwanja": "PLOT",
  "Shamba": "FARM",
  "Ardhi ya Kilimo": "AGRICULTURAL",
  "Ardhi ya Biashara": "COMMERCIAL",
  "Ardhi ya Makazi": "RESIDENTIAL",
};

const VEHICLE_TYPE_MAP = {
  "Gari": "CAR",
  "SUV": "SUV",
  "Pickup": "PICKUP",
  "Van": "VAN",
  "Lori": "TRUCK",
  "Basi": "BUS",
  "Pikipiki": "MOTORCYCLE",
};

const FUEL_MAP = {
  "Petrol": "PETROL",
  "Diesel": "DIESEL",
  "Hybrid": "HYBRID",
  "Umeme (EV)": "ELECTRIC",
};

const SIZE_UNIT_MAP = {
  "Sqm": "SQM",
  "Ekari": "ACRE",
  "Hekta": "HECTARE",
};

const CONDITION_MAP = {
  "Mpya": "NEW",
  "Imetumika": "USED",
  "Imerekebishwa": "REFURBISHED",
};

/**
 * Tengeneza detail body kwa ajili ya `POST /listings/{id}/{endpoint}/`.
 *
 * @returns {{ body: object|null, endpoint: string|null, warnings: Array }}
 */
export function buildDetailBody({
  categoryKey,
  attributes = {},
  location,
  addressText,
  latitude,
  longitude,
  price,
  title,
}) {
  const warnings = [];
  const endpoint = DETAIL_ENDPOINTS[categoryKey] || null;

  if (!endpoint) {
    warnings.push({
      code: "NO_ENDPOINT",
      message: `Category "${categoryKey}" haina detail endpoint — detail haitawasilishwa.`,
    });
    return { body: null, endpoint: null, warnings };
  }

  const cfg = getPostingConfig?.(categoryKey) || {};
  const visibleFields = Array.isArray(cfg.visibleFields) ? cfg.visibleFields : [];
  const schemaFieldKeys = new Set(
    visibleFields.map((f) => f.key || f.name || f.id).filter(Boolean)
  );

  // Common fields (zote zinaenda kwenye detail body)
  const body = {
    price: price ?? null,
    title: title ?? "",
  };

  // Ongeza fields zote zilizo kwenye attributes NA schema
  Object.entries(attributes || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (schemaFieldKeys.size > 0 && !schemaFieldKeys.has(k)) {
      warnings.push({
        code: "UNKNOWN_FIELD",
        message: `Field "${k}" haipo kwenye schema ya "${categoryKey}" — imerukwa.`,
      });
      return;
    }
    body[k] = v;
  });

  // ── Category-specific mapping ──────────────────────────────
  if (categoryKey === "nyumba") {
    if (attributes.vyumba) body.bedrooms = Number(attributes.vyumba);
    if (attributes.bafu) body.bathrooms = Number(attributes.bafu);
    if (attributes.ukubwa) body.area_sqm = String(attributes.ukubwa);

    if (attributes.aina) {
      const mapped = PROPERTY_TYPE_MAP[attributes.aina];
      if (mapped) {
        body.property_type = mapped;
      } else {
        warnings.push({
          code: "UNMAPPED_PROPERTY_TYPE",
          message: `Aina "${attributes.aina}" haipo kwenye PROPERTY_TYPE_MAP — property_type haitawasilishwa.`,
        });
      }
    }
  } else if (categoryKey === "viwanja") {
    if (attributes.ukubwa) body.size = String(Number(attributes.ukubwa));
    if (attributes.kipimo) {
      const mapped = SIZE_UNIT_MAP[attributes.kipimo];
      if (mapped) {
        body.size_unit = mapped;
      } else {
        warnings.push({
          code: "UNMAPPED_SIZE_UNIT",
          message: `Kipimo "${attributes.kipimo}" haipo kwenye SIZE_UNIT_MAP.`,
        });
      }
    }
    // ✅ Ongeza region/district/ward kutoka loc (si hardcode "Dar es Salaam")
    if (location?.mkoa) body.region = location.mkoa;
    if (location?.wilaya) body.district = location.wilaya;
    if (location?.eneo) body.village_or_street = location.eneo;

    if (attributes.aina) {
      const mapped = LAND_TYPE_MAP[attributes.aina];
      if (mapped) {
        body.land_type = mapped;
      } else {
        warnings.push({
          code: "UNMAPPED_LAND_TYPE",
          message: `Aina ya ardhi "${attributes.aina}" haipo kwenye LAND_TYPE_MAP.`,
        });
      }
    }
  } else if (categoryKey === "magari") {
    if (attributes.brand) body.make = String(attributes.brand).trim();
    if (attributes.model) body.model = String(attributes.model).trim();
    if (attributes.year) body.year = Number(attributes.year);
    if (attributes.mileage) body.mileage_km = Number(attributes.mileage);

    if (attributes.aina) {
      const mapped = VEHICLE_TYPE_MAP[attributes.aina];
      if (mapped) {
        body.vehicle_type = mapped;
      } else {
        warnings.push({
          code: "UNMAPPED_VEHICLE_TYPE",
          message: `Aina ya gari "${attributes.aina}" haipo kwenye VEHICLE_TYPE_MAP.`,
        });
      }
    }
    if (attributes.mafuta) {
      const mapped = FUEL_MAP[attributes.mafuta];
      if (mapped) {
        body.fuel_type = mapped;
      } else {
        warnings.push({
          code: "UNMAPPED_FUEL",
          message: `Mafuta "${attributes.mafuta}" haipo kwenye FUEL_MAP.`,
        });
      }
    }
    if (attributes.transmission) {
      body.transmission = String(attributes.transmission).toUpperCase();
    }
  } else if (categoryKey === "biashara") {
    if (attributes.aina) body.business_type = attributes.aina;
  } else if (categoryKey === "mashine") {
    if (attributes.aina) body.equipment_type = attributes.aina;
    if (attributes.hours) body.operating_hours = Number(attributes.hours);
    if (attributes.hali) {
      const mapped = CONDITION_MAP[attributes.hali];
      if (mapped) {
        body.condition = mapped;
      } else {
        warnings.push({
          code: "UNMAPPED_CONDITION",
          message: `Hali "${attributes.hali}" haipo kwenye CONDITION_MAP.`,
        });
      }
    }
  }

  return { body, endpoint, warnings };
}

export default buildDetailBody;