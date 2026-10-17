import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SearchBar from "../../../components/ui/SearchBar.jsx";
import {
  Search, Grid3x3, List, SlidersHorizontal, X, ChevronDown,
  Home as HomeIcon, ChevronLeft, ChevronRight,
} from "lucide-react";
import { isBoostActive, isLeadingActive } from "./shared";
import { usePublicListings } from "../../../config/listingsStore.js";
import ListingCard from "../../../components/ListingCard.jsx";
import {
  useSavedIds,
  toggleSaved,
} from "../../../config/savedStore.js";
import {
  useActiveCategories,
  getCategoryIcon,
  getCategoryLabel,
} from "../../../config/categoriesStore.js";

const REGIONS = [
  "Arusha", "Dar es Salaam", "Dodoma", "Geita", "Iringa", "Kagera", "Katavi",
  "Kigoma", "Kilimanjaro", "Lindi", "Manyara", "Mara", "Mbeya", "Morogoro",
  "Mtwara", "Mwanza", "Njombe", "Pwani", "Rukwa", "Ruvuma", "Shinyanga",
  "Simiyu", "Singida", "Songwe", "Tabora", "Tanga",
  "Kaskazini Pemba", "Kusini Pemba", "Kaskazini Unguja", "Kusini Unguja",
  "Mjini Magharibi",
];

const PRICE_RANGES = [
  { label: { sw: "Chini ya TZS 20M", en: "Under TZS 20M" }, min: 0, max: 20_000_000 },
  { label: { sw: "TZS 20M - 50M", en: "TZS 20M - 50M" }, min: 20_000_000, max: 50_000_000 },
  { label: { sw: "TZS 50M - 100M", en: "TZS 50M - 100M" }, min: 50_000_000, max: 100_000_000 },
  { label: { sw: "TZS 100M - 200M", en: "TZS 100M - 200M" }, min: 100_000_000, max: 200_000_000 },
  { label: { sw: "Juu ya TZS 200M", en: "Above TZS 200M" }, min: 200_000_000, max: Infinity },
];

/* ═══════════════════════════════════════════════════════════
   FILTER SIDEBAR
   ═══════════════════════════════════════════════════════════ */
