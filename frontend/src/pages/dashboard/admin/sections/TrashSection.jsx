// ============================================================
// TrashSection.jsx
// Admin — Trash / Recycle Bin.
//
// Marekebisho:
//  - Admin anaweza kufuta KILA KITU, ikiwemo protected items
//  - Protected items zinaonyesha onyo la ziada kwenye confirm modal
//  - "Empty This Type" na "Empty All" zinafanya kazi kwa protected pia
//  - ConfirmModal ina `extraWarning` prop (hiari)
// ============================================================

import React, { useState, useMemo } from "react";
import {
  Trash2,
  RotateCcw,
  Loader2,
  AlertTriangle,
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
  ShieldAlert,
} from "lucide-react";
import { COLORS, timeAgo } from "../shared/constants.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  getAllTrashTypes,
  getTrashTypeConfig,
  useTrashOverview,
  useTrashItemsState,
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
  return getTrashTypeConfig(typeKey);
}

// ============================================================
// CONFIRM MODAL
// ============================================================
function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  danger,
  busy,
  onConfirm,
  onClose,
  lang,
  extraWarning,
}) {
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
            <AlertTriangle
              size={26}
              color={danger ? COLORS.rust : COLORS.gold}
            />
          </div>
          <h3 className="text-lg font-bold text-primary">{title}</h3>
          <p className="text-sm text-secondary mt-2">{description}</p>

          {extraWarning && (
            <div
              style={{
                background: `${COLORS.rust}12`,
                color: COLORS.rust,
                border: `1px solid ${COLORS.rust}30`,
              }}
              className="mt-3 text-[11px] font-semibold px-3 py-2 rounded-lg text-left flex items-start gap-1.5"
            >
              <ShieldAlert size={13} className="shrink-0 mt-0.5" />
              <span>{extraWarning}</span>
            </div>
          )}
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
function TrashItemCard({
  item,
  lang,
  onRestore,
  onDelete,
  busyState,
  isProtected,
}) {
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

          {/* Protected notice — onyo tu, si kizuizi */}
          {isProtected && (
            <div
              style={{
                background: `${COLORS.gold}15`,
                color: "#8A5A16",
              }}
              className="mt-2 text-[10px] font-semibold px-2 py-1 rounded-lg flex items-center gap-1 w-fit"
            >
              <ShieldAlert size={11} />
              {t(
                "Inalindwa — futa kwa tahadhari",
                "Protected — delete with caution"
              )}
            </div>
          )}
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

          {/* Kitufe cha kufuta — kinaonekana KILA MARA */}
          <button
            onClick={onDelete}
            disabled={isBusy}
            style={{
              color: COLORS.rust,
              borderColor: isProtected ? `${COLORS.rust}60` : undefined,
              background: isProtected ? `${COLORS.rust}08` : undefined,
            }}
            className="p-2 rounded-lg border transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("Futa Kabisa", "Delete Permanently")}
            title={
              isProtected
                ? t(
                    "Inalindwa — bado unaweza kufuta",
                    "Protected — you can still delete"
                  )
                : t("Futa Kabisa", "Delete Permanently")
            }
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
  const { items, loading, error: loadError, reload } = useTrashItemsState(type);

  const typeConfig = getTypeConfig(type);
  const isProtected = typeConfig?.isProtected;

  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
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
      const detail = res.error?.data?.detail || res.error?.message;
      const protObjs = res.error?.data?.protected_objects;
      setError(
        protObjs && protObjs.length
          ? `${detail} (${protObjs.join(", ")})`
          : detail || t("Imeshindwa kufuta item.", "Failed to delete item.")
      );
    }
  };

  if (loading && items.length === 0) {
    return (
      <div
        style={{ borderColor: COLORS.sandLine, background: "white" }}
        className="rounded-2xl border p-8 text-center w-full"
      >
        <Loader2 size={28} className="mx-auto text-muted mb-2 animate-spin" />
        <p className="text-sm text-secondary">
          {t("Inapakia items...", "Loading items...")}
        </p>
      </div>
    );
  }

  if (loadError && items.length === 0) {
    return (
      <div
        style={{ borderColor: COLORS.rust, background: "white" }}
        className="rounded-2xl border p-6 text-center w-full"
      >
        <AlertTriangle
          size={28}
          color={COLORS.rust}
          className="mx-auto mb-2"
        />
        <h3 className="font-semibold text-primary mb-1">
          {t("Imeshindwa kupakia items", "Failed to load items")}
        </h3>
        <p className="text-xs text-secondary mb-3 break-words">
          {loadError?.message || ""}
        </p>
        <button
          onClick={reload}
          style={{ background: COLORS.night, color: COLORS.sand }}
          className="text-xs font-semibold px-4 py-2 rounded-lg"
        >
          {t("Jaribu tena", "Try again")}
        </button>
      </div>
    );
  }

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
          {items.length === 1 ? t("item", "item") : t("items", "items")}
        </p>
        {/* Empty This Type — inaonekana KILA MARA */}
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
          isProtected={isProtected || item.protected}
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
        extraWarning={
          (isProtected || confirmDelete?.protected) &&
          t(
            "⚠️ Item hii inalindwa. Kufuta kunaweza kuathiri mfumo. Endelea tu ikiwa una uhakika.",
            "⚠️ This item is protected. Deleting may affect the system. Continue only if you are sure."
          )
        }
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
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");
  const [confirmEmptyAll, setConfirmEmptyAll] = useState(false);
  const [confirmEmptyType, setConfirmEmptyType] = useState(null);

  const t = (sw, en) => (lang === "sw" ? sw : en);

  const typesWithCounts = useMemo(() => {
    return getAllTrashTypes(overview).filter(
      (ty) => ty.count > 0 || activeType === ty.key
    );
  }, [overview, activeType]);

  const totalItems = Number(overview.total) || 0;
  const hasProtectedTypes = (overview.protectedTypes || []).length > 0;

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
          t(
            "Imeshindwa kufuta recycle bin yote.",
            "Failed to empty recycle bin."
          )
      );
    }
  };

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

  const filteredTypes = typesWithCounts.filter((ty) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      ty.label?.sw?.toLowerCase().includes(q) ||
      ty.label?.en?.toLowerCase().includes(q) ||
      ty.key.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-hidden">
      <SectionHeader
        title={t("Sanduku la Kurejesha", "Recycle Bin")}
        subtitle={t(
          "Items zilizofutwa. Unaweza kuzirudisha au kuzifuta kabisa.",
          "Deleted items. You can restore or permanently delete them."
        )}
      />

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
              ? t("item kwenye sanduku la kurejesha", "item in recycle bin")
              : t(
                  "items kwenye sanduku la kurejesha",
                  "items in recycle bin"
                )}
          </p>
          <p className="text-xs text-secondary mt-0.5">
            {t(
              "Bofya aina yoyote kuona items zake.",
              "Click any type to view its items."
            )}
          </p>
          {hasProtectedTypes && (
            <p className="text-[10px] text-muted mt-1 flex items-center gap-1">
              <ShieldAlert size={9} />
              {t(
                "Baadhi ya items zinalindwa — unaweza kuzifuta kwa tahadhari.",
                "Some items are protected — you can delete them with caution."
              )}
            </p>
          )}
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

      {!hasTrash && (
        <div
          style={{ borderColor: COLORS.sandLine, background: "white" }}
          className="rounded-2xl border-2 border-dashed p-10 text-center w-full"
        >
          <Trash2 size={48} className="mx-auto text-muted mb-3" />
          <h3 className="font-semibold text-primary mb-1">
            {t("Sanduku la kurejesha ni tupu", "Recycle bin is empty")}
          </h3>
          <p className="text-sm text-secondary">
            {t(
              "Items zilizofutwa zitaonekana hapa.",
              "Deleted items will appear here."
            )}
          </p>
        </div>
      )}

      {hasTrash && (
        <>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 mb-4 w-full min-w-0">
            <Search size={14} className="text-muted shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Tafuta aina...", "Search type...")}
              className="outline-none text-xs flex-1 min-w-0"
            />
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 w-full min-w-0 sm:justify-center">
            <button
              onClick={() => setActiveType(null)}
              style={{
                background: activeType === null ? COLORS.night : "white",
                color:
                  activeType === null ? COLORS.sand : "var(--text-primary)",
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
                  {ty.isProtected && <ShieldAlert size={10} />}
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
                    {ty.isProtected && (
                      <p className="text-[9px] text-muted mt-1 flex items-center gap-1">
                        <ShieldAlert size={9} />
                        {t("Inalindwa", "Protected")}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {activeType !== null && (
            <TrashTypeItems
              type={activeType}
              lang={lang}
              onEmptyType={(ty) => setConfirmEmptyType(ty)}
            />
          )}
        </>
      )}

      <ConfirmModal
        open={confirmEmptyAll}
        busy={!!busy.emptyAll}
        danger
        title={t(
          "Futa Sanduku la Kurejesha Yote?",
          "Empty Entire Recycle Bin?"
        )}
        description={t(
          "Items zote kwenye sanduku la kurejesha zitafutwa kabisa. Hatua hii haiwezi kurudishwa.",
          "All items in the recycle bin will be permanently deleted. This action cannot be undone."
        )}
        extraWarning={
          hasProtectedTypes &&
          t(
            "⚠️ Kuna items zinalindwa kwenye sanduku hili. Zitafutwa pia. Hakikisha umezingatia usalama wa mfumo.",
            "⚠️ There are protected items in this bin. They will also be deleted. Please ensure system safety."
          )
        }
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

      <ConfirmModal
        open={!!confirmEmptyType}
        busy={!!busy[`emptyType-${confirmEmptyType}`]}
        danger
        title={t("Futa Aina Hii?", "Empty This Type?")}
        description={t(
          `Items zote za "${
            confirmEmptyType
              ? getTypeConfig(confirmEmptyType).label[lang]
              : ""
          }" zitafutwa kabisa.`,
          `All items of type "${
            confirmEmptyType
              ? getTypeConfig(confirmEmptyType).label[lang]
              : ""
          }" will be permanently deleted.`
        )}
        extraWarning={
          confirmEmptyType &&
          getTypeConfig(confirmEmptyType).isProtected &&
          t(
            "⚠️ Aina hii inalindwa. Kufuta zote kunaweza kuathiri mfumo. Endelea kwa tahadhari.",
            "⚠️ This type is protected. Emptying it may affect the system. Proceed with caution."
          )
        }
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