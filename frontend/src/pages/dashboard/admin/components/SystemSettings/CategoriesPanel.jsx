// ============================================================
// CategoriesPanel.jsx
// Categories management — Add/Edit/Disable/Delete + REORDER
// + SEARCH FILTER + BULK ACTIONS.
//
// Marekebisho:
//  - Search bar (jina SW/EN, key)
//  - Filter tabs: Zote / Hai / Imesimamishwa / Maarufu
//  - Bulk actions: select all, enable, disable, mark/unmark popular, delete
//  - Bulk actions bar inaonekana kama kuna zilizochaguliwa
// ============================================================

import React, { useState, useMemo } from "react";
import {
  ShoppingBag, Plus, Trash2, Loader2,
  ChevronUp, ChevronDown, Search, CheckSquare, Square,
  Eye, EyeOff, Star, X, CheckCircle, AlertTriangle,
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
];

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

  const listingsCountFor = (key) =>
    listings.filter((l) => l.category === key).length;

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
  }, [sortedCategories, filterTab, query]);

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
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 flex flex-col gap-4 lg:col-span-3">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div
            style={{ background: `${COLORS.night}0D` }}
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          >
            <ShoppingBag size={16} color={COLORS.night} />
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
        <button
          onClick={() => {
            setAdding(true);
            setEditing(null);
            setError("");
          }}
          disabled={adding || !!editing || busy.saving}
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={13} /> {lang === "sw" ? "Category Mpya" : "New Category"}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{ background: "rgba(193,80,46,0.1)", color: COLORS.rust }}
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
              className="smk-inline-search w-full rounded-lg border border-gray-200 bg-white pl-3 pr-16 py-2 text-xs outline-none focus:outline-none focus-visible:outline-none"
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
                  style={{
                    background: isActive ? COLORS.night : "white",
                    color: isActive ? COLORS.sand : "var(--text-primary)",
                    borderColor: COLORS.sandLine,
                  }}
                  className="text-[11px] font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
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
              style={{ color: COLORS.green, borderColor: COLORS.sandLine }}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md border bg-white disabled:opacity-50 flex items-center gap-1"
            >
              {bulkBusy ? <Loader2 size={11} className="animate-spin" /> : <Eye size={11} />}
              {t("Washa", "Enable")}
            </button>
            <button
              onClick={handleBulkDisable}
              disabled={bulkBusy}
              style={{ color: COLORS.rust, borderColor: COLORS.sandLine }}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md border bg-white disabled:opacity-50 flex items-center gap-1"
            >
              {bulkBusy ? <Loader2 size={11} className="animate-spin" /> : <EyeOff size={11} />}
              {t("Zima", "Disable")}
            </button>
            <button
              onClick={handleBulkMarkPopular}
              disabled={bulkBusy}
              style={{ color: COLORS.gold, borderColor: COLORS.sandLine }}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md border bg-white disabled:opacity-50 flex items-center gap-1"
            >
              {bulkBusy ? <Loader2 size={11} className="animate-spin" /> : <Star size={11} />}
              {t("Weka Popular", "Mark Popular")}
            </button>
            <button
              onClick={handleBulkUnmarkPopular}
              disabled={bulkBusy}
              style={{ color: COLORS.night, borderColor: COLORS.sandLine }}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md border bg-white disabled:opacity-50"
            >
              {t("Ondoa Popular", "Unmark")}
            </button>
            <button
              onClick={() => setConfirmBulkDelete(true)}
              disabled={bulkBusy}
              style={{ color: COLORS.rust, borderColor: COLORS.sandLine }}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md border bg-white disabled:opacity-50 flex items-center gap-1"
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
            style={{ borderColor: COLORS.sandLine, background: "white" }}
            className="rounded-2xl border-2 border-dashed p-8 text-center"
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
                borderColor: isSelected ? COLORS.gold : COLORS.sandLine,
                background: isSelected ? `${COLORS.gold}08` : "white",
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
                  style={{ color: isSelected ? COLORS.gold : "var(--text-muted)" }}
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
                    style={{ borderColor: COLORS.sandLine }}
                    title={lang === "sw" ? "Pandisha juu" : "Move up"}
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={() => handleMove(cat.key, "down")}
                    disabled={isAnyBusy || isLast || !!query || filterTab !== "all"}
                    className="w-7 h-7 rounded-md border flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ borderColor: COLORS.sandLine }}
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
                    <div
                      style={{ background: COLORS.night }}
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    >
                      <Icon size={15} color={COLORS.gold} />
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
                          background: `${COLORS.night}0D`,
                          color: COLORS.night,
                        }}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      >
                        #{cat.ordering ?? 0}
                      </span>
                      {cat.isPopular && (
                        <span
                          style={{
                            background: `${COLORS.gold}20`,
                            color: COLORS.gold,
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
                            color: COLORS.rust,
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
                      color: cat.active === false ? COLORS.green : COLORS.rust,
                      borderColor: COLORS.sandLine,
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
                      color: cat.isPopular ? COLORS.rust : COLORS.green,
                      borderColor: COLORS.sandLine,
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
                      borderColor: COLORS.sandLine,
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
                      color: COLORS.rust,
                      borderColor: COLORS.sandLine,
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
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="text-center mb-5">
              <div
                style={{ background: `${COLORS.rust}15` }}
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
              >
                <AlertTriangle size={26} color={COLORS.rust} />
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
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary disabled:opacity-50"
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