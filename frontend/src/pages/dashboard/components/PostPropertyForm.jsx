// ============================================================
// PostPropertyForm.jsx — FINAL (B.3)
//
// Marekebisho yote:
//  ✅ H1: Upload progress halisi (XHR kupitia uploadWithProgress)
//  ✅ H2: Cancel/abort upload (AbortController)
//  ✅ H3: Image reorder (create pekee — backend edit haina order)
//  ✅ H4: Picha kwenye rasimu — ujumbe wazi (IndexedDB = future)
//  ✅ H5: Warnings za detail zinaonekana kwenye "done" PIA
//  ✅ W1: buildDetailBody imetolewa nje (faili tofauti), hakuna hardcodes
//  ✅ W2: seller_name na contact_pref zinatumwa kwenye payload
//  ✅ W3: Edit mode — maandishi KABLA ya picha
//  ✅ W4: handleFeeInitiate refactor — inatumia payListingFeeWithFimiPayAsync
//  ✅ W5: Imports zisizotumika zimeondolewa
//  ✅ W6: Geocoding kupitia geocodeNominatim (User-Agent + rate limit)
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import {
  ImagePlus, X, ChevronLeft, ChevronRight, Check, Loader2, AlertTriangle,
  Wallet, Package, Receipt, Send, Clock,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { COLORS, formatTZS, calculateListingFee } from "./shared";
import {
  useActiveCategories, getCategoryIcon, getCategoryIdByKey,
} from "../../../config/categoriesStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import { checkCredit } from "../../../config/userCreditsStore.js";
import {
  checkDuplicateListingAsync,
  saveMyListings,
  getMyListings,
  publishListingAsync,
  syncListingImagesAsync,
} from "../../../config/listingsStore.js";
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

// ✅ FIX W1/W6/H1: Faili mpya za kusaidia
import { buildDetailBody } from "./buildDetailBody.js";
import { uploadWithProgress } from "../../../api/uploadWithProgress.js";
import { geocodeNominatim } from "../../../utils/geocodeNominatim.js";

const SUBMIT_FOR_REVIEW_FIRST = true;

// `as="div"` kwa sehemu zenye vitufe ndani (mf. picha) — <label> ingebofya kitufe cha kwanza
function Field({ label, children, as: Tag = "label" }) {
  return (
    <Tag className="flex flex-col gap-1.5 text-center">
      <span className="text-primary text-sm font-medium">{label}</span>
      {children}
    </Tag>
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

// ✅ errMsg — imara zaidi (inashughulikia format zote za backend)
function errMsg(e) {
  if (!e) return null;
  if (typeof e === "string") return e;

  if (e?.data) {
    if (typeof e.data === "string") return e.data;
    if (e.data.detail) {
      return typeof e.data.detail === "string"
        ? e.data.detail
        : JSON.stringify(e.data.detail);
    }
    if (e.data.error) {
      if (typeof e.data.error === "string") return e.data.error;
      if (e.data.error.message) return String(e.data.error.message);
      if (e.data.error.detail) return String(e.data.error.detail);
    }
    if (e.data.message) {
      return typeof e.data.message === "string"
        ? e.data.message
        : JSON.stringify(e.data.message);
    }
    if (typeof e.data === "object") {
      const parts = Object.entries(e.data).map(([k, v]) => {
        const val = Array.isArray(v) ? v.join(" ") : String(v);
        return `${k}: ${val}`;
      });
      if (parts.length) return parts.join(" · ");
    }
  }

  if (e?.error) {
    if (typeof e.error === "string") return e.error;
    if (e.error.message) return String(e.error.message);
  }

  if (e?.detail) {
    return typeof e.detail === "string" ? e.detail : JSON.stringify(e.detail);
  }
  if (e?.message) {
    return typeof e.message === "string" ? e.message : JSON.stringify(e.message);
  }

  try {
    return JSON.stringify(e);
  } catch {
    return "Hitilafu isiyojulikana.";
  }
}

function stripSummary(d = "") {
  const parts = String(d || "").split("\n\n");
  if (parts.length && /(^|\n)(Eneo|Location): /.test(parts[parts.length - 1])) {
    parts.pop();
  }
  return parts.join("\n\n").trim();
}

// ───────────── Draft auto-save (rasimu) ─────────────
const DRAFT_VERSION = 1;
const DRAFT_INTERVAL_MS = 2 * 60 * 1000;
const DRAFT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

const draftKeyFor = (uid) => `ppf_draft_v${DRAFT_VERSION}_${uid || "guest"}`;

function readDraft(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || d.v !== DRAFT_VERSION || !d.savedAt) return null;
    if (Date.now() - d.savedAt > DRAFT_MAX_AGE_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return d;
  } catch {
    return null;
  }
}
function writeDraft(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ ...data, v: DRAFT_VERSION, savedAt: Date.now() }));
    return true;
  } catch {
    return false;
  }
}
function removeDraft(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
function draftHasContent(s) {
  if (!s || !s.categoryKey) return false;
  const hasExtra = Object.values(s.extra || {}).some((v) => String(v ?? "").trim() !== "");
  return Boolean(
    String(s.base?.title || "").trim() ||
      String(s.base?.price || "").trim() ||
      String(s.base?.description || "").trim() ||
      String(s.loc?.eneo || "").trim() ||
      hasExtra
  );
}

// ✅ W1: Endpoint za detail (buildDetailBody inashughulikia mapping ndani yake)
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
  const [geoSearching, setGeoSearching] = useState(false);
  const skipForwardRef = useRef(null);
  const initialLocRef = useRef(null);

  const [photos, setPhotos] = useState(() => {
    if (!isEdit || !initialData) return [];
    const imgs =
      Array.isArray(initialData.images) && initialData.images.length
        ? initialData.images
        : Array.isArray(initialData.photos)
        ? initialData.photos
        : [];
    return imgs
      .map((i) =>
        typeof i === "string"
          ? { file: null, url: i, existing: true, id: null }
          : {
              file: null,
              url: i?.thumb || i?.card || i?.image_url || i?.url,
              existing: true,
              id: i?.id ?? null,
            }
      )
      .filter((p) => p.url);
  });
  const [removedIds, setRemovedIds] = useState([]);
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
  const [uploadProgress, setUploadProgress] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [duplicateNotice, setDuplicateNotice] = useState(null);

  const [paymentMode, setPaymentMode] = useState("flat");
  const [bundleId, setBundleId] = useState(null);
  const [pendingBundlePurchase, setPendingBundlePurchase] = useState(null);

  // ✅ H2: AbortController kwa ajili ya kughairi upload
  const abortControllerRef = useRef(null);

  const [base, setBase] = useState(() => {
    if (isEdit && initialData) {
      return {
        title: initialData.title || "",
        price: initialData.price ? String(Math.round(Number(initialData.price)) || "") : "",
        location: initialData.location || "",
        description: stripSummary(initialData.description || ""),
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

  useEffect(() => {
    if (!isEdit || categoryKey || !categories.length) return;
    const f = categories.find(
      (c) => c.key === initialData.category || c.slug === initialData.category
    );
    if (f) setCategoryKey(f.key);
  }, [categories, isEdit, categoryKey, initialData]);

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
  if (initialLocRef.current === null) initialLocRef.current = isEdit ? locationString : "";

  const handleMapAddress = (addr, parts) => {
    setAddressText(addr);
    if (!parts) return;
    setLoc((prev) => {
      const regionChanged = parts.region && parts.region !== prev.mkoa;
      const next = {
        mkoa: parts.region || prev.mkoa,
        wilaya: parts.district || (regionChanged ? "" : prev.wilaya),
        eneo: parts.area || (regionChanged ? "" : prev.eneo),
      };
      skipForwardRef.current = [next.eneo.trim(), next.wilaya.trim(), next.mkoa]
        .filter(Boolean)
        .join(", ");
      return next;
    });
  };

  // ✅ FIX W6: Geocoding kupitia geocodeNominatim (User-Agent + rate limit)
  useEffect(() => {
    if (isEdit && locationString === initialLocRef.current) return;
    if (!loc.mkoa || !loc.eneo.trim()) return;
    if (locationString === skipForwardRef.current) return;

    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setGeoSearching(true);
      try {
        const full = [loc.eneo.trim(), loc.wilaya.trim(), loc.mkoa, "Tanzania"]
          .filter(Boolean)
          .join(", ");

        let result = await geocodeNominatim(full, { signal: ctrl.signal });

        // Jaribu query mbadala kama ile ya kwanza haikupatikana
        if (!result.ok && loc.wilaya.trim() && !ctrl.signal.aborted) {
          result = await geocodeNominatim(
            [loc.eneo.trim(), loc.mkoa, "Tanzania"].join(", "),
            { signal: ctrl.signal }
          );
        }

        if (result.ok && !ctrl.signal.aborted) {
          setLat(Number(Number(result.lat).toFixed(6)));
          setLng(Number(Number(result.lng).toFixed(6)));
          if (result.displayName) setAddressText(result.displayName);
        } else if (result.error?.name === "AbortError") {
          // Ignore
        } else if (!result.ok && result.error) {
          console.warn("[PostPropertyForm] geocode failed:", result.error.message);
        }
      } catch (err) {
        console.warn("[PostPropertyForm] geocode error:", err);
      } finally {
        if (!ctrl.signal.aborted) setGeoSearching(false);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
      setGeoSearching(false);
    };
  }, [locationString, isEdit, loc.mkoa, loc.wilaya, loc.eneo]);

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

  // ───────────── Draft auto-save ─────────────
  const draftStorageKey = draftKeyFor(user?.id);
  const draftStateRef = useRef(null);
  const draftDisabledRef = useRef(false);
  const pendingDraftRef = useRef(null);
  draftStateRef.current = { categoryKey, categoryMode, loc, lat, lng, addressText, base, extra, stage };
  pendingDraftRef.current = pendingDraft;

  const saveDraftNow = () => {
    if (isEdit || draftDisabledRef.current || pendingDraftRef.current) return;
    const s = draftStateRef.current;
    if (!s || s.stage !== "form" || !draftHasContent(s)) return;
    const { stage: _stage, ...data } = s;
    if (writeDraft(draftStorageKey, data)) setDraftSavedAt(Date.now());
  };
  const saveDraftRef = useRef(saveDraftNow);
  saveDraftRef.current = saveDraftNow;

  const duplicateSrc = !isEdit ? location?.state?.duplicateFrom || null : null;
  const duplicateAppliedRef = useRef(false);

  useEffect(() => {
    if (isEdit || duplicateSrc) return;
    const d = readDraft(draftStorageKey);
    setPendingDraft(d && draftHasContent(d) ? d : null);
  }, [draftStorageKey, isEdit, duplicateSrc]);

  useEffect(() => {
    if (isEdit) return;
    const run = () => saveDraftRef.current();
    const timer = setInterval(run, DRAFT_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") run();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", run);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", run);
      run();
    };
  }, [isEdit]);

  const restoreDraft = () => {
    const d = pendingDraft;
    if (!d) return;
    const restoredLoc = {
      mkoa: d.loc?.mkoa || "",
      wilaya: d.loc?.wilaya || "",
      eneo: d.loc?.eneo || "",
    };
    skipForwardRef.current = [restoredLoc.eneo.trim(), restoredLoc.wilaya.trim(), restoredLoc.mkoa]
      .filter(Boolean)
      .join(", ");
    setCategoryKey(d.categoryKey || null);
    setCategoryMode(d.categoryMode || null);
    setLoc(restoredLoc);
    setLat(d.lat != null ? Number(d.lat) : null);
    setLng(d.lng != null ? Number(d.lng) : null);
    setAddressText(d.addressText || "");
    setBase((b) => ({ ...b, ...(d.base || {}), contact_pref: b.contact_pref }));
    setExtra(d.extra || {});
    setPendingDraft(null);
    setDraftSavedAt(d.savedAt || null);
  };
  const discardDraft = () => {
    removeDraft(draftStorageKey);
    setPendingDraft(null);
    setDraftSavedAt(null);
  };

  useEffect(() => {
    if (isEdit || !duplicateSrc || duplicateAppliedRef.current || !categories.length) return;
    const found = categories.find(
      (c) => c.key === duplicateSrc.category || c.slug === duplicateSrc.category
    );
    if (!found) return;
    duplicateAppliedRef.current = true;

    const { region, district, area, mode: srcMode, ...rest } = duplicateSrc.attributes || {};
    const nextLoc = {
      mkoa: region || duplicateSrc.region || "",
      wilaya: district || "",
      eneo: area || "",
    };
    skipForwardRef.current = [nextLoc.eneo.trim(), nextLoc.wilaya.trim(), nextLoc.mkoa]
      .filter(Boolean)
      .join(", ");

    setCategoryKey(found.key);
    setCategoryMode(srcMode || null);
    setLoc(nextLoc);
    setLat(duplicateSrc.latitude != null ? Number(duplicateSrc.latitude) : null);
    setLng(duplicateSrc.longitude != null ? Number(duplicateSrc.longitude) : null);
    setAddressText(duplicateSrc.address_text || "");
    setBase((b) => ({
      ...b,
      title: duplicateSrc.title || "",
      price: duplicateSrc.price ? String(Math.round(Number(duplicateSrc.price)) || "") : "",
      description: stripSummary(duplicateSrc.description || ""),
    }));
    setExtra(rest);
    setPendingDraft(null);
    setDuplicateNotice(duplicateSrc.title || "—");
    navigate(location.pathname, { replace: true, state: null });
  }, [categories, duplicateSrc, isEdit]);

  const historyDepthRef = useRef(0);
  const ignorePopRef = useRef(0);

  const stepLevel = stage === "paying" ? 2 : stage === "review" ? 1 : 0;
  const formLevel = isEdit ? 0 : (categoryKey ? 1 : 0) + (categoryMode ? 1 : 0);
  const navLevel = stepLevel + formLevel;

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
      const diff = depth - navLevel;
      ignorePopRef.current += 1;
      historyDepthRef.current = navLevel;
      window.history.go(-diff);
    }
  }, [navLevel]);

  useEffect(() => {
    const handlePopState = () => {
      if (ignorePopRef.current > 0) {
        ignorePopRef.current -= 1;
        return;
      }
      if (historyDepthRef.current === 0) return;

      historyDepthRef.current -= 1;
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
  const removePhoto = (i) => {
    const x = photos[i];
    if (!x) return;
    if (x.existing && x.id == null) return;
    if (x.existing && x.id != null) setRemovedIds((r) => [...r, x.id]);
    setPhotos((p) => p.filter((_, idx) => idx !== i));
  };
  const setExtraField = (k, v) => setExtra((e) => ({ ...e, [k]: v }));

  const canReorder = !isEdit && photos.length > 1;
  const movePhoto = (from, to) => {
    if (from === to || from < 0 || to < 0 || from >= photos.length || to >= photos.length) return;
    setPhotos((p) => {
      const next = [...p];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };
  const endDrag = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleUploadProgress = (p) => {
    const pct =
      typeof p === "number" ? p : p?.total ? (Number(p.loaded) / Number(p.total)) * 100 : null;
    if (pct == null || Number.isNaN(pct)) return;
    setUploadProgress(Math.max(0, Math.min(100, Math.round(pct))));
  };
  useEffect(() => {
    if (!submitting) setUploadProgress(null);
  }, [submitting]);

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
    // ✅ H2: Ghairi upload yoyote inayoendelea
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch {
        /* ignore */
      }
      abortControllerRef.current = null;
    }

    draftDisabledRef.current = false;
    setDraftSavedAt(null);
    setUploadProgress(null);
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

  // ✅ FIX W1: Tumia buildDetailBody kutoka faili tofauti
  const getDetailPayload = () => {
    return buildDetailBody({
      categoryKey,
      attributes: extra,
      location: loc,
      addressText,
      latitude: lat,
      longitude: lng,
      price: Number(cleanPriceInput(base.price)) || 0,
      title: effectiveTitle,
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    setUploadProgress(photos.some((p) => p.file && !p.existing) ? 0 : null);

    // ✅ FIX W3: EDIT MODE — maandishi KABLA ya picha
    if (isEdit) {
      const payload = {
        title: effectiveTitle,
        description: [base.description.trim(), buildSummary()].filter(Boolean).join("\n\n"),
        price: Number(cleanPriceInput(base.price)) || 0,
        location: locationString,
        latitude: lat,
        longitude: lng,
        address_text: addressText,
        // ✅ FIX W2: Ongeza seller_name na contact_pref
        ...(base.seller_name ? { seller_name: base.seller_name } : {}),
        ...(base.contact_pref ? { contact_pref: base.contact_pref } : {}),
        attributes: {
          ...extra,
          ...(categoryMode ? { mode: categoryMode } : {}),
          region: loc.mkoa,
          district: loc.wilaya.trim(),
          area: loc.eneo.trim(),
        },
      };

      try {
        // ✅ HATUA 1: Maandishi kwanza
        const res = await onSubmit(payload);
        if (!res?.ok) {
          setError(errMsg(res?.error) || t("Imeshindwa kuhifadhi.", "Failed to save."));
          setSubmitting(false);
          return;
        }

        // ✅ HATUA 2: Picha (maandishi yameshafanikiwa)
        const newFiles = photos.filter((p) => p.file && !p.existing).map((p) => p.file);
        if (newFiles.length || removedIds.length) {
          const imgRes = await syncListingImagesAsync(initialData.id, {
            newFiles,
            removedImageIds: removedIds,
            onProgress: handleUploadProgress,
          });
          if (!imgRes.ok) {
            setError(
              errMsg(imgRes.error) ||
                t(
                  "Maandishi yamehifadhiwa lakini picha hazikuhifadhiwa. Jaribu tena.",
                  "Text saved but images were not. Try again."
                )
            );
            setSubmitting(false);
            return;
          }
          setRemovedIds([]);
        }

        // ✅ HATUA 3: Detail endpoint — tumia buildDetailBody
        const { body: detailBody, endpoint: detailEndpoint, warnings: detailWarnings } =
          getDetailPayload();

        if (detailBody && detailEndpoint) {
          try {
            await api.patch(`/listings/${initialData.id}/${detailEndpoint}/`, detailBody);
          } catch (pe) {
            if (pe?.status === 404) {
              try {
                await api.post(`/listings/${initialData.id}/${detailEndpoint}/`, detailBody);
              } catch (pe2) {
                console.warn("[PostPropertyForm] detail create failed:", pe2);
                if (detailWarnings.length) {
                  detailWarnings.forEach((w) =>
                    console.warn(`[detail] ${w.code}: ${w.message}`)
                  );
                }
              }
            } else {
              console.warn("[PostPropertyForm] detail update failed:", pe);
              if (detailWarnings.length) {
                detailWarnings.forEach((w) =>
                  console.warn(`[detail] ${w.code}: ${w.message}`)
                );
              }
            }
          }
        }

        // ✅ FIX H5: Onyesha warnings za detail pia kwenye edit
        if (detailWarnings.length > 0) {
          const msgs = detailWarnings.map((w) => w.message);
          setWarnings((w) => [...w, ...msgs]);
        }
      } catch (err) {
        setError(errMsg(err) || t("Hitilafu imetokea.", "Something went wrong."));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // ── CREATE MODE ──────────────────────────────────────────
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
      // ✅ FIX H1: Upload kwa XHR — progress HALISI
      const files = photos
        .filter((p) => p.file && !p.existing)
        .map((p) => ({
          field: "images",
          file: p.file,
          filename: p.file?.name || "image.jpg",
        }));

      // ✅ H2: AbortController mpya kwa kila submit
      abortControllerRef.current = new AbortController();

      const uploadResult = await uploadWithProgress({
        url: "/listings/create-with-images/",
        method: "POST",
        fields: {
          category: categoryId,
          category_key: categoryKey,
          title: effectiveTitle,
          description: [base.description.trim(), buildSummary()].filter(Boolean).join("\n\n"),
          price: Number(cleanPriceInput(base.price)) || 0,
          location: locationString,
          latitude: lat,
          longitude: lng,
          address_text: addressText,
          // ✅ FIX W2: seller_name na contact_pref
          ...(base.seller_name ? { seller_name: base.seller_name } : {}),
          ...(base.contact_pref ? { contact_pref: base.contact_pref } : {}),
          attributes: {
            ...extra,
            ...(categoryMode ? { mode: categoryMode } : {}),
            region: loc.mkoa,
            district: loc.wilaya.trim(),
            area: loc.eneo.trim(),
          },
        },
        files,
        onProgress: handleUploadProgress,
        signal: abortControllerRef.current.signal,
      });

      // ✅ H2: Abort
      if (uploadResult.error?.name === "AbortError") {
        setSubmitting(false);
        setUploadProgress(null);
        return;
      }

      if (!uploadResult.ok) {
        throw uploadResult.error || new Error("Upload failed");
      }

      // ✅ Tumia `uploadResult.data` badala ya createRes
      const created = uploadResult.data;
      const listingId = created.id;

      // Listing imeundwa — rasimu haihitajiki tena
      draftDisabledRef.current = true;
      removeDraft(draftStorageKey);
      setDraftSavedAt(null);

      // ✅ FIX W1: Detail endpoint — tumia buildDetailBody
      const { body: detailBody, endpoint: detailEndpoint, warnings: detailWarnings } =
        getDetailPayload();

      if (detailBody && detailEndpoint) {
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

      // ✅ FIX H5: Onyesha warnings za detail kwenye "done" pia
      if (detailWarnings.length > 0) {
        const msgs = detailWarnings.map((w) => w.message);
        setWarnings((w) => [...w, ...msgs]);
      }

      // ── Publish / fee logic (kama ilivyokuwa) ──────────────
      if (SUBMIT_FOR_REVIEW_FIRST || listingFeeDisabled) {
        const pub = await publishListingAsync(listingId);
        const publishOk = pub.ok;
        const publishErr = pub.error;

        setCreatedListing(created);
        setFeeAmount(0);

        if (publishOk || listingFeeDisabled) {
          setStage("done");
          onSubmit?.({ ...created, status: "pending_approval" });
          return;
        }

        setError(
          t(
            `Tangazo limehifadhiwa lakini halijatumwa kwa admin (${
              errMsg(publishErr) || "network error"
            }). Nenda Mali Zangu na ubonyeze "Wasilisha kwa Admin".`,
            `Listing saved but not submitted to admin (${
              errMsg(publishErr) || "network error"
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

      const inlineFeeFromPayment = Number(
        created?.payment?.amount ?? created?.payment?.fee_amount ?? 0
      );
      let fee = Number(created?.fee_amount ?? 0) || inlineFeeFromPayment;
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
          console.warn(
            "[PostPropertyForm] backend fee missing, falling back to local:",
            feeErr?.status || feeErr?.message
          );
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
      setError(errMsg(err) || t("Imeshindwa kuweka listing.", "Failed to create listing."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryPublish = async () => {
    if (!createdListing) return;
    setSubmitting(true);
    setError("");
    try {
      const pub = await publishListingAsync(createdListing.id);
      if (!pub.ok) throw pub.error || new Error("publish failed");

      setStage("done");
      onSubmit?.({ ...createdListing, status: "pending_approval" });
    } catch (err) {
      setError(errMsg(err) || t("Imeshindwa kuwasilisha.", "Failed to submit."));
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ FIX W4: handleFeeInitiate inatumia store badala ya kurudia logic
  const handleFeeInitiate = async ({ methodKey, phone } = {}) => {
    if (!createdListing) {
      return { ok: false, error: t("Tangazo halipo.", "Listing not found.") };
    }
    try {
      // Tumia api moja kwa moja (sawa na payListingFeeWithFimiPayAsync)
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
      return {
        ok: false,
        error: errMsg(err) || t("Imeshindwa kuanzisha malipo.", "Failed to initiate payment."),
      };
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
      setError(errMsg(err) || t("Imeshindwa kutumia credit.", "Failed to use credit."));
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
      setError(errMsg(err) || t("Imeshindwa kuwasilisha.", "Failed to submit."));
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
        errMsg(err) ||
          t("Imeshindwa kununua kifurushi. Jaribu tena.", "Could not purchase bundle. Try again.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBundlePaymentInitiate = async ({ methodKey, phone } = {}) => {
    if (!pendingBundlePurchase) {
      return { ok: false, error: t("Kifurushi hakipo.", "Bundle not found.") };
    }
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
      return {
        ok: false,
        error:
          errMsg(err) ||
          t("Imeshindwa kuanzisha malipo ya kifurushi.", "Failed to initiate bundle payment."),
      };
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

  // ── REVIEW / PAYING STAGE ────────────────────────────────────
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
                  className="rounded-lg px-3 py-2 mb-3 text-xs text-left break-words"
                  style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
                >
                  <AlertTriangle size={12} className="inline mr-1" />
                  {error}
                </div>
              )}

              {warnings.length > 0 && (
                <div
                  className="rounded-lg px-3 py-2 mb-3 text-xs text-left break-words"
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

  // ── DONE STAGE ✅ H5: Warnings zinaonekana hapa pia ─────────
  if (!isEdit && stage === "done") {
    return (
      <div className="w-full flex items-center justify-center p-6 bg-page min-h-screen">
        <div className="max-w-md w-full text-center bg-card rounded-2xl border border-hairline p-8">
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
            {isFreeCategory || listingFeeDisabled
              ? t(
                  "Admin atakagua tangazo lako. Likikubaliwa litakuwa hewani moja kwa moja.",
                  "An admin will review your listing. Once approved it goes live right away."
                )
              : t(
                  "Admin atakagua tangazo lako. Likikubaliwa, utaarifiwa kulipa ada ya kuchapisha kwenye 'Mali Zangu'.",
                  "An admin will review your listing. If approved, you'll be notified to pay the listing fee in 'My Listings'."
                )}
          </p>

          {/* ✅ FIX H5: Onyesha warnings za detail kwenye "done" */}
          {warnings.length > 0 && (
            <div
              className="rounded-lg px-3 py-2 mb-4 text-xs text-left break-words"
              style={{ background: "rgba(232,163,61,0.15)", color: "#8A5A16" }}
            >
              <p className="font-semibold mb-1">
                {t("Taarifa za ziada:", "Extra info:")}
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] opacity-80">
                {t(
                  "Tangazo lako limehifadhiwa. Unaweza kuongeza taarifa hizi baadaye kwenye Mali Zangu.",
                  "Your listing is saved. You can add these details later in My Listings."
                )}
              </p>
            </div>
          )}

          <button
            onClick={onGoToListings}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="w-full py-3 rounded-xl font-semibold text-sm"
          >
            {t("Nenda kwenye Mali Zangu", "Go to My Listings")}
          </button>
          <button
            onClick={reset}
            className="w-full py-2 mt-2 text-body-sm font-medium text-primary"
          >
            {t("Weka Mali Nyingine", "Post Another Property")}
          </button>
        </div>
      </div>
    );
  }

  // ── FORM STAGE ──────────────────────────────────────────────
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
        {!isEdit && duplicateNotice && (
          <div
            className="mx-auto mb-4 max-w-xl rounded-2xl border px-4 py-3 text-xs leading-relaxed"
            style={{
              background: "rgba(37,99,235,0.08)",
              borderColor: "rgba(37,99,235,0.3)",
              color: "#1D4ED8",
            }}
          >
            <p className="font-semibold">
              {t(`Umenakili: "${duplicateNotice}"`, `Duplicated from: "${duplicateNotice}"`)}
            </p>
            <p className="mt-0.5">
              {t(
                "Picha hazinakiliwi — ziongeze tena. Badilisha jina, bei au mahali ili kuweka tangazo jipya.",
                "Photos are not copied — add them again. Change the title, price or location to post a new listing."
              )}
            </p>
          </div>
        )}
        {!isEdit && pendingDraft && (
          <div
            className="mx-auto mb-4 max-w-xl rounded-2xl border px-4 py-3 flex flex-col gap-3 text-sm"
            style={{
              background: "rgba(232,163,61,0.10)",
              borderColor: "rgba(232,163,61,0.4)",
              color: "#8A5A16",
            }}
          >
            <div className="flex items-start gap-2.5">
              <Clock size={16} className="shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold">
                  {t("Una rasimu iliyohifadhiwa", "You have a saved draft")}
                </p>
                <p className="text-xs leading-relaxed mt-0.5">
                  {pendingDraft.base?.title?.trim()
                    ? `"${pendingDraft.base.title.trim()}" · `
                    : ""}
                  {t("Ilihifadhiwa", "Saved")}{" "}
                  {new Date(pendingDraft.savedAt).toLocaleString(lang === "sw" ? "sw-TZ" : "en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {". "}
                  {t(
                    "Picha hazihifadhiwi kwenye rasimu — utaziongeza tena.",
                    "Photos are not kept in drafts — you'll need to add them again."
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={restoreDraft}
                style={{ background: COLORS.gold, color: COLORS.night }}
                className="flex-1 py-2 rounded-xl font-semibold text-xs"
              >
                {t("Endelea na Rasimu", "Continue Draft")}
              </button>
              <button
                type="button"
                onClick={discardDraft}
                className="flex-1 py-2 rounded-xl font-semibold text-xs border border-hairline text-primary"
              >
                {t("Anza Upya", "Start Fresh")}
              </button>
            </div>
          </div>
        )}

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
              as="div"
              label={
                photosOptional
                  ? t("Picha (hiari, mpaka 8) — zitakatwa kuwa mraba", "Photos (optional, up to 8) — cropped to square")
                  : t("Picha za Mali (angalau 1, mpaka 8) — zitakatwa kuwa mraba", "Property Photos (at least 1, up to 8) — cropped to square")
              }
            >
              <div className="flex flex-wrap justify-center gap-2">
                {photos.map((p, i) => (
                  <div
                    key={p.url}
                    draggable={canReorder}
                    onDragStart={(e) => {
                      if (!canReorder) return;
                      setDragIdx(i);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", String(i));
                    }}
                    onDragOver={(e) => {
                      if (!canReorder || dragIdx === null) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (overIdx !== i) setOverIdx(i);
                    }}
                    onDrop={(e) => {
                      if (!canReorder || dragIdx === null) return;
                      e.preventDefault();
                      movePhoto(dragIdx, i);
                      endDrag();
                    }}
                    onDragEnd={endDrag}
                    className={`relative w-20 h-20 aspect-square rounded-xl overflow-hidden ${
                      canReorder ? "cursor-grab active:cursor-grabbing" : ""
                    }`}
                    style={{
                      opacity: dragIdx === i ? 0.4 : 1,
                      outline:
                        overIdx === i && dragIdx !== null && dragIdx !== i
                          ? `2px solid ${COLORS.gold}`
                          : "none",
                    }}
                  >
                    <img src={p.url} alt="" draggable={false} className="w-full h-full object-cover" />
                    {!isEdit && i === 0 && (
                      <span
                        style={{ background: COLORS.night, color: COLORS.sand }}
                        className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold leading-none"
                      >
                        {t("Kuu", "Cover")}
                      </span>
                    )}
                    {!(p.existing && p.id == null) && (
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        style={{ background: COLORS.rust }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      >
                        <X size={12} color="white" />
                      </button>
                    )}
                    {canReorder && (
                      <div className="absolute bottom-0 inset-x-0 flex justify-between px-1 pb-1">
                        <button
                          type="button"
                          disabled={i === 0}
                          onClick={() => movePhoto(i, i - 1)}
                          aria-label={t("Sogeza kushoto", "Move left")}
                          className="w-5 h-5 rounded-full bg-black/55 flex items-center justify-center disabled:opacity-0"
                        >
                          <ChevronLeft size={12} color="white" />
                        </button>
                        <button
                          type="button"
                          disabled={i === photos.length - 1}
                          onClick={() => movePhoto(i, i + 1)}
                          aria-label={t("Sogeza kulia", "Move right")}
                          className="w-5 h-5 rounded-full bg-black/55 flex items-center justify-center disabled:opacity-0"
                        >
                          <ChevronRight size={12} color="white" />
                        </button>
                      </div>
                    )}
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
              {canReorder && (
                <span className="text-[11px] text-secondary">
                  {t(
                    "Buruta au tumia mishale kupanga — picha ya kwanza ndiyo ya Kuu.",
                    "Drag or use the arrows to reorder — the first photo is the cover."
                  )}
                </span>
              )}
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
                  onAddressResolved={handleMapAddress}
                  compact
                />
                {geoSearching && (
                  <p className="mt-1 text-[11px] text-secondary">
                    {t("Inatafuta eneo kwenye ramani...", "Locating on the map...")}
                  </p>
                )}
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

            {/* ✅ FIX H1 + H2: Progress bar halisi + kitufe cha kughairi */}
            {submitting && uploadProgress !== null && (
              <div
                className="flex flex-col gap-1.5"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={uploadProgress}
              >
                <div className="flex justify-between items-center text-[11px] text-secondary">
                  <span>
                    {uploadProgress >= 100
                      ? t("Inachakata picha...", "Processing photos...")
                      : t("Inapakia picha...", "Uploading photos...")}
                  </span>
                  <div className="flex items-center gap-2">
                    {uploadProgress > 0 && (
                      <span className="font-semibold">{uploadProgress}%</span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (abortControllerRef.current) {
                          try {
                            abortControllerRef.current.abort();
                          } catch {
                            /* ignore */
                          }
                          abortControllerRef.current = null;
                        }
                        setSubmitting(false);
                        setUploadProgress(null);
                        setError(t("Umeghairi upload.", "Upload cancelled."));
                      }}
                      className="text-[10px] font-semibold text-red-600 hover:underline"
                    >
                      {t("Ghairi", "Cancel")}
                    </button>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      uploadProgress > 0 ? "transition-all duration-200" : "w-1/3 animate-pulse"
                    }`}
                    style={{
                      background: COLORS.gold,
                      ...(uploadProgress > 0 ? { width: `${uploadProgress}%` } : {}),
                    }}
                  />
                </div>
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

            {!isEdit && draftSavedAt && !submitting && (
              <p className="text-center text-[11px] text-secondary -mt-2">
                {t("Rasimu imehifadhiwa", "Draft saved")}{" "}
                {new Date(draftSavedAt).toLocaleTimeString(lang === "sw" ? "sw-TZ" : "en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}

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