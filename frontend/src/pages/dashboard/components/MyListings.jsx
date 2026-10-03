// ============================================================
// MyListings.jsx
// Seller — orodha ya mali zake (listings).
// - Preview, boost, leading, advertise, mark sold, pause/resume
// - Delete (soft) + undo window + admin notification
// - Picha za mraba (aspect-square) kwa grid na cards
// ============================================================
import React, { useState, useMemo } from "react";
import {
  PlusCircle,
  Edit3,
  Trash2,
  Pause,
  Play,
  CheckCircle2,
  Rocket,
  TrendingUp,
  Megaphone,
  Eye,
  MapPin,
  Tag,
  Search,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { COLORS, formatTZS, timeAgo, getCategory } from "./shared.js";
import StatusBadge from "./StatusBadge";
import { getCategoryIcon } from "../../../../config/categoriesStore.js";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import { useAuth } from "../../../../config/authStore.js";
import { useToast } from "../../../../components/Toast.jsx";
import { startUndo } from "../../../../config/undoStore.js";
import { notifyAdminAboutDeletion } from "../../../../config/notificationsStore.js";
import { restoreListingAsync } from "../../../../config/listingsStore.js";

// ============================================================
// LISTING CARD
// ============================================================
function ListingCard({
  listing,
  lang,
  onRemove,
  onBoost,
  onLeading,
  onAdvertise,
  onPause,
  onResume,
  onMarkSold,
  busy,
}) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const category = getCategory(listing.category);
  const CategoryIcon = getCategoryIcon(category?.iconKey);
  const catLabel =
    category?.label?.[lang] || category?.label?.sw || listing.category || "—";
  const isBusy = busy === "delete";

  const imageUrl =
    listing.imageUrl ||
    (listing.photos && listing.photos[0]) ||
    null;

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border overflow-hidden w-full max-w-full min-w-0"
    >
      <div className="flex items-start gap-3 p-3 sm:p-4 min-w-0">
        {/* Picha ya mraba */}
        <div
          style={{ background: COLORS.sandLine }}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden shrink-0 aspect-square"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {CategoryIcon ? (
                <CategoryIcon size={22} color={COLORS.night} />
              ) : (
                <Tag size={22} color={COLORS.night} />
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-sm font-semibold text-primary line-clamp-2 break-words">
              {listing.title}
            </p>
            <StatusBadge status={listing.status} lang={lang} />
          </div>

          <div className="flex items-center gap-2 text-xs text-secondary mt-0.5 flex-wrap">
            {category && (
              <>
                <span className="flex items-center gap-1 min-w-0">
                  <CategoryIcon size={11} className="shrink-0" />
                  <span className="truncate">{catLabel}</span>
                </span>
                <span className="text-muted shrink-0">•</span>
              </>
            )}
            {listing.location && (
              <span className="flex items-center gap-1 min-w-0 truncate">
                <MapPin size={11} className="shrink-0" />
                <span className="truncate">{listing.location}</span>
              </span>
            )}
          </div>

          <p
            style={{ color: COLORS.rust }}
            className="text-sm font-bold mt-1.5 truncate"
          >
            {formatTZS(listing.price)}
          </p>

          <div className="flex items-center gap-2 text-[11px] text-muted mt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <Eye size={10} />
              {listing.views || 0}
            </span>
            <span className="text-muted">•</span>
            <span>{timeAgo(listing.postedAt, lang)}</span>
          </div>

          {listing.status === "rejected" && listing.rejectionReason && (
            <p
              style={{ color: COLORS.rust }}
              className="text-[11px] mt-1 line-clamp-2"
            >
              {listing.rejectionReason}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        style={{ borderColor: COLORS.sandLine, background: COLORS.sand }}
        className="border-t px-3 sm:px-4 py-2 flex items-center gap-1.5 flex-wrap"
      >
        {/* Boost / Leading / Advertise — kwa live/available */}
        {(listing.status === "live" || listing.status === "reserved") && (
          <>
            <button
              onClick={() => onBoost(listing.id)}
              disabled={isBusy}
              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg border transition-colors disabled:opacity-50 hover:bg-white"
              style={{ borderColor: COLORS.sandLine, color: "#8A5A16" }}
            >
              <Rocket size={11} />
              {t("Boost", "Boost")}
            </button>
            <button
              onClick={() => onLeading(listing.id)}
              disabled={isBusy}
              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg border transition-colors disabled:opacity-50 hover:bg-white"
              style={{ borderColor: COLORS.sandLine, color: COLORS.green }}
            >
              <TrendingUp size={11} />
              {t("Leading", "Leading")}
            </button>
            <button
              onClick={() => onAdvertise(listing.id)}
              disabled={isBusy}
              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg border transition-colors disabled:opacity-50 hover:bg-white"
              style={{ borderColor: COLORS.sandLine, color: COLORS.rust }}
            >
              <Megaphone size={11} />
              {t("Advertise", "Advertise")}
            </button>
          </>
        )}

        {/* Pause/Resume */}
        {listing.status === "live" && (
          <button
            onClick={() => onPause(listing.id)}
            disabled={isBusy}
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg border transition-colors disabled:opacity-50 hover:bg-white"
            style={{ borderColor: COLORS.sandLine, color: COLORS.night }}
          >
            <Pause size={11} />
            {t("Pause", "Pause")}
          </button>
        )}
        {listing.status === "paused" && (
          <button
            onClick={() => onResume(listing.id)}
            disabled={isBusy}
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg border transition-colors disabled:opacity-50 hover:bg-white"
            style={{ borderColor: COLORS.sandLine, color: COLORS.green }}
          >
            <Play size={11} />
            {t("Resume", "Resume")}
          </button>
        )}

        {/* Mark Sold */}
        {(listing.status === "live" || listing.status === "reserved") && (
          <button
            onClick={() => onMarkSold(listing.id)}
            disabled={isBusy}
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg border transition-colors disabled:opacity-50 hover:bg-white"
            style={{ borderColor: COLORS.sandLine, color: COLORS.green }}
          >
            <CheckCircle2 size={11} />
            {t("Sold", "Sold")}
          </button>
        )}

        {/* Delete */}
        <button
          onClick={() => onRemove(listing.id)}
          disabled={isBusy}
          className="ml-auto flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg border transition-colors disabled:opacity-50 hover:bg-red-50 shrink-0"
          style={{ borderColor: "rgba(193,80,46,0.3)", color: COLORS.rust }}
        >
          {isBusy ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <Trash2 size={11} />
          )}
          {t("Futa", "Delete")}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================
export default function MyListings({
  listings = [],
  onRemove,
  onBoost,
  onLeading,
  onAdvertise,
  onPaid,
  onPause,
  onResume,
  onMarkSold,
  onPostNew,
}) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [busy, setBusy] = useState({});

  // ── Kichujio + utafutaji ────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...listings];

    if (filter !== "all") {
      list = list.filter((l) => l.status === filter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (l) =>
          l.title?.toLowerCase().includes(q) ||
          l.location?.toLowerCase().includes(q) ||
          l.category?.toLowerCase().includes(q)
      );
    }

    return list.sort(
      (a, b) =>
        new Date(b.postedAt || 0).getTime() -
        new Date(a.postedAt || 0).getTime()
    );
  }, [listings, filter, searchQuery]);

  const filters = [
    { key: "all", label: { sw: "Zote", en: "All" } },
    { key: "live", label: { sw: "Hai", en: "Live" } },
    { key: "in_review", label: { sw: "Inasubiri", en: "In Review" } },
    { key: "reserved", label: { sw: "Imehifadhiwa", en: "Reserved" } },
    { key: "sold", label: { sw: "Imeuzwa", en: "Sold" } },
    { key: "paused", label: { sw: "Imesimama", en: "Paused" } },
    { key: "rejected", label: { sw: "Imekataliwa", en: "Rejected" } },
  ];

  // ============================================================
  // HANDLE REMOVE — undo window + admin notification
  // ============================================================
  const handleRemove = async (id) => {
    if (busy[id]) return;
    const listing = listings.find((l) => String(l.id) === String(id));
    if (!listing) return;

    setBusy((b) => ({ ...b, [id]: "delete" }));

    // 1. Futa (soft delete) kwa API
    const res = await onRemove(id);
    setBusy((b) => {
      const n = { ...b };
      delete n[id];
      return n;
    });

    if (!res?.ok) {
      toast.error(
        res?.error?.message || t("Imeshindikana kufuta", "Failed to delete")
      );
      return;
    }

    // 2. Anzisha undo window
    startUndo({
      type: "listing",
      id,
      title: listing.title,
      message: t(
        `"${listing.title}" imefutwa. Unaweza kuirejesha.`,
        `"${listing.title}" deleted. You can undo.`
      ),
      onRestore: async () => {
        await restoreListingAsync(id);
      },
    });

    // 3. Tuma notification kwa admin
    notifyAdminAboutDeletion({
      itemType: "listing",
      itemId: id,
      itemTitle: listing.title,
      user,
    });

    // 4. Toast ya kawaida (badala ya undo toast inayojitokeza)
    toast.success(t("Tangazo limefutwa", "Listing deleted"), {
      duration: 2000,
    });
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-hidden">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-bold text-primary">
            {t("Mali Zangu", "My Listings")}
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            {t(
              `${listings.length} matangazo`,
              `${listings.length} listings`
            )}
          </p>
        </div>
        <button
          onClick={onPostNew}
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg shrink-0 hover:opacity-90 transition-opacity"
        >
          <PlusCircle size={14} />
          {t("Weka Mpya", "Post New")}
        </button>
      </div>

      {/* ── Filters + Search ─────────────────────────────── */}
      {listings.length > 0 && (
        <>
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 mb-3 w-full"
               style={{ borderColor: COLORS.sandLine }}>
            <Search size={14} className="text-muted shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(
                "Tafuta kwa jina, mahali, au category...",
                "Search by title, location, or category..."
              )}
              className="outline-none text-xs flex-1 min-w-0"
            />
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {filters.map((f) => {
              const count = listings.filter((l) =>
                f.key === "all" ? true : l.status === f.key
              ).length;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    background: filter === f.key ? COLORS.night : "white",
                    color:
                      filter === f.key ? COLORS.sand : "var(--text-primary)",
                    borderColor: COLORS.sandLine,
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0"
                >
                  {f.label[lang]} ({count})
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ── List ─────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center"
        >
          <Tag size={40} className="mx-auto text-muted mb-3" />
          <h3 className="font-semibold text-primary mb-1">
            {searchQuery || filter !== "all"
              ? t("Hakuna matokeo", "No results")
              : t("Hakuna mali bado", "No listings yet")}
          </h3>
          <p className="text-sm text-secondary mb-4">
            {searchQuery || filter !== "all"
              ? t(
                  "Jaribu kubadilisha vichujio au utafutaji.",
                  "Try changing filters or search."
                )
              : t(
                  "Weka tangazo lako la kwanza ili wanunuzi wakuone.",
                  "Post your first listing so buyers can find you."
                )}
          </p>
          {!searchQuery && filter === "all" && (
            <button
              onClick={onPostNew}
              style={{ background: COLORS.gold, color: COLORS.night }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              <PlusCircle size={14} />
              {t("Weka Mali Yako", "Post Property")}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              lang={lang}
              onRemove={handleRemove}
              onBoost={onBoost}
              onLeading={onLeading}
              onAdvertise={onAdvertise}
              onPause={onPause}
              onResume={onResume}
              onMarkSold={onMarkSold}
              busy={busy[l.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
