// ============================================================
// CategoriesPanel.jsx
// Categories management — Add/Edit/Disable/Delete + REORDER
// + SEARCH FILTER + BULK ACTIONS + LISTINGS COUNT + ANALYTICS.
//
// Marekebisho:
//  - Search bar (jina SW/EN, key)
//  - Filter tabs: Zote / Hai / Imesimamishwa / Maarufu
//  - Bulk actions: select all, enable, disable, mark/unmark popular, delete
//  - Bulk actions bar inaonekana kama kuna zilizochaguliwa
//  - Idadi ya listings sasa inatoka backend (`listings_count`), si useListings
//  - Kichujio "Tupu" + kadi ya Takwimu (GET /categories/stats/)
// ============================================================

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  ShoppingBag, Plus, Trash2, Loader2,
  ChevronUp, ChevronDown, Search, CheckSquare, Square,
  Eye, EyeOff, Star, X, CheckCircle, AlertTriangle,
  BarChart3, RefreshCw,
} from "lucide-react";
import { COLORS } from "../../shared/constants.js";
import CategoryForm from "./CategoryForm.jsx";
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
import {
  useCategories,
  addCategoryAsync,
  updateCategoryAsync,
  removeCategoryAsync,
  toggleCategoryActiveAsync,
  toggleCategoryPopularAsync,
  getCategoryIcon,
  reorderCategoriesAsync,
  bulkToggleActiveAsync,
  bulkTogglePopularAsync,
  bulkRemoveCategoriesAsync,
  fetchCategoryStats,
} from "../../../../../config/categoriesStore.js";
import { useListings } from "../../../../../config/listingsStore.js";
import { useToast } from "../../../../../components/Toast.jsx";

// ============================================================
// FILTER TABS
// ============================================================
const FILTER_TABS = [
  { key: "all", label: { sw: "Zote", en: "All" } },
  { key: "active", label: { sw: "Hai", en: "Active" } },
  { key: "inactive", label: { sw: "Imesimamishwa", en: "Inactive" } },
  { key: "popular", label: { sw: "Maarufu", en: "Popular" } },
  { key: "empty", label: { sw: "Tupu", en: "Empty" } },
];

const STATS_PERIODS = [7, 30, 90];

// Status za Listing (listings/models.py) → majina ya kusomeka
const LISTING_STATUS_LABELS = {
  DRAFT: { sw: "Rasimu", en: "Draft" },
  PENDING_PAYMENT: { sw: "Inasubiri malipo", en: "Pending payment" },
  PENDING_APPROVAL: { sw: "Inasubiri ukaguzi", en: "Pending review" },
  NEEDS_EDIT: { sw: "Inahitaji marekebisho", en: "Needs edit" },
  APPROVED_PENDING_PAYMENT: { sw: "Imeidhinishwa, inasubiri malipo", en: "Approved, awaiting payment" },
  PAID_PENDING_APPROVAL: { sw: "Imelipwa, inasubiri idhini", en: "Paid, awaiting approval" },
  LIVE: { sw: "Hai", en: "Live" },
  RESERVED: { sw: "Imehifadhiwa", en: "Reserved" },
  SOLD: { sw: "Imeuzwa", en: "Sold" },
  PAUSED: { sw: "Imesimamishwa", en: "Paused" },
  REJECTED: { sw: "Imekataliwa", en: "Rejected" },
  EXPIRED: { sw: "Muda umeisha", en: "Expired" },
  ARCHIVED: { sw: "Imehifadhiwa kumbukumbu", en: "Archived" },
};