function FilterSidebar({ filters, setFilters, isOpen, onClose, lang }) {
  const [local, setLocal] = useState(filters);
  const categories = useActiveCategories();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  useEffect(() => { setLocal(filters); }, [filters]);

  const toggleCat = (key) => {
    setLocal((p) => ({
      ...p,
      categories: p.categories.includes(key)
        ? p.categories.filter((c) => c !== key)
        : [...p.categories, key],
    }));
  };
  const toggleRegion = (r) => {
    setLocal((p) => ({
      ...p,
      regions: p.regions.includes(r)
        ? p.regions.filter((x) => x !== r)
        : [...p.regions, r],
    }));
  };

  const reset = () => setLocal({
    categories: [], priceRange: null, regions: [], verified: false, featured: false,
  });

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
          <SlidersHorizontal size={15} />
          {t("Vichujio", "Filters")}
        </h3>
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full text-secondary hover:bg-[color:rgb(var(--c-page))] lg:hidden"
          aria-label={t("Funga", "Close")}
        >
          <X size={18} />
        </button>
      </div>

      <div>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-secondary">
          {t("Kategoria", "Category")}
        </h4>
        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.iconKey);
            const label = cat.label?.[lang] || cat.label?.sw || cat.key;
            const checked = local.categories.includes(cat.key);
            return (
              <label key={cat.key} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCat(cat.key)}
                  className="h-4 w-4 rounded accent-[color:rgb(var(--c-gold))]"
                />
                <Icon size={14} className="shrink-0 text-secondary" />
                <span className="truncate text-sm text-primary">{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-secondary">
          {t("Bei", "Price")}
        </h4>
        <div className="space-y-2">
          {PRICE_RANGES.map((r, i) => (
            <label key={i} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="priceRange"
                checked={local.priceRange === i}
                onChange={() => setLocal({ ...local, priceRange: i })}
                className="h-4 w-4 accent-[color:rgb(var(--c-gold))]"
              />
              <span className="text-sm text-primary">{r.label[lang] || r.label.sw}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-secondary">
          {t("Mkoa", "Region")}
        </h4>
        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
          {REGIONS.map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={local.regions.includes(r)}
                onChange={() => toggleRegion(r)}
                className="h-4 w-4 rounded accent-[color:rgb(var(--c-gold))]"
              />
              <span className="text-sm text-primary">{r}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-secondary">
          {t("Vigezo Vingine", "Other")}
        </h4>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={local.verified}
              onChange={(e) => setLocal({ ...local, verified: e.target.checked })}
              className="h-4 w-4 rounded accent-[color:rgb(var(--c-gold))]"
            />
            <span className="text-sm text-primary">
              {t("Zilizothibitishwa tu", "Verified only")}
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={local.featured}
              onChange={(e) => setLocal({ ...local, featured: e.target.checked })}
              className="h-4 w-4 rounded accent-[color:rgb(var(--c-gold))]"
            />
            <span className="text-sm text-primary">
              {t("Featured tu", "Featured only")}
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-2 border-t border-[color:rgb(var(--c-hairline))] pt-4">
        <button
          onClick={() => { setFilters(local); onClose(); }}
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-[#011957] hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)" }}
        >
          {t("Tumia Vichujio", "Apply Filters")}
        </button>
        <button
          onClick={reset}
          className="w-full rounded-lg border border-[color:rgb(var(--c-hairline))] py-2.5 text-sm font-medium text-secondary hover:bg-[color:rgb(var(--c-page))]"
        >
          {t("Safisha", "Reset")}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="rounded-xl border border-[color:rgb(var(--c-hairline))] bg-card p-5 lg:sticky lg:top-24">
          {content}
        </div>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="flex-1 bg-black/50" onClick={onClose} />
          <div className="h-full w-80 max-w-[85%] overflow-y-auto bg-card p-5">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════ */
export default function BrowseProperties({ lang = "sw", excludeSellerId = null }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("tafuta") || "");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState({
    categories: [], priceRange: null, regions: [], verified: false, featured: false,
  });
  const [mobileFilters, setMobileFilters] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;
  const savedIds = useSavedIds();
  const allCategories = useActiveCategories();

  const t = (sw, en) => (lang === "sw" ? sw : en);

  useEffect(() => { setSearchQuery(searchParams.get("tafuta") || ""); }, [searchParams]);

  const allRaw = usePublicListings();
  const all = useMemo(() => {
    if (!excludeSellerId) return allRaw;
    return allRaw.filter((p) => String(p.sellerId) !== String(excludeSellerId));
  }, [allRaw, excludeSellerId]);

  const filtered = useMemo(() => {
    let result = [...all];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => {
        const cat = getCategoryLabel(p.category, lang).toLowerCase();
        return (
          p.title?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.region?.toLowerCase().includes(q) ||
          cat.includes(q)
        );
      });
    }

    if (filters.categories.length > 0) {
      result = result.filter((p) => filters.categories.includes(p.category));
    }
    if (filters.regions.length > 0) {
      result = result.filter((p) => filters.regions.includes(p.region));
    }
    if (filters.verified) result = result.filter((p) => p.verified);
    if (filters.featured) result = result.filter((p) => isBoostActive(p));

    if (filters.priceRange !== null) {
      const r = PRICE_RANGES[filters.priceRange];
      result = result.filter((p) => p.price >= r.min && p.price < r.max);
    }

    const cmp = (a, b) => {
      switch (sortBy) {
        case "price_low":  return a.price - b.price;
        case "price_high": return b.price - a.price;
        case "popular":    return (b.views || 0) - (a.views || 0);
        default:           return new Date(b.postedAt) - new Date(a.postedAt);
      }
    };

    const rank = (p) => p.status === "live" ? 0 : p.status === "reserved" ? 1 : 2;

    result.sort((a, b) => {
      const aL = isLeadingActive(a) ? 1 : 0;
      const bL = isLeadingActive(b) ? 1 : 0;
      if (aL !== bL) return bL - aL;
      const aR = rank(a);
      const bR = rank(b);
      if (aR !== bR) return aR - bR;
      return cmp(a, b);
    });

    return result;
  }, [all, searchQuery, filters, sortBy, lang]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => { setPage(1); }, [searchQuery, filters, sortBy]);

  const submitSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ categories: [], priceRange: null, regions: [], verified: false, featured: false });
    setSearchQuery("");
  };

  const hasFilters =
    filters.categories.length > 0 ||
    filters.priceRange !== null ||
    filters.regions.length > 0 ||
    filters.verified ||
    filters.featured;

  return (
    <div className="min-h-screen bg-page">
      {/* ═══════════════════════════════════════════════════════
          HERO HEADER — matches CategoryPage / HomePage style
          ═══════════════════════════════════════════════════════ */}
      <section className="surface-night relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(135deg, #010F3A 0%, #011957 55%, #042475 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/4 -z-10 h-72 w-72 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #FEA406 0%, transparent 70%)" }}
        />

        <div className="container relative py-12 sm:py-16">
          <div className="flex flex-col items-center gap-3 text-center">
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
              style={{
                background: "rgba(254,164,6,0.20)",
                border: "1px solid rgba(254,164,6,0.35)",
              }}
            >
              <Search size={26} color="#FEA406" />
            </span>
            <div>
              <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-tight text-white">
                {t("Tafuta Mali", "Browse Listings")}
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
                {t(
                  "Pata mali unayoitafuta kutoka kwa wauzaji walioidhinishwa.",
                  "Find the property you're looking for from verified sellers."
                )}
              </p>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-2xl">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={() => setPage(1)}
                placeholder={t(
                  "Tafuta kwa jina, mahali, au kategoria...",
                  "Search by title, location, or category..."
                )}
                size="md"
                variant="navy"
              />
            </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          BODY
          ═══════════════════════════════════════════════════════ */}
      <div className="container py-6">
        <div className="flex gap-6">
          <FilterSidebar
            filters={filters}
            setFilters={setFilters}
            isOpen={mobileFilters}
            onClose={() => setMobileFilters(false)}
            lang={lang}
          />

          <div className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:rgb(var(--c-hairline))] bg-card p-3 sm:p-4">
              <p className="text-sm text-secondary">
                <span className="font-semibold text-primary">
                  {filtered.length}
                </span>{" "}
                {t("mali zimepatikana", "listings found")}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileFilters(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-[color:rgb(var(--c-hairline))] px-3 py-2 text-sm font-medium text-primary hover:bg-[color:rgb(var(--c-page))] lg:hidden"
                >
                  <SlidersHorizontal size={14} />
                  {t("Vichujio", "Filters")}
                </button>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="cursor-pointer appearance-none rounded-lg border border-[color:rgb(var(--c-hairline))] bg-card px-3 py-2 pr-8 text-sm font-medium text-primary outline-none focus:border-[color:rgb(var(--c-gold))]"
                  >
                    <option value="newest">{t("Mpya Kwanza", "Newest First")}</option>
                    <option value="price_low">{t("Bei: Chini → Juu", "Price: Low → High")}</option>
                    <option value="price_high">{t("Bei: Juu → Chini", "Price: High → Low")}</option>
                    <option value="popular">{t("Maarufu", "Popular")}</option>
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted" />
                </div>

                <div className="hidden overflow-hidden rounded-lg border border-[color:rgb(var(--c-hairline))] sm:flex">
                  <button
                    onClick={() => setViewMode("grid")}
                    aria-label={t("Grid", "Grid")}
                    className="grid h-9 w-9 place-items-center"
                    style={{
                      background: viewMode === "grid" ? "#FEA406" : "transparent",
                      color: viewMode === "grid" ? "#011957" : "var(--text-secondary)",
                    }}
                  >
                    <Grid3x3 size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    aria-label={t("Orodha", "List")}
                    className="grid h-9 w-9 place-items-center"
                    style={{
                      background: viewMode === "list" ? "#FEA406" : "transparent",
                      color: viewMode === "list" ? "#011957" : "var(--text-secondary)",
                    }}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filters */}
            {hasFilters && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-secondary">
                  {t("Vichujio:", "Filters:")}
                </span>
                {filters.categories.map((key) => {
                  const cat = allCategories.find((c) => c.key === key);
                  const label = cat?.label?.[lang] || cat?.label?.sw || key;
                  return (
                    <span key={key} className="inline-flex items-center gap-1 rounded-full bg-[color:rgb(var(--c-gold)/0.14)] px-2.5 py-1 text-xs font-medium text-[#A35F00] dark:text-[#FEA406]">
                      {label}
                      <button
                        onClick={() => setFilters({ ...filters, categories: filters.categories.filter((c) => c !== key) })}
                        aria-label={t("Ondoa", "Remove")}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
                <button onClick={clearFilters} className="text-xs font-medium text-[#C1502E] hover:underline">
                  {t("Safisha zote", "Clear all")}
                </button>
              </div>
            )}

            {/* Grid */}
            {pageItems.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-4"
                      : "flex flex-col gap-3"
                  }
                >
                  {pageItems.map((p) => {
                    const cat = allCategories.find((c) => c.key === p.category);
                    const Icon = getCategoryIcon(cat?.iconKey || "Home");
                    return (
                      <ListingCard
                        key={p.id}
                        listing={p}
                        category={cat}
                        Icon={Icon}
                        lang={lang}
                        viewMode={viewMode}
                        isSaved={savedIds.some((x) => String(x) === String(p.id))}
                        onToggleSave={(id) => toggleSaved(id, p)}
                      />
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((n) => Math.max(1, n - 1))}
                      disabled={page === 1}
                      aria-label={t("Nyuma", "Previous")}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-[color:rgb(var(--c-hairline))] text-primary hover:bg-[color:rgb(var(--c-page))] disabled:opacity-40"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className="grid h-9 w-9 place-items-center rounded-lg text-sm font-medium"
                        style={
                          page === n
                            ? { background: "#FEA406", color: "#011957" }
                            : { border: "1px solid rgb(var(--c-hairline))", color: "var(--text-primary)" }
                        }
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
                      disabled={page === totalPages}
                      aria-label={t("Mbele", "Next")}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-[color:rgb(var(--c-hairline))] text-primary hover:bg-[color:rgb(var(--c-page))] disabled:opacity-40"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-[color:rgb(var(--c-hairline))] bg-card p-10 text-center sm:p-14">
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-[color:rgb(var(--c-page))]">
                  <HomeIcon size={24} className="text-muted" />
                </div>
                <h3 className="font-semibold text-primary">
                  {t("Hakuna mali iliyopatikana", "No listings found")}
                </h3>
                <p className="mt-1 text-sm text-secondary">
                  {t("Jaribu kubadilisha vichujio au utafutaji wako.", "Try changing your filters or search.")}
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 rounded-lg px-5 py-2 text-sm font-semibold text-[#011957]"
                  style={{ background: "linear-gradient(135deg, #FEA406 0%, #FD8706 100%)" }}
                >
                  {t("Safisha Vichujio", "Clear Filters")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
