// ============================================================
// MySearchesSection.jsx
// Buyer — saved searches (alerts) zake.
// Bilingual + mobile-responsive.
// ============================================================

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Trash2,
  Plus,
  X,
  MapPin,
  CheckCircle,
  Filter,
} from "lucide-react";
import { COLORS, FONTS, formatTZS, timeAgo } from "../components/shared";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import {
  useSearches,
  addSearch,
  removeSearch,
  countMatches,
} from "../../../config/searchesStore.js";
import { usePublicListings } from "../../../config/listingsStore.js";
import {
  useActiveCategories,
  getCategoryIcon,
} from "../../../config/categoriesStore.js";

const REGIONS = [
  "Arusha", "Dar es Salaam", "Dodoma", "Geita", "Iringa", "Kagera", "Katavi",
  "Kigoma", "Kilimanjaro", "Lindi", "Manyara", "Mara", "Mbeya", "Morogoro",
  "Mtwara", "Mwanza", "Njombe", "Pwani", "Rukwa", "Ruvuma", "Shinyanga",
  "Simiyu", "Singida", "Songwe", "Tabora", "Tanga",
  "Kaskazini Pemba", "Kusini Pemba", "Kaskazini Unguja", "Kusini Unguja",
  "Mjini Magharibi",
];

export default function MySearchesSection() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const searches = useSearches();
  const listings = usePublicListings();
  const categories = useActiveCategories();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    query: "",
    category: null,
    minPrice: "",
    maxPrice: "",
    region: null,
    verifiedOnly: false,
  });

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // Match counts kwa kila search
  const searchesWithCounts = useMemo(
    () =>
      searches.map((s) => ({
        ...s,
        matchCount: countMatches(s, listings),
      })),
    [searches, listings]
  );

  const canSave = form.name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    addSearch({
      name: form.name.trim(),
      query: form.query.trim(),
      category: form.category,
      minPrice: form.minPrice ? Number(form.minPrice.replace(/\D/g, "")) : null,
      maxPrice: form.maxPrice ? Number(form.maxPrice.replace(/\D/g, "")) : null,
      region: form.region,
      verifiedOnly: form.verifiedOnly,
    });
    setForm({
      name: "",
      query: "",
      category: null,
      minPrice: "",
      maxPrice: "",
      region: null,
      verifiedOnly: false,
    });
    setShowForm(false);
  };

  const runSearch = (search) => {
    const params = new URLSearchParams();
    if (search.query) params.set("tafuta", search.query);
    if (search.category) params.set("kategoria", search.category);
    if (search.region) params.set("mkoa", search.region);
    if (search.minPrice != null) params.set("min", search.minPrice);
    if (search.maxPrice != null) params.set("max", search.maxPrice);
    if (search.verifiedOnly) params.set("verified", "1");
    navigate(`/tafuta?${params.toString()}`);
  };

  return (
    <div
      style={{ background: COLORS.sand, fontFamily: FONTS.body, minHeight: "100%" }}
      className="w-full p-4 sm:p-6"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..700&family=Manrope:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-3 mb-6 flex-wrap">
          <div>
            <h1
              style={{ fontFamily: FONTS.display, color: COLORS.night }}
              className="text-2xl sm:text-3xl font-semibold"
            >
              {t("Utafutaji Wangu", "My Searches")}
            </h1>
            <p style={{ color: "rgba(16,26,46,0.6)" }} className="text-sm mt-1">
              {t(
                "Hifadhi utafutaji wako na upate taarifa listings mpya zinapolingana.",
                "Save your searches and get notified when new listings match."
              )}
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 shrink-0"
          >
            <Plus size={13} />
            {t("Utafutaji Mpya", "New Search")}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div
            style={{ borderColor: COLORS.sandLine, background: "white" }}
            className="rounded-2xl border p-4 mb-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <p style={{ color: COLORS.night }} className="text-sm font-semibold">
                {t("Utafutaji Mpya", "New Search")}
              </p>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Name */}
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-gray-500">
                {t("Jina la Utafutaji", "Search Name")}
              </span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("mfano: Toyota Harrier Dar", "e.g. Toyota Harrier Dar")}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E8A33D]"
              />
            </label>

            {/* Query */}
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-gray-500">
                {t("Neno la Utafutaji (hiari)", "Search Query (optional)")}
              </span>
              <input
                value={form.query}
                onChange={(e) => setForm({ ...form, query: e.target.value })}
                placeholder={t("mfano: Harrier", "e.g. Harrier")}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E8A33D]"
              />
            </label>

            {/* Category */}
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-gray-500">
                {t("Kategoria (hiari)", "Category (optional)")}
              </span>
              <select
                value={form.category || ""}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value || null })
                }
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E8A33D]"
              >
                <option value="">{t("Zote", "All")}</option>
                {categories.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label?.[lang] || cat.label?.sw}
                  </option>
                ))}
              </select>
            </label>

            {/* Region */}
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-gray-500">
                {t("Mkoa (hiari)", "Region (optional)")}
              </span>
              <select
                value={form.region || ""}
                onChange={(e) =>
                  setForm({ ...form, region: e.target.value || null })
                }
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E8A33D]"
              >
                <option value="">{t("Zote", "All")}</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            {/* Price */}
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-gray-500">
                  {t("Bei ya Chini (TZS)", "Min Price (TZS)")}
                </span>
                <input
                  value={form.minPrice}
                  onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
                  placeholder="0"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E8A33D]"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-gray-500">
                  {t("Bei ya Juu (TZS)", "Max Price (TZS)")}
                </span>
                <input
                  value={form.maxPrice}
                  onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
                  placeholder="100,000,000"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E8A33D]"
                />
              </label>
            </div>

            {/* Verified only */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.verifiedOnly}
                onChange={(e) =>
                  setForm({ ...form, verifiedOnly: e.target.checked })
                }
                className="w-4 h-4 rounded text-[#E8A33D] focus:ring-[#E8A33D]"
              />
              <span className="text-sm text-gray-600">
                {t("Zilizothibitishwa tu", "Verified only")}
              </span>
            </label>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                {t("Ghairi", "Cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                style={{
                  background: canSave ? COLORS.gold : COLORS.sandLine,
                  color: canSave ? COLORS.night : "rgba(16,26,46,0.4)",
                }}
                className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg"
              >
                {t("Hifadhi Utafutaji", "Save Search")}
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {searchesWithCounts.length === 0 ? (
          <div
            style={{ borderColor: COLORS.sandLine }}
            className="rounded-2xl border-2 border-dashed p-10 text-center bg-white"
          >
            <Bell size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 style={{ color: COLORS.night }} className="font-semibold mb-1">
              {t("Hakuna utafutaji uliohifadhiwa", "No saved searches yet")}
            </h3>
            <p style={{ color: "rgba(16,26,46,0.55)" }} className="text-sm">
              {t(
                'Bofya "Utafutaji Mpya" kuweka alert yako ya kwanza.',
                'Click "New Search" to create your first alert.'
              )}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {searchesWithCounts.map((s) => (
              <div
                key={s.id}
                style={{ borderColor: COLORS.sandLine, background: "white" }}
                className="rounded-xl border p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <p
                      style={{ color: COLORS.night }}
                      className="text-sm font-semibold truncate"
                    >
                      {s.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 flex-wrap">
                      {s.query && (
                        <span className="flex items-center gap-1">
                          <Search size={10} /> {s.query}
                        </span>
                      )}
                      {s.category && (
                        <span className="flex items-center gap-1">
                          <Filter size={10} />{" "}
                          {categories.find((c) => c.key === s.category)?.label?.[lang] ||
                            categories.find((c) => c.key === s.category)?.label?.sw ||
                            s.category}
                        </span>
                      )}
                      {s.region && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} /> {s.region}
                        </span>
                      )}
                      {s.verifiedOnly && (
                        <span className="flex items-center gap-1">
                          <CheckCircle size={10} /> {t("Imethibitishwa", "Verified")}
                        </span>
                      )}
                    </p>
                    {(s.minPrice != null || s.maxPrice != null) && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {s.minPrice != null && formatTZS(s.minPrice)}
                        {s.minPrice != null && s.maxPrice != null && " - "}
                        {s.maxPrice != null && formatTZS(s.maxPrice)}
                      </p>
                    )}
                  </div>

                  <span
                    style={{
                      background:
                        s.matchCount > 0
                          ? "rgba(47,109,79,0.12)"
                          : "rgba(16,26,46,0.08)",
                      color: s.matchCount > 0 ? COLORS.green : COLORS.night,
                    }}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
                  >
                    {s.matchCount} {t("zinalingana", "matches")}
                  </span>
                </div>

                <p className="text-[10px] text-gray-400 mb-3">
                  {t("Ilianzishwa", "Created")} {timeAgo(s.createdAt, lang)}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => runSearch(s)}
                    style={{ background: COLORS.gold, color: COLORS.night }}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
                  >
                    <Search size={12} />
                    {t("Tafuta Sasa", "Search Now")}
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          t("Ondoa utafutaji huu?", "Remove this search?")
                        )
                      ) {
                        removeSearch(s.id);
                      }
                    }}
                    className="ml-auto flex items-center gap-1 text-xs font-semibold px-2 py-2 rounded-lg text-gray-400 hover:text-[#C1502E] transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
