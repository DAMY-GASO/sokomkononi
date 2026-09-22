// ============================================================
// AdminBundles.jsx
// Admin anaweza kuongeza/kubadilisha/kufuta bundles.
// FIXED: uses async CRUD (API-backed) — no more local-only writes.
// ============================================================
import React, { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Package,
  Eye,
  EyeOff,
  Search,
  Loader2,
} from "lucide-react";

import { COLORS, formatTZS } from "./dashboard/components/shared";
import {
  useBundles,
  createBundleAsync,
  updateBundleAsync,
  removeBundleAsync,
  toggleBundleActiveAsync,
} from "../config/bundlesStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";

const TYPE_LABELS = {
  listing: { sw: "Kuweka Mali", en: "Listing" },
  leading: { sw: "Kuongoza", en: "Leading" },
  boost: { sw: "Kukuza", en: "Boost" },
  reservation: { sw: "Kuhifadhi", en: "Reservation" },
  ads: { sw: "Matangazo", en: "Ads" },
  premium: { sw: "Hadhi ya Juu", en: "Premium" },
  package: { sw: "Kifurushi", en: "Package" },
};

const CREDIT_LABELS = {
  listing: { sw: "Kuweka Mali", en: "Listing" },
  leading: { sw: "Kuongoza", en: "Leading" },
  boost: { sw: "Kukuza", en: "Boost" },
  reservation: { sw: "Kuhifadhi", en: "Reservation" },
  ads: { sw: "Matangazo", en: "Ads" },
  premium: { sw: "Hadhi ya Juu", en: "Premium" },
};

const pickLang = (obj, lang) =>
  obj?.[lang] || obj?.[lang === "sw" ? "en" : "sw"] || "";

