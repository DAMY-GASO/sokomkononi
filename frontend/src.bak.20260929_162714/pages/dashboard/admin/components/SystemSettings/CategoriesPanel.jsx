// ============================================================
// CategoriesPanel.jsx
// Categories management — Add/Edit/Disable/Delete.
// Bilingual + mobile-responsive + image support + Async actions.
// ============================================================

import React, { useState } from "react";
import { ShoppingBag, Plus, Trash2, Loader2 } from "lucide-react";
import { COLORS } from "../../shared/constants.js";
import CategoryForm from "./CategoryForm.jsx";
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
// ⬇️ MABADILIKO: tumia async variants
import {
  useCategories,
  addCategoryAsync,
  updateCategoryAsync,
  removeCategoryAsync,
  toggleCategoryActiveAsync,
  toggleCategoryPopularAsync,
  getCategoryIcon,
} from "../../../../../config/categoriesStore.js";
import { useListings } from "../../../../../config/listingsStore.js";

export default function CategoriesPanel() {
  const { lang } = useLanguage();
  const categories = useCategories();
  const listings = useListings();
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [flash, setFlash] = useState(null);
  // ⬇️ MPYA: busy + error
  const [busy, setBusy] = useState({}); // { [key]: true, saving: true }
  const [error, setError] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const showFlash = (msg, type = "success") => {
    setFlash({ msg, type });
    setTimeout(() => setFlash(null), 3500);
  };

  const listingsCountFor = (key) =>
    listings.filter((l) => l.category === key).length;

  // ============================================================
  // HANDLERS — async + rollback
  // ============================================================
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
      const msg =
        res.warning === "local_only"
          ? t(
              `Category "${newCat.key}" imeongezwa (local — backend haipo bado).`,
              `Category "${newCat.key}" added (local — backend not ready).`
            )
          : t(
              `Category "${newCat.key}" imeongezwa. Kumbuka kuweka Listing Fee kwenye Revenue.`,
              `Category "${newCat.key}" added. Remember to set its Listing Fee in Revenue.`
            );
      showFlash(msg);
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
      showFlash(
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
      showFlash(
        lang === "sw"
          ? `Kuna listings ${count} zenye category "${key}". Ondoa/kwamisha listings hizo kwanza.`
          : `There are ${count} listings with category "${key}". Remove/disable those first.`,
        "error"
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
      showFlash(
        t(`Category "${key}" imefutwa.`, `Category "${key}" deleted.`)
      );
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kufuta category.", "Failed to delete category.")
      );
    }
  };

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
                ? "Ongeza, hariri, zima, au futa categories"
                : "Add, edit, disable, or delete categories"}
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
          style={{
            background: "rgba(193,80,46,0.1)",
            color: COLORS.rust,
          }}
          className="text-xs font-semibold px-3 py-2 rounded-lg"
        >
          {error}
        </div>
      )}

      {/* Flash */}
      {flash && (
        <div
          style={{
            background:
              flash.type === "error" ? `${COLORS.rust}15` : `${COLORS.green}15`,
            color: flash.type === "error" ? COLORS.rust : COLORS.green,
          }}
          className="text-xs font-semibold px-3 py-2 rounded-lg"
        >
          {flash.msg}
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
        {categories.map((cat) => {
          const count = listingsCountFor(cat.key);
          const Icon = getCategoryIcon(cat.iconKey);
          const isEditing = editing === cat.key;
          const hasPhoto = Boolean(cat.imageUrl);

          const isTogglingActive = !!busy[`active-${cat.key}`];
          const isTogglingPopular = !!busy[`popular-${cat.key}`];
          const isDeleting = !!busy[`delete-${cat.key}`];
          const isAnyBusy =
            isTogglingActive || isTogglingPopular || isDeleting || busy.saving;

          return (
            <div
              key={cat.key}
              style={{ borderColor: COLORS.sandLine }}
              className="border rounded-lg overflow-hidden"
            >
              {/* Main row */}
              <div className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Top: Photo/Icon + Info */}
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
                    {isTogglingActive && <Loader2 size={10} className="animate-spin" />}
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
                    {isTogglingPopular && <Loader2 size={10} className="animate-spin" />}
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
                    style={{ color: "var(--text-primary)", borderColor: COLORS.sandLine }}
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
    </div>
  );
}
