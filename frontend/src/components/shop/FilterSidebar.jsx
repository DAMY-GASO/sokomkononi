import React, { useState, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { useActiveCategories, getCategoryIcon } from "../../config/categoriesStore.js";

const DEFAULT_PRICE_RANGES = [
  { label: { sw: "Chini ya TZS 20M", en: "Under TZS 20M" }, min: 0, max: 20000000 },
  { label: { sw: "TZS 20M - 50M",    en: "TZS 20M - 50M" }, min: 20000000, max: 50000000 },
  { label: { sw: "TZS 50M - 100M",   en: "TZS 50M - 100M" }, min: 50000000, max: 100000000 },
  { label: { sw: "TZS 100M - 200M",  en: "TZS 100M - 200M" }, min: 100000000, max: 200000000 },
  { label: { sw: "Juu ya TZS 200M",  en: "Above TZS 200M" }, min: 200000000, max: Infinity },
];

const REGIONS = [
  "Arusha", "Dar es Salaam", "Dodoma", "Geita", "Iringa", "Kagera", "Katavi",
  "Kigoma", "Kilimanjaro", "Lindi", "Manyara", "Mara", "Mbeya", "Morogoro",
  "Mtwara", "Mwanza", "Njombe", "Pwani", "Rukwa", "Ruvuma", "Shinyanga",
  "Simiyu", "Singida", "Songwe", "Tabora", "Tanga",
  "Kaskazini Pemba", "Kusini Pemba", "Kaskazini Unguja", "Kusini Unguja",
  "Mjini Magharibi",
];

export default function FilterSidebar({
  filters,
  setFilters,
  isOpen,
  onClose,
  hideCategories = false,
  priceRanges = DEFAULT_PRICE_RANGES,
  className = "",
}) {
  const { lang } = useLanguage();
  const allCategories = useActiveCategories();
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => { setLocalFilters(filters); }, [filters]);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleApply = () => { setFilters(localFilters); onClose?.(); };
  const handleReset = () => {
    setLocalFilters({
      categories: [],
      priceRange: null,
      regions: [],
      verified: false,
      featured: false,
    });
  };

  const toggleCategory = (cat) => {
    setLocalFilters((p) => ({
      ...p,
      categories: p.categories?.includes(cat)
        ? p.categories.filter((c) => c !== cat)
        : [...(p.categories || []), cat],
    }));
  };
  const toggleRegion = (region) => {
    setLocalFilters((p) => ({
      ...p,
      regions: p.regions?.includes(region)
        ? p.regions.filter((r) => r !== region)
        : [...(p.regions || []), region],
    }));
  };

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary flex items-center gap-2">
          <SlidersHorizontal size={16} />
          {t("Vichujio", "Filters")}
        </h3>
        <button
          onClick={onClose}
          className="lg:hidden text-muted hover:text-secondary"
          aria-label={t("Funga", "Close")}
        >
          <X size={20} />
        </button>
      </div>

      {!hideCategories && (
        <div>
          <h4 className="text-sm font-medium text-secondary mb-3">
            {t("Kategoria", "Category")}
          </h4>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {allCategories.map((cat) => {
              const CatIcon = getCategoryIcon(cat.iconKey);
              const checked = localFilters.categories?.includes(cat.key);
              return (
                <label key={cat.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!checked}
                    onChange={() => toggleCategory(cat.key)}
                    className="w-4 h-4 rounded text-gold-ink focus:ring-gold"
                  />
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt=""
                      className="w-5 h-5 rounded object-cover shrink-0"
                    />
                  ) : (
                    <CatIcon size={16} className="text-muted shrink-0" />
                  )}
                  <span className="text-sm text-secondary">
                    {cat.label?.[lang] || cat.label?.sw}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-medium text-secondary mb-3">
          {t("Bei", "Price")}
        </h4>
        <div className="space-y-2">
          {priceRanges.map((range, idx) => (
            <label key={idx} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="priceRange"
                checked={localFilters.priceRange === idx}
                onChange={() => setLocalFilters({ ...localFilters, priceRange: idx })}
                className="w-4 h-4 text-gold-ink focus:ring-gold"
              />
              <span className="text-sm text-secondary">
                {range.label?.[lang] || range.label?.sw || range.en}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-secondary mb-3">
          {t("Mkoa", "Region")}
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {REGIONS.map((region) => (
            <label key={region} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.regions?.includes(region)}
                onChange={() => toggleRegion(region)}
                className="w-4 h-4 rounded text-gold-ink focus:ring-gold"
              />
              <span className="text-sm text-secondary">{region}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-secondary mb-3">
          {t("Vigezo Vingine", "Other")}
        </h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.verified}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, verified: e.target.checked })
              }
              className="w-4 h-4 rounded text-gold-ink focus:ring-gold"
            />
            <span className="text-sm text-secondary">
              {t("Zilizothibitishwa tu", "Verified only")}
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.featured}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, featured: e.target.checked })
              }
              className="w-4 h-4 rounded text-gold-ink focus:ring-gold"
            />
            <span className="text-sm text-secondary">
              {t("Zinazoangaziwa tu", "Featured only")}
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-sandline">
        <button
          type="button"
          onClick={handleApply}
          className="w-full py-2.5 rounded-lg font-semibold text-sm text-[#011957] transition-colors hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)",
          }}
        >
          {t("Tumia Vichujio", "Apply Filters")}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="w-full py-2.5 rounded-lg font-medium text-sm text-secondary border border-sandline hover:bg-sand transition-colors"
        >
          {t("Safisha", "Reset")}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className={`hidden lg:block w-64 shrink-0 ${className}`}>
        <div className="bg-white rounded-xl border border-sandline p-5 lg:sticky lg:top-24">
          {content}
        </div>
      </aside>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={onClose} />
          <div className="w-80 max-w-[85%] bg-white h-full overflow-y-auto p-5">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
