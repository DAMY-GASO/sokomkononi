// ============================================================
// AdminBundles.jsx
// ============================================================
import React, { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Package,
  Eye,
  EyeOff,
  Search,
  Loader2,
  History,
  Coins,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { COLORS, formatTZS } from "./dashboard/components/shared";
import {
  useBundles,
  createBundleAsync,
  updateBundleAsync,
  removeBundleAsync,
  toggleBundleActiveAsync,
  fetchBundlePurchasesAsync,
} from "../config/bundlesStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";

const TYPE_LABELS = {
  listing: { sw: "Kuweka Mali", en: "Listing" },
  reservation: { sw: "Kuhifadhi", en: "Reservation" },
  success: { sw: "Mafanikio", en: "Success" },
  package: { sw: "Kifurushi Maalum", en: "Package" },
  boost: { sw: "Kukuza", en: "Boost" },
  leading: { sw: "Kuongoza", en: "Leading" },
  ads: { sw: "Matangazo", en: "Ads" },
  premium: { sw: "Hadhi ya Juu", en: "Premium" },
};

const CREDIT_LABELS = {
  listing: { sw: "Kuweka Mali", en: "Listing" },
  leading: { sw: "Kuongoza", en: "Leading" },
  boost: { sw: "Kukuza", en: "Boost" },
  reservation: { sw: "Kuhifadhi", en: "Reservation" },
  success: { sw: "Mafanikio", en: "Success" },
  ads: { sw: "Matangazo", en: "Ads" },
  premium: { sw: "Hadhi ya Juu", en: "Premium" },
};

// ============================================================
// CODE DISPLAY — badilisha `code` kuwa jina linaloeleweka
// ============================================================
const CODE_DISPLAY = {
  // Listing bundles
  b_listing_starter: { sw: "Kifurushi cha Kuanzia", en: "Listing Starter" },
  b_listing_basic: { sw: "Kifurushi cha Msingi", en: "Listing Basic" },
  b_listing_standard: { sw: "Kifurushi cha Kawaida", en: "Listing Standard" },
  b_listing_premium: { sw: "Kifurushi cha Juu", en: "Listing Premium" },
  b_listing_pro: { sw: "Kifurushi cha Pro", en: "Listing Pro" },

  // Boost bundles
  b_boost_starter: { sw: "Boost ya Kuanzia", en: "Boost Starter" },
  b_boost_pack: { sw: "Kifurushi cha Boost", en: "Boost Pack" },
  b_boost_premium: { sw: "Boost ya Juu", en: "Boost Premium" },

  // Leading bundles
  b_leading_pack: { sw: "Kifurushi cha Kuongoza", en: "Leading Pack" },
  b_leading_starter: { sw: "Kuongoza kwa Kuanzia", en: "Leading Starter" },

  // Ads bundles
  b_ads_pack: { sw: "Kifurushi cha Matangazo", en: "Ads Pack" },
  b_ads_starter: { sw: "Matangazo ya Kuanzia", en: "Ads Starter" },

  // Premium / Package
  b_premium_bundle: { sw: "Kifurushi cha Hadhi ya Juu", en: "Premium Bundle" },
  b_premium_pack: { sw: "Pakiti ya Hadhi ya Juu", en: "Premium Pack" },

  // Reservation
  b_reservation_pack: { sw: "Kifurushi cha Kuhifadhi", en: "Reservation Pack" },
  b_reservation_starter: {
    sw: "Kuhifadhi kwa Kuanzia",
    en: "Reservation Starter",
  },

  // Success
  b_success_pack: { sw: "Kifurushi cha Mafanikio", en: "Success Pack" },
  b_success_starter: { sw: "Mafanikio ya Kuanzia", en: "Success Starter" },
};

/**
 * displayBundleCode — inabadilisha `code` kuwa jina linaloeleweka.
 *
 * - Kama `code` ipo kwenye CODE_DISPLAY, inarudisha SW/EN kulingana na lang.
 * - Kama haipo, inaondoa prefix `b_`, inabadilisha `_` kuwa space,
 *   na kufanya Title Case (mfano `b_my_pack` → `My Pack`).
 */
function displayBundleCode(code, lang = "sw") {
  if (!code) return "";
  const entry = CODE_DISPLAY[code];
  if (entry) return pickLang(entry, lang);
  return String(code)
    .replace(/^b_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const pickLang = (obj, lang) =>
  obj?.[lang] || obj?.[lang === "sw" ? "en" : "sw"] || "";

// ============================================================
// FORM MODAL
// ============================================================
function BundleFormModal({ bundle, onSave, onClose, lang, saving, error }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const [form, setForm] = useState(
    bundle || {
      id: "",
      code: "",
      type: "listing",
      name: { sw: "", en: "" },
      description: { sw: "", en: "" },
      price: 0,
      credits: {},
      validityDays: 90,
      services: [],
      discountPercent: 0,
      active: true,
      featured: false,
      icon: "Package",
      color: "night",
    }
  );

  const [localError, setLocalError] = useState("");

  const getCreditsForType = (type) => {
    const c = form.credits;
    if (c && typeof c === "object") return c[type] ?? 1;
    return Number(c) || 1;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const missing = [];
    if (!form.code?.trim())
      missing.push(t("Kitambulisho (ID)", "Identifier (ID)"));
    if (!form.name?.sw?.trim()) missing.push(t("Jina (SW)", "Name (SW)"));
    if (!form.name?.en?.trim()) missing.push(t("Jina (EN)", "Name (EN)"));
    if (!form.description?.sw?.trim())
      missing.push(t("Maelezo (SW)", "Description (SW)"));
    if (!form.description?.en?.trim())
      missing.push(t("Maelezo (EN)", "Description (EN)"));
    if (!form.price) missing.push(t("Bei (TZS)", "Price (TZS)"));

    if (missing.length > 0) {
      setLocalError(
        t("Jaza sehemu hizi: ", "Fill in these fields: ") + missing.join(", ")
      );
      return;
    }

    setLocalError("");
    onSave(form);
  };

  const updateField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
      <form
        onSubmit={handleSubmit}
        className="bg-card rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-4 sm:p-6 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-card pb-2 border-b border-hairline">
          <h3 className="font-bold text-primary text-sm sm:text-base">
            {bundle
              ? t("Hariri Kifurushi", "Edit Bundle")
              : t("Ongeza Kifurushi", "Add Bundle")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1 text-muted hover:text-secondary disabled:opacity-50"
            aria-label={t("Funga", "Close")}
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">
              {t("Kitambulisho (ID)", "Identifier (ID)")}{" "}
              <span className="text-rust">*</span>
            </label>
            <input
              value={form.code || ""}
              onChange={(e) => updateField("code", e.target.value)}
              disabled={!!bundle || saving}
              className="w-full border border-hairline rounded-lg px-3 py-2 text-sm disabled:bg-page disabled:text-secondary"
              placeholder="b_listing_starter"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">
              {t("Aina", "Type")}
            </label>
            <select
              value={form.type}
              onChange={(e) => updateField("type", e.target.value)}
              disabled={saving}
              className="w-full border border-hairline rounded-lg px-3 py-2 text-sm disabled:opacity-50"
            >
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {pickLang(label, lang)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">
                {t("Jina (SW)", "Name (SW)")}{" "}
                <span className="text-rust">*</span>
              </label>
              <input
                value={form.name?.sw || ""}
                onChange={(e) =>
                  updateField("name", { ...form.name, sw: e.target.value })
                }
                disabled={saving}
                className="w-full border border-hairline rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">
                {t("Jina (EN)", "Name (EN)")}{" "}
                <span className="text-rust">*</span>
              </label>
              <input
                value={form.name?.en || ""}
                onChange={(e) =>
                  updateField("name", { ...form.name, en: e.target.value })
                }
                disabled={saving}
                className="w-full border border-hairline rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">
                {t("Maelezo (SW)", "Description (SW)")}{" "}
                <span className="text-rust">*</span>
              </label>
              <textarea
                value={form.description?.sw || ""}
                onChange={(e) =>
                  updateField("description", {
                    ...form.description,
                    sw: e.target.value,
                  })
                }
                rows={2}
                disabled={saving}
                className="w-full border border-hairline rounded-lg px-3 py-2 text-sm resize-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">
                {t("Maelezo (EN)", "Description (EN)")}{" "}
                <span className="text-rust">*</span>
              </label>
              <textarea
                value={form.description?.en || ""}
                onChange={(e) =>
                  updateField("description", {
                    ...form.description,
                    en: e.target.value,
                  })
                }
                rows={2}
                disabled={saving}
                className="w-full border border-hairline rounded-lg px-3 py-2 text-sm resize-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">
                {t("Bei (TZS)", "Price (TZS)")}{" "}
                <span className="text-rust">*</span>
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => updateField("price", Number(e.target.value))}
                disabled={saving}
                className="w-full border border-hairline rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">
                {t("Salio", "Credits")}
              </label>
              <input
                type="number"
                value={getCreditsForType(form.type)}
                onChange={(e) =>
                  updateField("credits", {
                    ...(form.credits && typeof form.credits === "object"
                      ? form.credits
                      : {}),
                    [form.type]: Number(e.target.value),
                  })
                }
                disabled={saving}
                className="w-full border border-hairline rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">
                {t("Muda (siku)", "Validity (days)")}
              </label>
              <input
                type="number"
                value={form.validityDays}
                onChange={(e) =>
                  updateField("validityDays", Number(e.target.value))
                }
                disabled={saving}
                className="w-full border border-hairline rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">
                {t("Punguzo (%)", "Discount (%)")}
              </label>
              <input
                type="number"
                value={form.discountPercent}
                onChange={(e) =>
                  updateField("discountPercent", Number(e.target.value))
                }
                disabled={saving}
                className="w-full border border-hairline rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => updateField("featured", e.target.checked)}
              disabled={saving}
              className="w-4 h-4 rounded text-gold disabled:opacity-50"
            />
            <span className="text-xs sm:text-sm text-secondary">
              {t("Onyesha kama Maarufu", "Mark as Featured")}
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active !== false}
              onChange={(e) => updateField("active", e.target.checked)}
              disabled={saving}
              className="w-4 h-4 rounded text-gold disabled:opacity-50"
            />
            <span className="text-xs sm:text-sm text-secondary">
              {t("Hai (active)", "Active")}
            </span>
          </label>

          {displayError && (
            <p className="text-xs text-rust bg-rust/10 rounded-lg px-3 py-2">
              {displayError}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 pt-3 sticky bottom-0 bg-card pb-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg border border-hairline text-secondary text-xs sm:text-sm font-medium disabled:opacity-50"
            >
              {t("Ghairi", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-gold text-night text-xs sm:text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {t("Hifadhi", "Save")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
// ============================================================
// HISTORY MODAL — manunuzi ya bundle (au ya vifurushi vyote)
// ============================================================
const PURCHASE_STATUS = {
  PAID: {
    sw: "Imelipwa",
    en: "Paid",
    cls: "bg-green/10 text-green",
  },
  PENDING: {
    sw: "Inasubiri",
    en: "Pending",
    cls: "bg-gold/15 text-gold-ink",
  },
  FAILED: {
    sw: "Imeshindwa",
    en: "Failed",
    cls: "bg-rust/10 text-rust",
  },
  REFUNDED: {
    sw: "Imerudishwa",
    en: "Refunded",
    cls: "bg-page text-secondary",
  },
};

const HISTORY_PAGE_SIZE = 15;

function fmtDate(iso, lang) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return d.toLocaleString(lang === "sw" ? "sw-TZ" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return d.toISOString().slice(0, 16).replace("T", " ");
  }
}

function creditsText(credits, lang) {
  const entries = Object.entries(credits || {});
  if (!entries.length) return "—";
  return entries
    .map(([k, v]) => `${pickLang(CREDIT_LABELS[k], lang) || k}: ${v}`)
    .join(", ");
}

function BundleHistoryModal({ bundle, lang, onClose }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search inasubiri kidogo ili isiite API kwa kila herufi
  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      const res = await fetchBundlePurchasesAsync({
        page,
        page_size: HISTORY_PAGE_SIZE,
        ...(bundle?.id ? { bundle: bundle.id } : {}),
        ...(status ? { status } : {}),
        ...(query ? { search: query } : {}),
      });
      if (cancelled) return;
      if (res.ok) {
        setItems(res.items);
        setCount(res.count);
        setSummary(res.summary);
      } else {
        setError(
          res.error?.data?.detail ||
            res.error?.data?.error?.message ||
            res.error?.message ||
            t("Imeshindwa kupakia historia.", "Failed to load history.")
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundle?.id, page, status, query]);

  const totalPages = Math.max(1, Math.ceil(count / HISTORY_PAGE_SIZE));
  const title = bundle
    ? pickLang(bundle.name, lang) || displayBundleCode(bundle.code, lang)
    : t("Vifurushi vyote", "All bundles");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl max-w-3xl w-full p-4 sm:p-6 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-card pb-2 border-b border-hairline">
          <div className="min-w-0">
            <h3 className="font-bold text-primary text-sm sm:text-base">
              {t("Historia ya Manunuzi", "Purchase History")}
            </h3>
            <p className="text-xs text-secondary truncate">
              {title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted hover:text-secondary"
            aria-label={t("Funga", "Close")}
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="rounded-lg border border-hairline p-2.5 text-center">
            <p className="text-lg font-bold text-primary">
              {summary ? summary.count : "—"}
            </p>
            <p className="text-xs text-secondary">
              {t("Manunuzi yote", "All purchases")}
            </p>
          </div>
          <div className="rounded-lg border border-hairline p-2.5 text-center">
            <p className="text-lg font-bold text-green">
              {summary ? summary.paidCount : "—"}
            </p>
            <p className="text-xs text-secondary">
              {t("Yaliyolipwa", "Paid")}
            </p>
          </div>
          <div className="rounded-lg border border-hairline p-2.5 text-center">
            <p className="text-sm sm:text-base font-bold text-rust leading-7">
              {summary ? formatTZS(summary.paidAmount) : "—"}
            </p>
            <p className="text-xs text-secondary">
              {t("Mapato", "Revenue")}
            </p>
          </div>
          <div className="rounded-lg border border-hairline p-2.5 text-center">
            <p className="text-lg font-bold text-gold-ink">
              {summary ? summary.creditsIssued : "—"}
            </p>
            <p className="text-xs text-secondary">
              {t("Credits zilizotolewa", "Credits issued")}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(
                "Tafuta mnunuzi, simu, barua pepe, kumbukumbu...",
                "Search buyer, phone, email, reference..."
              )}
              className="w-full rounded-lg border border-hairline bg-card pl-3 pr-9 py-2 text-sm outline-none"
            />
            <Search
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-hairline bg-card px-3 py-2 text-sm"
          >
            <option value="">{t("Hali zote", "All statuses")}</option>
            {Object.entries(PURCHASE_STATUS).map(([key, v]) => (
              <option key={key} value={key}>
                {pickLang(v, lang)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="text-xs font-semibold px-3 py-2 rounded-lg bg-rust/10 text-rust mb-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 size={22} className="animate-spin text-muted" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-hairline p-8 text-center">
            <Package size={32} className="mx-auto text-muted mb-2" />
            <p className="text-xs sm:text-sm text-secondary">
              {t("Hakuna manunuzi yaliyopatikana.", "No purchases found.")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((p) => {
              const st = PURCHASE_STATUS[p.status] || PURCHASE_STATUS.PENDING;
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-hairline p-3 flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-primary truncate">
                        {p.user.name || p.user.email || p.user.phone || "—"}
                      </p>
                      <p className="text-xs text-secondary truncate">
                        {[p.user.phone, p.user.email]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${st.cls}`}
                    >
                      {pickLang(st, lang)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {!bundle && (
                      <span className="text-xs text-secondary truncate">
                        {pickLang(p.bundle.name, lang) ||
                          displayBundleCode(p.bundle.code, lang)}
                      </span>
                    )}
                    <span className="text-sm font-bold text-rust">
                      {formatTZS(p.amount)}
                    </span>
                  </div>

                  <p className="text-xs text-secondary flex items-start gap-1">
                    <Coins size={12} className="mt-0.5 shrink-0" />
                    <span>
                      {creditsText(p.credits, lang)}
                      {p.creditsTotal > 0 && ` (${p.creditsTotal})`}
                    </span>
                  </p>

                  <div className="flex items-center justify-between gap-2 text-xs text-muted flex-wrap">
                    <span>
                      {p.paidAt
                        ? `${t("Imelipwa", "Paid")}: ${fmtDate(p.paidAt, lang)}`
                        : `${t("Imeundwa", "Created")}: ${fmtDate(
                            p.createdAt,
                            lang
                          )}`}
                    </span>
                    {p.paymentReference && (
                      <span
                        className="font-mono truncate max-w-[180px]"
                        title={p.paymentReference}
                      >
                        {p.paymentReference}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && count > HISTORY_PAGE_SIZE && (
          <div className="flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg border border-hairline text-secondary disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              {t("Nyuma", "Prev")}
            </button>
            <span className="text-xs text-secondary">
              {t("Ukurasa", "Page")} {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg border border-hairline text-secondary disabled:opacity-40"
            >
              {t("Mbele", "Next")}
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminBundles() {
  const { lang } = useLanguage();
  const bundles = useBundles();
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const inflightRef = React.useRef(new Set());
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");
  // history.open = dirisha liko wazi; history.bundle = null → vifurushi vyote
  const [history, setHistory] = useState({ open: false, bundle: null });

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleSave = async (bundle) => {
    if (saving || inflightRef.current.has("save")) return;
    inflightRef.current.add("save");
    setSaving(true);
    setError("");

    const res = editing
      ? await updateBundleAsync(editing.id, bundle)
      : await createBundleAsync(bundle);

    setSaving(false);
    inflightRef.current.delete("save");

    if (res.ok) {
      setEditing(null);
      setShowForm(false);
    } else {
      setError(
        res.error?.data?.detail ||
          res.error?.message ||
          t("Imeshindwa kuhifadhi kifurushi.", "Failed to save bundle.")
      );
    }
  };

  const handleToggle = async (id) => {
    if (busy[`toggle-${id}`]) return;
    setBusy((b) => ({ ...b, [`toggle-${id}`]: true }));
    setError("");

    const res = await toggleBundleActiveAsync(id);

    setBusy((b) => {
      const n = { ...b };
      delete n[`toggle-${id}`];
      return n;
    });

    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kubadilisha hali.", "Failed to toggle status.")
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("Futa kifurushi hiki?", "Delete this bundle?")))
      return;
    if (busy[`delete-${id}`]) return;
    setBusy((b) => ({ ...b, [`delete-${id}`]: true }));
    setError("");

    const res = await removeBundleAsync(id);

    setBusy((b) => {
      const n = { ...b };
      delete n[`delete-${id}`];
      return n;
    });

    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kufuta kifurushi.", "Failed to delete bundle.")
      );
    }
  };

  const filtered = bundles.filter((b) => {
    const matchesType = filterType === "all" || b.type === filterType;
    const q = searchQuery.toLowerCase();
    const displayCode = displayBundleCode(b.code, lang).toLowerCase();
    const matchesSearch =
      !q ||
      (b.name?.sw || "").toLowerCase().includes(q) ||
      (b.name?.en || "").toLowerCase().includes(q) ||
      String(b.code || "").toLowerCase().includes(q) ||
      displayCode.includes(q);
    return matchesType && matchesSearch;
  });

  const stats = {
    total: bundles.length,
    active: bundles.filter((b) => b.active).length,
    inactive: bundles.filter((b) => !b.active).length,
    featured: bundles.filter((b) => b.featured).length,
  };

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center gap-3 mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-primary">
            {t("Vifurushi vya Huduma", "Service Bundles")}
          </h1>
          <p className="text-xs sm:text-sm text-secondary max-w-xl px-2">
            {t(
              "Dhibiti vifurushi vya huduma vinavyouzwa kwa watumiaji.",
              "Manage bundles sold to users."
            )}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-2xl mt-2">
            <div className="bg-card rounded-lg border border-hairline p-2.5 text-center">
              <p className="text-lg font-bold text-primary">{stats.total}</p>
              <p className="text-xs text-secondary">{t("Zote", "Total")}</p>
            </div>
            <div className="bg-card rounded-lg border border-hairline p-2.5 text-center">
              <p className="text-lg font-bold text-green">{stats.active}</p>
              <p className="text-xs text-secondary">{t("Hai", "Active")}</p>
            </div>
            <div className="bg-card rounded-lg border border-hairline p-2.5 text-center">
              <p className="text-lg font-bold text-secondary">
                {stats.inactive}
              </p>
              <p className="text-xs text-secondary">
                {t("Imesimamishwa", "Inactive")}
              </p>
            </div>
            <div className="bg-card rounded-lg border border-hairline p-2.5 text-center">
              <p className="text-lg font-bold text-gold-ink">
                {stats.featured}
              </p>
              <p className="text-xs text-secondary">
                {t("Maarufu", "Featured")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center mt-2">
            <button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
                setError("");
              }}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg bg-gold text-night disabled:opacity-50"
            >
              <Plus size={14} />
              {t("Ongeza Kifurushi", "Add Bundle")}
            </button>
            <button
              onClick={() => setHistory({ open: true, bundle: null })}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg border border-hairline bg-card text-secondary hover:bg-page"
            >
              <History size={14} />
              {t("Historia ya Manunuzi", "Purchase History")}
            </button>
          </div>

          {error && !showForm && (
            <div className="text-xs font-semibold px-3 py-2 rounded-lg bg-rust/10 text-rust max-w-xl">
              {error}
            </div>
          )}
        </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Tafuta kifurushi...", "Search bundle...")}
              className="smk-inline-search w-full rounded-xl border border-hairline bg-card pl-3 pr-10 py-2.5 text-sm outline-none focus:outline-none focus-visible:outline-none"
              style={{ WebkitAppearance: "none" }}
            />
            <Search
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            />
          </div>
          
          {/* FIX: Filters scroll — kitufe cha kwanza kinaonekana, scroll pande zote mbili */}
          <div 
            className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1"
            style={{
              scrollbarWidth: "thin",
              WebkitOverflowScrolling: "touch",
              scrollBehavior: "smooth",
            }}
          >
            {["all", ...Object.keys(TYPE_LABELS)].map((key) => {
              const label =
                key === "all"
                  ? t("Zote", "All")
                  : pickLang(TYPE_LABELS[key], lang);
              return (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`text-xs font-semibold px-3 py-1.5 sm:py-2 rounded-full border whitespace-nowrap shrink-0 transition-colors ${
                    filterType === key
                      ? "bg-night text-sand border-night"
                      : "bg-card text-primary border-hairline"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-hairline p-8 sm:p-12 text-center bg-card">
            <Package
              size={40}
              className="mx-auto text-muted mb-3 sm:w-12 sm:h-12"
            />
            <p className="text-xs sm:text-sm text-secondary">
              {t("Hakuna vifurushi.", "No bundles found.")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map((b) => {
              const isToggling = !!busy[`toggle-${b.id}`];
              const isDeleting = !!busy[`delete-${b.id}`];
              return (
                <div
                  key={b.id}
                  className="bg-card rounded-xl border border-hairline p-3 sm:p-4 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-primary truncate">
                        {pickLang(b.name, lang) ||
                          displayBundleCode(b.code, lang)}
                      </p>
                      <p className="text-xs text-secondary capitalize">
                        {pickLang(TYPE_LABELS[b.type], lang) || b.type}
                      </p>
                      <p
                        className="text-xs text-muted font-mono truncate"
                        title={`Code: ${b.code}`}
                      >
                        {displayBundleCode(b.code, lang)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        b.active
                          ? "bg-green/10 text-green"
                          : "bg-page text-secondary"
                      }`}
                    >
                      {b.active
                        ? t("Hai", "Active")
                        : t("Imesimamishwa", "Inactive")}
                    </span>
                  </div>

                  <p className="text-base sm:text-lg font-bold text-rust">
                    {formatTZS(b.price)}
                  </p>

                  <p className="text-xs text-secondary line-clamp-2">
                    {t("Salio", "Credits")}:{" "}
                    {b && typeof b.credits === "object"
                      ? Object.entries(b.credits)
                          .map(
                            ([k, v]) =>
                              `${pickLang(CREDIT_LABELS[k], lang) || k}: ${v}`
                          )
                          .join(", ")
                      : b.credits}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-secondary flex-wrap">
                    {b.validityDays && (
                      <span>
                        {t(
                          `Siku ${b.validityDays}`,
                          `${b.validityDays} days`
                        )}
                      </span>
                    )}
                    {b.discountPercent > 0 && (
                      <span className="text-green font-semibold">
                        {t(
                          `Okoa ${b.discountPercent}%`,
                          `Save ${b.discountPercent}%`
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-secondary flex-wrap">
                    <span title={t("Manunuzi yaliyolipwa", "Paid purchases")}>
                      {t("Zilizonunuliwa", "Purchased")}:{" "}
                      <b className="text-primary">{b.purchasesCount}</b>
                    </span>
                    <span
                      title={
                        Object.keys(b.creditsIssuedByService || {}).length
                          ? creditsText(b.creditsIssuedByService, lang)
                          : ""
                      }
                    >
                      {t("Credits zilizotolewa", "Credits issued")}:{" "}
                      <b className="text-primary">{b.creditsIssued}</b>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-2">
                    <button
                      onClick={() => {
                        setEditing(b);
                        setShowForm(true);
                        setError("");
                      }}
                      disabled={saving || isToggling || isDeleting}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-2 rounded-lg border border-hairline text-secondary hover:bg-page transition-colors disabled:opacity-50"
                    >
                      <Pencil size={12} />
                      {t("Hariri", "Edit")}
                    </button>
                    <button
                      onClick={() => setHistory({ open: true, bundle: b })}
                      className="p-2 text-muted hover:text-rust rounded-lg hover:bg-page transition-colors"
                      title={t("Historia ya manunuzi", "Purchase history")}
                      aria-label={t("Historia ya manunuzi", "Purchase history")}
                    >
                      <History size={14} />
                    </button>
                    <button
                      onClick={() => handleToggle(b.id)}
                      disabled={isToggling || isDeleting}
                      className="p-2 text-muted hover:text-green rounded-lg hover:bg-page transition-colors disabled:opacity-50"
                      title={
                        b.active
                          ? t("Simamisha", "Deactivate")
                          : t("Washa", "Activate")
                      }
                      aria-label={
                        b.active
                          ? t("Simamisha", "Deactivate")
                          : t("Washa", "Activate")
                      }
                    >
                      {isToggling ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : b.active ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={isDeleting || isToggling}
                      className="p-2 text-muted hover:text-rust rounded-lg hover:bg-page transition-colors disabled:opacity-50"
                      aria-label={t("Futa", "Delete")}
                    >
                      {isDeleting ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {history.open && (
        <BundleHistoryModal
          bundle={history.bundle}
          lang={lang}
          onClose={() => setHistory({ open: false, bundle: null })}
        />
      )}

      {showForm && (
        <BundleFormModal
          bundle={editing}
          lang={lang}
          saving={saving}
          error={error}
          onSave={handleSave}
          onClose={() => {
            if (saving) return;
            setShowForm(false);
            setEditing(null);
            setError("");
          }}
        />
      )}
    </div>
  );
}