// ============================================================
// PostPropertyForm.jsx (production + bundle support)
// Category-specific posting + duplicate check + skip fee
// + bundle option kwa listing fee
//
// SASISHO:
//   - Kila listing inaenda PENDING_APPROVAL (admin approval)
//   - Hata fee imezimwa au imewashwa, admin aidhinisha
//   - Hakuna auto-publish — kila kitu kinapitia admin
// ============================================================
import React, { useState, useEffect } from "react";
import {
  ImagePlus, X, ChevronLeft, Check, Loader2, AlertTriangle,
  Wallet, Package,
} from "lucide-react";
import { COLORS, formatTZS, calculateListingFee } from "./shared";
import {
  useActiveCategories, getCategoryIcon, getCategoryIdByKey,
} from "../../../config/categoriesStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import { checkCredit, consumeCreditAsync } from "../../../config/userCreditsStore.js";
import { checkDuplicateListingAsync } from "../../../config/listingsStore.js";
import { getListingFeeConfig } from "../../../config/listingFeeStore.js";
import { useActiveBundles } from "../../../config/bundlesStore.js";
import { api } from "../../../api/client.js";
import PaymentGateway from "./PaymentGateway";
import ImageCropper from "../../../components/ImageCropper.jsx";
import {
  getPostingConfig,
  getVisibleFields,
  getPriceMeta,
  TZ_REGIONS,
  WILAYA_SUGGESTIONS,
} from "../../../config/categorySchemas.js";

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-center">
      <span className="text-primary text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  background: COLORS.sand,
  borderColor: COLORS.sandLine,
  color: COLORS.night,
};
const inputCls =
  "rounded-xl border px-3 py-2.5 text-sm outline-none text-center w-full";

