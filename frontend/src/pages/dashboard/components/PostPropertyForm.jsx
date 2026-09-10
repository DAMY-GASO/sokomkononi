import React, { useState } from "react";
import {
  Home,
  Trees,
  Car,
  Briefcase,
  Wrench,
  ImagePlus,
  X,
  ChevronLeft,
  Check,
} from "lucide-react";

const COLORS = {
  night: "#101A2E",
  sand: "#F5F3EC",
  gold: "#E8A33D",
  green: "#2F6D4F",
  rust: "#C1502E",
  nightSoft: "#1B2740",
  sandLine: "#E6E2D6",
};

const FONTS = {
  display: "'Fraunces', serif",
  body: "'Manrope', sans-serif",
};

// ============================================================
// CATEGORIES
// Note: Tumia `titleStatus` kwa hati (badala ya `title`)
// ili kuepuka duplicate key 'title'
// ============================================================

const CATEGORIES = [
  {
    key: "nyumba",
    label: "Nyumba & Majengo",
    icon: Home,
    extra: [
      { key: "vyumba", label: "Vyumba vya kulala", type: "number", placeholder: "mfano: 3" },
      { key: "bafu", label: "Bafu", type: "number", placeholder: "mfano: 2" },
      { key: "ukubwa", label: "Ukubwa (sqm)", type: "text", placeholder: "mfano: 250 sqm" },
      {
        key: "titleStatus",                      // ✅ IMEBADILISHWA
        label: "Hati (Title Status)",
        type: "select",
        options: ["Hati Miliki", "Hati ya Kimila", "Inasubiri Hati", "Hakuna Hati"],
      },
    ],
  },
  {
    key: "viwanja",
    label: "Viwanja & Mashamba",
    icon: Trees,
    extra: [
      { key: "ukubwa", label: "Ukubwa wa Eneo", type: "text", placeholder: "mfano: nusu ekari" },
      {
        key: "titleStatus",                      // ✅ IMEBADILISHWA
        label: "Hati / Title Status",
        type: "select",
        options: ["Hati Miliki", "Hati ya Kimila", "Inasubiri Hati", "Hakuna Hati"],
      },
      {
        key: "matumizi",
        label: "Matumizi ya Ardhi",
        type: "select",
        options: ["Makazi", "Kilimo", "Biashara", "Viwanda"],
      },
    ],
  },
  {
    key: "magari",
    label: "Magari",
    icon: Car,
    extra: [
      { key: "make_model", label: "Make / Model / Mwaka", type: "text", placeholder: "mfano: Toyota Harrier 2016" },
      { key: "mileage", label: "Mileage (km)", type: "number", placeholder: "mfano: 85000" },
      {
        key: "transmission",
        label: "Transmission",
        type: "select",
        options: ["Automatic", "Manual"],
      },
      {
        key: "mafuta",
        label: "Aina ya Mafuta",
        type: "select",
        options: ["Petrol", "Diesel", "Hybrid", "Umeme (EV)"],
      },
    ],
  },
  {
    key: "biashara",
    label: "Biashara Zinazouzwa",
    icon: Briefcase,
    extra: [
      { key: "aina", label: "Aina ya Biashara", type: "text", placeholder: "mfano: Duka la vifaa vya ujenzi" },
      { key: "mapato", label: "Mapato ya Wastani (kwa mwezi)", type: "text", placeholder: "TZS ..." },
      { key: "muda", label: "Muda Biashara Ikiwepo", type: "text", placeholder: "mfano: miaka 4" },
    ],
  },
  {
    key: "mashine",
    label: "Mashine / Heavy Equipment",
    icon: Wrench,
    extra: [
      { key: "aina", label: "Aina ya Mashine", type: "text", placeholder: "mfano: Excavator" },
      { key: "hours", label: "Saa za Matumizi", type: "number", placeholder: "mfano: 3200" },
      {
        key: "hali",
        label: "Hali",
        type: "select",
        options: ["Mpya", "Nzuri Sana", "Nzuri", "Inahitaji Matengenezo"],
      },
    ],
  },
];

