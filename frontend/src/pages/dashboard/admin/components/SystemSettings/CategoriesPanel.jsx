// ============================================================
// CategoriesPanel.jsx
// Categories management — Add/Edit/Disable/Delete.
// Bilingual + mobile-responsive + image support.
// ============================================================

import React, { useState } from "react";
import { ShoppingBag, Plus, Trash2 } from "lucide-react";
import { COLORS } from "../../shared/constants.js";
import CategoryForm from "./CategoryForm.jsx";
import { useLanguage } from "../../../../../context/LanguageContext.jsx";
import {
  useCategories,
  addCategory,
  updateCategory,
  removeCategory,
  toggleCategoryActive,
  toggleCategoryPopular,
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

  const showFlash = (msg, type = "success") => {
    setFlash({ msg, type });
    setTimeout(() => setFlash(null), 3500);
  };

  const listingsCountFor = (key) =>
    listings.filter((l) => l.category === key).length;

  const handleDelete = (key) => {
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
    const result = removeCategory(key, count);
    if (result.success) {
      showFlash(
        lang === "sw"
          ? `Category "${key}" imefutwa.`
          : `Category "${key}" deleted.`
      );
    } else {
      showFlash(result.message, "error");
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
            <p className="text-sm font-semibold text-gray-800">
              {lang === "sw" ? "Categories" : "Categories"}
            </p>
            <p className="text-xs text-gray-500">
              {lang === "sw"
                ? "Ongeza, hariri, zima, au futa categories"
                : "Add, edit, disable, or delete categories"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setAdding(true)}
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 shrink-0"
        >
          <Plus size={13} /> {lang === "sw" ? "Category Mpya" : "New Category"}
        </button>
      </div>

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
          onSave={(newCat) => {
            try {
              addCategory(newCat);
              setAdding(false);
              showFlash(
                lang === "sw"
                  ? `Category "${newCat.key}" imeongezwa. Kumbuka kuweka Listing Fee kwenye Revenue.`
                  : `Category "${newCat.key}" added. Remember to set its Listing Fee in Revenue.`
              );
            } catch (e) {
              showFlash(e.message, "error");
            }
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {/* Categories list */}
      <div className="flex flex-col gap-2">
        {categories.map((cat) => {
          const count = listingsCountFor(cat.key);
          const Icon = getCategoryIcon(cat.iconKey);
          const isEditing = editing === cat.key;
          const hasPhoto = Boolean(cat.imageUrl);

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
                  {/* Photo / Icon */}
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

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {cat.label?.sw || cat.key}
                      </p>
                      <span className="text-[10px] text-gray-400 font-mono truncate">
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
                    <p className="text-xs text-gray-400 mt-0.5">
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

                {/* Actions — grid 2x2 kwenye simu, mstari mmoja kwenye desktop */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-1.5 sm:shrink-0">
                  <button
                    onClick={() => toggleCategoryActive(cat.key)}
                    className="text-[11px] font-semibold px-2 py-1.5 rounded-md border text-center"
                    style={{
                      color:
                        cat.active === false ? COLORS.green : COLORS.rust,
                      borderColor: COLORS.sandLine,
                    }}
                  >
                    {cat.active === false
                      ? lang === "sw"
                        ? "Washa"
                        : "Enable"
                      : lang === "sw"
                        ? "Zima"
                        : "Disable"}
                  </button>
                  <button
                    onClick={() => toggleCategoryPopular(cat.key)}
                    className="text-[11px] font-semibold px-2 py-1.5 rounded-md border text-center"
                    style={{
                      color: cat.isPopular ? COLORS.rust : COLORS.green,
                      borderColor: COLORS.sandLine,
                    }}
                  >
                    {cat.isPopular
                      ? lang === "sw"
                        ? "Ondoa Popular"
                        : "Unmark Popular"
                      : lang === "sw"
                        ? "Weka Popular"
                        : "Mark Popular"}
                  </button>
                  <button
                    onClick={() => setEditing(isEditing ? null : cat.key)}
                    className="text-[11px] font-semibold px-2 py-1.5 rounded-md border text-center"
                    style={{ color: COLORS.night, borderColor: COLORS.sandLine }}
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
                    className="text-[11px] font-semibold px-2 py-1.5 rounded-md border text-center flex items-center justify-center gap-1"
                    style={{
                      color: COLORS.rust,
                      borderColor: COLORS.sandLine,
                    }}
                    aria-label={lang === "sw" ? "Futa" : "Delete"}
                  >
                    <Trash2 size={12} />
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
                  onSave={(patch) => {
                    updateCategory(cat.key, patch);
                    setEditing(null);
                    showFlash(
                      lang === "sw"
                        ? `Category "${cat.key}" imehaririwa.`
                        : `Category "${cat.key}" updated.`
                    );
                  }}
                  onCancel={() => setEditing(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
