// ============================================================
// SavedPropertiesPage.jsx
// Zilizohifadhiwa — buyer anaona listings alizozihifadhi.
// Bilingual kamili + KILA KITU CENTERED.
// ============================================================

import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Grid3x3,
  List,
  Search,
  Bell,
} from "lucide-react";
import {
  COLORS,
  getCategory,
} from "./dashboard/components/shared";
import { usePublicListings } from "../config/listingsStore.js";
import { useSavedIds, toggleSaved } from "../config/savedStore.js";
import { getCategoryIcon } from "../config/categoriesStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import ListingCard from "../components/ListingCard.jsx";

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function SavedPropertiesPage() {
  const { lang } = useLanguage();
  const savedIds = useSavedIds();
  const allListings = usePublicListings();
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const saved = useMemo(() => {
    return allListings.filter((l) => savedIds.includes(l.id));
  }, [allListings, savedIds]);

  const filtered = saved.filter(
    (p) =>
      (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.location || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemove = (id) => toggleSaved(id);

  return (
    <div
      style={{
        background: COLORS.sand,
        minHeight: "100%",
      }}
      className="w-full p-4 sm:p-6"
    >

      <div className="max-w-5xl mx-auto">
        {/* ============================================================ */}
        {/* HEADER — CENTERED */}
        {/* ============================================================ */}
        <div className="mb-2 text-center">
          <div className="flex items-center justify-center gap-3 mb-1">
            <h1
              style={{ color: "var(--text-primary)" }}
              className="text-2xl sm:text-3xl font-semibold"
            >
              {t("Zilizohifadhiwa", "Saved Properties")}
            </h1>
            <span
              style={{ background: COLORS.night, color: COLORS.sand }}
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
            >
              {saved.length}
            </span>
          </div>
          <p
            style={{ color: "var(--text-secondary)" }}
            className="text-sm max-w-xl mx-auto"
          >
            {t(
              "Mali ulizozihifadhi kwa ajili ya baadaye.",
              "Properties you've saved for later."
            )}
          </p>
        </div>

        {/* ============================================================ */}
        {/* NOTIFICATIONS INFO — CENTERED */}
        {/* ============================================================ */}
        <div
          style={{
            background: "rgba(0,98,253,0.08)",
            color: "#011957",
            borderColor: "rgba(0,98,253,0.25)",
          }}
          className="flex flex-col items-center text-center gap-2 text-xs rounded-lg border px-3 py-2.5 mb-5 max-w-2xl mx-auto"
        >
          <Bell size={14} />
          <span>
            {t(
              "Utapata taarifa listings hizi zinapobadilika (bei, sold, reserved).",
              "You'll be notified when these listings change (price, sold, reserved)."
            )}
          </span>
        </div>

        {/* ============================================================ */}
        {/* SEARCH + VIEW TOGGLE — CENTERED */}
        {/* ============================================================ */}
        {saved.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(
                  "Tafuta kwenye zilizohifadhiwa...",
                  "Search in saved..."
                )}
                style={{
                  background: "white",
                  borderColor: COLORS.sandLine,
                  color: "var(--text-primary)",
                }}
                className="w-full rounded-xl border pl-10 pr-3 py-2.5 text-sm outline-none text-center"
              />
            </div>
            <div
              className="flex border rounded-xl overflow-hidden shrink-0 mx-auto sm:mx-0"
              style={{ borderColor: COLORS.sandLine }}
            >
              <button
                onClick={() => setViewMode("grid")}
                style={{
                  background: viewMode === "grid" ? COLORS.night : "white",
                  color: viewMode === "grid" ? COLORS.sand : "var(--text-primary)",
                }}
                className="p-2.5 transition-colors"
                aria-label={t("Grid", "Grid")}
              >
                <Grid3x3 size={16} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                style={{
                  background: viewMode === "list" ? COLORS.night : "white",
                  color: viewMode === "list" ? COLORS.sand : "var(--text-primary)",
                }}
                className="p-2.5 transition-colors"
                aria-label={t("Orodha", "List")}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* LIST — kadi zimeachwa kushoto */}
        {/* ============================================================ */}
        {filtered.length === 0 ? (
          <div
            style={{ borderColor: COLORS.sandLine }}
            className="rounded-2xl border-2 border-dashed p-12 text-center bg-white"
          >
            <Heart size={48} className="mx-auto text-muted mb-3" />
            <h3
              style={{ color: "var(--text-primary)" }}
              className="font-semibold mb-1"
            >
              {searchQuery
                ? t("Hakuna matokeo", "No results")
                : t("Hakuna mali iliyohifadhiwa", "No saved properties")}
            </h3>
            <p
              style={{ color: "var(--text-secondary)" }}
              className="text-sm mb-5"
            >
              {searchQuery
                ? t(
                    "Jaribu kutafuta kwa neno lingine",
                    "Try searching with a different term"
                  )
                : t(
                    "Mali unayovutiwa nayo, ihifadhi ili uikumbuke baadaye.",
                    "Save properties you're interested in so you can find them later."
                  )}
            </p>
            {!searchQuery && (
              <Link
                to="/"
                style={{ background: COLORS.gold, color: COLORS.night }}
                className="inline-block px-5 py-2.5 rounded-xl font-semibold text-sm"
              >
                {t("Tafuta Mali", "Browse Properties")}
              </Link>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"
                : "flex flex-col gap-3"
            }
          >
            {filtered.map((p) => {
              const cat = getCategory(p.category);
              return (
                <ListingCard
                  key={p.id}
                  listing={p}
                  category={cat}
                  Icon={getCategoryIcon(cat?.iconKey)}
                  lang={lang}
                  viewMode={viewMode}
                  isSaved
                  onToggleSave={handleRemove}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