// ============================================================
// LISTING FEE CONFIGURATION
// ============================================================

const FEE_CONFIG = {
  nyumba: { rate: 0.010, min: 20000, max: 300000 },
  viwanja: { rate: 0.008, min: 15000, max: 250000 },
  magari: { rate: 0.015, min: 10000, max: 150000 },
  biashara: { rate: 0.012, min: 20000, max: 200000 },
  mashine: { rate: 0.010, min: 15000, max: 180000 },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function parsePrice(value) {
  if (!value) return 0;
  const digitsOnly = String(value).replace(/[^0-9]/g, "");
  return digitsOnly ? parseInt(digitsOnly, 10) : 0;
}

function formatTZS(amount) {
  return "TZS " + Math.round(amount).toLocaleString("en-US");
}

function calculateListingFee(categoryKey, priceInput) {
  const config = FEE_CONFIG[categoryKey];
  const price = parsePrice(priceInput);

  if (!config || !price) {
    return { price, rate: config?.rate ?? 0, rawFee: 0, fee: 0, capped: null };
  }

  const rawFee = price * config.rate;
  let fee = rawFee;
  let capped = null;

  if (rawFee < config.min) {
    fee = config.min;
    capped = "min";
  } else if (rawFee > config.max) {
    fee = config.max;
    capped = "max";
  }

  // Round to nearest 500 TZS
  fee = Math.round(fee / 500) * 500;

  return { price, rate: config.rate, rawFee, fee, capped };
}

// ============================================================
// FIELD COMPONENT
// ============================================================

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span style={{ color: COLORS.night }} className="text-sm font-medium">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  background: COLORS.sand,
  borderColor: COLORS.sandLine,
  color: COLORS.night,
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function PostPropertyForm({ onSuccess, onCancel }) {
  const [categoryKey, setCategoryKey] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [base, setBase] = useState({
    title: "",
    price: "",
    location: "",
    description: "",
    seller_name: "",
    contact_pref: "Simu",
  });
  const [extra, setExtra] = useState({});

  const category = CATEGORIES.find((c) => c.key === categoryKey);
  const feeInfo = calculateListingFee(categoryKey, base.price);

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 8 - photos.length);
    const withUrls = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPhotos((p) => [...p, ...withUrls]);
  };

  const removePhoto = (idx) => setPhotos((p) => p.filter((_, i) => i !== idx));

  const setExtraField = (key, value) => setExtra((e) => ({ ...e, [key]: value }));

  const canSubmit =
    category &&
    base.title.trim() &&
    base.price.trim() &&
    base.location.trim() &&
    photos.length > 0;

  // Handle successful submission
  const handleSuccess = () => {
    setSubmitted(true);
    // Call onSuccess callback if provided
    if (onSuccess) {
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }
  };

  // Reset form
  const resetForm = () => {
    setSubmitted(false);
    setCategoryKey(null);
    setPhotos([]);
    setBase({
      title: "",
      price: "",
      location: "",
      description: "",
      seller_name: "",
      contact_pref: "Simu",
    });
    setExtra({});
  };

  // ============================================================
  // SUCCESS STATE
  // ============================================================
  if (submitted) {
    return (
      <div
        style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "400px" }}
        className="w-full flex items-center justify-center p-6"
      >
        <div
          style={{ borderColor: COLORS.sandLine }}
          className="max-w-md w-full text-center bg-white rounded-2xl border p-8"
        >
          <div
            style={{ background: COLORS.green }}
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Check color={COLORS.sand} size={26} />
          </div>
          <h2
            style={{ fontFamily: FONTS.display, color: COLORS.night }}
            className="text-2xl font-semibold mb-2"
          >
            Taarifa zimehifadhiwa!
          </h2>
          <p style={{ color: "rgba(16,26,46,0.65)" }} className="text-sm mb-5">
            Hatua inayofuata ni kulipa Listing Fee ili "{base.title}" ichapishwe na
            ionekane kwa wanunuzi.
          </p>

          <div
            style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
            className="rounded-xl border p-4 mb-6 text-left"
          >
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: "rgba(16,26,46,0.6)" }}>Bei ya Mali</span>
              <span style={{ color: COLORS.night }} className="font-medium">
                {formatTZS(feeInfo.price)}
              </span>
            </div>
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: "rgba(16,26,46,0.6)" }}>
                Rate ({category?.label || ""})
              </span>
              <span style={{ color: COLORS.night }} className="font-medium">
                {(feeInfo.rate * 100).toFixed(1)}%
              </span>
            </div>
            {feeInfo.capped && (
              <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color: COLORS.rust }}>
                  {feeInfo.capped === "min"
                    ? "Fee ya chini kabisa imetumika"
                    : "Fee ya juu kabisa imetumika (imekomaa)"}
                </span>
              </div>
            )}
            <div
              style={{ borderColor: COLORS.sandLine }}
              className="flex justify-between text-sm pt-2 mt-1 border-t font-semibold"
            >
              <span style={{ color: COLORS.night }}>Listing Fee</span>
              <span style={{ color: COLORS.rust }}>{formatTZS(feeInfo.fee)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              style={{ background: COLORS.gold, color: COLORS.night }}
              className="w-full py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Lipa {formatTZS(feeInfo.fee)} — Endelea
            </button>
            <button
              onClick={resetForm}
              style={{ color: COLORS.night }}
              className="w-full py-2.5 text-sm font-medium underline underline-offset-2"
            >
              Weka Mali Nyingine
            </button>
            {onSuccess && (
              <button
                onClick={onSuccess}
                style={{ color: COLORS.green }}
                className="w-full py-2.5 text-sm font-medium"
              >
                ← Rudi kwenye My Listings
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // FORM STATE
  // ============================================================
  return (
    <div
      style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "400px" }}
      className="w-full"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-2xl mx-auto">
        {/* Back button - ikiwa onCancel ipo */}
        {onCancel && (
          <button
            onClick={onCancel}
            style={{ color: COLORS.night }}
            className="flex items-center gap-1 text-sm font-medium mb-3 opacity-70 hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={16} /> Rudi kwenye My Listings
          </button>
        )}

        {category && (
          <button
            onClick={() => setCategoryKey(null)}
            style={{ color: COLORS.night }}
            className="flex items-center gap-1 text-sm font-medium mb-3 opacity-70 hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={16} /> Badilisha Category
          </button>
        )}

        <h1
          style={{ fontFamily: FONTS.display, color: COLORS.night }}
          className="text-2xl sm:text-3xl font-semibold mb-1"
        >
          Weka Mali Yako
        </h1>
        <p style={{ color: "rgba(16,26,46,0.6)" }} className="text-sm mb-6">
          {category
            ? `Category: ${category.label}`
            : "Chagua category ya mali unayotaka kuiweka"}
        </p>

        {/* ============================================================ */}
        {/* CATEGORY SELECTION */}
        {/* ============================================================ */}
        {!category && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setCategoryKey(key)}
                style={{ borderColor: COLORS.sandLine, background: "white" }}
                className="flex flex-col items-start gap-3 p-4 rounded-2xl border text-left hover:shadow-sm transition-shadow"
              >
                <div
                  style={{ background: COLORS.night }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                >
                  <Icon size={18} color={COLORS.gold} />
                </div>
                <span style={{ color: COLORS.night }} className="text-sm font-semibold">
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ============================================================ */}
        {/* FORM */}
        {/* ============================================================ */}
        {category && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit) handleSuccess();
            }}
            className="flex flex-col gap-5"
          >
            {/* Photos */}
            <Field label="Picha za Mali (angalau 1, mpaka 8)">
              <div className="flex flex-wrap gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      style={{ background: COLORS.rust }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    >
                      <X size={12} color="white" />
                    </button>
                  </div>
                ))}
                {photos.length < 8 && (
                  <label
                    style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
                    className="w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer text-xs hover:bg-gray-50 transition-colors"
                  >
                    <ImagePlus size={18} />
                    Ongeza
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={handlePhotoAdd}
                    />
                  </label>
                )}
              </div>
            </Field>

            {/* Title */}
            <Field label="Jina la Mali">
              <input
                style={inputStyle}
                className="rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-all"
                placeholder="mfano: Nyumba ya Ghorofa Mbezi Beach"
                value={base.title}
                onChange={(e) => setBase({ ...base, title: e.target.value })}
              />
            </Field>

            {/* Price & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Bei (TZS)">
                <input
                  style={inputStyle}
                  type="text"
                  className="rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-all"
                  placeholder="mfano: 85,000,000"
                  value={base.price}
                  onChange={(e) => setBase({ ...base, price: e.target.value })}
                />
                {feeInfo.price > 0 && (
                  <span style={{ color: "rgba(16,26,46,0.55)" }} className="text-xs">
                    Makadirio ya Listing Fee:{" "}
                    <b style={{ color: COLORS.rust }}>{formatTZS(feeInfo.fee)}</b>
                  </span>
                )}
              </Field>
              <Field label="Mahali">
                <input
                  style={inputStyle}
                  className="rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-all"
                  placeholder="mfano: Mbezi Beach, Dar es Salaam"
                  value={base.location}
                  onChange={(e) => setBase({ ...base, location: e.target.value })}
                />
              </Field>
            </div>

            {/* ============================================================ */}
            {/* CATEGORY-SPECIFIC FIELDS */}
            {/* ============================================================ */}
            <div
              style={{ borderColor: COLORS.sandLine, background: "white" }}
              className="rounded-2xl border p-4 flex flex-col gap-4"
            >
              <span style={{ color: COLORS.rust }} className="text-xs font-semibold">
                Taarifa za Ziada — {category.label}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {category.extra.map((f) => (
                  <Field key={f.key} label={f.label}>
                    {f.type === "select" ? (
                      <select
                        style={inputStyle}
                        className="rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-all"
                        value={extra[f.key] || ""}
                        onChange={(e) => setExtraField(f.key, e.target.value)}
                      >
                        <option value="">Chagua...</option>
                        {f.options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        style={inputStyle}
                        type={f.type}
                        className="rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-all"
                        placeholder={f.placeholder}
                        value={extra[f.key] || ""}
                        onChange={(e) => setExtraField(f.key, e.target.value)}
                      />
                    )}
                  </Field>
                ))}
              </div>
            </div>

            {/* Description */}
            <Field label="Maelezo">
              <textarea
                style={inputStyle}
                rows={4}
                className="rounded-xl border px-3 py-2.5 text-sm outline-none resize-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-all"
                placeholder="Eleza kwa ufupi kuhusu mali yako..."
                value={base.description}
                onChange={(e) => setBase({ ...base, description: e.target.value })}
              />
            </Field>

            {/* Seller Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Jina la Muuzaji">
                <input
                  style={inputStyle}
                  className="rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-all"
                  placeholder="Jina lako"
                  value={base.seller_name}
                  onChange={(e) =>
                    setBase({ ...base, seller_name: e.target.value })
                  }
                />
              </Field>
              <Field label="Contact Preference">
                <select
                  style={inputStyle}
                  className="rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#E8A33D] focus:ring-2 focus:ring-[#E8A33D]/20 transition-all"
                  value={base.contact_pref}
                  onChange={(e) =>
                    setBase({ ...base, contact_pref: e.target.value })
                  }
                >
                  <option>Simu</option>
                  <option>WhatsApp</option>
                  <option>Ujumbe wa ndani (In-app)</option>
                </select>
              </Field>
            </div>

            {/* Info Note */}
            <div
              style={{ borderColor: COLORS.sandLine, background: COLORS.sandLine }}
              className="rounded-xl border px-4 py-3 text-xs"
            >
              <span style={{ color: COLORS.night }}>
                Baada ya kuwasilisha, utaelekezwa kulipa <b>Listing Fee</b> kabla mali
                yako haijachapishwa. Fee inategemea bei uliyoweka.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                background: canSubmit ? COLORS.gold : COLORS.sandLine,
                color: canSubmit ? COLORS.night : "rgba(16,26,46,0.4)",
              }}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-colors"
            >
              Wasilisha na Endelea Kulipa
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
