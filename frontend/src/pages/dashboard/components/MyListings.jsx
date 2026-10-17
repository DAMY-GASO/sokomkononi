// ============================================================
// MyListings.jsx
// Seller — orodha ya mali zake (listings).
// + Statuses mpya: needs_edit, approved_pending_payment, paid_pending_approval
// + Picha: horizontal scroll ya picha zote kwenye kila card
// + Mark Sold: confirmation modal (are you sure?)
// ============================================================
import React, { useState, useMemo } from "react";
import {
  PlusCircle, Edit3, Trash2, Pause, Play, CheckCircle2,
  Rocket, TrendingUp, Megaphone, Eye, MapPin, Tag, Search,
  Loader2, AlertTriangle, Wallet, AlertCircle, Pencil,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  COLORS, formatTZS, timeAgo, getCategory,
  isBoostActive, isLeadingActive,
} from "./shared.js";
import { Link } from "react-router-dom";
import StatusBadge from "../admin/shared/StatusBadge";
import ListingImage from "../../../components/ListingImage.jsx";
import { getCategoryIcon } from "../../../config/categoriesStore.js";
import { useLanguage } from "../../../context/LanguageContext.jsx";
import { useAuth } from "../../../config/authStore.js";
import { useToast } from "../../../components/Toast.jsx";
import { useConfirm } from "../../../components/ConfirmDialog.jsx";
import { startUndo } from "../../../config/undoStore.js";
import {
  restoreListingAsync,
  markSoldAsync,   // ⬅️ ONGEZA
} from "../../../config/listingsStore.js";

// ============================================================
// isUnpaid — module-scope helper
// ============================================================
function isUnpaid(listing) {
  if (!listing) return false;
  const s = String(listing.status || "").toLowerCase();

  if (
    s === "pending_payment" ||
    s === "draft" ||
    s === "approved_pending_payment"
  ) {
    return true;
  }

  if (
    ["live", "reserved", "sold", "paused", "in_review",
     "rejected", "expired", "needs_edit", "paid_pending_approval"].includes(s)
  ) {
    return false;
  }

  return listing.isPaid === false;
}

// ============================================================
// getPhotos — chukua picha zote
// ============================================================
function getPhotos(listing) {
  if (!listing) return [];
  const arr =
    (Array.isArray(listing.photos) && listing.photos) ||
    (Array.isArray(listing.images) && listing.images) ||
    [];
  const urls = arr
    .map((img) => {
      if (!img) return null;
      if (typeof img === "string") return img;
      return (
        img.image_url || img.url || img.image || img.src || img.file || null
      );
    })
    .filter(Boolean);
  if (urls.length) return urls;
  if (listing.imageUrl) return [listing.imageUrl];
  return [];
}

