// ============================================================
// AdminBundles.jsx
// Admin anaweza kuongeza/kubadilisha/kufuta bundles.
// Bilingual kamili + mobile-responsive.
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
} from "lucide-react";

import { COLORS, FONTS, formatTZS } from "./dashboard/components/shared";
import {
  useBundles,
  addBundle,
  updateBundle,
  removeBundle,
  toggleBundleActive,
} from "../config/bundlesStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";

// ============================================================
// BILINGUAL — type labels
// ============================================================
const TYPE_LABELS = {
  listing: { sw: "Listing", en: "Listing" },
  leading: { sw: "Leading", en: "Leading" },
  boost: { sw: "Boost", en: "Boost" },
  reservation: { sw: "Reservation", en: "Reservation" },
  ads: { sw: "Matangazo", en: "Ads" },
  premium: { sw: "Premium", en: "Premium" },
  package: { sw: "Kifurushi", en: "Package" },
};

// ============================================================
// FORM MODAL — bilingual + responsive
// ============================================================
function BundleFormModal({ bundle, onSave, onClose, lang }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const [form, setForm] = useState(
    bundle || {
      id: "",
      type: "listing",
      name: { sw: "", en: "" },
      description: { sw: "", en: "" },
      price: 0,
      credits: 1,
      validityDays: 90,
      services: [],
      discountPercent: 0,
      active: true,
      featured: false,
      icon: "Package",
      color: "night",
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.id || !form.name?.sw || !form.price) return;
    onSave(form);
    onClose();
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-4 sm:p-6 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-2 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-sm sm:text-base">
            {bundle
              ? t("Hariri Kifurushi", "Edit Bundle")
              : t("Ongeza Kifurushi", "Add Bundle")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
            aria-label={t("Funga", "Close")}
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {/* ID */}
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 mb-1">
              ID
            </label>
            <input
              value={form.id}
              onChange={(e) => updateField("id", e.target.value)}
              disabled={!!bundle}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="b_listing_starter"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 mb-1">
              {t("Aina", "Type")}
            </label>
            <select
              value={form.type}
              onChange={(e) => updateField("type", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label[lang] || label.sw}
                </option>
              ))}
            </select>
          </div>

          {/* Name SW/EN — stacked kwenye mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 mb-1">
                {t("Jina (SW)", "Name (SW)")}
              </label>
              <input
                value={form.name?.sw || ""}
                onChange={(e) =>
                  updateField("name", { ...form.name, sw: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 mb-1">
                {t("Jina (EN)", "Name (EN)")}
              </label>
              <input
                value={form.name?.en || ""}
                onChange={(e) =>
                  updateField("name", { ...form.name, en: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Description SW/EN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 mb-1">
                {t("Maelezo (SW)", "Description (SW)")}
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 mb-1">
                {t("Maelezo (EN)", "Description (EN)")}
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              />
            </div>
          </div>

          {/* Price + Credits + Validity + Discount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 mb-1">
                {t("Bei (TZS)", "Price (TZS)")}
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => updateField("price", Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 mb-1">
                {t("Credits", "Credits")}
              </label>
              <input
                type="number"
                value={typeof form.credits === "number" ? form.credits : 0}
                onChange={(e) =>
                  updateField("credits", Number(e.target.value))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 mb-1">
                {t("Muda (siku)", "Validity (days)")}
              </label>
              <input
                type="number"
                value={form.validityDays}
                onChange={(e) =>
                  updateField("validityDays", Number(e.target.value))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-gray-600 mb-1">
                {t("Punguzo (%)", "Discount (%)")}
              </label>
              <input
                type="number"
                value={form.discountPercent}
                onChange={(e) =>
                  updateField("discountPercent", Number(e.target.value))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Featured */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => updateField("featured", e.target.checked)}
              className="w-4 h-4 rounded text-[#E8A33D]"
            />
            <span className="text-xs sm:text-sm text-gray-600">
              {t("Onyesha kama Featured", "Mark as Featured")}
            </span>
          </label>

          {/* Submit — stacked kwenye mobile */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 pt-3 sticky bottom-0 bg-white pb-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-xs sm:text-sm font-medium"
            >
              {t("Ghairi", "Cancel")}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg bg-[#E8A33D] text-[#101A2E] text-xs sm:text-sm font-semibold"
            >
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

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleSave = (bundle) => {
    if (editing) {
      updateBundle(editing.id, bundle);
    } else {
      addBundle(bundle);
    }
    setEditing(null);
  };

  const filtered = bundles.filter((b) => {
    const matchesType = filterType === "all" || b.type === filterType;
    const matchesSearch =
      !searchQuery ||
      (b.name?.sw || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.name?.en || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Takwimu
  const stats = {
    total: bundles.length,
    active: bundles.filter((b) => b.active).length,
    inactive: bundles.filter((b) => !b.active).length,
    featured: bundles.filter((b) => b.featured).length,
  };

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* ============================================================ */}
        {/* HEADER — CENTERED */}
        {/* ============================================================ */}
        <div className="flex flex-col items-center text-center gap-3 mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            {t("Vifurushi vya Huduma", "Service Bundles")}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl px-2">
            {t(
              "Dhibiti bundles/vifurushi vya huduma vinavyouzwa kwa watumiaji.",
              "Manage bundles sold to users."
            )}
          </p>

          {/* Quick stats — grid ya 2x2 kwenye mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-2xl mt-2">
            <div className="bg-white rounded-lg border border-gray-100 p-2.5 text-center">
              <p className="text-lg font-bold text-gray-800">{stats.total}</p>
              <p className="text-[10px] text-gray-500">
                {t("Zote", "Total")}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-2.5 text-center">
              <p className="text-lg font-bold text-[#2F6D4F]">
                {stats.active}
              </p>
              <p className="text-[10px] text-gray-500">
                {t("Hai", "Active")}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-2.5 text-center">
              <p className="text-lg font-bold text-gray-500">
                {stats.inactive}
              </p>
              <p className="text-[10px] text-gray-500">
                {t("Imesimamishwa", "Inactive")}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-2.5 text-center">
              <p className="text-lg font-bold text-[#E8A33D]">
                {stats.featured}
              </p>
              <p className="text-[10px] text-gray-500">
                {t("Maarufu", "Featured")}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg bg-[#E8A33D] text-[#101A2E] mt-2"
          >
            <Plus size={14} />
            {t("Ongeza Kifurushi", "Add Bundle")}
          </button>
        </div>

        {/* ============================================================ */}
        {/* SEARCH + FILTER — responsive */}
        {/* ============================================================ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Tafuta kifurushi...", "Search bundle...")}
              className="w-full rounded-xl border border-gray-200 pl-10 pr-3 py-2.5 text-sm outline-none focus:border-[#E8A33D] bg-white"
            />
          </div>

          {/* Type filter — scrollable kwenye mobile */}
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
            {["all", ...Object.keys(TYPE_LABELS)].map((key) => {
              const label =
                key === "all"
                  ? t("Zote", "All")
                  : TYPE_LABELS[key]?.[lang] || TYPE_LABELS[key]?.sw;
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

        {/* ============================================================ */}
        {/* BUNDLES LIST — responsive grid */}
        {/* ============================================================ */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 sm:p-12 text-center bg-white">
            <Package
              size={40}
              className="mx-auto text-gray-300 mb-3 sm:w-12 sm:h-12"
            />
            <p className="text-xs sm:text-sm text-gray-500">
              {t("Hakuna vifurushi.", "No bundles found.")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 flex flex-col gap-2"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs sm:text-sm text-gray-800 truncate">
                      {b.name?.[lang] || b.name?.sw}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500 capitalize">
                      {TYPE_LABELS[b.type]?.[lang] || TYPE_LABELS[b.type]?.sw}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      b.active
                        ? "bg-[#2F6D4F]/10 text-[#2F6D4F]"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {b.active ? t("Hai", "Active") : t("Imesimamishwa", "Inactive")}
                  </span>
                </div>

                {/* Price */}
                <p className="text-base sm:text-lg font-bold text-[#C1502E]">
                  {formatTZS(b.price)}
                </p>

                {/* Credits */}
                <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-2">
                  {t("Credits", "Credits")}:{" "}
                  {typeof b.credits === "object"
                    ? Object.entries(b.credits)
                        .map(([k, v]) => `${k}:${v}`)
                        .join(", ")
                    : b.credits}
                </p>

                {/* Validity + Discount */}
                <div className="flex items-center gap-3 text-[10px] sm:text-xs text-gray-500 flex-wrap">
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

                {/* Actions — responsive */}
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    onClick={() => {
                      setEditing(b);
                      setShowForm(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 text-[11px] sm:text-xs font-semibold py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Pencil size={12} />
                    {t("Hariri", "Edit")}
                  </button>
                  <button
                    onClick={() => toggleBundleActive(b.id)}
                    className="p-2 text-gray-400 hover:text-[#2F6D4F] rounded-lg hover:bg-gray-50 transition-colors"
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
                    {b.active ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          t(
                            "Futa kifurushi hiki?",
                            "Delete this bundle?"
                          )
                        )
                      ) {
                        removeBundle(b.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-[#C1502E] rounded-lg hover:bg-gray-50 transition-colors"
                    aria-label={t("Futa", "Delete")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <BundleFormModal
          bundle={editing}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          lang={lang}
        />
      )}
    </div>
  );
}