// ── SchemaField ─────────────────────────────────────────────
function SchemaField({ f, value, onChange, lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const label = (f.label?.[lang] || f.label?.sw) + (f.required ? " *" : "");
  const placeholder = f.placeholder?.[lang] || f.placeholder?.sw || "";
  const listId = f.suggestions ? `dl-${f.key}` : undefined;
  const today = new Date().toISOString().slice(0, 10);

  let control;
  if (f.type === "select") {
    control = (
      <select
        style={inputStyle}
        className={inputCls}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t("Chagua...", "Choose...")}</option>
        {f.options?.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label?.[lang] || op.label?.sw}
          </option>
        ))}
      </select>
    );
  } else if (f.type === "textarea") {
    control = (
      <textarea
        style={inputStyle}
        rows={3}
        className={`${inputCls} resize-none`}
        placeholder={placeholder}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  } else {
    control = (
      <>
        <input
          style={inputStyle}
          className={inputCls}
          type={
            f.type === "number"
              ? "number"
              : f.type === "date"
                ? "date"
                : "text"
          }
          inputMode={f.type === "number" ? "numeric" : undefined}
          min={f.type === "date" ? today : f.min}
          max={f.max}
          list={listId}
          placeholder={placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
        {f.suggestions && (
          <datalist id={listId}>
            {f.suggestions.map((sg) => (
              <option key={sg} value={sg} />
            ))}
          </datalist>
        )}
      </>
    );
  }
  return (
    <Field label={label}>
      {control}
      {f.hint && (
        <span className="text-[11px] text-secondary">
          {f.hint[lang] || f.hint.sw}
        </span>
      )}
    </Field>
  );
}

function formatPriceInput(v) {
  if (!v) return "";
  const d = String(v).replace(/[^0-9]/g, "");
  if (!d) return "";
  return Number(d).toLocaleString("en-US");
}
function cleanPriceInput(v) {
  return String(v).replace(/[^0-9]/g, "");
}

const CATEGORY_DETAIL_ENDPOINT = {
  nyumba: "property-details",
  viwanja: "land-details",
  magari: "vehicle-details",
  biashara: "business-details",
  mashine: "equipment-details",
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function PostPropertyForm({
  onSubmit = () => {},
  onGoToListings = () => {},
  onPaid = () => {},
  onGoToBoost = () => {},
}) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const categories = useActiveCategories();
  const listingBundles = useActiveBundles().filter(
    (b) => b.type === "listing"
  );

  const [categoryKey, setCategoryKey] = useState(null);
  const [mode, setMode] = useState(null);
  const [loc, setLoc] = useState({ mkoa: "", wilaya: "", eneo: "" });
  const [photos, setPhotos] = useState([]);
  const [cropQueue, setCropQueue] = useState([]);
  const [stage, setStage] = useState("form");
  const [createdListing, setCreatedListing] = useState(null);
  const [feeAmount, setFeeAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // ⬇️ Payment mode kwa listing fee
  const [paymentMode, setPaymentMode] = useState("flat"); // "flat" | "bundle"
  const [bundleId, setBundleId] = useState(null);
  const [pendingBundlePurchase, setPendingBundlePurchase] = useState(null);

  const [base, setBase] = useState({
    title: "",
    price: "",
    location: "",
    description: "",
    seller_name: "",
    contact_pref: lang === "sw" ? "Simu" : "Phone",
  });
  const [extra, setExtra] = useState({});

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const category = categories.find((c) => c.key === categoryKey);
  const categoryLabel =
    category?.label?.[lang] || category?.label?.sw || "";

  const cfg = getPostingConfig(categoryKey);
  const activeMode = cfg.modes?.find((m) => m.key === mode) || null;
  const needsMode = Boolean(cfg.modes) && !activeMode;
  const visibleFields = getVisibleFields(category?.extra, cfg, mode, extra);
  const priceMeta = getPriceMeta(cfg, mode, extra);
  const titleLabel =
    activeMode?.titleLabel || cfg.titleLabel || { sw: "Jina la Mali", en: "Property Title" };
  const titlePlaceholder =
    activeMode?.titlePlaceholder ||
    cfg.titlePlaceholder || {
      sw: "mfano: Nyumba ya Ghorofa Mbezi Beach",
      en: "e.g. Mbezi Beach Apartment Building",
    };
  const locationLabel =
    activeMode?.locationLabel || cfg.locationLabel || { sw: "Mahali", en: "Location" };
  const descLabel =
    activeMode?.descLabel || { sw: "Maelezo", en: "Description" };
  const photosOptional = Boolean(cfg.photosOptional);

  const suggestedTitle = cfg.autoTitle ? cfg.autoTitle(extra) : "";
  const effectiveTitle = base.title.trim();
  const locationString = [loc.eneo.trim(), loc.wilaya.trim(), loc.mkoa]
    .filter(Boolean)
    .join(", ");

  const creditInfo = checkCredit(user?.id, "listing");
  const hasCredit = creditInfo.hasCredit;
  const listingCreditRemaining = creditInfo.remaining || 0;

  // ⬇️ Angalia kama listing fee imezimwa kwa category hii
  const categoryFeeConfig = categoryKey ? getListingFeeConfig(categoryKey) : null;
  const listingFeeDisabled = categoryFeeConfig
    ? categoryFeeConfig.isActive === false
    : false;

  const selectedBundle = listingBundles.find((b) => b.id === bundleId);

  useEffect(() => {
    if (!bundleId && listingBundles.length) {
      setBundleId(listingBundles[0].id);
    }
  }, [listingBundles, bundleId]);

  // ============================================================
  // REAL-TIME DUPLICATE CHECK (debounced)
  // ============================================================
  useEffect(() => {
    if (!categoryKey || !effectiveTitle || !base.price || !loc.eneo) {
      setDuplicateWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const check = await checkDuplicateListingAsync({
          title: effectiveTitle,
          price: Number(cleanPriceInput(base.price)) || 0,
          location: locationString,
          category: categoryKey,
        });

        if (check.ok && check.isDuplicate) {
          setDuplicateWarning(check.existing);
        } else {
          setDuplicateWarning(null);
        }
      } catch (err) {
        console.warn("[PostPropertyForm] duplicate check failed:", err);
        setDuplicateWarning(null);
      }
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveTitle, base.price, loc.mkoa, loc.wilaya, loc.eneo, categoryKey]);

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 8 - photos.length);
    setCropQueue((q) => [...q, ...files]);
    e.target.value = "";
  };
  const handleCropDone = (cropped) => {
    setPhotos((p) =>
      p.length >= 8
        ? p
        : [...p, { file: cropped, url: URL.createObjectURL(cropped) }]
    );
    setCropQueue((q) => q.slice(1));
  };
  const handleCropSkip = () => setCropQueue((q) => q.slice(1));
  const removePhoto = (i) => setPhotos((p) => p.filter((_, idx) => idx !== i));
  const setExtraField = (k, v) => setExtra((e) => ({ ...e, [k]: v }));

  const requiredFilled = visibleFields.every(
    (f) => !f.required || String(extra[f.key] ?? "").trim() !== ""
  );
  const canSubmit =
    category &&
    !needsMode &&
    effectiveTitle &&
    (priceMeta.optional || base.price.trim()) &&
    loc.mkoa &&
    loc.eneo.trim() &&
    requiredFilled &&
    (photosOptional || photos.length > 0) &&
    !submitting &&
    !duplicateWarning;

  const chooseCategory = (key) => {
    setCategoryKey(key);
    setMode(null);
    setExtra({});
    setError("");
    setDuplicateWarning(null);
  };
  const clearCategory = () => chooseCategory(null);
  const chooseMode = (m) => {
    setMode(m);
    setExtra({});
  };

  const buildSummary = () => {
    const lines = [];
    if (activeMode)
      lines.push(`${t("Aina", "Type")}: ${activeMode.label[lang]}`);
    visibleFields.forEach((f) => {
      const v = extra[f.key];
      if (v === undefined || v === null || String(v).trim() === "") return;
      const opt = f.options?.find((op) => op.value === v);
      lines.push(`${f.label[lang]}: ${opt ? opt.label[lang] : v}`);
    });
    lines.push(`${t("Eneo", "Location")}: ${locationString}`);
    return lines.join("\n");
  };

  const reset = () => {
    setStage("form");
    setCreatedListing(null);
    setCategoryKey(null);
    setMode(null);
    setLoc({ mkoa: "", wilaya: "", eneo: "" });
    setPhotos([]);
    setBase({
      title: "",
      price: "",
      location: "",
      description: "",
      seller_name: "",
      contact_pref: lang === "sw" ? "Simu" : "Phone",
    });
    setExtra({});
    setError("");
    setDuplicateWarning(null);
    setFeeAmount(0);
    setPaymentMode("flat");
    setBundleId(null);
    setPendingBundlePurchase(null);
  };

  // ── Step 1: create the listing on backend ────────────────
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");

    // Final duplicate check
    try {
      const finalCheck = await checkDuplicateListingAsync({
        title: effectiveTitle,
        price: Number(cleanPriceInput(base.price)) || 0,
        location: locationString,
        category: categoryKey,
      });

      if (finalCheck.ok && finalCheck.isDuplicate) {
        setError(
          t(
            `Umekwisha kuweka tangazo linalofanana na hili${
              finalCheck.existing?.title ? `: "${finalCheck.existing.title}"` : ""
            }. Tafadhali badilisha jina, bei, au mahali.`,
            `You've already posted a similar listing${
              finalCheck.existing?.title ? `: "${finalCheck.existing.title}"` : ""
            }. Please change the title, price, or location.`
          )
        );
        setDuplicateWarning(finalCheck.existing);
        setSubmitting(false);
        return;
      }
    } catch (checkErr) {
      console.warn("[PostPropertyForm] final duplicate check failed:", checkErr);
    }

    const categoryId = getCategoryIdByKey(categoryKey);
    if (!categoryId) {
      setError(
        t(
          "Category haina backend id. Hydrate kwanza.",
          "Category has no backend id. Hydrate first."
        )
      );
      setSubmitting(false);
      return;
    }

    try {
      const created = await api.post("/listings/", {
        category_id: categoryId,
        title: effectiveTitle,
        description: [base.description.trim(), buildSummary()]
          .filter(Boolean)
          .join("\n\n"),
        price: Number(cleanPriceInput(base.price)) || 0,
        location: locationString,
        attributes: {
          ...extra,
          ...(mode ? { mode } : {}),
          region: loc.mkoa,
          district: loc.wilaya.trim(),
          area: loc.eneo.trim(),
        },
      });

      let listingId =
        created?.id ?? created?.pk ?? created?.listing_id ?? created?.listingId;

      if (!listingId) {
        try {
          const me = await api.get("/auth/me/");
          const mine = await api.get(
            `/listings/?seller=${me.id}&ordering=-created_at&page_size=10`
          );
          const list = Array.isArray(mine) ? mine : mine?.results || [];
          const match = list.find((l) => l.title === effectiveTitle);
          listingId = match?.id;
        } catch (lookupErr) {
          console.warn("[PostPropertyForm] id lookup failed:", lookupErr);
        }
      }

      if (!listingId) {
        throw new Error(
          t(
            "Backend haikurudisha listing id na hatukuweza kuipata. Wasiliana na support.",
            "Backend did not return a listing id and we couldn't resolve it. Contact support."
          )
        );
      }

      created.id = listingId;

      // Upload images
      for (const p of photos) {
        const fd = new FormData();
        fd.append("image", p.file);
        fd.append("is_primary", photos.indexOf(p) === 0 ? "true" : "false");
        fd.append("ordering", String(photos.indexOf(p)));
        // eslint-disable-next-line no-await-in-loop
        await api.upload(`/listings/${listingId}/images/`, fd);
      }

      // Category details
      const detailEndpoint = CATEGORY_DETAIL_ENDPOINT[categoryKey];
      if (detailEndpoint) {
        const detailBody = {};
        const FUEL_MAP = {
          Petrol: "PETROL",
          Diesel: "DIESEL",
          Hybrid: "HYBRID",
          "Umeme (EV)": "ELECTRIC",
        };
        const SIZE_UNIT_MAP = {
          Sqm: "SQM",
          Ekari: "ACRE",
          Hekta: "HECTARE",
        };
        if (categoryKey === "nyumba") {
          if (extra.vyumba) detailBody.bedrooms = Number(extra.vyumba);
          if (extra.bafu) detailBody.bathrooms = Number(extra.bafu);
          if (extra.ukubwa) detailBody.area_sqm = String(extra.ukubwa);
          detailBody.property_type = "HOUSE";
        } else if (categoryKey === "viwanja") {
          detailBody.size = extra.ukubwa ? String(Number(extra.ukubwa)) : "0";
          detailBody.size_unit = SIZE_UNIT_MAP[extra.kipimo] || "SQM";
          detailBody.region = loc.mkoa || "Dar es Salaam";
          detailBody.land_type = "PLOT";
        } else if (categoryKey === "magari") {
          if (extra.brand) detailBody.make = String(extra.brand).trim();
          if (extra.model) detailBody.model = String(extra.model).trim();
          if (extra.year) detailBody.year = Number(extra.year);
          if (extra.mileage) detailBody.mileage_km = Number(extra.mileage);
          detailBody.vehicle_type = "CAR";
          detailBody.fuel_type = FUEL_MAP[extra.mafuta] || "PETROL";
          detailBody.transmission = String(
            extra.transmission || "Automatic"
          ).toUpperCase();
        } else if (categoryKey === "biashara") {
          detailBody.business_type = extra.aina || "General";
        } else if (categoryKey === "mashine") {
          detailBody.equipment_type = extra.aina || "General";
          if (extra.hours) detailBody.operating_hours = Number(extra.hours);
          detailBody.condition = extra.hali === "Mpya" ? "NEW" : "USED";
        }
        try {
          await api.post(`/listings/${listingId}/${detailEndpoint}/`, detailBody);
        } catch (detailErr) {
          console.warn("[PostPropertyForm] detail submit failed:", detailErr);
          const msg = t(
            "Taarifa za ziada hazikuhifadhiwa — unaweza kuziongeza baadaye kwenye Mali Zangu.",
            "Extra details were not saved — you can add them later from My Listings."
          );
          setWarnings((w) => (w.includes(msg) ? w : [...w, msg]));
        }
      }

      // ═══════════════════════════════════════════════════════════
      // ⬇️ Kama listing fee imezimwa → wasilisha kwa admin approval
      //    (HAKUNA auto-publish — kila kitu kinapitia admin)
      // ═══════════════════════════════════════════════════════════
      if (listingFeeDisabled) {
        console.info(
          "[PostPropertyForm] Listing fee disabled — submitting for admin approval"
        );
        try {
          await api.post(`/listings/${listingId}/publish/`, {});
        } catch (pubErr) {
          console.warn("[PostPropertyForm] publish endpoint missing:", pubErr);
        }

        setCreatedListing(created);
        setFeeAmount(0);
        setStage("done");
        onSubmit?.(created);
        return;
      }

      // ═══════════════════════════════════════════════════════════
      // Listing fee ipo active → review (flat au bundle)
      // ═══════════════════════════════════════════════════════════
      let fee = 0;
      let feeSource = "backend";
      try {
        const feeRes = await api.get(`/listings/${listingId}/fee/`);
        fee = Number(feeRes?.amount) || 0;
        if (!fee) throw new Error("Backend returned no fee");
      } catch (feeErr) {
        feeSource = "local";
        console.warn(
          "[PostPropertyForm] backend fee missing, falling back to local:",
          feeErr?.status || feeErr?.message
        );
        const local = calculateListingFee(
          categoryKey,
          cleanPriceInput(base.price)
        );
        fee = Number(local?.fee) || 0;
      }

      if (!fee && !listingFeeDisabled) {
        const msg = t(
          "Ada ya kuchapisha haijasanidiwa kwa category hii bado. Wasiliana na Admin.",
          "The listing fee has not been configured for this category yet. Contact admin."
        );
        setWarnings((w) => (w.includes(msg) ? w : [...w, msg]));
      }
      console.info("[PostPropertyForm] fee resolved:", {
        fee,
        source: feeSource,
        categoryKey,
      });

      setCreatedListing(created);
      setFeeAmount(fee);
      setStage("review");
      onSubmit?.(created);
    } catch (err) {
      setError(
        err?.data?.detail ||
          (err?.data && typeof err.data === "object"
            ? Object.values(err.data)
                .flat()
                .find((v) => typeof v === "string")
            : null) ||
          err?.message ||
          t("Imeshindwa kuweka listing.", "Failed to create listing.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Flat fee payment ────────────────────────────────────
  const handleFeeInitiate = async ({ methodKey, phone } = {}) => {
    if (!createdListing) return { ok: false, error: new Error("no listing") };
    try {
      const res = await api.post(
        `/listings/${createdListing.id}/fee/pay/`,
        {
          payment_method: methodKey || "",
          phone: phone || "",
        }
      );
      const candidates = [
        res?.fimipay,
        res?.data?.fimipay,
        res?.data,
        res,
      ].filter(Boolean);
      const payload =
        candidates.find((c) => c && (c.order_id || c.payment_status)) || {};

      return {
        ok: true,
        orderId: payload.order_id || null,
        paymentStatus: (payload.payment_status || "").toUpperCase() || null,
        transid: payload.transid || null,
        gatewayUrl: payload.payment_gateway_url || null,
        simulated: !!payload.simulated,
        environment: payload.environment || "live",
      };
    } catch (err) {
      return { ok: false, error: err };
    }
  };

  const handleFeeSuccess = () => {
    if (!createdListing) return;
    onPaid?.(createdListing.id, { alreadyPaid: true });
    setStage("done");
  };

  // ── Credit path ─────────────────────────────────────────
  const handleUseCredit = async () => {
    if (!createdListing || !user) return;
    setError("");
    try {
      await api.post(`/listings/${createdListing.id}/fee/pay/`, {
        payment_reference: "credits",
      });
      onPaid?.(createdListing.id, { alreadyPaid: true });
      setStage("done");
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          t("Imeshindwa kutumia credit.", "Failed to use credit.")
      );
    }
  };

  // ── Bundle purchase path ────────────────────────────────
  const handleBeginBundlePurchase = async () => {
    if (!selectedBundle) return;
    setSubmitting(true);
    setError("");
    try {
      const purchase = await api.post("/bundles/purchases/", {
        bundle: selectedBundle.id,
      });
      const purchaseId =
        purchase?.id || purchase?.purchase_id || purchase?.purchaseId;
      if (!purchaseId) throw new Error("Backend did not return purchase id.");
      setPendingBundlePurchase({ id: purchaseId, bundle: selectedBundle });
      setStage("paying");
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          t(
            "Imeshindwa kununua kifurushi. Jaribu tena.",
            "Could not purchase bundle. Try again."
          )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBundlePaymentInitiate = async ({ methodKey, phone } = {}) => {
    if (!pendingBundlePurchase) return { ok: false, error: new Error("no bundle") };
    try {
      const paid = await api.post(
        `/bundles/purchases/${pendingBundlePurchase.id}/pay/`,
        {
          payment_method: methodKey || "",
          phone: phone || "",
        }
      );
      const fimipay = paid?.fimipay || paid?.data?.fimipay || {};
      return {
        ok: true,
        orderId: fimipay.order_id,
        gatewayUrl: fimipay.payment_gateway_url || null,
        simulated: !!fimipay.simulated,
        environment: fimipay.environment || "live",
      };
    } catch (err) {
      return { ok: false, error: err };
    }
  };

  const handleBundlePaymentSuccess = async () => {
    // Bundle credits zinaingizwa. Sasa tumia credit kwa listing hii.
    if (!createdListing) return;
    try {
      await api.post(`/listings/${createdListing.id}/fee/pay/`, {
        payment_reference: "credits",
      });
      onPaid?.(createdListing.id, { alreadyPaid: true });
      setStage("done");
    } catch (err) {
      console.warn("[PostPropertyForm] credit after bundle failed:", err);
      setStage("done");
    }
  };

  // ═══════════════════════════════════════════════════════════
  // REVIEW STAGE
  // ═══════════════════════════════════════════════════════════
  if (stage === "review" || stage === "paying") {
    return (
      <div
        className="w-full flex items-center justify-center p-6"
        style={{ background: COLORS.sand, minHeight: "600px" }}
      >
        <div className="max-w-md w-full">
          {stage === "review" && (
            <div
              className="text-center bg-white rounded-2xl border p-8"
              style={{ borderColor: COLORS.sandLine }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: COLORS.green }}
              >
                <Check color={COLORS.sand} size={26} />
              </div>
              <h2 className="h-title mb-2">
                {t("Listing imeundwa", "Listing Created")}
              </h2>
              <p className="text-secondary text-sm mb-5">
                {t(
                  "Lipa ada ili listing iwasilishwe kwa admin kuidhinisha.",
                  "Pay the fee so the listing is submitted to admin for approval."
                )}
              </p>

              {/* Fee amount */}
              <div
                className="rounded-xl border p-4 mb-4"
                style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
              >
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">
                    {t("Ada ya Kuchapisha", "Listing Fee")}
                  </span>
                  <span className="font-bold" style={{ color: COLORS.rust }}>
                    {formatTZS(feeAmount)}
                  </span>
                </div>
              </div>

              {/* Credit banner */}
              {hasCredit && (
                <div className="rounded-xl bg-[#2F6D4F]/10 border border-[#2F6D4F]/25 px-4 py-3 mb-4 flex flex-col items-center gap-2 text-center">
                  <div className="flex items-center gap-2">
                    <Wallet size={16} color={COLORS.green} />
                    <span className="text-body-sm text-[#2F6D4F] font-medium">
                      {t(
                        `Una Listing Credits ${listingCreditRemaining}`,
                        `You have ${listingCreditRemaining} Listing Credits`
                      )}
                    </span>
                  </div>
                  <button
                    onClick={handleUseCredit}
                    className="w-full py-2.5 rounded-xl font-semibold text-body-sm bg-[#2F6D4F] text-white"
                  >
                    {t("Tumia Credit", "Use Credit")}
                  </button>
                </div>
              )}

              {/* Bundle vs Flat toggle */}
              {listingBundles.length > 0 && (
                <div className="flex justify-center gap-2 mb-4">
                  <button
                    onClick={() => setPaymentMode("flat")}
                    className="flex-1 text-xs font-semibold px-3 py-2 rounded-full border transition-colors"
                    style={{
                      background:
                        paymentMode === "flat" ? COLORS.night : "white",
                      color:
                        paymentMode === "flat" ? COLORS.sand : COLORS.night,
                      borderColor:
                        paymentMode === "flat" ? COLORS.night : COLORS.sandLine,
                    }}
                  >
                    {t("Ada ya Kawaida", "Flat Fee")}
                  </button>
                  <button
                    onClick={() => setPaymentMode("bundle")}
                    className="flex-1 text-xs font-semibold px-3 py-2 rounded-full border transition-colors"
                    style={{
                      background:
                        paymentMode === "bundle" ? COLORS.night : "white",
                      color:
                        paymentMode === "bundle" ? COLORS.sand : COLORS.night,
                      borderColor:
                        paymentMode === "bundle" ? COLORS.night : COLORS.sandLine,
                    }}
                  >
                    {t("Kifurushi (Bundle)", "Bundle Package")}
                  </button>
                </div>
              )}

              {/* Bundle selector */}
              {paymentMode === "bundle" && listingBundles.length > 0 && (
                <div className="flex flex-col gap-2 mb-4">
                  {listingBundles.map((b) => {
                    const selected = b.id === bundleId;
                    const other = lang === "sw" ? "en" : "sw";
                    const bName =
                      b.name?.[lang] || b.name?.[other] || t("Kifurushi", "Bundle");
                    return (
                      <button
                        key={b.id}
                        onClick={() => setBundleId(b.id)}
                        style={{
                          borderColor: selected ? COLORS.gold : COLORS.sandLine,
                          background: selected ? "rgba(232,163,61,0.08)" : "white",
                        }}
                        className="flex items-center justify-between gap-2 p-3 rounded-xl border text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Package size={14} color={COLORS.gold} />
                          <span className="text-sm font-semibold text-primary truncate">
                            {bName}
                          </span>
                        </div>
                        <span
                          className="text-sm font-bold shrink-0"
                          style={{ color: COLORS.rust }}
                        >
                          {formatTZS(b.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {error && (
                <div
                  className="rounded-lg px-3 py-2 mb-3 text-xs"
                  style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
                >
                  <AlertTriangle size={12} className="inline mr-1" />
                  {error}
                </div>
              )}

              {warnings.length > 0 && (
                <div
                  className="rounded-lg px-3 py-2 mb-3 text-xs text-left"
                  style={{ background: "rgba(232,163,61,0.15)", color: "#8A5A16" }}
                >
                  {warnings.map((w, i) => (
                    <p key={i}>⚠️ {w}</p>
                  ))}
                </div>
              )}

              {/* Main CTA */}
              <button
                onClick={
                  paymentMode === "flat"
                    ? () => setStage("paying")
                    : handleBeginBundlePurchase
                }
                disabled={submitting || (paymentMode === "bundle" && !selectedBundle)}
                style={{
                  background: COLORS.gold,
                  color: COLORS.night,
                }}
                className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
              >
                {paymentMode === "flat"
                  ? t(`Lipa ${formatTZS(feeAmount)}`, `Pay ${formatTZS(feeAmount)}`)
                  : t("Nunua Kifurushi", "Buy Bundle")}
              </button>
              <button
                onClick={onGoToListings}
                className="w-full py-2.5 mt-2 text-sm font-medium underline underline-offset-2"
              >
                {t("Angalia kwenye Mali Zangu", "View in My Listings")}
              </button>
            </div>
          )}

          {stage === "paying" && paymentMode === "flat" && (
            <PaymentGateway
              amount={feeAmount}
              title={t("Ada ya Kuchapisha", "Listing Fee")}
              description={t(
                `Kuchapisha "${effectiveTitle}"`,
                `Publishing "${effectiveTitle}"`
              )}
              onInitiate={handleFeeInitiate}
              onSuccess={handleFeeSuccess}
              onCancel={() => setStage("review")}
            />
          )}

          {stage === "paying" && paymentMode === "bundle" && (
            <PaymentGateway
              amount={pendingBundlePurchase?.bundle?.price || 0}
              title={t("Nunua Kifurushi cha Listing", "Buy Listing Bundle")}
              description={t(
                `Credits zitaingizwa kwenye akaunti yako`,
                `Credits will be added to your account`
              )}
              onInitiate={handleBundlePaymentInitiate}
              onSuccess={handleBundlePaymentSuccess}
              onCancel={() => {
                setStage("review");
                setPendingBundlePurchase(null);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // DONE STAGE — kila listing inasubiri admin approval
  // ═══════════════════════════════════════════════════════════
  if (stage === "done") {
    return (
      <div
        className="w-full flex items-center justify-center p-6"
        style={{ background: COLORS.sand, minHeight: "600px" }}
      >
        <div
          className="max-w-md w-full text-center bg-white rounded-2xl border p-8"
          style={{ borderColor: COLORS.sandLine }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: COLORS.green }}
          >
            <Check color={COLORS.sand} size={26} />
          </div>
          <h2 className="h-title mb-2">
            {t("Listing imewasilishwa!", "Listing Submitted!")}
          </h2>
          <p className="text-secondary text-sm mb-6">
            {t(
              "Listing yako inasubiri idhini ya Admin. Utapata taarifa mara itakapoidhinishwa.",
              "Your listing awaits admin approval. You'll be notified once it's approved."
            )}
          </p>
          <button
            onClick={onGoToListings}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="w-full py-3 rounded-xl font-semibold text-sm"
          >
            {t("Nenda kwenye Mali Zangu", "Go to My Listings")}
          </button>
          <button
            onClick={reset}
            className="w-full py-2 mt-2 text-body-sm font-medium"
          >
            {t("Weka Mali Nyingine", "Post Another Property")}
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // FORM STAGE
  // ═══════════════════════════════════════════════════════════
  return (
    <div style={{ background: COLORS.sand, minHeight: "600px" }} className="w-full p-4 sm:p-6">
      {cropQueue.length > 0 && (
        <ImageCropper
          key={cropQueue[0].name + cropQueue[0].size + cropQueue.length}
          file={cropQueue[0]}
          lang={lang}
          outputSize={1080}
          onConfirm={handleCropDone}
          onCancel={handleCropSkip}
        />
      )}
      <div className="max-w-2xl mx-auto">
        {error && (
          <div
            className="rounded-xl px-4 py-3 mb-4 flex items-center gap-2 text-sm"
            style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
          >
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {category && (
          <div className="flex justify-center mb-3">
            <button
              onClick={() =>
                activeMode ? setMode(null) : clearCategory()
              }
              className="text-primary flex items-center gap-1 text-sm font-medium opacity-70"
            >
              <ChevronLeft size={16} />{" "}
              {activeMode
                ? t("Badilisha Chaguo", "Change Option")
                : t("Badilisha Category", "Change Category")}
            </button>
          </div>
        )}

        <div className="mb-6 text-center">
          <h1 className="h-title">
            {t("Weka Mali Yako", "Post Your Property")}
          </h1>
          <p className="text-secondary text-sm mt-2 max-w-xl mx-auto">
            {category
              ? `${t("Category", "Category")}: ${categoryLabel}${
                  activeMode ? ` — ${activeMode.label[lang]}` : ""
                }`
              : t(
                  "Chagua category ya mali unayotaka kuiweka",
                  "Choose the category of the property you want to list"
                )}
          </p>
          {/* Onyesha kama listing fee imezimwa */}
          {category && listingFeeDisabled && (
            <div
              className="mt-3 rounded-xl border px-4 py-2.5 inline-flex items-center gap-2 text-xs"
              style={{
                background: "rgba(47,109,79,0.10)",
                borderColor: "rgba(47,109,79,0.35)",
                color: COLORS.green,
              }}
            >
              <Check size={14} />
              {t(
                "Ada ya kuchapisha imezimwa — unaweka bure. Lakini listing bado itapitia idhini ya Admin.",
                "Listing fee is disabled — post for free. But the listing still requires admin approval."
              )}
            </div>
          )}
        </div>

        {!category && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.iconKey);
              const hasPhoto = Boolean(cat.imageUrl);
              const catLabel = cat.label?.[lang] || cat.label?.sw;
              return (
                <button
                  key={cat.key}
                  onClick={() => chooseCategory(cat.key)}
                  style={{ borderColor: COLORS.sandLine, background: "white" }}
                  className="flex flex-col items-center text-center gap-3 p-4 rounded-2xl border hover:shadow-sm transition-shadow overflow-hidden"
                >
                  {hasPhoto ? (
                    <img
                      src={cat.imageUrl}
                      alt={catLabel}
                      className="w-full aspect-square rounded-xl object-cover object-center"
                    />
                  ) : (
                    <div
                      style={{ background: COLORS.night }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                    >
                      <Icon size={18} color={COLORS.gold} />
                    </div>
                  )}
                  <span className="text-primary text-sm font-semibold">
                    {catLabel}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {category && needsMode && (
          <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cfg.modes.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => chooseMode(m.key)}
                style={{ borderColor: COLORS.sandLine, background: "white" }}
                className="rounded-2xl border p-5 text-center hover:shadow-sm transition-shadow"
              >
                <span className="block text-primary text-base font-semibold">
                  {m.label[lang]}
                </span>
                <span className="block text-secondary text-xs mt-1">
                  {m.desc[lang]}
                </span>
              </button>
            ))}
          </div>
        )}

        {category && !needsMode && (
          <form onSubmit={handleFormSubmit} className="max-w-md mx-auto flex flex-col gap-5">
            <Field
              label={
                photosOptional
                  ? t(
                      "Picha (hiari, mpaka 8) — zitakatwa kuwa mraba",
                      "Photos (optional, up to 8) — cropped to square"
                    )
                  : t(
                      "Picha za Mali (angalau 1, mpaka 8) — zitakatwa kuwa mraba",
                      "Property Photos (at least 1, up to 8) — cropped to square"
                    )
              }
            >
              <div className="flex flex-wrap justify-center gap-2">
                {photos.map((p, i) => (
                  <div
                    key={i}
                    className="relative w-20 h-20 aspect-square rounded-xl overflow-hidden"
                  >
                    <img
                      src={p.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
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
                    className="w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer text-body-sm"
                  >
                    <ImagePlus size={18} />
                    {t("Ongeza", "Add")}
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

            <Field label={`${titleLabel[lang] || titleLabel.sw} *`}>
              <input
                style={inputStyle}
                className={inputCls}
                placeholder={
                  suggestedTitle
                    ? t(`mfano: ${suggestedTitle}`, `e.g. ${suggestedTitle}`)
                    : titlePlaceholder[lang] || titlePlaceholder.sw
                }
                value={base.title}
                onChange={(e) => setBase({ ...base, title: e.target.value })}
              />
              {suggestedTitle && !base.title.trim() && (
                <span className="text-[11px] text-secondary">
                  {t("Kidokezo", "Hint")}: <b>{suggestedTitle}</b> —{" "}
                  {t(
                    "unaweza kuandika jina lako mwenyewe",
                    "you can write your own title"
                  )}
                </span>
              )}
            </Field>

            {visibleFields.length > 0 && (
              <div
                style={{ borderColor: COLORS.sandLine, background: "white" }}
                className="rounded-2xl border p-4 flex flex-col gap-4"
              >
                <span
                  style={{ color: COLORS.rust }}
                  className="text-body-sm font-semibold text-center"
                >
                  {t("Taarifa za Ziada", "Additional Details")} — {categoryLabel}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {visibleFields.map((f) => (
                    <div
                      key={f.key}
                      className={f.type === "textarea" ? "sm:col-span-2" : ""}
                    >
                      <SchemaField
                        f={f}
                        lang={lang}
                        value={extra[f.key]}
                        onChange={(v) => setExtraField(f.key, v)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{ borderColor: COLORS.sandLine, background: "white" }}
              className="rounded-2xl border p-4 flex flex-col gap-4"
            >
              <span className="text-primary text-sm font-medium text-center">
                {locationLabel[lang] || locationLabel.sw} *
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label={`${t("Mkoa", "Region")} *`}>
                  <select
                    style={inputStyle}
                    className={inputCls}
                    value={loc.mkoa}
                    onChange={(e) =>
                      setLoc({
                        mkoa: e.target.value,
                        wilaya: "",
                        eneo: loc.eneo,
                      })
                    }
                  >
                    <option value="">{t("Chagua...", "Choose...")}</option>
                    {TZ_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("Wilaya", "District")}>
                  <input
                    style={inputStyle}
                    className={inputCls}
                    list="dl-wilaya"
                    placeholder={t("mfano: Kinondoni", "e.g. Kinondoni")}
                    value={loc.wilaya}
                    onChange={(e) =>
                      setLoc({ ...loc, wilaya: e.target.value })
                    }
                  />
                  <datalist id="dl-wilaya">
                    {(WILAYA_SUGGESTIONS[loc.mkoa] || []).map((w) => (
                      <option key={w} value={w} />
                    ))}
                  </datalist>
                </Field>
                <Field label={`${t("Eneo", "Area")} *`}>
                  <input
                    style={inputStyle}
                    className={inputCls}
                    placeholder={t("mfano: Mbezi Beach", "e.g. Mbezi Beach")}
                    value={loc.eneo}
                    onChange={(e) => setLoc({ ...loc, eneo: e.target.value })}
                  />
                </Field>
              </div>
            </div>

            <Field
              label={`${
                priceMeta.label[lang] || priceMeta.label.sw
              }${priceMeta.optional ? "" : " *"}`}
            >
              <input
                style={inputStyle}
                type="text"
                inputMode="numeric"
                className={inputCls}
                placeholder={t("mfano: 85,000,000", "e.g. 85,000,000")}
                value={formatPriceInput(base.price)}
                onChange={(e) =>
                  setBase({ ...base, price: cleanPriceInput(e.target.value) })
                }
              />
              {priceMeta.optional && (
                <span className="text-[11px] text-secondary">
                  {t(
                    "Hiari — acha wazi kama inajadiliwa.",
                    "Optional — leave empty if negotiable."
                  )}
                </span>
              )}
            </Field>

            <Field label={descLabel[lang] || descLabel.sw}>
              <textarea
                style={inputStyle}
                rows={4}
                className={`${inputCls} resize-none`}
                placeholder={t("Eleza kwa ufupi...", "Briefly describe...")}
                value={base.description}
                onChange={(e) =>
                  setBase({ ...base, description: e.target.value })
                }
              />
            </Field>

            {duplicateWarning && (
              <div
                style={{
                  background: "rgba(232,163,61,0.15)",
                  color: "#8A5A16",
                  borderColor: "rgba(232,163,61,0.4)",
                }}
                className="rounded-xl border px-4 py-3 flex items-start gap-2.5 text-sm"
              >
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold mb-0.5">
                    {t("Tangazo linalofanana lipo", "Similar listing exists")}
                  </p>
                  <p className="text-xs leading-relaxed">
                    {t(
                      `Umekwisha kuweka tangazo "${
                        duplicateWarning.title || ""
                      }" lenye bei sawa na mahali sawa. Tafadhali badilisha jina, bei, au mahali ili kuendelea.`,
                      `You already have a listing "${
                        duplicateWarning.title || ""
                      }" with the same price and location. Please change the title, price, or location to continue.`
                    )}
                  </p>
                </div>
              </div>
            )}

            {cfg.modes && (
              <p
                className="text-center text-xs text-secondary rounded-xl px-3 py-2"
                style={{
                  background: "white",
                  border: `1px solid ${COLORS.sandLine}`,
                }}
              >
                {t(
                  "Mawasiliano yote yatafanyika kupitia Deal Room — hakuna haja ya kuweka namba ya simu.",
                  "All contact happens through the Deal Room — no need to add a phone number."
                )}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                background: canSubmit ? COLORS.gold : COLORS.sandLine,
                color: canSubmit ? COLORS.night : "rgba(16,26,46,0.4)",
              }}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />{" "}
                  {t("Inawasilisha...", "Submitting...")}
                </>
              ) : (
                t("Wasilisha", "Submit")
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
