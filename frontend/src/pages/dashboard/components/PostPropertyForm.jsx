import React, { useState, useEffect, useRef } from "react";
import {
  ImagePlus, X, ChevronLeft, Check, Loader2, AlertTriangle,
  Wallet, Package, Receipt, Send,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { COLORS, formatTZS, calculateListingFee } from "./shared";
import {
  useActiveCategories, getCategoryIcon, getCategoryIdByKey,
} from "../../../config/categoriesStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import { checkCredit } from "../../../config/userCreditsStore.js";
import { checkDuplicateListingAsync } from "../../../config/listingsStore.js";
import {
  getListingFeeConfig,
  hydrateListingFeeConfigsFromApi,
} from "../../../config/listingFeeStore.js";
import { useActiveBundles } from "../../../config/bundlesStore.js";
import { api } from "../../../api/client.js";
import PaymentGateway from "./PaymentGateway";
import ImageCropper from "../../../components/ImageCropper.jsx";
import LocationPicker from "../../../components/LocationPicker.jsx";
import {
  getPostingConfig,
  getVisibleFields,
  getPriceMeta,
  TZ_REGIONS,
  WILAYA_SUGGESTIONS,
} from "../../../config/categorySchemas.js";

const SUBMIT_FOR_REVIEW_FIRST = true;

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-center">
      <span className="text-primary text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "rounded-xl border border-hairline bg-card text-primary px-3 py-2.5 text-sm outline-none text-center w-full focus:border-gold focus:ring-1 focus:ring-gold transition-colors";

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
          className={inputCls}
          type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
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

export default function PostPropertyForm({
  mode = "create",
  initialData = null,
  onSubmit = () => {},
  onGoToListings = () => {},
  onPaid = () => {},
  onGoToBoost = () => {},
}) {
  const isEdit = mode === "edit" && !!initialData;
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const categories = useActiveCategories();
  const listingBundles = useActiveBundles().filter((b) => b.type === "listing");

  const [categoryKey, setCategoryKey] = useState(() => {
    if (!isEdit || !initialData) return null;
    const found = categories.find(
      (c) => c.key === initialData.category || c.slug === initialData.category
    );
    return found?.key || initialData.category || null;
  });
  const [categoryMode, setCategoryMode] = useState(
    isEdit ? initialData.attributes?.mode || null : null
  );
  const [loc, setLoc] = useState(() => {
    if (isEdit && initialData) {
      const attrs = initialData.attributes || {};
      return {
        mkoa: attrs.region || initialData.region || "",
        wilaya: attrs.district || "",
        eneo: attrs.area || "",
      };
    }
    return { mkoa: "", wilaya: "", eneo: "" };
  });
  const [lat, setLat] = useState(
    isEdit && initialData ? (initialData.latitude != null ? Number(initialData.latitude) : null) : null
  );
  const [lng, setLng] = useState(
    isEdit && initialData ? (initialData.longitude != null ? Number(initialData.longitude) : null) : null
  );
  const [addressText, setAddressText] = useState(
    isEdit && initialData ? (initialData.address_text || "") : ""
  );

  const [photos, setPhotos] = useState(() => {
    if (!isEdit || !initialData) return [];
    const urls = Array.isArray(initialData.photos) ? initialData.photos : [];
    return urls
      .map((u) => (typeof u === "string" ? u : u?.url || u?.image_url))
      .filter(Boolean)
      .map((url) => ({ file: null, url, existing: true }));
  });
  const [cropQueue, setCropQueue] = useState([]);
  const [stage, setStage] = useState("form");
  const [createdListing, setCreatedListing] = useState(null);
  const [feeAmount, setFeeAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [isFreeCategory, setIsFreeCategory] = useState(false);
  const [feeConfigLoaded, setFeeConfigLoaded] = useState(false);

  const [paymentMode, setPaymentMode] = useState("flat");
  const [bundleId, setBundleId] = useState(null);
  const [pendingBundlePurchase, setPendingBundlePurchase] = useState(null);

  const [base, setBase] = useState(() => {
    if (isEdit && initialData) {
      return {
        title: initialData.title || "",
        price: initialData.price ? String(initialData.price) : "",
        location: initialData.location || "",
        description: initialData.description || "",
        seller_name: initialData.seller_name || "",
        contact_pref: lang === "sw" ? "Simu" : "Phone",
      };
    }
    return {
      title: "",
      price: "",
      location: "",
      description: "",
      seller_name: "",
      contact_pref: lang === "sw" ? "Simu" : "Phone",
    };
  });

  const [extra, setExtra] = useState(() => {
    if (!isEdit || !initialData?.attributes) return {};
    const { region, district, area, mode: _m, ...rest } = initialData.attributes || {};
    return rest;
  });

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const category = categories.find((c) => c.key === categoryKey);
  const categoryLabel = category?.label?.[lang] || category?.label?.sw || "";

  const cfg = getPostingConfig(categoryKey);
  const activeMode = cfg.modes?.find((m) => m.key === categoryMode) || null;
  const needsMode = Boolean(cfg.modes) && !activeMode && !isEdit;
  const visibleFields = getVisibleFields(category?.extra, cfg, categoryMode, extra);
  const priceMeta = getPriceMeta(cfg, categoryMode, extra);
  const titleLabel =
    activeMode?.titleLabel || cfg.titleLabel || { sw: "Jina la Mali", en: "Property Title" };
  const titlePlaceholder =
    activeMode?.titlePlaceholder ||
    cfg.titlePlaceholder || { sw: "mfano: Nyumba ya Ghorofa Mbezi Beach", en: "e.g. Mbezi Beach Apartment Building" };
  const locationLabel =
    activeMode?.locationLabel || cfg.locationLabel || { sw: "Mahali", en: "Location" };
  const descLabel = activeMode?.descLabel || { sw: "Maelezo", en: "Description" };
  const photosOptional = Boolean(cfg.photosOptional);

  const suggestedTitle = cfg.autoTitle ? cfg.autoTitle(extra) : "";
  const effectiveTitle = base.title.trim();
  const locationString = [loc.eneo.trim(), loc.wilaya.trim(), loc.mkoa].filter(Boolean).join(", ");

  const creditInfo = checkCredit(user?.id, "listing");
  const hasCredit = creditInfo.hasCredit;
  const listingCreditRemaining = creditInfo.remaining || 0;

  useEffect(() => {
    hydrateListingFeeConfigsFromApi()
      .then(() => setFeeConfigLoaded(true))
      .catch((err) => {
        console.warn("[PostPropertyForm] fee hydrate failed:", err);
        setFeeConfigLoaded(true);
      });
  }, []);

  const categoryFeeConfig = categoryKey ? getListingFeeConfig(categoryKey) : null;
  const listingFeeDisabled = categoryFeeConfig ? categoryFeeConfig.isActive === false : true;

  const selectedBundle = listingBundles.find((b) => b.id === bundleId);

  useEffect(() => {
    if (!bundleId && listingBundles.length) {
      setBundleId(listingBundles[0].id);
    }
  }, [listingBundles, bundleId]);

  useEffect(() => {
    if (isEdit) return;
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
  }, [effectiveTitle, base.price, loc.mkoa, loc.wilaya, loc.eneo, categoryKey, isEdit]);

  // ✅ Mobile Navigation: back button/gesture inarudi hatua moja moja
  // (paying → review → form, option → category → category list)
  // Kila hatua mbele inaongeza history entry moja; back ya simu inaiondoa moja moja.
  const historyDepthRef = useRef(0);
  const ignorePopRef = useRef(0);

  const stepLevel = stage === "paying" ? 2 : stage === "review" ? 1 : 0;
  const formLevel = isEdit ? 0 : (categoryKey ? 1 : 0) + (categoryMode ? 1 : 0);
  const navLevel = stepLevel + formLevel;

  // Sawazisha history na level ya sasa (mbele = push, nyuma kwa button ya ndani = go(-n))
  useEffect(() => {
    const depth = historyDepthRef.current;
    if (navLevel > depth) {
      for (let i = depth; i < navLevel; i++) {
        window.history.pushState(
          { ...(window.history.state || {}), ppfStep: i + 1 },
          "",
          window.location.href
        );
      }
      historyDepthRef.current = navLevel;
    } else if (navLevel < depth) {
      // Mtumiaji amerudi kwa button ya ndani (mf. "Change Category") —
      // ondoa entries za ziada ili back ya simu isibaki "imekufa"
      const diff = depth - navLevel;
      ignorePopRef.current += 1;
      historyDepthRef.current = navLevel;
      window.history.go(-diff);
    }
  }, [navLevel]);

  // Back ya simu / gesture
  useEffect(() => {
    const handlePopState = () => {
      if (ignorePopRef.current > 0) {
        ignorePopRef.current -= 1;
        return;
      }
      if (historyDepthRef.current === 0) return; // hakuna cha kurudi — acha router ifanye kazi yake

      historyDepthRef.current -= 1; // browser tayari imerudi nyuma entry moja
      setError("");

      if (stage === "paying") setStage("review");
      else if (stage === "review") setStage("form");
      else if (!isEdit && categoryMode) setCategoryMode(null);
      else if (!isEdit && categoryKey) {
        setCategoryKey(null);
        setCategoryMode(null);
        setExtra({});
        setDuplicateWarning(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [stage, categoryKey, categoryMode, isEdit]);

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 8 - photos.length);
    setCropQueue((q) => [...q, ...files]);
    e.target.value = "";
  };
  const handleCropDone = (cropped) => {
    setPhotos((p) =>
      p.length >= 8 ? p : [...p, { file: cropped, url: URL.createObjectURL(cropped) }]
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
    if (isEdit) return;
    const foundCategory = categories.find((c) => c.key === key);
    if (!foundCategory) return;
    setCategoryKey(foundCategory.key);
    setCategoryMode(null);
    setExtra({});
    setError("");
    setDuplicateWarning(null);
  };
  const clearCategory = () => {
    if (isEdit) return;
    // Rudisha moja kwa moja kwenye orodha ya categories
    // (chooseCategory(null) ilirudi mapema kwa sababu null haipo kwenye categories)
    setCategoryKey(null);
    setCategoryMode(null);
    setExtra({});
    setError("");
    setDuplicateWarning(null);
  };
  const chooseMode = (m) => {
    setCategoryMode(m);
    setExtra({});
  };

  const buildSummary = () => {
    const lines = [];
    if (activeMode) lines.push(`${t("Aina", "Type")}: ${activeMode.label[lang]}`);
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
    setWarnings([]);
    setCreatedListing(null);
    setCategoryKey(null);
    setCategoryMode(null);
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

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");

    if (isEdit) {
      const payload = {
        title: effectiveTitle,
        description: base.description.trim(),
        price: Number(cleanPriceInput(base.price)) || 0,
        location: locationString,
        attributes: {
          ...extra,
          ...(categoryMode ? { mode: categoryMode } : {}),
          region: loc.mkoa,
          district: loc.wilaya.trim(),
          area: loc.eneo.trim(),
        },
      };

      try {
        const res = await onSubmit(payload);
        if (!res?.ok) {
          setError(
            res?.error?.data?.detail ||
              res?.error?.message ||
              t("Imeshindwa kuhifadhi.", "Failed to save.")
          );
        }
      } catch (err) {
        setError(err?.message || t("Hitilafu imetokea.", "Something went wrong."));
      } finally {
        setSubmitting(false);
      }
      return;
    }

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
        t("Category haina backend id. Hydrate kwanza.", "Category has no backend id. Hydrate first.")
      );
      setSubmitting(false);
      return;
    }

    try {
      const { createListingWithImagesAsync } = await import("../../../config/listingsStore.js");
      const createRes = await createListingWithImagesAsync({
        payload: {
          category: categoryId,
          category_key: categoryKey,
          title: effectiveTitle,
          description: [base.description.trim(), buildSummary()].filter(Boolean).join("\n\n"),
          price: Number(cleanPriceInput(base.price)) || 0,
          location: locationString,
          latitude: lat,
          longitude: lng,
          address_text: addressText,
          attributes: {
            ...extra,
            ...(categoryMode ? { mode: categoryMode } : {}),
            region: loc.mkoa,
            district: loc.wilaya.trim(),
            area: loc.eneo.trim(),
          },
        },
        images: photos.filter((p) => p.file && !p.existing),
      });

      if (!createRes.ok) {
        throw createRes.error;
      }

      const created = createRes.raw;
      const listingId = createRes.listing.id;
      const inlineFee = Number(created?.fee_amount ?? 0);

      const detailEndpoint = CATEGORY_DETAIL_ENDPOINT[categoryKey];
      if (detailEndpoint) {
        const detailBody = {};
        const FUEL_MAP = { Petrol: "PETROL", Diesel: "DIESEL", Hybrid: "HYBRID", "Umeme (EV)": "ELECTRIC" };
        const SIZE_UNIT_MAP = { Sqm: "SQM", Ekari: "ACRE", Hekta: "HECTARE" };
        
        if (categoryKey === "nyumba") {
          if (extra.vyumba) detailBody.bedrooms = Number(extra.vyumba);
          if (extra.bafu) detailBody.bathrooms = Number(extra.bafu);
          if (extra.ukubwa) detailBody.area_sqm = String(extra.ukubwa);
          const PROPERTY_TYPE_MAP = {
            "Nyumba ya Kawaida": "HOUSE",
            "Apartment": "APARTMENT",
            "Villa": "VILLA",
            "Studio / Chumba": "STUDIO",
            "Townhouse": "TOWNHOUSE",
          };
          detailBody.property_type = PROPERTY_TYPE_MAP[extra.aina] || "HOUSE";
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
          detailBody.transmission = String(extra.transmission || "Automatic").toUpperCase();
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

      if (SUBMIT_FOR_REVIEW_FIRST || listingFeeDisabled) {
        let publishOk = false;
        let publishErr = null;
        try {
          await api.post(`/listings/${listingId}/publish/`, {});
          publishOk = true;
        } catch (pubErr) {
          publishErr = pubErr;
          console.warn("[PostPropertyForm] publish failed:", pubErr);
        }

        setCreatedListing(created);
        setFeeAmount(0);

        if (publishOk || listingFeeDisabled) {
          setStage("done");
          onSubmit?.(created);
          return;
        }

        setError(
          t(
            `Tangazo limehifadhiwa lakini halijatumwa kwa admin (${
              publishErr?.data?.detail || publishErr?.message || "network error"
            }). Nenda Mali Zangu na ubonyeze "Wasilisha kwa Admin".`,
            `Listing saved but not submitted to admin (${
              publishErr?.data?.detail || publishErr?.message || "network error"
            }). Go to My Listings and click "Submit for Review".`
          )
        );
        setStage("review");
        onSubmit?.(created);
        return;
      }

      if (hasCredit) {
        try {
          await api.post(`/listings/${listingId}/fee/pay/`, { payment_reference: "credits" });
          onPaid?.(listingId, { alreadyPaid: true });
          setCreatedListing(created);
          setFeeAmount(0);
          setIsFreeCategory(true);
          setStage("done");
          onSubmit?.(created);
          return;
        } catch (creditErr) {
          console.warn("[PostPropertyForm] credit consumption failed:", creditErr);
        }
      }

      const inlineFeeFromPayment = Number(created?.payment?.amount ?? created?.payment?.fee_amount ?? 0);
      let fee = inlineFee || inlineFeeFromPayment;
      let feeSource = fee > 0 ? "inline" : "backend";

      let isFreeCategoryLocal =
        created?.payment?.is_free === true ||
        (created?.payment?.required === false && fee === 0);

      if (!fee && !isFreeCategoryLocal && !listingFeeDisabled) {
        try {
          const feeRes = await api.get(`/listings/${listingId}/fee/`);
          const backendFree =
            feeRes?.is_disabled === true ||
            feeRes?.payment_status === "FREE" ||
            feeRes?.amount === "0.00";
          fee = Number(feeRes?.amount) || Number(feeRes?.fee_amount) || 0;
          if (backendFree && fee === 0) isFreeCategoryLocal = true;
          if (!fee && !backendFree) throw new Error("Backend returned zero fee");
        } catch (feeErr) {
          feeSource = "local";
          console.warn("[PostPropertyForm] backend fee missing, falling back to local:", feeErr?.status || feeErr?.message);
          const local = calculateListingFee(categoryKey, cleanPriceInput(base.price));
          fee = Number(local?.fee) || 0;
        }
      }

      if (!fee && listingFeeDisabled) isFreeCategoryLocal = true;

      setCreatedListing(created);
      setFeeAmount(fee);
      setIsFreeCategory(Boolean(isFreeCategoryLocal));
      setStage("review");
      onSubmit?.(created);
    } catch (err) {
      setError(
        err?.data?.detail ||
          (err?.data && typeof err.data === "object"
            ? Object.values(err.data).flat().find((v) => typeof v === "string")
            : null) ||
          err?.message ||
          t("Imeshindwa kuweka listing.", "Failed to create listing.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryPublish = async () => {
    if (!createdListing) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post(`/listings/${createdListing.id}/publish/`, {});
      setStage("done");
      onSubmit?.(createdListing);
    } catch (err) {
      setError(err?.data?.detail || err?.message || t("Imeshindwa kuwasilisha.", "Failed to submit."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeeInitiate = async ({ methodKey, phone } = {}) => {
    if (!createdListing) return { ok: false, error: new Error("no listing") };
    try {
      const res = await api.post(`/listings/${createdListing.id}/fee/pay/`, {
        payment_method: methodKey || "",
        phone: phone || "",
      });
      const candidates = [res?.fimipay, res?.data?.fimipay, res?.data, res].filter(Boolean);
      const payload = candidates.find((c) => c && (c.order_id || c.payment_status)) || {};

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

  const handleUseCredit = async () => {
    if (!createdListing || !user) return;
    setError("");
    try {
      await api.post(`/listings/${createdListing.id}/fee/pay/`, { payment_reference: "credits" });
      onPaid?.(createdListing.id, { alreadyPaid: true });
      setStage("done");
    } catch (err) {
      setError(err?.data?.detail || err?.message || t("Imeshindwa kutumia credit.", "Failed to use credit."));
    }
  };

  const handleFreeSubmit = async () => {
    if (!createdListing) return;
    setSubmitting(true);
    setError("");
    try {
      await api.post(`/listings/${createdListing.id}/fee/pay/`, { payment_reference: "free" });
      onPaid?.(createdListing.id, { alreadyPaid: true });
      setStage("done");
    } catch (err) {
      setError(err?.data?.detail || err?.message || t("Imeshindwa kuwasilisha.", "Failed to submit."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBeginBundlePurchase = async () => {
    if (!selectedBundle) return;
    setSubmitting(true);
    setError("");
    try {
      const purchase = await api.post("/bundles/purchases/", { bundle: selectedBundle.id });
      const purchaseId = purchase?.id || purchase?.purchase_id || purchase?.purchaseId;
      if (!purchaseId) throw new Error("Backend did not return purchase id.");
      setPendingBundlePurchase({ id: purchaseId, bundle: selectedBundle });
      setStage("paying");
    } catch (err) {
      setError(
        err?.data?.detail ||
          err?.message ||
          t("Imeshindwa kununua kifurushi. Jaribu tena.", "Could not purchase bundle. Try again.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBundlePaymentInitiate = async ({ methodKey, phone } = {}) => {
    if (!pendingBundlePurchase) return { ok: false, error: new Error("no bundle") };
    try {
      const paid = await api.post(`/bundles/purchases/${pendingBundlePurchase.id}/pay/`, {
        payment_method: methodKey || "",
        phone: phone || "",
      });
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
    if (!createdListing) return;
    try {
      await api.post(`/listings/${createdListing.id}/fee/pay/`, { payment_reference: "credits" });
      onPaid?.(createdListing.id, { alreadyPaid: true });
      setStage("done");
    } catch (err) {
      console.warn("[PostPropertyForm] credit after bundle failed:", err);
      setStage("done");
    }
  };

  if (!isEdit && (stage === "review" || stage === "paying")) {
    const needsRetryPublish = stage === "review" && createdListing && feeAmount === 0 && !!error;

    return (
      <div className="w-full flex items-center justify-center p-6 bg-page min-h-screen">
        <div className="max-w-md w-full">
          {stage === "review" && (
            <div className="text-center bg-card rounded-2xl border border-hairline p-8">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: needsRetryPublish ? COLORS.rust : COLORS.green }}
              >
                {needsRetryPublish ? (
                  <AlertTriangle color={COLORS.sand} size={26} />
                ) : (
                  <Check color={COLORS.sand} size={26} />
                )}
              </div>
              <h2 className="h-title mb-2">
                {needsRetryPublish
                  ? t("Tangazo limehifadhiwa", "Listing Saved")
                  : t("Listing imeundwa", "Listing Created")}
              </h2>
              <p className="text-secondary text-sm mb-5">
                {needsRetryPublish
                  ? t(
                      "Tangazo lako limehifadhiwa lakini halijatumwa kwa admin. Bonyeza kitufe hapa chini kujaribu tena.",
                      "Your listing was saved but not sent to admin. Click the button below to retry."
                    )
                  : t(
                      "Lipa ada ili listing iwasilishwe kwa admin kuidhinisha.",
                      "Pay the fee so the listing is submitted to admin for approval."
                    )}
              </p>

              {error && (
                <div
                  className="rounded-lg px-3 py-2 mb-3 text-xs text-left"
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

              {needsRetryPublish && (
                <button
                  onClick={handleRetryPublish}
                  disabled={submitting}
                  style={{ background: COLORS.green, color: "white" }}
                  className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 mb-3"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {t("Jaribu Tena Kuwasilisha", "Retry Submit to Admin")}
                </button>
              )}

              {!needsRetryPublish && (
                <>
                  <div className="rounded-xl border border-hairline p-4 mb-4 bg-page">
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">
                        {t("Ada ya Kuchapisha", "Listing Fee")}
                      </span>
                      <span className="font-bold" style={{ color: COLORS.rust }}>
                        {feeAmount > 0 ? formatTZS(feeAmount) : t("Haijawekwa", "Not set")}
                      </span>
                    </div>

                    {feeAmount === 0 && (
                      <p className="mt-2 text-[11px] leading-snug" style={{ color: COLORS.rust }}>
                        {t(
                          "Ada ya kuchapisha haijawekwa kwa kategoria hii. Wasiliana na Admin ili kuweka kiasi kabla ya kuendelea.",
                          "No listing fee is configured for this category. Contact Admin to set an amount before continuing."
                        )}
                      </p>
                    )}
                  </div>

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

                  {listingBundles.length > 0 && (
                    <div className="flex justify-center gap-2 mb-4">
                      <button
                        onClick={() => setPaymentMode("flat")}
                        className="flex-1 text-xs font-semibold px-3 py-2 rounded-full border transition-colors"
                        style={{
                          background: paymentMode === "flat" ? COLORS.night : "transparent",
                          color: paymentMode === "flat" ? COLORS.sand : "inherit",
                          borderColor: paymentMode === "flat" ? COLORS.night : COLORS.sandLine,
                        }}
                      >
                        {t("Ada ya Kawaida", "Flat Fee")}
                      </button>
                      <button
                        onClick={() => setPaymentMode("bundle")}
                        className="flex-1 text-xs font-semibold px-3 py-2 rounded-full border transition-colors"
                        style={{
                          background: paymentMode === "bundle" ? COLORS.night : "transparent",
                          color: paymentMode === "bundle" ? COLORS.sand : "inherit",
                          borderColor: paymentMode === "bundle" ? COLORS.night : COLORS.sandLine,
                        }}
                      >
                        {t("Kifurushi (Bundle)", "Bundle Package")}
                      </button>
                    </div>
                  )}

                  {paymentMode === "bundle" && listingBundles.length > 0 && (
                    <div className="flex flex-col gap-2 mb-4">
                      {listingBundles.map((b) => {
                        const selected = b.id === bundleId;
                        const other = lang === "sw" ? "en" : "sw";
                        const bName = b.name?.[lang] || b.name?.[other] || t("Kifurushi", "Bundle");
                        return (
                          <button
                            key={b.id}
                            onClick={() => setBundleId(b.id)}
                            style={{
                              borderColor: selected ? COLORS.gold : COLORS.sandLine,
                              background: selected ? "rgba(232,163,61,0.08)" : "transparent",
                            }}
                            className="flex items-center justify-between gap-2 p-3 rounded-xl border border-hairline text-left"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Package size={14} color={COLORS.gold} />
                              <span className="text-sm font-semibold text-primary truncate">
                                {bName}
                              </span>
                            </div>
                            <span className="text-sm font-bold shrink-0" style={{ color: COLORS.rust }}>
                              {formatTZS(b.price)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button
                    onClick={
                      isFreeCategory || listingFeeDisabled
                        ? handleFreeSubmit
                        : paymentMode === "flat"
                          ? () => setStage("paying")
                          : handleBeginBundlePurchase
                    }
                    disabled={
                      submitting ||
                      (feeAmount === 0 && !isFreeCategory && !listingFeeDisabled) ||
                      (paymentMode === "bundle" && !selectedBundle)
                    }
                    style={{ background: COLORS.gold, color: COLORS.night }}
                    className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                  >
                    {feeAmount === 0
                      ? t("Ada haijawekwa", "Fee not set")
                      : paymentMode === "flat"
                        ? t(`Lipa ${formatTZS(feeAmount)}`, `Pay ${formatTZS(feeAmount)}`)
                        : t("Nunua Kifurushi", "Buy Bundle")}
                  </button>
                </>
              )}

              <button
                onClick={onGoToListings}
                className="w-full py-2.5 mt-2 text-sm font-medium underline underline-offset-2 text-primary"
              >
                {t("Angalia kwenye Mali Zangu", "View in My Listings")}
              </button>
            </div>
          )}

          {stage === "paying" && paymentMode === "flat" && (
            <PaymentGateway
              amount={feeAmount}
              title={t("Ada ya Kuchapisha", "Listing Fee")}
              description={t(`Kuchapisha "${effectiveTitle}"`, `Publishing "${effectiveTitle}"`)}
              onInitiate={handleFeeInitiate}
              onSuccess={handleFeeSuccess}
              onCancel={() => setStage("review")}
            />
          )}

          {stage === "paying" && paymentMode === "bundle" && (
            <PaymentGateway
              amount={pendingBundlePurchase?.bundle?.price || 0}
              title={t("Nunua Kifurushi cha Listing", "Buy Listing Bundle")}
              description={t("Credits zitaingizwa kwenye akaunti yako", "Credits will be added to your account")}
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

  if (!isEdit && stage === "done") {
    return (
      <div className="w-full flex items-center justify-center p-6 bg-page min-h-screen">
        <div className="max-w-md w-full text-center bg-card rounded-2xl border border-hairline p-8">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: COLORS.green }}>
            <Check color={COLORS.sand} size={26} />
          </div>
          <h2 className="h-title mb-2">{t("Listing imewasilishwa!", "Listing Submitted!")}</h2>
          <p className="text-secondary text-sm mb-6">
            {isFreeCategory || listingFeeDisabled
              ? t(
                  "Admin atakagua tangazo lako. Likikubaliwa litakuwa hewani moja kwa moja — hakuna ada ya kulipa.",
                  "An admin will review your listing. Once approved it goes live right away — there is no fee to pay."
                )
              : t(
                  "Admin atakagua tangazo lako na kukujibu kwa ujumbe. Likikubaliwa, utaarifiwa kulipa ada ya kuchapisha; baada ya kulipa, admin ataliidhinisha liwe hewani.",
                  "An admin will review your listing and reply with a message. If accepted, you'll be asked to pay the listing fee; after payment the admin approves it to go live."
                )}
          </p>
          <button
            onClick={onGoToListings}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="w-full py-3 rounded-xl font-semibold text-sm"
          >
            {t("Nenda kwenye Mali Zangu", "Go to My Listings")}
          </button>
          <button onClick={reset} className="w-full py-2 mt-2 text-body-sm font-medium text-primary">
            {t("Weka Mali Nyingine", "Post Another Property")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-page min-h-screen w-full p-4 sm:p-6">
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
        {category && !isEdit && (
          <div className="flex justify-center mb-3">
            <button
              onClick={() => (activeMode ? setCategoryMode(null) : clearCategory())}
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
          <h1 className="h-title text-primary">
            {isEdit ? t("Hariri Tangazo", "Edit Listing") : t("Weka Mali Yako", "Post Your Property")}
          </h1>
          <p className="text-secondary text-sm mt-2 max-w-xl mx-auto">
            {isEdit
              ? `${t("Category", "Category")}: ${categoryLabel}`
              : category
                ? `${t("Category", "Category")}: ${categoryLabel}${
                    activeMode ? ` — ${activeMode.label[lang]}` : ""
                  }`
                : t("Chagua category ya mali unayotaka kuiweka", "Choose the category of the property you want to list")}
          </p>
          {!isEdit && category && feeConfigLoaded && (() => {
            const cfgFee = getListingFeeConfig(categoryKey);

            if (listingFeeDisabled || !cfgFee) {
              return (
                <div
                  className="mt-4 inline-flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm"
                  style={{
                    background: "rgba(47,109,79,0.10)",
                    borderColor: "rgba(47,109,79,0.35)",
                    color: COLORS.green,
                  }}
                >
                  <Check size={16} />
                  <span className="font-medium leading-relaxed">
                    {t(
                      "🎉 Chapisha tangazo lako bila malipo na anza kuuza kupitia SokoMkononi leo!",
                      "🎉 List for free and start selling on SokoMkononi today!"
                    )}
                  </span>
                </div>
              );
            }

            const isFlat = String(cfgFee.feeMode || "PERCENTAGE").toUpperCase() === "FLAT";
            const flat = Number(cfgFee.flatFee) || 0;
            const rate = Number(cfgFee.rate) || 0;
            const price = Number(cleanPriceInput(base.price)) || 0;

            let amount = 0;
            let basis = "";
            let amountKnown = false;

            if (isFlat) {
              amount = flat;
              amountKnown = true;
            } else {
              basis = t(
                `${(rate * 100).toFixed(2).replace(/\.?0+$/, "")}% ya bei ya mali`,
                `${(rate * 100).toFixed(2).replace(/\.?0+$/, "")}% of the listing price`
              );
              if (price > 0) {
                let f = price * rate;
                if (f < cfgFee.min) f = cfgFee.min;
                else if (f > cfgFee.max) f = cfgFee.max;
                f = Math.round(f / 500) * 500;
                amount = f;
                amountKnown = true;
              }
            }

            const noFee = amountKnown && amount === 0;

            return (
              <div
                className="mt-4 inline-flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm"
                style={{
                  background: noFee ? "rgba(47,109,79,0.10)" : "rgba(232,163,61,0.10)",
                  borderColor: noFee ? "rgba(47,109,79,0.35)" : "rgba(232,163,61,0.4)",
                  color: noFee ? COLORS.green : "#8A5A16",
                }}
              >
                {noFee ? <Check size={15} /> : <Receipt size={15} />}
                <span>
                  {t("Ada ya Kuchapisha:", "Listing Fee:")}{" "}
                  <b className="ml-0.5">
                    {noFee
                      ? t("Bure", "Free")
                      : amountKnown
                        ? formatTZS(amount)
                        : t("Itakokotolewa ukiweka bei", "Calculated after you enter a price")}
                  </b>
                  {basis && <span className="ml-1.5 text-[11px] opacity-70">({basis})</span>}
                </span>
              </div>
            );
          })()}
        </div>

        {!isEdit && !category && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.iconKey);
              const hasPhoto = Boolean(cat.imageUrl);
              const catLabel = cat.label?.[lang] || cat.label?.sw;
              return (
                <button
                  key={cat.key}
                  onClick={() => chooseCategory(cat.key)}
                  className="flex flex-col items-center text-center gap-3 p-4 rounded-2xl border border-hairline bg-card hover:shadow-sm transition-shadow overflow-hidden"
                >
                  {hasPhoto ? (
                    <img
                      src={cat.imageUrl}
                      alt={catLabel}
                      className="w-full aspect-square rounded-xl object-cover object-center"
                    />
                  ) : (
                    <div style={{ background: COLORS.night }} className="w-10 h-10 rounded-xl flex items-center justify-center">
                      <Icon size={18} color={COLORS.gold} />
                    </div>
                  )}
                  <span className="text-primary text-sm font-semibold">{catLabel}</span>
                </button>
              );
            })}
          </div>
        )}

        {!isEdit && category && needsMode && (
          <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cfg.modes.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => chooseMode(m.key)}
                className="rounded-2xl border border-hairline bg-card p-5 text-center hover:shadow-sm transition-shadow"
              >
                <span className="block text-primary text-base font-semibold">{m.label[lang]}</span>
                <span className="block text-secondary text-xs mt-1">{m.desc[lang]}</span>
              </button>
            ))}
          </div>
        )}

        {category && (!needsMode || isEdit) && (
          <form
            onSubmit={handleFormSubmit}
            className="mx-auto flex max-w-xl flex-col gap-5 rounded-3xl border-[1.5px] border-gold/60 bg-card p-4 shadow-[0_12px_32px_-18px_rgba(1,25,87,0.3)] sm:p-6"
          >
            <Field
              label={
                photosOptional
                  ? t("Picha (hiari, mpaka 8) — zitakatwa kuwa mraba", "Photos (optional, up to 8) — cropped to square")
                  : t("Picha za Mali (angalau 1, mpaka 8) — zitakatwa kuwa mraba", "Property Photos (at least 1, up to 8) — cropped to square")
              }
            >
              <div className="flex flex-wrap justify-center gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="relative w-20 h-20 aspect-square rounded-xl overflow-hidden">
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
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-hairline flex flex-col items-center justify-center gap-1 cursor-pointer text-body-sm text-primary">
                    <ImagePlus size={18} />
                    {t("Ongeza", "Add")}
                    <input type="file" accept="image/*" multiple hidden onChange={handlePhotoAdd} />
                  </label>
                )}
              </div>
            </Field>

            <Field label={`${titleLabel[lang] || titleLabel.sw} *`}>
              <input
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
                  {t("unaweza kuandika jina lako mwenyewe", "you can write your own title")}
                </span>
              )}
            </Field>

            {visibleFields.length > 0 && (
              <div className="rounded-2xl border border-hairline p-4 flex flex-col gap-4 bg-page">
                <span style={{ color: COLORS.rust }} className="text-body-sm font-semibold text-center">
                  {t("Taarifa za Ziada", "Additional Details")} — {categoryLabel}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {visibleFields.map((f) => (
                    <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
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

            <div className="rounded-2xl border border-hairline p-4 flex flex-col gap-4 bg-page">
              <span className="text-primary text-sm font-medium text-center">
                {locationLabel[lang] || locationLabel.sw} *
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label={`${t("Mkoa", "Region")} *`}>
                  <select
                    className={inputCls}
                    value={loc.mkoa}
                    onChange={(e) => setLoc({ mkoa: e.target.value, wilaya: "", eneo: loc.eneo })}
                  >
                    <option value="">{t("Chagua...", "Choose...")}</option>
                    {TZ_REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t("Wilaya", "District")}>
                  <input
                    className={inputCls}
                    list="dl-wilaya"
                    placeholder={t("mfano: Kinondoni", "e.g. Kinondoni")}
                    value={loc.wilaya}
                    onChange={(e) => setLoc({ ...loc, wilaya: e.target.value })}
                  />
                  <datalist id="dl-wilaya">
                    {(WILAYA_SUGGESTIONS[loc.mkoa] || []).map((w) => (
                      <option key={w} value={w} />
                    ))}
                  </datalist>
                </Field>
                <Field label={`${t("Eneo", "Area")} *`}>
                  <input
                    className={inputCls}
                    placeholder={t("mfano: Mbezi Beach", "e.g. Mbezi Beach")}
                    value={loc.eneo}
                    onChange={(e) => setLoc({ ...loc, eneo: e.target.value })}
                  />
                </Field>
              </div>

              <div className="mt-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary block mb-2">
                  {t("Mahali halisi kwenye ramani (hiari, lakini inashauriwa)", "Exact location on the map (optional, but recommended)")}
                </span>
                <LocationPicker
                  value={{ latitude: lat, longitude: lng }}
                  onChange={(newLat, newLng) => {
                    setLat(newLat);
                    setLng(newLng);
                  }}
                  onAddressResolved={(addr) => setAddressText(addr)}
                  compact
                />
                {addressText && (
                  <p className="mt-2 text-[11px] text-secondary leading-snug">
                    <span className="font-semibold">{t("Anwani:", "Address:")}</span> {addressText}
                  </p>
                )}
              </div>
            </div>

            <Field label={`${priceMeta.label[lang] || priceMeta.label.sw}${priceMeta.optional ? "" : " *"}`}>
              <input
                type="text"
                inputMode="numeric"
                className={inputCls}
                placeholder={t("mfano: 85,000,000", "e.g. 85,000,000")}
                value={formatPriceInput(base.price)}
                onChange={(e) => setBase({ ...base, price: cleanPriceInput(e.target.value) })}
              />
              {priceMeta.optional && (
                <span className="text-[11px] text-secondary">
                  {t("Hiari — acha wazi kama inajadiliwa.", "Optional — leave empty if negotiable.")}
                </span>
              )}
            </Field>

            <Field label={descLabel[lang] || descLabel.sw}>
              <textarea
                rows={4}
                className={`${inputCls} resize-none`}
                placeholder={t("Eleza kwa ufupi...", "Briefly describe...")}
                value={base.description}
                onChange={(e) => setBase({ ...base, description: e.target.value })}
              />
            </Field>

            {!isEdit && duplicateWarning && (
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
                  <p className="font-semibold mb-0.5">{t("Tangazo linalofanana lipo", "Similar listing exists")}</p>
                  <p className="text-xs leading-relaxed">
                    {t(
                      `Umekwisha kuweka tangazo "${duplicateWarning.title || ""}" lenye bei sawa na mahali sawa. Tafadhali badilisha jina, bei, au mahali ili kuendelea.`,
                      `You already have a listing "${duplicateWarning.title || ""}" with the same price and location. Please change the title, price, or location to continue.`
                    )}
                  </p>
                </div>
              </div>
            )}

            {cfg.modes && !isEdit && (
              <p className="text-center text-xs text-secondary rounded-xl px-3 py-2 border border-hairline bg-page">
                {t(
                  "Mawasiliano yote yatafanyika kupitia Deal Room — hakuna haja ya kuweka namba ya simu.",
                  "All contact happens through the Deal Room — no need to add a phone number."
                )}
              </p>
            )}

            {error && (
              <div
                className="rounded-xl px-4 py-3 flex items-start gap-2 text-sm"
                style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
              >
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span className="min-w-0 break-words">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                canSubmit ? "bg-gold text-night hover:brightness-110" : "bg-ink/10 text-muted cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />{" "}
                  {isEdit ? t("Inahifadhi...", "Saving...") : t("Inawasilisha...", "Submitting...")}
                </>
              ) : isEdit ? (
                t("Hifadhi Mabadiliko", "Save Changes")
              ) : (
                t("Wasilisha", "Submit")
              )}
            </button>

            {isEdit && (
              <button
                type="button"
                onClick={onGoToListings}
                className="w-full py-2.5 rounded-xl text-sm font-medium border border-hairline text-primary hover:bg-ink/5 transition-colors"
              >
                {t("Ghairi", "Cancel")}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}