// ============================================================
// ANALYTICS CARD — takwimu za listings kwa category
// ============================================================
function CategoryAnalytics({ t, stats, loading, error, days, onDaysChange, onRefresh }) {
  const rows = useMemo(
    () =>
      [...(stats?.categories || [])].sort((a, b) => b.total - a.total),
    [stats]
  );
  const totals = stats?.totals || {};
  const max = rows.length ? Math.max(1, rows[0].total) : 1;
  const empties = rows.filter((r) => r.total === 0);

  const Tile = ({ label, value }) => (
    <div
      className="rounded-lg border px-3 py-2"
      style={{ borderColor: "rgb(var(--c-hairline))" }}
    >
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="text-lg font-bold text-primary">{value ?? "—"}</p>
    </div>
  );

  return (
    <div
      className="rounded-xl border p-3 sm:p-4 flex flex-col gap-3"
      style={{ borderColor: "rgb(var(--c-hairline))" }}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-semibold text-primary">
          {t("Takwimu za Categories", "Category Analytics")}
        </p>
        <div className="flex items-center gap-1.5">
          {STATS_PERIODS.map((d) => (
            <button
              key={d}
              onClick={() => onDaysChange(d)}
              disabled={loading}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border border-hairline disabled:opacity-50 ${
                days === d ? "chip-active" : "bg-card text-primary"
              }`}
            >
              {d}{t("s", "d")}
            </button>
          ))}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="w-7 h-7 rounded-md border flex items-center justify-center disabled:opacity-50"
            style={{ borderColor: "rgb(var(--c-hairline))" }}
            aria-label={t("Onyesha upya", "Refresh")}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs" style={{ color: COLORS.dangerText }}>
          {error}
        </p>
      )}

      {loading && !stats && (
        <div className="flex items-center gap-2 text-xs text-secondary">
          <Loader2 size={13} className="animate-spin" />
          {t("Inapakia takwimu...", "Loading stats...")}
        </div>
      )}

      {stats && stats.available === false && (
        <p className="text-xs text-secondary">
          {t(
            "Backend haikuweza kupata model ya Listing. Angalia LISTING_MODEL_LABEL kwenye categories/stats.py.",
            "Backend could not find the Listing model. Check LISTING_MODEL_LABEL in categories/stats.py."
          )}
        </p>
      )}

      {stats && stats.available !== false && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Tile label={t("Listings zote", "Total listings")} value={totals.listings} />
            <Tile
              label={t(`Mpya (siku ${stats.days})`, `New (${stats.days}d)`)}
              value={stats.has_created_at ? totals.new_recent : null}
            />
            <Tile label={t("Categories tupu", "Empty categories")} value={totals.empty} />
            <Tile
              label={t("Views", "Views")}
              value={stats.has_views ? totals.views : null}
            />
          </div>

          <div className="flex flex-col gap-2">
            {rows.map((r) => {
              const pct = totals.listings
                ? Math.round((r.total / totals.listings) * 100)
                : 0;
              const statusText = Object.entries(r.by_status || {})
                .map(([k, v]) => {
                  const l = LISTING_STATUS_LABELS[k];
                  return `${l ? t(l.sw, l.en) : k}: ${v}`;
                })
                .join(" · ");
              return (
                <div key={r.id}>
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-semibold text-primary truncate">{r.name}</span>
                    <span className="text-muted shrink-0">
                      {r.total} ({pct}%)
                      {stats.has_created_at && r.new_recent > 0 ? ` · +${r.new_recent}` : ""}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full mt-1 overflow-hidden"
                    style={{ background: "rgb(var(--c-ink) / 0.08)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(r.total ? 3 : 0, (r.total / max) * 100)}%`,
                        background: COLORS.gold,
                      }}
                    />
                  </div>
                  {statusText && (
                    <p className="text-[10px] text-muted mt-0.5">{statusText}</p>
                  )}
                </div>
              );
            })}
          </div>

          {empties.length > 0 && (
            <p className="text-[11px] text-secondary">
              {t("Hazina listings: ", "No listings: ")}
              {empties.map((e) => e.name).join(", ")}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function CategoriesPanel() {
  const { lang } = useLanguage();
  const toast = useToast();
  const categories = useCategories();
  const listings = useListings();

  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");
  const [reordering, setReordering] = useState(false);

  // ⬇️ MPYA: search + filter
  const [query, setQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all");

  // ⬇️ MPYA: bulk selection
  const [selected, setSelected] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ⬇️ MPYA: takwimu
  const [statsOpen, setStatsOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [statsDays, setStatsDays] = useState(30);

  const loadStats = useCallback(
    async (days) => {
      setStatsLoading(true);
      setStatsError("");
      const res = await fetchCategoryStats(days);
      if (res.ok) {
        setStats(res.data);
      } else {
        setStatsError(
          res.unsupported
            ? lang === "sw"
              ? "Endpoint ya takwimu haipo bado kwenye backend."
              : "Stats endpoint is not available on the backend yet."
            : res.error?.message ||
                (lang === "sw" ? "Imeshindwa kupakia takwimu." : "Failed to load stats.")
        );
      }
      setStatsLoading(false);
    },
    [lang]
  );

  useEffect(() => {
    if (statsOpen) loadStats(statsDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsOpen, statsDays]);

  const statsById = useMemo(() => {
    const m = new Map();
    (stats?.categories || []).forEach((r) => m.set(String(r.id), r));
    return m;
  }, [stats]);

  // Chanzo cha ukweli: `listings_count` ya backend. `useListings()` ni
  // fallback tu (backend ya zamani) — inaweza kuwa na sehemu ya listings.
  const listingsCountFor = (key) => {
    const cat = categories.find((c) => c.key === key);
    if (cat && cat.listingsCount != null) return cat.listingsCount;
    return listings.filter((l) => l.category === key).length;
  };

  // ══════════════════════════════════════════════════════════
  // SORTED + FILTERED
  // ══════════════════════════════════════════════════════════
  const sortedCategories = useMemo(
    () =>
      [...categories].sort(
        (a, b) => (a.ordering ?? 999) - (b.ordering ?? 999)
      ),
    [categories]
  );

  const filteredCategories = useMemo(() => {
    let result = sortedCategories;

    // Filter tab
    if (filterTab === "active") {
      result = result.filter((c) => c.active !== false);
    } else if (filterTab === "inactive") {
      result = result.filter((c) => c.active === false);
    } else if (filterTab === "popular") {
      result = result.filter((c) => c.isPopular === true);
    } else if (filterTab === "empty") {
      result = result.filter((c) => listingsCountFor(c.key) === 0);
    }

    // Search
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (c) =>
          c.key?.toLowerCase().includes(q) ||
          c.label?.sw?.toLowerCase().includes(q) ||
          c.label?.en?.toLowerCase().includes(q) ||
          c.slug?.toLowerCase().includes(q)
      );
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedCategories, filterTab, query, listings]);

  // ══════════════════════════════════════════════════════════
  // SELECTION HELPERS
  // ══════════════════════════════════════════════════════════
  const allVisibleSelected =
    filteredCategories.length > 0 &&
    filteredCategories.every((c) => selected.has(c.key));
  const someSelected = selected.size > 0;

  const toggleSelect = (key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredCategories.map((c) => c.key)));
    }
  };

  const clearSelection = () => setSelected(new Set());

  // ══════════════════════════════════════════════════════════
  // REORDER
  // ══════════════════════════════════════════════════════════
  const handleMove = async (key, direction) => {
    if (reordering) return;
    const currentIdx = sortedCategories.findIndex((c) => c.key === key);
    if (currentIdx < 0) return;

    const newIdx = direction === "up" ? currentIdx - 1 : currentIdx + 1;
    if (newIdx < 0 || newIdx >= sortedCategories.length) return;

    const newOrder = [...sortedCategories];
    const [moved] = newOrder.splice(currentIdx, 1);
    newOrder.splice(newIdx, 0, moved);

    setReordering(true);
    setError("");

    const res = await reorderCategoriesAsync(newOrder);

    if (res.ok) {
      toast.success(t("Mpangilio umebadilishwa.", "Order updated."));
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kupanga upya.", "Failed to reorder.")
      );
    }
    setReordering(false);
  };

  // ══════════════════════════════════════════════════════════
  // SINGLE HANDLERS
  // ══════════════════════════════════════════════════════════
  const handleAdd = async (newCat) => {
    if (busy.saving) return;
    setBusy((b) => ({ ...b, saving: true }));
    setError("");

    const res = await addCategoryAsync(newCat);

    setBusy((b) => {
      const next = { ...b };
      delete next.saving;
      return next;
    });

    if (res.ok) {
      setAdding(false);
      toast.success(
        t(
          `Category "${newCat.key}" imeongezwa. Kumbuka kuweka Listing Fee kwenye Revenue.`,
          `Category "${newCat.key}" added. Remember to set its Listing Fee in Revenue.`
        )
      );
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kuongeza category.", "Failed to add category.")
      );
    }
  };

  const handleUpdate = async (key, patch) => {
    if (busy.saving) return;
    setBusy((b) => ({ ...b, saving: true }));
    setError("");

    const res = await updateCategoryAsync(key, patch);

    setBusy((b) => {
      const next = { ...b };
      delete next.saving;
      return next;
    });

    if (res.ok) {
      setEditing(null);
      toast.success(
        t(`Category "${key}" imehaririwa.`, `Category "${key}" updated.`)
      );
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kuhifadhi category.", "Failed to save category.")
      );
    }
  };

  const handleToggleActive = async (key) => {
    if (busy[`active-${key}`]) return;
    setBusy((b) => ({ ...b, [`active-${key}`]: true }));
    setError("");

    const res = await toggleCategoryActiveAsync(key);

    setBusy((b) => {
      const next = { ...b };
      delete next[`active-${key}`];
      return next;
    });

    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kubadilisha hali.", "Failed to toggle status.")
      );
    }
  };

  const handleTogglePopular = async (key) => {
    if (busy[`popular-${key}`]) return;
    setBusy((b) => ({ ...b, [`popular-${key}`]: true }));
    setError("");

    const res = await toggleCategoryPopularAsync(key);

    setBusy((b) => {
      const next = { ...b };
      delete next[`popular-${key}`];
      return next;
    });

    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kubadilisha popular.", "Failed to toggle popular.")
      );
    }
  };

  const handleDelete = async (key) => {
    const count = listingsCountFor(key);
    if (count > 0) {
      toast.error(
        lang === "sw"
          ? `Kuna listings ${count} zenye category "${key}". Ondoa/kwamisha listings hizo kwanza.`
          : `There are ${count} listings with category "${key}". Remove/disable those first.`
      );
      return;
    }
    if (
      !window.confirm(
        lang === "sw"
          ? `Futa category "${key}"? Hatua hii haiwezi kurudishwa.`
          : `Delete category "${key}"? This cannot be undone.`
      )
    )
      return;

    if (busy[`delete-${key}`]) return;
    setBusy((b) => ({ ...b, [`delete-${key}`]: true }));
    setError("");

    const res = await removeCategoryAsync(key);

    setBusy((b) => {
      const next = { ...b };
      delete next[`delete-${key}`];
      return next;
    });

    if (res.ok) {
      toast.success(
        t(`Category "${key}" imefutwa.`, `Category "${key}" deleted.`)
      );
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kufuta category.", "Failed to delete category.")
      );
    }
  };

  // ══════════════════════════════════════════════════════════
  // BULK HANDLERS
  // ══════════════════════════════════════════════════════════
  const selectedKeys = Array.from(selected);

  const handleBulkEnable = async () => {
    if (bulkBusy || !selectedKeys.length) return;
    setBulkBusy(true);
    setError("");
    const res = await bulkToggleActiveAsync(selectedKeys, true);
    setBulkBusy(false);
    if (res.ok) {
      toast.success(
        t(`Categories ${res.count} zimewashwa.`, `${res.count} categories enabled.`)
      );
      clearSelection();
    } else {
      setError(res.error?.message || t("Bulk enable imeshindwa.", "Bulk enable failed."));
    }
  };

  const handleBulkDisable = async () => {
    if (bulkBusy || !selectedKeys.length) return;
    setBulkBusy(true);
    setError("");
    const res = await bulkToggleActiveAsync(selectedKeys, false);
    setBulkBusy(false);
    if (res.ok) {
      toast.success(
        t(`Categories ${res.count} zimezimwa.`, `${res.count} categories disabled.`)
      );
      clearSelection();
    } else {
      setError(res.error?.message || t("Bulk disable imeshindwa.", "Bulk disable failed."));
    }
  };

  const handleBulkMarkPopular = async () => {
    if (bulkBusy || !selectedKeys.length) return;
    setBulkBusy(true);
    setError("");
    const res = await bulkTogglePopularAsync(selectedKeys, true);
    setBulkBusy(false);
    if (res.ok) {
      toast.success(
        t(`Categories ${res.count} zimewekwa popular.`, `${res.count} categories marked popular.`)
      );
      clearSelection();
    } else {
      setError(res.error?.message || t("Bulk popular imeshindwa.", "Bulk popular failed."));
    }
  };

  const handleBulkUnmarkPopular = async () => {
    if (bulkBusy || !selectedKeys.length) return;
    setBulkBusy(true);
    setError("");
    const res = await bulkTogglePopularAsync(selectedKeys, false);
    setBulkBusy(false);
    if (res.ok) {
      toast.success(
        t(`Categories ${res.count} zimeondolewa popular.`, `${res.count} categories unmarked.`)
      );
      clearSelection();
    } else {
      setError(res.error?.message || t("Bulk unmark imeshindwa.", "Bulk unmark failed."));
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (bulkBusy || !selectedKeys.length) return;
    setBulkBusy(true);
    setError("");

    // Tengeneza listingsByKey
    const listingsByKey = {};
    for (const k of selectedKeys) {
      listingsByKey[k] = listingsCountFor(k);
    }

    const res = await bulkRemoveCategoriesAsync(selectedKeys, listingsByKey);
    setBulkBusy(false);
    setConfirmBulkDelete(false);

    if (res.ok) {
      toast.success(
        t(`Categories ${res.count} zimefutwa.`, `${res.count} categories deleted.`)
      );
      if (res.blocked && res.blocked.length > 0) {
        toast.warning(
          t(
            `Categories ${res.blocked.length} hazikufutwa (zina listings).`,
            `${res.blocked.length} categories not deleted (have listings).`
          )
        );
      }
      clearSelection();
    } else {
      setError(res.error?.message || t("Bulk delete imeshindwa.", "Bulk delete failed."));
    }
  };

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div className="bg-card rounded-xl border border-hairline p-4 sm:p-5 flex flex-col gap-4 lg:col-span-3">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div
            style={{ background: "rgb(var(--c-ink) / 0.08)" }}
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          >
            <ShoppingBag size={16} style={{ color: COLORS.ink }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">
              {lang === "sw" ? "Categories" : "Categories"}
            </p>
            <p className="text-xs text-secondary">
              {lang === "sw"
                ? "Ongeza, hariri, panga, au futa categories"
                : "Add, edit, reorder, or delete categories"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setStatsOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 border bg-card text-primary"
            style={{ borderColor: "rgb(var(--c-hairline))" }}
            aria-expanded={statsOpen}
          >
            <BarChart3 size={13} /> {t("Takwimu", "Analytics")}
          </button>
          <button
            onClick={() => {
              setAdding(true);
              setEditing(null);
              setError("");
            }}
            disabled={adding || !!editing || busy.saving}
            style={{ background: COLORS.gold, color: "rgb(var(--c-night))" }}
            className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={13} /> {lang === "sw" ? "Category Mpya" : "New Category"}
          </button>
        </div>
      </div>

      {statsOpen && (
        <CategoryAnalytics
          t={t}
          stats={stats}
          loading={statsLoading}
          error={statsError}
          days={statsDays}
          onDaysChange={setStatsDays}
          onRefresh={() => loadStats(statsDays)}
        />
      )}

      {/* Error banner */}
      {error && (
        <div
          style={{ background: "rgba(193,80,46,0.1)", color: COLORS.dangerText }}
          className="text-xs font-semibold px-3 py-2 rounded-lg"
        >
          {error}
        </div>
      )}

      {/* Search + Filter */}
      {categories.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 w-full min-w-0">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Tafuta category...", "Search category...")}
              className="smk-inline-search w-full rounded-lg border border-hairline bg-card pl-3 pr-16 py-2 text-xs outline-none focus:outline-none focus-visible:outline-none"
              style={{ WebkitAppearance: "none" }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-9 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
                aria-label={t("Futa", "Clear")}
              >
                <X size={13} />
              </button>
            )}
            <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
            {FILTER_TABS.map((tab) => {
              const isActive = filterTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key)}
                  className={`text-[11px] font-semibold px-3 py-2 rounded-full border border-hairline whitespace-nowrap shrink-0 ${
                    isActive ? "chip-active" : "bg-card text-primary"
                  }`}
                >
                  {tab.label?.[lang] || tab.label?.sw}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bulk actions bar */}
      {someSelected && (
        <div
          style={{ background: `${COLORS.gold}15`, borderColor: COLORS.gold }}
          className="border rounded-lg px-3 py-2.5 flex items-center gap-2 flex-wrap"
        >
          <span className="text-xs font-semibold text-primary shrink-0">
            {selected.size} {t("zimechaguliwa", "selected")}
          </span>
          <div className="flex gap-1.5 flex-wrap flex-1">
            <button
              onClick={handleBulkEnable}
              disabled={bulkBusy}
              style={{ color: COLORS.successText, borderColor: "rgb(var(--c-hairline))" }}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md border bg-card disabled:opacity-50 flex items-center gap-1"
            >
              {bulkBusy ? <Loader2 size={11} className="animate-spin" /> : <Eye size={11} />}
              {t("Washa", "Enable")}
            </button>
            <button
              onClick={handleBulkDisable}
              disabled={bulkBusy}
              style={{ color: COLORS.dangerText, borderColor: "rgb(var(--c-hairline))" }}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md border bg-card disabled:opacity-50 flex items-center gap-1"
            >
              {bulkBusy ? <Loader2 size={11} className="animate-spin" /> : <EyeOff size={11} />}
              {t("Zima", "Disable")}
            </button>
            <button
              onClick={handleBulkMarkPopular}
              disabled={bulkBusy}
              style={{ color: COLORS.goldText, borderColor: "rgb(var(--c-hairline))" }}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md border bg-card disabled:opacity-50 flex items-center gap-1"
            >
              {bulkBusy ? <Loader2 size={11} className="animate-spin" /> : <Star size={11} />}
              {t("Weka Popular", "Mark Popular")}
            </button>
            <button
              onClick={handleBulkUnmarkPopular}
              disabled={bulkBusy}
              style={{ color: COLORS.ink, borderColor: "rgb(var(--c-hairline))" }}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md border bg-card disabled:opacity-50"
            >
              {t("Ondoa Popular", "Unmark")}
            </button>
            <button
              onClick={() => setConfirmBulkDelete(true)}
              disabled={bulkBusy}
              style={{ color: COLORS.dangerText, borderColor: "rgb(var(--c-hairline))" }}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md border bg-card disabled:opacity-50 flex items-center gap-1"
            >
              {bulkBusy ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
              {t("Futa", "Delete")}
            </button>
          </div>
          <button
            onClick={clearSelection}
            disabled={bulkBusy}
            className="text-muted hover:text-secondary shrink-0 disabled:opacity-50"
            aria-label={t("Ondoa uchaguzi", "Clear selection")}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Select all + count */}
      {categories.length > 0 && filteredCategories.length > 0 && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 font-semibold text-primary hover:underline"
          >
            {allVisibleSelected ? (
              <CheckSquare size={14} />
            ) : (
              <Square size={14} />
            )}
            {allVisibleSelected
              ? t("Ondoa zote", "Deselect all")
              : t("Chagua zote", "Select all")}
          </button>
          <span className="text-muted">
            {filteredCategories.length}{" "}
            {filteredCategories.length === 1
              ? t("category", "category")
              : t("categories", "categories")}
          </span>
        </div>
      )}

      {/* Add form */}
      {adding && (
        <CategoryForm
          onSave={handleAdd}
          onCancel={() => {
            setAdding(false);
            setError("");
          }}
          saving={!!busy.saving}
          error={error}
        />
      )}

      {/* Categories list */}
      <div className="flex flex-col gap-2">
        {filteredCategories.length === 0 && !adding && (
          <div
            className="rounded-2xl border-2 border-dashed border-hairline bg-card p-8 text-center"
          >
            <ShoppingBag size={40} className="mx-auto text-muted mb-3" />
            <h3 className="font-semibold text-primary mb-1">
              {query || filterTab !== "all"
                ? t("Hakuna matokeo", "No results")
                : t("Hakuna categories", "No categories")}
            </h3>
            <p className="text-sm text-secondary">
              {query || filterTab !== "all"
                ? t(
                    "Jaribu kubadilisha vichujio au utafutaji wako.",
                    "Try changing your filters or search."
                  )
                : t(
                    "Categories zilizoongezwa zitaonekana hapa.",
                    "Added categories will appear here."
                  )}
            </p>
          </div>
        )}

        {filteredCategories.map((cat) => {
          const count = listingsCountFor(cat.key);
          const Icon = getCategoryIcon(cat.iconKey);
          const isEditing = editing === cat.key;
          const hasPhoto = Boolean(cat.imageUrl);
          const isSelected = selected.has(cat.key);

          const isTogglingActive = !!busy[`active-${cat.key}`];
          const isTogglingPopular = !!busy[`popular-${cat.key}`];
          const isDeleting = !!busy[`delete-${cat.key}`];
          const isAnyBusy =
            isTogglingActive ||
            isTogglingPopular ||
            isDeleting ||
            busy.saving ||
            reordering ||
            bulkBusy;

          const globalIdx = sortedCategories.findIndex((c) => c.key === cat.key);
          const isFirst = globalIdx === 0;
          const isLast = globalIdx === sortedCategories.length - 1;

          return (
            <div
              key={cat.key}
              style={{
                borderColor: isSelected ? COLORS.gold : "rgb(var(--c-hairline))",
                background: isSelected ? `${COLORS.gold}08` : "rgb(var(--c-card))",
              }}
              className="border rounded-lg overflow-hidden"
            >
              <div className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleSelect(cat.key)}
                  disabled={isAnyBusy}
                  className="shrink-0 self-start sm:self-center p-0.5 disabled:opacity-50"
                  aria-label={t("Chagua", "Select")}
                  style={{ color: isSelected ? COLORS.goldText : "var(--text-muted)" }}
                >
                  {isSelected ? (
                    <CheckSquare size={18} />
                  ) : (
                    <Square size={18} />
                  )}
                </button>

                {/* Reorder buttons */}
                <div className="flex sm:flex-col gap-1 shrink-0">
                  <button
                    onClick={() => handleMove(cat.key, "up")}
                    disabled={isAnyBusy || isFirst || !!query || filterTab !== "all"}
                    className="w-7 h-7 rounded-md border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ borderColor: "rgb(var(--c-hairline))" }}
                    title={lang === "sw" ? "Pandisha juu" : "Move up"}
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={() => handleMove(cat.key, "down")}
                    disabled={isAnyBusy || isLast || !!query || filterTab !== "all"}
                    className="w-7 h-7 rounded-md border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ borderColor: "rgb(var(--c-hairline))" }}
                    title={lang === "sw" ? "Shusha chini" : "Move down"}
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>

                {/* Photo/Icon + Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {hasPhoto ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.label?.sw || cat.key}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="category-tile-icon !h-10 !w-10 !rounded-lg shrink-0 [&>svg]:!h-4 [&>svg]:!w-4">
                      <Icon size={15} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-primary truncate">
                        {cat.label?.sw || cat.key}
                      </p>
                      <span className="text-[10px] text-muted font-mono truncate">
                        ({cat.key})
                      </span>
                      <span
                        style={{
                          background: "rgb(var(--c-ink) / 0.08)",
                          color: COLORS.ink,
                        }}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      >
                        #{cat.ordering ?? 0}
                      </span>
                      {cat.isPopular && (
                        <span
                          style={{
                            background: `${COLORS.gold}20`,
                            color: COLORS.goldText,
                          }}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        >
                          POPULAR
                        </span>
                      )}
                      {cat.active === false && (
                        <span
                          style={{
                            background: `${COLORS.rust}20`,
                            color: COLORS.dangerText,
                          }}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        >
                          {lang === "sw" ? "IMEZIMWA" : "DISABLED"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {count}{" "}
                      {count === 1
                        ? lang === "sw"
                          ? "listing"
                          : "listing"
                        : lang === "sw"
                          ? "listings"
                          : "listings"}
                      {(() => {
                        const st = cat.id != null ? statsById.get(String(cat.id)) : null;
                        if (!st) return null;
                        const parts = [];
                        if (stats?.has_created_at && st.new_recent > 0)
                          parts.push(`+${st.new_recent} / ${stats.days}${t("s", "d")}`);
                        if (stats?.has_views && st.views > 0) parts.push(`${st.views} views`);
                        return parts.length ? ` · ${parts.join(" · ")}` : null;
                      })()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-1.5 sm:shrink-0">
                  <button
                    onClick={() => handleToggleActive(cat.key)}
                    disabled={isAnyBusy}
                    className="text-[11px] font-semibold px-2 py-1.5 rounded-md border text-center flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      color: cat.active === false ? COLORS.successText : COLORS.dangerText,
                      borderColor: "rgb(var(--c-hairline))",
                    }}
                  >
                    {isTogglingActive && (
                      <Loader2 size={10} className="animate-spin" />
                    )}
                    {cat.active === false
                      ? lang === "sw"
                        ? "Washa"
                        : "Enable"
                      : lang === "sw"
                        ? "Zima"
                        : "Disable"}
                  </button>
                  <button
                    onClick={() => handleTogglePopular(cat.key)}
                    disabled={isAnyBusy}
                    className="text-[11px] font-semibold px-2 py-1.5 rounded-md border text-center flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      color: cat.isPopular ? COLORS.dangerText : COLORS.successText,
                      borderColor: "rgb(var(--c-hairline))",
                    }}
                  >
                    {isTogglingPopular && (
                      <Loader2 size={10} className="animate-spin" />
                    )}
                    {cat.isPopular
                      ? lang === "sw"
                        ? "Ondoa Popular"
                        : "Unmark Popular"
                      : lang === "sw"
                        ? "Weka Popular"
                        : "Mark Popular"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(isEditing ? null : cat.key);
                      setAdding(false);
                      setError("");
                    }}
                    disabled={isAnyBusy}
                    className="text-[11px] font-semibold px-2 py-1.5 rounded-md border text-center disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      color: "var(--text-primary)",
                      borderColor: "rgb(var(--c-hairline))",
                    }}
                  >
                    {isEditing
                      ? lang === "sw"
                        ? "Funga"
                        : "Close"
                      : lang === "sw"
                        ? "Hariri"
                        : "Edit"}
                  </button>
                  <button
                    onClick={() => handleDelete(cat.key)}
                    disabled={isAnyBusy}
                    className="text-[11px] font-semibold px-2 py-1.5 rounded-md border text-center flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      color: COLORS.dangerText,
                      borderColor: "rgb(var(--c-hairline))",
                    }}
                    aria-label={lang === "sw" ? "Futa" : "Delete"}
                  >
                    {isDeleting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                    <span className="sm:hidden">
                      {lang === "sw" ? "Futa" : "Delete"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Edit form */}
              {isEditing && (
                <CategoryForm
                  initial={cat}
                  isEditing
                  onSave={(patch) => handleUpdate(cat.key, patch)}
                  onCancel={() => {
                    setEditing(null);
                    setError("");
                  }}
                  saving={!!busy.saving}
                  error={error}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Bulk delete confirm modal */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl max-w-sm w-full p-6">
            <div className="text-center mb-5">
              <div
                style={{ background: `${COLORS.rust}15` }}
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
              >
                <AlertTriangle size={26} style={{ color: COLORS.dangerText }} />
              </div>
              <h3 className="text-lg font-bold text-primary">
                {t("Futa Categories Hizi?", "Delete These Categories?")}
              </h3>
              <p className="text-sm text-secondary mt-2">
                {t(
                  `Categories ${selected.size} zitafutwa. Categories zenye listings hazitafutwa.`,
                  `${selected.size} categories will be deleted. Categories with listings will be skipped.`
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmBulkDelete(false)}
                disabled={bulkBusy}
                className="flex-1 py-2.5 border border-hairline rounded-lg text-sm font-semibold text-secondary disabled:opacity-50"
              >
                {t("Ghairi", "Cancel")}
              </button>
              <button
                onClick={handleBulkDeleteConfirm}
                disabled={bulkBusy}
                style={{ background: COLORS.rust, color: "white" }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {bulkBusy ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {t("Inafanya...", "Working...")}
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    {t("Futa", "Delete")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}