// ============================================================
// TrashSection.jsx
// Admin — Trash / Recycle Bin.
// Inaonyesha items zilizofutwa kwa kila aina, na kuruhusu
// restore, permanent delete, na empty.
// Bilingual + mobile-responsive + Async actions na rollback.
// ============================================================

import React, { useState, useMemo } from "react";
import {
  Trash2,
  RotateCcw,
  Loader2,
  AlertTriangle,
  X,
  History,
  Home as HomeIcon,
  Users as UsersIcon,
  ShieldCheck,
  Headphones,
  Image as ImageIcon,
  Megaphone,
  Handshake,
  Search,
  FileText,
  Clock,
  User as UserIcon,
} from "lucide-react";
import { COLORS, timeAgo } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  TRASH_TYPES,
  useTrashOverview,
  useTrashItems,
  useHasTrash,
  restoreTrashItemAsync,
  permanentDeleteTrashItemAsync,
  emptyTrashByTypeAsync,
  emptyTrashAsync,
} from "../../../../config/trashStore.js";

// ============================================================
// ICON MAP
// ============================================================
const ICON_MAP = {
  Home: HomeIcon,
  Users: UsersIcon,
  ShieldCheck,
  Headphones,
  Image: ImageIcon,
  Megaphone,
  Handshake,
};

function getTypeConfig(typeKey) {
  return TRASH_TYPES.find((t) => t.key === typeKey) || TRASH_TYPES[0];
}

