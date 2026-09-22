// ============================================================
// SavedPropertiesPage.jsx
// Zilizohifadhiwa — buyer anaona listings alizozihifadhi.
// Bilingual kamili + KILA KITU CENTERED.
// ============================================================

import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  MapPin,
  Eye,
  Trash2,
  Grid3x3,
  List,
  Search,
  Bell,
  Clock3,
  Ban,
  Shield,
} from "lucide-react";
import {
  COLORS,
  formatTZS,
  timeAgo,
  getCategory,
} from "./dashboard/components/shared";
import { usePublicListings } from "../config/listingsStore.js";
import { useSavedIds, toggleSaved } from "../config/savedStore.js";
import { getCategoryIcon } from "../config/categoriesStore.js";
import { useLanguage } from "../context/LanguageContext.jsx";

// ============================================================
// CARD IMAGE RESOLVER
// ============================================================
function resolveCardImage(property, category) {
  if (property?.imageUrl) return property.imageUrl;
  if (category?.imageUrl) return category.imageUrl;
  return null;
}

// ============================================================
// SAVED CARD — imeachwa (kadi zina data nyingi)
// ============================================================
function SavedCard({ property, viewMode, onRemove, lang }) {
  const category = getCategory(property.category);
  const Icon = getCategoryIcon(category?.iconKey);
  const categoryLabel =
    category?.label?.[lang] || category?.label?.sw || property.category;
  const cardImage = resolveCardImage(property, category);

  const isReserved = property.status === "reserved";
  const isSold = property.status === "sold";
  const isVerified = Boolean(property.verified);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(property.id);
  };

  if (viewMode === "list") {
    return (
      <div
        className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow flex flex-col sm:flex-row ${
          isSold ? "border-gray-200 opacity-75" : "border-gray-100"
        }`}
      >
        <Link
          to={`/mali/${property.id}`}
          className="w-full sm:w-48 h-40 sm:h-auto bg-gray-100 flex items-center justify-center flex-shrink-0 relative overflow-hidden"
        >
          {cardImage ? (
            <img
              src={cardImage}
              alt={property.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Icon size={32} className="text-muted" />
          )}
          {isReserved && (
            <span className="absolute top-2 left-2 bg-[#E8A33D] text-[#101A2E] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Clock3 size={10} /> {t("IMEHIFADHIWA", "RESERVED")}
            </span>
          )}
          {isSold && (
            <span className="absolute top-2 left-2 bg-[#101A2E] text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Ban size={10} /> {t("IMEUZWA", "SOLD")}
            </span>
          )}
        </Link>
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/mali/${property.id}`} className="flex-1 min-w-0">
              <h3 className="font-semibold text-primary text-sm hover:text-[#E8A33D] transition-colors">
                {property.title}
              </h3>
            </Link>
            <button
              onClick={handleRemove}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
              aria-label={t("Ondoa", "Remove")}
            >
              <Trash2 size={16} />
            </button>
          </div>

          <span className="inline-block mt-1.5 text-[10px] font-medium text-[#E8A33D] bg-[#E8A33D]/10 px-2 py-0.5 rounded-full w-fit">
            {categoryLabel}
          </span>

          <div className="flex items-center gap-1 mt-1.5 text-xs text-secondary">
            <MapPin size={12} />
            {property.location}
          </div>
          <p className="text-[#C1502E] font-bold text-base mt-2">
            {formatTZS(property.price)}
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-muted">
              {timeAgo(property.postedAt, lang)}
            </span>
            <Link
              to={`/mali/${property.id}`}
              className="text-xs font-semibold text-[#E8A33D] hover:underline"
            >
              {t("Angalia", "View")} →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all group ${
        isSold ? "border-gray-200 opacity-75" : "border-gray-100"
      }`}
    >
      <Link to={`/mali/${property.id}`} className="block relative">
        <div className="w-full h-44 bg-gray-100 flex items-center justify-center overflow-hidden">
          {cardImage ? (
            <img
              src={cardImage}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              loading="lazy"
            />
          ) : (
            <Icon
              size={40}
              className="text-muted group-hover:scale-110 transition-transform"
            />
          )}
        </div>
        {isReserved && (
          <span className="absolute top-2 left-2 bg-[#E8A33D] text-[#101A2E] text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Clock3 size={10} /> {t("IMEHIFADHIWA", "RESERVED")}
          </span>
        )}
        {isSold && (
          <span className="absolute top-2 left-2 bg-[#101A2E] text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Ban size={10} /> {t("IMEUZWA", "SOLD")}
          </span>
        )}
        {isVerified && (
          <span className="absolute top-2 right-2 bg-[#2F6D4F] text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Shield size={10} /> {t("Imethibitishwa", "Verified")}
          </span>
        )}
        <button
          onClick={handleRemove}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center bg-white/90 text-[#C1502E] hover:bg-red-500 hover:text-white transition-colors"
          aria-label={t("Ondoa", "Remove")}
        >
          <Trash2 size={16} />
        </button>
      </Link>
      <Link to={`/mali/${property.id}`} className="block p-4">
        <span className="inline-block text-[10px] font-medium text-[#E8A33D] bg-[#E8A33D]/10 px-2 py-0.5 rounded-full mb-1">
          {categoryLabel}
        </span>
        <h3 className="font-semibold text-primary text-sm truncate">
          {property.title}
        </h3>
        <div className="flex items-center gap-1 mt-1 text-xs text-secondary">
          <MapPin size={12} />
          <span className="truncate">{property.location}</span>
        </div>
        <p className="text-[#C1502E] font-bold text-base mt-2">
          {formatTZS(property.price)}
        </p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Eye size={12} /> {property.views || 0}
          </span>
          <span>{timeAgo(property.postedAt, lang)}</span>
        </div>
      </Link>
    </div>
  );
}

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
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase())
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
            background: "rgba(37,99,235,0.08)",
            color: "#1E3A8A",
            borderColor: "rgba(37,99,235,0.2)",
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
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "flex flex-col gap-3"
            }
          >
            {filtered.map((p) => (
              <SavedCard
                key={p.id}
                property={p}
                viewMode={viewMode}
                onRemove={handleRemove}
                lang={lang}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