// ============================================================
// MARK SOLD CONFIRM MODAL
// ============================================================
function MarkSoldConfirmModal({ listing, lang, busy, onConfirm, onClose }) {
  if (!listing) return null;
  const t = (sw, en) => (lang === "sw" ? sw : en);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6">
        <div className="text-center mb-5">
          <div
            style={{ background: "rgba(47,109,79,0.12)" }}
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
          >
            <CheckCircle2 size={26} color={COLORS.green} />
          </div>
          <h3 className="text-lg font-bold text-primary">
            {t("Weka kama Imeuzwa?", "Mark as Sold?")}
          </h3>
          <p className="text-sm text-secondary mt-2 break-words">
            {listing.title}
          </p>
          <p className="text-xs text-muted mt-2">
            {t(
              "Tangazo hili halitaonekana kwenye kurasa za umma. Litaonekana kwenye 'Mali Zangu' kama imeuzwa.",
              "This listing will no longer appear on public pages. It will remain in 'My Listings' as sold."
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-secondary disabled:opacity-50"
          >
            {t("Ghairi", "Cancel")}
          </button>
          <button
            onClick={() => onConfirm(listing)}
            disabled={busy}
            style={{ background: COLORS.green, color: "white" }}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {busy ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t("Inafanya...", "Working...")}
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                {t("Ndio, Imeuzwa", "Yes, Mark Sold")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ACTION BUTTON
// ============================================================
function ActionBtn({
  icon: Icon, label, color, onClick, disabled,
  danger, spin, className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
        danger ? "hover:bg-red-50" : "hover:bg-sand"
      } ${className}`}
      style={{
        borderColor: danger ? "rgba(193,80,46,0.3)" : COLORS.sandLine,
        color,
      }}
    >
      <Icon size={12} className={`shrink-0 ${spin ? "animate-spin" : ""}`} />
      {label}
    </button>
  );
}

// ============================================================
// LISTING CARD
// ============================================================
function ListingCard({
  listing, lang, onRemove, onBoost, onLeading, onAdvertise,
  onPause, onResume, onMarkSold, onPay, onEdit, busy,
}) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const category = getCategory(listing.category);
  const CategoryIcon = getCategoryIcon(category?.iconKey) || Tag;
  const catLabel =
    category?.label?.[lang] || category?.label?.sw || listing.category || "—";
  const isBusy = busy === "delete";

  const photos = getPhotos(listing);
  const hasManyPhotos = photos.length > 1;

  const isLiveOrReserved =
    listing.status === "live" || listing.status === "reserved";
  const featured = isBoostActive(listing);
  const leading = isLeadingActive(listing);
  const viewable = ["live", "reserved", "paused", "sold"].includes(
    listing.status
  );
  const detailTo = `/mali/${listing.id}`;

  const Thumb = (
    <div
      className="relative h-24 shrink-0 overflow-hidden rounded-xl sm:h-28"
      style={{ width: hasManyPhotos ? "100%" : "6rem" }}
    >
      {photos.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center bg-sand">
          <CategoryIcon size={24} color={COLORS.night} />
        </div>
      ) : hasManyPhotos ? (
        <div className="no-scrollbar flex h-full w-full snap-x snap-mandatory gap-1 overflow-x-auto scroll-smooth">
          {photos.map((url, idx) => (
            <div
              key={idx}
              className="relative h-full shrink-0 snap-center overflow-hidden rounded-xl"
              style={{ width: "6.5rem" }}
            >
              <ListingImage
                src={url}
                variant="thumb"
                alt={`${listing.title} — ${idx + 1}`}
                ratio="aspect-square"
                fallback={
                  idx === 0 ? (
                    <CategoryIcon size={24} color={COLORS.night} />
                  ) : null
                }
              />
              <span className="pointer-events-none absolute bottom-1 right-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {idx + 1}/{photos.length}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <ListingImage
          src={photos[0]}
          variant="thumb"
          alt={listing.title}
          ratio="aspect-square"
          fallback={<CategoryIcon size={24} color={COLORS.night} />}
        />
      )}
    </div>
  );

  const Title = (
    <p className="line-clamp-2 break-words text-sm font-semibold leading-snug text-primary">
      {listing.title}
    </p>
  );

  return (
    <div
      className={`w-full min-w-0 max-w-full overflow-hidden rounded-2xl border-[1.5px] bg-white p-2 shadow-[0_1px_2px_rgba(1,25,87,0.04)] transition-all duration-200 hover:border-gold sm:p-2.5 ${
        featured ? "border-gold" : "border-sandline"
      } ${listing.status === "sold" ? "opacity-80" : ""}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        {viewable ? (
          <Link
            to={detailTo}
            className={hasManyPhotos ? "min-w-0 flex-1" : "shrink-0"}
          >
            {Thumb}
          </Link>
        ) : (
          <div className={hasManyPhotos ? "min-w-0 flex-1" : "shrink-0"}>
            {Thumb}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            {viewable ? (
              <Link
                to={detailTo}
                className="min-w-0 flex-1 hover:text-gold-ink"
              >
                {Title}
              </Link>
            ) : (
              <div className="min-w-0 flex-1">{Title}</div>
            )}
            <StatusBadge status={listing.status} lang={lang} />
          </div>

          <p className="mt-1 text-base font-bold leading-tight text-night">
            {formatTZS(listing.price)}
          </p>

          {isUnpaid(listing) &&
            listing.feeAmount > 0 &&
            listing.status !== "approved_pending_payment" && (
              <div
                className="mt-1.5 flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                style={{
                  background: "rgba(193,80,46,0.10)",
                  color: COLORS.rust,
                }}
              >
                <AlertCircle size={12} className="shrink-0" />
                <span className="text-[11px] font-semibold leading-tight">
                  {t("Haijalipwa", "Unpaid")} · {formatTZS(listing.feeAmount)}
                </span>
              </div>
            )}

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-secondary">
            <span className="flex min-w-0 items-center gap-1">
              <CategoryIcon size={11} className="shrink-0" />
              <span className="truncate">{catLabel}</span>
            </span>
            {listing.location && (
              <span className="flex min-w-0 items-center gap-1">
                <MapPin size={11} className="shrink-0" />
                <span className="truncate">{listing.location}</span>
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <Eye size={10} />
              {listing.views || 0}
            </span>
            <span>•</span>
            <span>{timeAgo(listing.postedAt, lang)}</span>
            {featured && (
              <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-night">
                {t("Imeangaziwa", "Featured")}
              </span>
            )}
            {leading && (
              <span className="rounded-full bg-green px-2 py-0.5 text-[10px] font-semibold text-white">
                {t("Kipaumbele", "Priority")}
              </span>
            )}
          </div>

          {/* Status-specific messages */}
          {listing.status === "needs_edit" && (
            <div
              className="mt-1.5 rounded-lg px-2.5 py-1.5"
              style={{ background: "rgba(180,83,9,0.08)" }}
            >
              <p
                className="text-[11px] font-semibold leading-tight"
                style={{ color: "#B45309" }}
              >
                {t("Admin ameomba uhariri:", "Admin requested edit:")}{" "}
                {listing.rejectionReason}
              </p>
            </div>
          )}

          {listing.status === "approved_pending_payment" && (
            <div
              className="mt-1.5 rounded-lg px-2.5 py-1.5"
              style={{ background: "rgba(47,109,79,0.08)" }}
            >
              <p
                className="text-[11px] font-semibold leading-tight"
                style={{ color: COLORS.green }}
              >
                {t(
                  "Admin amekagua — lipa ada ili liidhinishwe",
                  "Admin reviewed — pay fee to publish"
                )}
              </p>
            </div>
          )}

          {listing.status === "paid_pending_approval" && (
            <div
              className="mt-1.5 rounded-lg px-2.5 py-1.5"
              style={{ background: "rgba(37,99,235,0.08)" }}
            >
              <p
                className="text-[11px] font-semibold leading-tight"
                style={{ color: "#2563EB" }}
              >
                {t(
                  "Umelipa — inasubiri idhini ya mwisho",
                  "Paid — awaiting final approval"
                )}
              </p>
            </div>
          )}

          {listing.status === "rejected" && listing.rejectionReason && (
            <p
              style={{ color: COLORS.rust }}
              className="mt-1.5 line-clamp-2 rounded-lg bg-red-50 px-2 py-1 text-[11px]"
            >
              {listing.rejectionReason}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-sandline pt-2.5">
        {/* approved_pending_payment — Pay Now kikubwa */}
        {listing.status === "approved_pending_payment" && (
          <button
            type="button"
            onClick={() => onPay?.(listing.id, listing)}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
            style={{ background: COLORS.rust, color: "white" }}
          >
            <Wallet size={12} />
            {t("Lipa Sasa", "Pay Now")}
          </button>
        )}

        {/* needs_edit — Hariri Sasa kikubwa */}
        {listing.status === "needs_edit" && (
          <button
            type="button"
            onClick={() => onEdit?.(listing.id)}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
            style={{ background: "#B45309", color: "white" }}
          >
            <Pencil size={12} />
            {t("Hariri Sasa", "Edit Now")}
          </button>
        )}

        {/* unpaid legacy — Pay Now */}
        {isUnpaid(listing) &&
          listing.status !== "approved_pending_payment" && (
            <button
              type="button"
              onClick={() => onPay?.(listing.id, listing)}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
              style={{ background: COLORS.rust, color: "white" }}
            >
              <Wallet size={12} />
              {t("Lipa Sasa", "Pay Now")}
            </button>
          )}

        <ActionBtn
          icon={Edit3}
          label={t("Hariri", "Edit")}
          color={COLORS.night}
          onClick={() => onEdit?.(listing.id)}
          disabled={isBusy}
        />

        {isLiveOrReserved && (
          <>
            <ActionBtn
              icon={Rocket}
              label={t("Angaza", "Boost")}
              color={COLORS.goldInk}
              onClick={() => onBoost(listing.id)}
              disabled={isBusy}
            />
            <ActionBtn
              icon={TrendingUp}
              label={t("Kipaumbele", "Priority")}
              color={COLORS.green}
              onClick={() => onLeading(listing.id)}
              disabled={isBusy}
            />
            <ActionBtn
              icon={Megaphone}
              label={t("Tangaza", "Advertise")}
              color={COLORS.rust}
              onClick={() => onAdvertise(listing.id)}
              disabled={isBusy}
            />
          </>
        )}

        {listing.status === "live" && (
          <ActionBtn
            icon={Pause}
            label={t("Simamisha", "Pause")}
            color={COLORS.night}
            onClick={() => onPause(listing.id)}
            disabled={isBusy}
          />
        )}
        {listing.status === "paused" && (
          <ActionBtn
            icon={Play}
            label={t("Endelea", "Resume")}
            color={COLORS.green}
            onClick={() => onResume(listing.id)}
            disabled={isBusy}
          />
        )}
        {isLiveOrReserved && (
          <ActionBtn
            icon={CheckCircle2}
            label={t("Imeuzwa", "Sold")}
            color={COLORS.green}
            onClick={() => onMarkSold(listing.id)}
            disabled={isBusy}
          />
        )}

        <ActionBtn
          icon={isBusy ? Loader2 : Trash2}
          label={t("Futa", "Delete")}
          color={COLORS.rust}
          onClick={() => onRemove(listing.id)}
          disabled={isBusy}
          spin={isBusy}
          danger
          className="ml-auto"
        />
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
  onMarkSold,   // ⬅️ Inatoka DashboardShell
  onPostNew,
  onEdit,
}) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ⬇️ MPYA: confirmation modal state
  const [confirmSold, setConfirmSold] = useState(null);
  const [markingSold, setMarkingSold] = useState(false);

  const goToPayment = (id) => {
    if (String(id).startsWith("temp_")) {
      alert(
        lang === "sw"
          ? "Tangazo lako bado halijathibitishwa. Subiri sekunde chache."
          : "Your listing hasn't synced yet. Please wait."
      );
      return;
    }
    navigate(`/dashboard/pay-listing?id=${id}`);
  };

  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [busy, setBusy] = useState({});

  const filtered = useMemo(() => {
    let list = [...listings];

    if (filter === "unpaid") {
      list = list.filter((l) => isUnpaid(l));
    } else if (filter !== "all") {
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
    { key: "unpaid", label: { sw: "Haijalipwa", en: "Unpaid" } },
    { key: "needs_edit", label: { sw: "Inahitaji Uhariri", en: "Needs Edit" } },
    {
      key: "approved_pending_payment",
      label: { sw: "Lipa Sasa", en: "Pay Now" },
    },
    {
      key: "paid_pending_approval",
      label: { sw: "Inasubiri Idhini", en: "Pending Approval" },
    },
    { key: "in_review", label: { sw: "Inasubiri Admin", en: "Admin Review" } },
    { key: "live", label: { sw: "Hai", en: "Live" } },
    { key: "reserved", label: { sw: "Imehifadhiwa", en: "Reserved" } },
    { key: "sold", label: { sw: "Imeuzwa", en: "Sold" } },
    { key: "paused", label: { sw: "Imesimama", en: "Paused" } },
    { key: "rejected", label: { sw: "Imekataliwa", en: "Rejected" } },
  ];

  // ⬇️ MPYA: Mark sold handlers
  const handleMarkSold = (id) => {
    const listing = listings.find((l) => String(l.id) === String(id));
    if (!listing) return;
    setConfirmSold(listing);
  };

  const handleConfirmMarkSold = async (listing) => {
    setMarkingSold(true);
    try {
      const res = onMarkSold
        ? await onMarkSold(listing.id)
        : await markSoldAsync(listing.id);
      if (!res?.ok) {
        toast.error(
          res?.error?.message ||
            t("Imeshindwa kumark kama imeuzwa.", "Failed to mark as sold.")
        );
      } else {
        toast.success(
          t("Tangazo limewekwa kama imeuzwa.", "Listing marked as sold.")
        );
      }
    } catch (err) {
      toast.error(
        err?.message || t("Imeshindwa kumark kama imeuzwa.", "Failed to mark as sold.")
      );
    } finally {
      setMarkingSold(false);
      setConfirmSold(null);
    }
  };

  const handleRemove = async (id) => {
    if (busy[id]) return;
    const listing = listings.find((l) => String(l.id) === String(id));
    if (!listing) return;

    const ok = await confirm({
      title: t("Futa tangazo?", "Delete listing?"),
      description: t(
        `"${listing.title}" itaingizwa kwenye Recycle Bin. Unaweza kuirejesha kwa dakika 5.`,
        `"${listing.title}" will be moved to the Recycle Bin. You can restore within 5 minutes.`
      ),
      confirmLabel: t("Futa", "Delete"),
      danger: true,
    });
    if (!ok) return;

    setBusy((b) => ({ ...b, [id]: "delete" }));

    let res;
    try {
      res = await onRemove(id);
    } catch (err) {
      res = { ok: false, error: err };
    }
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

    toast.success(t("Tangazo limefutwa", "Listing deleted"), {
      duration: 2000,
    });
  };

  const handleEdit = (id) => {
    if (onEdit) {
      onEdit(id);
    } else {
      navigate(`/dashboard/listings/edit/${id}`);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-hidden">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-bold text-primary">
            {t("Mali Zangu", "My Listings")}
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-0.5">
            {t(`${listings.length} matangazo`, `${listings.length} listings`)}
          </p>
        </div>
        <button
          onClick={onPostNew}
          className="cta-gradient flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg shrink-0"
        >
          <PlusCircle size={14} />
          {t("Weka Mpya", "Post New")}
        </button>
      </div>

      {listings.length > 0 && (
        <>
          <div
            className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 mb-3 w-full"
            style={{ borderColor: COLORS.sandLine }}
          >
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
              const count = listings.filter((l) => {
                if (f.key === "all") return true;
                if (f.key === "unpaid") return isUnpaid(l);
                return l.status === f.key;
              }).length;
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
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
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
              onPay={goToPayment}
              onEdit={handleEdit}
              busy={busy[l.id]}
            />
          ))}
        </div>
      )}

      {/* ⬇️ MPYA: Confirmation Modal */}
      <MarkSoldConfirmModal
        listing={confirmSold}
        lang={lang}
        busy={markingSold}
        onConfirm={handleConfirmMarkSold}
        onClose={() => !markingSold && setConfirmSold(null)}
      />
    </div>
  );
}