// ============================================================
// CONFIRM MODAL — generic confirmation
// ============================================================
function ConfirmModal({ open, title, description, confirmLabel, danger, busy, onConfirm, onClose, lang }) {
  if (!open) return null;
  const t = (sw, en) => (lang === "sw" ? sw : en);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6">
        <div className="text-center mb-5">
          <div
            style={{
              background: danger ? `${COLORS.rust}15` : `${COLORS.gold}15`,
            }}
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
          >
            <AlertTriangle size={26} color={danger ? COLORS.rust : COLORS.gold} />
          </div>
          <h3 className="text-lg font-bold text-primary">{title}</h3>
          <p className="text-sm text-secondary mt-2">{description}</p>
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
            onClick={onConfirm}
            disabled={busy}
            style={{
              background: danger ? COLORS.rust : COLORS.gold,
              color: danger ? "white" : COLORS.night,
            }}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {busy ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t("Inafanya...", "Working...")}
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ITEM CARD
// ============================================================
function TrashItemCard({ item, lang, onRestore, onDelete, busyState }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const typeConfig = getTypeConfig(item.type);
  const Icon = ICON_MAP[typeConfig.iconKey] || FileText;

  const isRestoring = busyState?.restore;
  const isDeleting = busyState?.delete;
  const isBusy = isRestoring || isDeleting;

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-3 sm:p-4 w-full max-w-full min-w-0 overflow-hidden"
    >
      <div className="flex items-start gap-3 w-full min-w-0">
        <div
          style={{ background: `${typeConfig.color}15` }}
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        >
          <Icon size={16} color={typeConfig.color} />
        </div>

        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-sm font-semibold text-primary truncate w-full">
            {item.name || `#${item.id}`}
          </p>
          {item.subtitle && (
            <p className="text-xs text-secondary truncate w-full mt-0.5">
              {item.subtitle}
            </p>
          )}
          {item.details && (
            <p className="text-[11px] text-muted mt-1 line-clamp-2 break-words">
              {item.details}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted flex-wrap">
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {item.deletedAt ? timeAgo(item.deletedAt, lang) : "—"}
            </span>
            {item.deletedBy && item.deletedBy !== "—" && (
              <>
                <span className="text-muted">•</span>
                <span className="flex items-center gap-1 truncate">
                  <UserIcon size={10} />
                  {item.deletedBy}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onRestore}
            disabled={isBusy}
            style={{ color: COLORS.green }}
            className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("Rudisha", "Restore")}
          >
            {isRestoring ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RotateCcw size={12} />
            )}
            <span className="hidden sm:inline">
              {t("Rudisha", "Restore")}
            </span>
          </button>
          <button
            onClick={onDelete}
            disabled={isBusy}
            style={{ color: COLORS.rust }}
            className="p-2 rounded-lg border transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("Futa Kabisa", "Delete Permanently")}
          >
            {isDeleting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ITEMS LIST — kwa type moja
// ============================================================
function TrashTypeItems({ type, lang, onEmptyType }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const items = useTrashItems(type);

  const [busy, setBusy] = useState({}); // { [id]: { restore: bool, delete: bool } }
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null); // item
  const [confirming, setConfirming] = useState(false);

  const setItemBusy = (id, key, value) => {
    setBusy((b) => ({
      ...b,
      [id]: { ...(b[id] || {}), [key]: value },
    }));
  };

  const handleRestore = async (item) => {
    setError("");
    setItemBusy(item.id, "restore", true);
    const res = await restoreTrashItemAsync(item.type, item.id);
    setItemBusy(item.id, "restore", false);

    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kurudisha item.", "Failed to restore item.")
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setConfirming(true);
    setError("");
    const res = await permanentDeleteTrashItemAsync(
      confirmDelete.type,
      confirmDelete.id
    );
    setConfirming(false);
    setConfirmDelete(null);
    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kufuta item.", "Failed to delete item.")
      );
    }
  };

  if (items.length === 0) {
    return (
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center w-full"
      >
        <Trash2 size={40} className="mx-auto text-muted mb-3" />
        <h3 className="font-semibold text-primary mb-1">
          {t("Hakuna items kwenye aina hii", "No items in this type")}
        </h3>
        <p className="text-sm text-secondary">
          {t(
            "Items zilizofutwa kwenye aina hii zitaonekana hapa.",
            "Deleted items from this type will appear here."
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full min-w-0">
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

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-secondary">
          {items.length}{" "}
          {items.length === 1
            ? t("item", "item")
            : t("items", "items")}
        </p>
        <button
          onClick={() => onEmptyType(type)}
          disabled={confirming}
          style={{ color: COLORS.rust }}
          className="flex items-center gap-1 text-xs font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 size={12} />
          {t("Futa Zote za Aina Hii", "Empty This Type")}
        </button>
      </div>

      {items.map((item) => (
        <TrashItemCard
          key={item.id}
          item={item}
          lang={lang}
          busyState={busy[item.id]}
          onRestore={() => handleRestore(item)}
          onDelete={() => setConfirmDelete(item)}
        />
      ))}

      <ConfirmModal
        open={!!confirmDelete}
        busy={confirming}
        danger
        title={t("Futa Kabisa?", "Delete Permanently?")}
        description={t(
          `"${confirmDelete?.name || ""}" itafutwa kabisa. Hatua hii haiwezi kurudishwa.`,
          `"${confirmDelete?.name || ""}" will be permanently deleted. This action cannot be undone.`
        )}
        confirmLabel={
          <>
            <Trash2 size={14} />
            {t("Futa Kabisa", "Delete Permanently")}
          </>
        }
        onConfirm={handleDeleteConfirm}
        onClose={() => !confirming && setConfirmDelete(null)}
        lang={lang}
      />
    </div>
  );
}

// ============================================================
// MAIN SECTION
// ============================================================
export default function TrashSection() {
  const { lang } = useLanguage();
  const overview = useTrashOverview();
  const hasTrash = useHasTrash();

  const [activeType, setActiveType] = useState(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState({}); // { emptyAll, emptyType: bool }
  const [error, setError] = useState("");
  const [confirmEmptyAll, setConfirmEmptyAll] = useState(false);
  const [confirmEmptyType, setConfirmEmptyType] = useState(null);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ============================================================
  // TYPE FILTERS + counts
  // ============================================================
  const typesWithCounts = useMemo(() => {
    return TRASH_TYPES.map((t) => ({
      ...t,
      count: Number(overview[t.key]) || 0,
    })).filter((t) => t.count > 0 || activeType === t.key);
  }, [overview, activeType]);

  const totalItems = Number(overview.total) || 0;

  // ============================================================
  // HANDLERS — empty all
  // ============================================================
  const handleEmptyAllConfirm = async () => {
    setBusy((b) => ({ ...b, emptyAll: true }));
    setError("");
    const res = await emptyTrashAsync();
    setBusy((b) => {
      const n = { ...b };
      delete n.emptyAll;
      return n;
    });
    setConfirmEmptyAll(false);
    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kufuta trash yote.", "Failed to empty trash.")
      );
    }
  };

  // ============================================================
  // HANDLERS — empty type
  // ============================================================
  const handleEmptyTypeConfirm = async () => {
    if (!confirmEmptyType) return;
    const type = confirmEmptyType;
    setBusy((b) => ({ ...b, [`emptyType-${type}`]: true }));
    setError("");
    const res = await emptyTrashByTypeAsync(type);
    setBusy((b) => {
      const n = { ...b };
      delete n[`emptyType-${type}`];
      return n;
    });
    setConfirmEmptyType(null);
    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kufuta aina hii.", "Failed to empty this type.")
      );
    }
  };

  const filteredTypes = typesWithCounts.filter((t) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      t.label?.sw?.toLowerCase().includes(q) ||
      t.label?.en?.toLowerCase().includes(q) ||
      t.key.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-hidden">
      <SectionHeader
        title={t("Sanduku la Taka", "Recycle Bin")}
        subtitle={t(
          "Items zilizofutwa. Unaweza kuzirudisha au kuzifuta kabisa.",
          "Deleted items. You can restore or permanently delete them."
        )}
      />

      {/* Error banner */}
      {error && (
        <div
          style={{
            background: "rgba(193,80,46,0.1)",
            color: COLORS.rust,
          }}
          className="text-xs font-semibold px-3 py-2 rounded-lg mb-4"
        >
          {error}
        </div>
      )}

      {/* Summary Card */}
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-xl border p-3 sm:p-4 mb-5 flex items-start gap-3 flex-wrap w-full min-w-0"
      >
        <div
          style={{ background: `${COLORS.rust}15` }}
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        >
          <Trash2 size={18} color={COLORS.rust} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary break-words">
            {totalItems}{" "}
            {totalItems === 1
              ? t("item kwenye trash", "item in trash")
              : t("items kwenye trash", "items in trash")}
          </p>
          <p className="text-xs text-secondary mt-0.5">
            {t(
              "Bofya aina yoyote kuona items zake.",
              "Click any type to view its items."
            )}
          </p>
        </div>
        {totalItems > 0 && (
          <button
            onClick={() => setConfirmEmptyAll(true)}
            disabled={busy.emptyAll}
            style={{ color: COLORS.rust }}
            className="flex items-center gap-1 text-xs font-semibold shrink-0 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy.emptyAll ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
            {t("Futa Zote", "Empty All")}
          </button>
        )}
      </div>

      {/* Empty state */}
      {!hasTrash && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-2xl border-2 border-dashed p-10 text-center w-full"
        >
          <Trash2 size={48} className="mx-auto text-muted mb-3" />
          <h3 className="font-semibold text-primary mb-1">
            {t("Trash ni tupu", "Trash is empty")}
          </h3>
          <p className="text-sm text-secondary">
            {t(
              "Items zilizofutwa zitaonekana hapa.",
              "Deleted items will appear here."
            )}
          </p>
        </div>
      )}

      {/* Types + items */}
      {hasTrash && (
        <>
          {/* Search */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 mb-4 w-full min-w-0">
            <Search size={14} className="text-muted shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Tafuta aina...", "Search type...")}
              className="outline-none text-xs flex-1 min-w-0"
            />
          </div>

          {/* Type tabs */}
          <div className="flex justify-center gap-2 mb-4 overflow-x-auto pb-2 w-full min-w-0">
            <button
              onClick={() => setActiveType(null)}
              style={{
                background: activeType === null ? COLORS.night : "white",
                color: activeType === null ? COLORS.sand : "var(--text-primary)",
                borderColor: COLORS.sandLine,
              }}
              className="text-xs font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
            >
              {t("Muhtasari", "Overview")}
            </button>
            {filteredTypes.map((ty) => {
              const Icon = ICON_MAP[ty.iconKey] || FileText;
              const isActive = activeType === ty.key;
              return (
                <button
                  key={ty.key}
                  onClick={() => setActiveType(ty.key)}
                  style={{
                    background: isActive ? COLORS.night : "white",
                    color: isActive ? COLORS.sand : "var(--text-primary)",
                    borderColor: COLORS.sandLine,
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
                >
                  <Icon size={12} />
                  {ty.label[lang] || ty.label.sw}
                  <span
                    style={{
                      background: isActive
                        ? "rgba(245,243,236,0.18)"
                        : COLORS.sandLine,
                      color: isActive ? COLORS.sand : "var(--text-primary)",
                    }}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  >
                    {ty.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Overview — breakdown grid */}
          {activeType === null && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 w-full min-w-0">
              {typesWithCounts.map((ty) => {
                const Icon = ICON_MAP[ty.iconKey] || FileText;
                return (
                  <button
                    key={ty.key}
                    onClick={() => setActiveType(ty.key)}
                    style={{
                      borderColor: COLORS.sandLine,
                      background: "white",
                    }}
                    className="rounded-xl border p-3 sm:p-4 min-w-0 w-full text-left hover:shadow-md transition-all"
                  >
                    <div
                      style={{ background: `${ty.color}15` }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center mb-2 shrink-0"
                    >
                      <Icon size={16} color={ty.color} />
                    </div>
                    <p
                      style={{ color: ty.color }}
                      className="text-2xl font-bold leading-tight"
                    >
                      {ty.count}
                    </p>
                    <p className="text-[11px] text-secondary mt-0.5 truncate">
                      {ty.label[lang] || ty.label.sw}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Items for active type */}
          {activeType !== null && (
            <TrashTypeItems
              type={activeType}
              lang={lang}
              onEmptyType={(ty) => setConfirmEmptyType(ty)}
            />
          )}
        </>
      )}

      {/* Confirm — Empty All */}
      <ConfirmModal
        open={confirmEmptyAll}
        busy={!!busy.emptyAll}
        danger
        title={t("Futa Trash Yote?", "Empty Entire Trash?")}
        description={t(
          "Items zote kwenye trash zitafutwa kabisa. Hatua hii haiwezi kurudishwa.",
          "All items in trash will be permanently deleted. This action cannot be undone."
        )}
        confirmLabel={
          <>
            <Trash2 size={14} />
            {t("Futa Zote", "Empty All")}
          </>
        }
        onConfirm={handleEmptyAllConfirm}
        onClose={() => !busy.emptyAll && setConfirmEmptyAll(false)}
        lang={lang}
      />

      {/* Confirm — Empty Type */}
      <ConfirmModal
        open={!!confirmEmptyType}
        busy={!!busy[`emptyType-${confirmEmptyType}`]}
        danger
        title={t("Futa Aina Hii?", "Empty This Type?")}
        description={t(
          `Items zote za "${confirmEmptyType ? getTypeConfig(confirmEmptyType).label[lang] : ""}" zitafutwa kabisa.`,
          `All items of type "${confirmEmptyType ? getTypeConfig(confirmEmptyType).label[lang] : ""}" will be permanently deleted.`
        )}
        confirmLabel={
          <>
            <Trash2 size={14} />
            {t("Futa Zote", "Empty All")}
          </>
        }
        onConfirm={handleEmptyTypeConfirm}
        onClose={() =>
          !busy[`emptyType-${confirmEmptyType}`] && setConfirmEmptyType(null)
        }
        lang={lang}
      />
    </div>
  );
}
