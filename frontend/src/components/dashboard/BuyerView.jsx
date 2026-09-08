import React, { useEffect, useState } from "react";
import { fetchProperties } from "../../api/property.api";
import { fetchCategories } from "../../api/category.api";
import { useDebounce } from "../../hooks/useDebounce.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import PropertyCard from "../property/PropertyCard.jsx";

const EMPTY_FILTERS = { search: "", category: "", minPrice: "", maxPrice: "" };

export default function BuyerView() {
  const { t } = useLanguage();
  const [properties, setProperties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const debouncedSearch = useDebounce(filters.search, 400);
  const debouncedMin = useDebounce(filters.minPrice, 400);
  const debouncedMax = useDebounce(filters.maxPrice, 400);

  useEffect(() => {
    fetchCategories().then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(filters.category && { category: filters.category }),
      ...(debouncedMin && { minPrice: debouncedMin }),
      ...(debouncedMax && { maxPrice: debouncedMax }),
    };
    fetchProperties(params)
      .then((res) => setProperties(res.data))
      .finally(() => setLoading(false));
  }, [debouncedSearch, filters.category, debouncedMin, debouncedMax]);

  const hasActiveFilters =
    filters.search || filters.category || filters.minPrice || filters.maxPrice;

  return (
    <div>
      <h2 className="text-xl font-bold text-ink-primary mb-4">{t("buy_heading")}</h2>

      {/* Search + filters — Leading Fee ordering inashughulikiwa na backend (isLeading desc) */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
        <input
          className="flex-1 border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm"
          placeholder={t("buy_search_placeholder")}
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <select
          className="border border-ink-muted/40 rounded-md px-3 py-2.5 text-sm sm:w-48"
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
        >
          <option value="">{t("buy_filter_category")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 mb-6">
        <input
          type="number"
          className="border border-ink-muted/40 rounded-md px-3 py-2 text-sm w-32"
          placeholder={t("buy_filter_min_price")}
          value={filters.minPrice}
          onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
        />
        <span className="text-ink-muted text-sm">–</span>
        <input
          type="number"
          className="border border-ink-muted/40 rounded-md px-3 py-2 text-sm w-32"
          placeholder={t("buy_filter_max_price")}
          value={filters.maxPrice}
          onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
        />
        {hasActiveFilters && (
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="text-xs font-semibold text-rust ml-1"
          >
            {t("buy_clear_filters")}
          </button>
        )}
      </div>

      {!loading && (
        <p className="text-xs text-ink-muted mb-3">
          {t("buy_results_count", { count: properties.length })}
        </p>
      )}

      {loading && <p className="text-ink-muted text-sm">{t("buy_loading")}</p>}
      {!loading && properties.length === 0 && (
        <p className="text-ink-muted text-sm">{t("buy_empty")}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </div>
  );
}