// ============================================================
// FORM MODAL
// ============================================================
function BundleFormModal({ bundle, onSave, onClose, lang, saving, error }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const initialCredits =
    bundle?.credits && typeof bundle.credits === "object"
      ? bundle.credits
      : { [bundle?.type || "listing"]: Number(bundle?.credits) || 1 };

  const [form, setForm] = useState(
    bundle || {
      id: "",
      code: "",
      type: "listing",
      name: { sw: "", en: "" },
      description: { sw: "", en: "" },
      price: 0,
      credits: { listing: 1 },
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

  const handleSubmit = (e) => {
    e.preventDefault();

    const missing = [];
    if (!form.code?.trim() && !form.id?.trim())
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
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-4 sm:p-6 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-2 border-b border-gray-100">
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
            <label className="block text-[11px] sm:text-xs font-semibold text-secondary mb-1">
              {t("Kitambulisho (ID)", "Identifier (ID)")}{" "}
              <span className="text-[#C1502E]">*</span>
            </label>
            <input
              value={form.code || form.id || ""}
              onChange={(e) => updateField("code", e.target.value)}
              disabled={!!bundle || saving}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-secondary"
              placeholder="b_listing_starter"
            />
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-secondary mb-1">
              {t("Aina", "Type")}
            </label>
            <select
              value={form.type}
              onChange={(e) => updateField("type", e.target.value)}
              disabled={saving}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
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
              <label className="block text-[11px] sm:text-xs font-semibold text-secondary mb-1">
                {t("Jina (SW)", "Name (SW)")}{" "}
                <span className="text-[#C1502E]">*</span>
              </label>
              <input
                value={form.name?.sw || ""}
                onChange={(e) =>
                  updateField("name", { ...form.name, sw: e.target.value })
                }
                disabled={saving}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-secondary mb-1">
                {t("Jina (EN)", "Name (EN)")}{" "}
                <span className="text-[#C1502E]">*</span>
              </label>
              <input
                value={form.name?.en || ""}
                onChange={(e) =>
                  updateField("name", { ...form.name, en: e.target.value })
                }
                disabled={saving}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-secondary mb-1">
                {t("Maelezo (SW)", "Description (SW)")}{" "}
                <span className="text-[#C1502E]">*</span>
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-secondary mb-1">
                {t("Maelezo (EN)", "Description (EN)")}{" "}
                <span className="text-[#C1502E]">*</span>
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-secondary mb-1">
                {t("Bei (TZS)", "Price (TZS)")}{" "}
                <span className="text-[#C1502E]">*</span>
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => updateField("price", Number(e.target.value))}
                disabled={saving}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-secondary mb-1">
                {t("Salio", "Credits")}
              </label>
              <input
                type="number"
                value={initialCredits[form.type] ?? 1}
                onChange={(e) =>
                  updateField("credits", {
                    [form.type]: Number(e.target.value),
                  })
                }
                disabled={saving}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-secondary mb-1">
                {t("Muda (siku)", "Validity (days)")}
              </label>
              <input
                type="number"
                value={form.validityDays}
                onChange={(e) =>
                  updateField("validityDays", Number(e.target.value))
                }
                disabled={saving}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-secondary mb-1">
                {t("Punguzo (%)", "Discount (%)")}
              </label>
              <input
                type="number"
                value={form.discountPercent}
                onChange={(e) =>
                  updateField("discountPercent", Number(e.target.value))
                }
                disabled={saving}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => updateField("featured", e.target.checked)}
              disabled={saving}
              className="w-4 h-4 rounded text-[#E8A33D] disabled:opacity-50"
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
              className="w-4 h-4 rounded text-[#E8A33D] disabled:opacity-50"
            />
            <span className="text-xs sm:text-sm text-secondary">
              {t("Hai (active)", "Active")}
            </span>
          </label>

          {displayError && (
            <p className="text-[11px] sm:text-xs text-[#C1502E] bg-[#C1502E]/10 rounded-lg px-3 py-2">
              {displayError}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 pt-3 sticky bottom-0 bg-white pb-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-secondary text-xs sm:text-sm font-medium disabled:opacity-50"
            >
              {t("Ghairi", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#E8A33D] text-[#101A2E] text-xs sm:text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
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
export default function AdminBundles() {
  const { lang } = useLanguage();
  const bundles = useBundles();
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleSave = async (bundle) => {
    if (saving) return;
    setSaving(true);
    setError("");

    const res = editing
      ? await updateBundleAsync(editing.id, bundle)
      : await createBundleAsync(bundle);

    setSaving(false);

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
    const matchesSearch =
      !q ||
      (b.name?.sw || "").toLowerCase().includes(q) ||
      (b.name?.en || "").toLowerCase().includes(q) ||
      String(b.id || "").toLowerCase().includes(q);
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
            <div className="bg-white rounded-lg border border-gray-100 p-2.5 text-center">
              <p className="text-lg font-bold text-primary">{stats.total}</p>
              <p className="text-[10px] text-secondary">{t("Zote", "Total")}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-2.5 text-center">
              <p className="text-lg font-bold text-[#2F6D4F]">{stats.active}</p>
              <p className="text-[10px] text-secondary">{t("Hai", "Active")}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-2.5 text-center">
              <p className="text-lg font-bold text-secondary">
                {stats.inactive}
              </p>
              <p className="text-[10px] text-secondary">
                {t("Imesimamishwa", "Inactive")}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-2.5 text-center">
              <p className="text-lg font-bold text-[#E8A33D]">
                {stats.featured}
              </p>
              <p className="text-[10px] text-secondary">
                {t("Maarufu", "Featured")}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
              setError("");
            }}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg bg-[#E8A33D] text-[#101A2E] mt-2 disabled:opacity-50"
          >
            <Plus size={14} />
            {t("Ongeza Kifurushi", "Add Bundle")}
          </button>

          {error && !showForm && (
            <div className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#C1502E]/10 text-[#C1502E] max-w-xl">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Tafuta kifurushi...", "Search bundle...")}
              className="w-full rounded-xl border border-gray-200 pl-10 pr-3 py-2.5 text-sm outline-none focus:border-[#E8A33D] bg-white"
            />
          </div>
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
            {["all", ...Object.keys(TYPE_LABELS)].map((key) => {
              const label =
                key === "all"
                  ? t("Zote", "All")
                  : pickLang(TYPE_LABELS[key], lang);
              return (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`text-[11px] sm:text-xs font-semibold px-3 py-1.5 sm:py-2 rounded-full border whitespace-nowrap shrink-0 transition-colors ${
                    filterType === key
                      ? "bg-[#101A2E] text-[#F5F3EC] border-[#101A2E]"
                      : "bg-white text-[#101A2E] border-gray-200"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 sm:p-12 text-center bg-white">
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
                  className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-primary truncate">
                        {pickLang(b.name, lang) || b.id}
                      </p>
                      <p className="text-[10px] sm:text-xs text-secondary capitalize">
                        {pickLang(TYPE_LABELS[b.type], lang) || b.type}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        b.active
                          ? "bg-[#2F6D4F]/10 text-[#2F6D4F]"
                          : "bg-gray-100 text-secondary"
                      }`}
                    >
                      {b.active
                        ? t("Hai", "Active")
                        : t("Imesimamishwa", "Inactive")}
                    </span>
                  </div>

                  <p className="text-base sm:text-lg font-bold text-[#C1502E]">
                    {formatTZS(b.price)}
                  </p>

                  <p className="text-[10px] sm:text-xs text-secondary line-clamp-2">
                    {t("Salio", "Credits")}:{" "}
                    {typeof b.credits === "object"
                      ? Object.entries(b.credits)
                          .map(
                            ([k, v]) =>
                              `${pickLang(CREDIT_LABELS[k], lang) || k}: ${v}`
                          )
                          .join(", ")
                      : b.credits}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] sm:text-xs text-secondary flex-wrap">
                    {b.validityDays && (
                      <span>
                        {t(
                          `Siku ${b.validityDays}`,
                          `${b.validityDays} days`
                        )}
                      </span>
                    )}
                    {b.discountPercent > 0 && (
                      <span className="text-[#2F6D4F] font-semibold">
                        {t(
                          `Okoa ${b.discountPercent}%`,
                          `Save ${b.discountPercent}%`
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-2">
                    <button
                      onClick={() => {
                        setEditing(b);
                        setShowForm(true);
                        setError("");
                      }}
                      disabled={saving || isToggling || isDeleting}
                      className="flex-1 flex items-center justify-center gap-1 text-[11px] sm:text-xs font-semibold py-2 rounded-lg border border-gray-200 text-secondary hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <Pencil size={12} />
                      {t("Hariri", "Edit")}
                    </button>
                    <button
                      onClick={() => handleToggle(b.id)}
                      disabled={isToggling || isDeleting}
                      className="p-2 text-muted hover:text-[#2F6D4F] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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
                      className="p-2 text-muted hover:text-[#C1502E] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
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
