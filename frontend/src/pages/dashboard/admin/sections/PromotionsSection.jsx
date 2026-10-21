// ============================================================
// PromotionsSection.jsx
// Admin — Promotions Dashboard (boosted, leading, advertised,
// reserved, success fee, listing fee, campaigns).
//
// Marekebisho:
//  - PromotionCard ina pause/resume/cancel buttons
//  - Modal ya confirmation (pause/resume/cancel + refund option)
//  - Admin anaweza kusimamisha promotion kama kuna mkanganyiko
//  - isPaused prop inaonyesha "IMESIMAMISHWA" badge
//  - actionBusy inazuia double-click
//  - Cancel modal inaonyesha refund preview
//  - ✅ "Revenue by Type" IMEONDOLEWA — mapato yako Overview
// ============================================================

import React, { useState } from "react";
import {
  Rocket,
  TrendingUp,
  Megaphone,
  Plus,
  Trash2,
  Pencil,
  Save,
  Calendar,
  Sparkles,
  Loader2,
  HandCoins,
  Wallet,
  CreditCard,
  AlertTriangle,
  Pause,
  Play,
  Receipt,
} from "lucide-react";
import { COLORS, formatTZS, timeAgo } from "../shared/constants.js";
import { getCategory, getCategoryIcon } from "../../../../config/categoriesStore.js";
import SectionHeader from "../shared/SectionHeader.jsx";
import { useLanguage } from "../../../../context/LanguageContext.jsx";
import {
  usePromotions,
  addCampaignAsync,
  updateCampaignAsync,
  removeCampaignAsync,
  pausePromotionAsync,
  resumePromotionAsync,
  cancelPromotionAsync,
} from "../../../../config/promotionsStore.js";

// ============================================================
// PROMOTION TYPE CONFIG — REVENUE TYPES ZOTE 6
// ============================================================
const PROMO_TYPES = {
  boost: {
    key: "boost",
    label: { sw: "Boost", en: "Boost" },
    icon: Rocket,
    color: COLORS.gold,
    bg: "rgba(232,163,61,0.16)",
  },
  leading: {
    key: "leading",
    label: { sw: "Leading", en: "Leading" },
    icon: TrendingUp,
    color: COLORS.green,
    bg: "rgba(47,109,79,0.14)",
  },
  advertise: {
    key: "advertise",
    label: { sw: "Tangazo", en: "Advertisement" },
    icon: Megaphone,
    color: COLORS.rust,
    bg: "rgba(193,80,46,0.14)",
  },
  reservation: {
    key: "reservation",
    label: { sw: "Uhifadhi", en: "Reservation" },
    icon: HandCoins,
    color: "#2563EB",
    bg: "rgba(37,99,235,0.14)",
  },
  success: {
    key: "success",
    label: { sw: "Ada ya Mafanikio", en: "Success Fee" },
    icon: Wallet,
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.14)",
  },
  listing: {
    key: "listing",
    label: { sw: "Ada ya Kuchapisha", en: "Listing Fee" },
    icon: CreditCard,
    color: "#0891B2",
    bg: "rgba(8,145,178,0.14)",
  },
};

// ============================================================
// PROMOTION CARD — na pause/resume/cancel
// ============================================================
function PromotionCard({
  listing,
  lang,
  type: forcedType,
  onPause,
  onResume,
  onCancel,
  isBusy,
  isPaused,
  showActions = true,
}) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const typeKey = forcedType || listing.promotionType || "boost";
  const type = PROMO_TYPES[typeKey] || PROMO_TYPES.boost;
  const Icon = type.icon;

  const category = getCategory(listing.category);
  const CatIcon = getCategoryIcon(category?.iconKey);
  const catLabel =
    category?.label?.[lang] || category?.label?.sw || listing.category;

  const isUrgent =
    listing.daysRemaining != null && listing.daysRemaining <= 2;

  return (
    <div
      style={{
        borderColor: isPaused ? COLORS.rust : COLORS.sandLine,
        background: isPaused ? "rgba(193,80,46,0.03)" : "white",
      }}
      className="rounded-xl border p-3 sm:p-4 w-full max-w-full min-w-0 overflow-hidden"
    >
      <div className="flex items-start gap-2 sm:gap-3 w-full min-w-0">
        <div
          style={{ background: type?.bg || "#F5F3EC" }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
        >
          <Icon size={15} color={type.color} />
        </div>

        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span
              style={{
                background: type?.bg || "#F5F3EC",
                color: type?.color || "#101A2E",
              }}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
            >
              {type.label?.[lang] || type.label?.sw}
            </span>
            {isPaused && (
              <span
                style={{
                  background: "rgba(193,80,46,0.14)",
                  color: COLORS.rust,
                }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
              >
                {t("IMESIMAMISHWA", "PAUSED")}
              </span>
            )}
            {isUrgent && !isPaused && (
              <span
                style={{
                  background: "rgba(193,80,46,0.14)",
                  color: COLORS.rust,
                }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
              >
                {t("Inaisha Hivi Karibuni", "Expiring Soon")}
              </span>
            )}
          </div>

          <p className="text-sm font-semibold text-primary truncate w-full">
            {listing.title}
          </p>

          <div className="flex items-center gap-2 text-xs text-secondary mt-0.5 flex-wrap">
            {category && (
              <>
                <span className="flex items-center gap-1 min-w-0">
                  <CatIcon size={11} className="shrink-0" />
                  <span className="truncate">{catLabel}</span>
                </span>
                <span className="text-muted shrink-0">•</span>
              </>
            )}
            {listing.price != null && (
              <span className="shrink-0">{formatTZS(listing.price)}</span>
            )}
            {listing.amount != null && listing.price == null && (
              <span className="shrink-0">{formatTZS(listing.amount)}</span>
            )}
          </div>

          <p className="text-[11px] text-muted mt-1 truncate w-full">
            {t("Muuzaji", "Seller")}:{" "}
            {listing.seller_name || listing.seller || listing.user_name || "—"}
          </p>
        </div>

        {listing.daysRemaining != null && !isPaused && (
          <div className="text-right shrink-0">
            <p
              style={{ color: isUrgent ? COLORS.rust : "var(--text-primary)" }}
              className="text-sm font-bold"
            >
              {listing.daysRemaining}d
            </p>
            <p className="text-[10px] text-muted whitespace-nowrap">
              {t("zimebaki", "remaining")}
            </p>
          </div>
        )}

        {listing.date && (
          <div className="text-right shrink-0">
            <p className="text-[11px] text-muted whitespace-nowrap">
              {timeAgo(listing.date, lang)}
            </p>
          </div>
        )}
      </div>

      {/* Actions — pause/resume/cancel */}
      {showActions && (
        <div
          className="flex items-center gap-1.5 mt-3 pt-3 border-t"
          style={{ borderColor: COLORS.sandLine }}
        >
          {isPaused ? (
            <button
              onClick={() => onResume?.(listing)}
              disabled={isBusy}
              style={{ color: COLORS.green, borderColor: COLORS.sandLine }}
              className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBusy ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Play size={11} />
              )}
              {t("Washa", "Resume")}
            </button>
          ) : (
            <button
              onClick={() => onPause?.(listing)}
              disabled={isBusy}
              style={{ color: COLORS.rust, borderColor: COLORS.sandLine }}
              className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBusy ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Pause size={11} />
              )}
              {t("Simamisha", "Pause")}
            </button>
          )}
          <button
            onClick={() => onCancel?.(listing)}
            disabled={isBusy}
            style={{ color: COLORS.rust, borderColor: COLORS.sandLine }}
            className="flex items-center justify-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
            title={t("Futa (na refund)", "Cancel (with refund)")}
          >
            {isBusy ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Trash2 size={11} />
            )}
            {t("Futa", "Cancel")}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CAMPAIGN CARD
// ============================================================
function CampaignCard({ campaign, lang, onEdit, onRemove, isBusy }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const now = Date.now();
  const start = new Date(campaign.startDate).getTime();
  const end = new Date(campaign.endDate).getTime();
  const isActive = campaign.active && now >= start && now <= end;
  const isUpcoming = campaign.active && now < start;
  const isExpired = now > end;

  const status = isActive
    ? { label: t("Inaendelea", "Active"), color: COLORS.green }
    : isUpcoming
      ? { label: t("Inakuja", "Upcoming"), color: COLORS.gold }
      : isExpired
        ? { label: t("Imeisha", "Expired"), color: COLORS.rust }
        : { label: t("Imezimwa", "Inactive"), color: COLORS.night };

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-3 sm:p-4 w-full max-w-full min-w-0 overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 w-full min-w-0">
        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
          <div
            style={{ background: "rgba(232,163,61,0.16)" }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0"
          >
            <Sparkles size={15} color="#8A5A16" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span
                style={{
                  background: `${status.color}15`,
                  color: status.color,
                }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
              >
                {status.label}
              </span>
              {campaign.discountPercent > 0 && (
                <span
                  style={{
                    background: "rgba(193,80,46,0.14)",
                    color: COLORS.rust,
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                >
                  -{campaign.discountPercent}%
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-primary truncate w-full">
              {campaign.name?.[lang] || campaign.name?.sw}
            </p>
            {campaign.description?.[lang] && (
              <p className="text-xs text-secondary mt-0.5 line-clamp-2 break-words">
                {campaign.description[lang]}
              </p>
            )}
            <p className="text-[11px] text-muted mt-1 flex items-center gap-1 flex-wrap w-full">
              <Calendar size={10} className="shrink-0" />
              <span className="truncate">
                {new Date(campaign.startDate).toLocaleDateString(
                  lang === "sw" ? "sw-TZ" : "en-US"
                )}{" "}
                →{" "}
                {new Date(campaign.endDate).toLocaleDateString(
                  lang === "sw" ? "sw-TZ" : "en-US"
                )}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(campaign)}
            disabled={isBusy}
            className="p-1.5 text-muted hover:text-[#FEA406] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("Hariri", "Edit")}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onRemove(campaign)}
            disabled={isBusy}
            className="p-1.5 text-muted hover:text-[#C1502E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t("Ondoa", "Remove")}
          >
            {isBusy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CAMPAIGN FORM
// ============================================================
function CampaignForm({ initial, onSave, onCancel, lang, saving }) {
  const t = (sw, en) => (lang === "sw" ? sw : en);
  const [form, setForm] = useState({
    name: { sw: "", en: "" },
    description: { sw: "", en: "" },
    discountPercent: 10,
    appliesTo: "ALL",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    active: true,
    ...initial,
  });

  const APPLIES_TO_OPTIONS = [
    { key: "ALL", label: t("Zote", "All") },
    { key: "BOOST", label: t("Boost Pekee", "Boost Only") },
    { key: "LEADING", label: t("Leading Pekee", "Leading Only") },
    { key: "ADVERTISEMENT", label: t("Matangazo Pekee", "Advertisements Only") },
  ];

  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-3 sm:p-4 flex flex-col gap-3 w-full max-w-full min-w-0 overflow-hidden"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
        <label className="flex flex-col gap-1 min-w-0 w-full">
          <span className="text-[11px] font-semibold text-secondary">
            {t("Jina (SW)", "Name (SW)")}
          </span>
          <input
            value={form.name?.sw || ""}
            onChange={(e) =>
              setForm({ ...form, name: { ...form.name, sw: e.target.value } })
            }
            disabled={saving}
            className="w-full max-w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#FEA406] disabled:opacity-50"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0 w-full">
          <span className="text-[11px] font-semibold text-secondary">
            {t("Jina (EN)", "Name (EN)")}
          </span>
          <input
            value={form.name?.en || ""}
            onChange={(e) =>
              setForm({ ...form, name: { ...form.name, en: e.target.value } })
            }
            disabled={saving}
            className="w-full max-w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#FEA406] disabled:opacity-50"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
        <label className="flex flex-col gap-1 min-w-0 w-full">
          <span className="text-[11px] font-semibold text-secondary">
            {t("Maelezo (SW)", "Description (SW)")}
          </span>
          <textarea
            value={form.description?.sw || ""}
            onChange={(e) =>
              setForm({
                ...form,
                description: { ...form.description, sw: e.target.value },
              })
            }
            rows={2}
            disabled={saving}
            className="w-full max-w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#FEA406] resize-none disabled:opacity-50"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0 w-full">
          <span className="text-[11px] font-semibold text-secondary">
            {t("Maelezo (EN)", "Description (EN)")}
          </span>
          <textarea
            value={form.description?.en || ""}
            onChange={(e) =>
              setForm({
                ...form,
                description: { ...form.description, en: e.target.value },
              })
            }
            rows={2}
            disabled={saving}
            className="w-full max-w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#FEA406] resize-none disabled:opacity-50"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
        <label className="flex flex-col gap-1 min-w-0 w-full">
          <span className="text-[11px] font-semibold text-secondary">
            {t("Punguzo (%)", "Discount (%)")}
          </span>
          <input
            type="number"
            min={0}
            max={100}
            value={form.discountPercent}
            onChange={(e) =>
              setForm({
                ...form,
                discountPercent: Math.min(
                  100,
                  Math.max(0, Number(e.target.value) || 0)
                ),
              })
            }
            disabled={saving}
            className="w-full max-w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#FEA406] disabled:opacity-50"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0 w-full">
          <span className="text-[11px] font-semibold text-secondary">
            {t("Inatumika Kwa", "Applies To")}
          </span>
          <select
            value={form.appliesTo || "ALL"}
            onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}
            disabled={saving}
            className="w-full max-w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#FEA406] disabled:opacity-50"
          >
            {APPLIES_TO_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full min-w-0">
        <label className="flex flex-col gap-1 min-w-0 w-full">
          <span className="text-[11px] font-semibold text-secondary">
            {t("Tarehe ya Kuanza", "Start Date")}
          </span>
          <input
            type="date"
            value={form.startDate?.slice(0, 10) || ""}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            disabled={saving}
            className="w-full max-w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#FEA406] disabled:opacity-50"
          />
        </label>
        <label className="flex flex-col gap-1 min-w-0 w-full">
          <span className="text-[11px] font-semibold text-secondary">
            {t("Tarehe ya Mwisho", "End Date")}
          </span>
          <input
            type="date"
            value={form.endDate?.slice(0, 10) || ""}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            disabled={saving}
            className="w-full max-w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#FEA406] disabled:opacity-50"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 cursor-pointer w-full min-w-0">
        <input
          type="checkbox"
          checked={form.active !== false}
          onChange={(e) => setForm({ ...form, active: e.target.checked })}
          disabled={saving}
          className="w-4 h-4 rounded text-[#FEA406] shrink-0"
        />
        <span className="text-xs text-secondary">
          {t("Kampeni hai", "Active campaign")}
        </span>
      </label>

      <div className="flex items-center gap-2 flex-wrap w-full min-w-0">
        <button
          onClick={onCancel}
          disabled={saving}
          className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-secondary shrink-0 disabled:opacity-50"
        >
          {t("Ghairi", "Cancel")}
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={saving}
          style={{ background: COLORS.gold, color: COLORS.night }}
          className="flex-1 min-w-0 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Save size={13} />
          )}
          {t("Hifadhi", "Save")}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// CONFIRM ACTION MODAL
// ============================================================
function ConfirmActionModal({ action, lang, busy, onConfirm, onClose }) {
  if (!action) return null;
  const t = (sw, en) => (lang === "sw" ? sw : en);

  const isPause = action.type === "pause";
  const isResume = action.type === "resume";
  const isCancel = action.type === "cancel";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6">
        <div className="text-center mb-5">
          <div
            style={{
              background: isResume ? `${COLORS.green}15` : `${COLORS.rust}15`,
            }}
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
          >
            {isResume ? (
              <Play size={26} color={COLORS.green} />
            ) : isPause ? (
              <Pause size={26} color={COLORS.rust} />
            ) : (
              <AlertTriangle size={26} color={COLORS.rust} />
            )}
          </div>
          <h3 className="text-lg font-bold text-primary">
            {isPause && t("Simamisha Promotion?", "Pause Promotion?")}
            {isResume && t("Washa Promotion?", "Resume Promotion?")}
            {isCancel && t("Futa Promotion?", "Cancel Promotion?")}
          </h3>
          <p className="text-sm text-secondary mt-2 break-words">
            {action.title}
          </p>
          {isPause && (
            <p className="text-xs text-muted mt-2">
              {t(
                "Itaondolewa kwenye rotation hadi utakapoiwasha.",
                "It will be removed from rotation until you resume it."
              )}
            </p>
          )}
          {isCancel && (
            <div className="mt-3">
              <label className="flex items-center gap-2 justify-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={action.refund || false}
                  onChange={(e) =>
                    onConfirm({ ...action, refund: e.target.checked })
                  }
                  disabled={busy}
                  className="w-4 h-4"
                />
                <span className="text-xs text-secondary">
                  {t("Toa refund kwa muuzaji", "Refund seller")}
                </span>
              </label>
              {action.refund && (
                <div
                  style={{
                    background: "rgba(47,109,79,0.08)",
                    color: COLORS.green,
                  }}
                  className="mt-3 rounded-lg px-3 py-2 text-xs flex items-start gap-2"
                >
                  <Receipt size={12} className="shrink-0 mt-0.5" />
                  <span>
                    {t(
                      "Refund itaundwa na admin atashughulikia kwenye Refunds section.",
                      "Refund will be created and admin will process it in Refunds section."
                    )}
                  </span>
                </div>
              )}
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
            onClick={() => onConfirm(action)}
            disabled={busy}
            style={{
              background: isResume ? COLORS.green : COLORS.rust,
              color: "white",
            }}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {busy ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {t("Inafanya...", "Working...")}
              </>
            ) : (
              <>
                {isResume && <Play size={14} />}
                {isPause && <Pause size={14} />}
                {isCancel && <Trash2 size={14} />}
                {isPause && t("Simamisha", "Pause")}
                {isResume && t("Washa", "Resume")}
                {isCancel && t("Futa", "Cancel")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN SECTION
// ============================================================
export default function PromotionsSection() {
  const { lang } = useLanguage();
  const promotions = usePromotions(lang);

  const [activeTab, setActiveTab] = useState("boost");
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [addingCampaign, setAddingCampaign] = useState(false);
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");

  // pause/resume/cancel
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionBusy, setActionBusy] = useState({});

  const t = (sw, en) => (lang === "sw" ? sw : en);

  // ============================================================
  // PROMOTION ACTION HANDLERS
  // ============================================================
  const handlePause = (listing, type) => {
    setConfirmAction({
      type: "pause",
      promotionType: type,
      id: listing.id,
      title: listing.title,
    });
  };

  const handleResume = (listing, type) => {
    setConfirmAction({
      type: "resume",
      promotionType: type,
      id: listing.id,
      title: listing.title,
    });
  };

  const handleCancel = (listing, type) => {
    setConfirmAction({
      type: "cancel",
      promotionType: type,
      id: listing.id,
      title: listing.title,
      refund: false,
    });
  };

  const handleConfirmAction = async (action) => {
    if (!action) return;
    const { type, promotionType, id, refund } = action;

    const busyKey = `${type}-${id}`;
    setActionBusy((b) => ({ ...b, [busyKey]: true }));
    setError("");

    let res;
    if (type === "pause") {
      res = await pausePromotionAsync(promotionType, id, "");
    } else if (type === "resume") {
      res = await resumePromotionAsync(promotionType, id, "");
    } else if (type === "cancel") {
      res = await cancelPromotionAsync(promotionType, id, "", refund);
    }

    setActionBusy((b) => {
      const next = { ...b };
      delete next[busyKey];
      return next;
    });

    if (res?.ok) {
      setConfirmAction(null);
    } else {
      setError(
        res?.error?.message || t("Action imeshindwa.", "Action failed.")
      );
    }
  };

  const isListingBusy = (id) =>
    !!actionBusy[`pause-${id}`] ||
    !!actionBusy[`resume-${id}`] ||
    !!actionBusy[`cancel-${id}`];

  // ============================================================
  // CAMPAIGN HANDLERS
  // ============================================================
  const handleAddCampaign = async (form) => {
    if (busy.campaignSave) return;
    setBusy((b) => ({ ...b, campaignSave: true }));
    setError("");
    const res = await addCampaignAsync(form);
    setBusy((b) => {
      const next = { ...b };
      delete next.campaignSave;
      return next;
    });
    if (res.ok) {
      setAddingCampaign(false);
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kuongeza kampeni.", "Failed to add campaign.")
      );
    }
  };

  const handleUpdateCampaign = async (id, form) => {
    if (busy.campaignSave) return;
    setBusy((b) => ({ ...b, campaignSave: true }));
    setError("");
    const res = await updateCampaignAsync(id, form);
    setBusy((b) => {
      const next = { ...b };
      delete next.campaignSave;
      return next;
    });
    if (res.ok) {
      setEditingCampaign(null);
    } else {
      setError(
        res.error?.message ||
          t("Imeshindwa kuhifadhi kampeni.", "Failed to save campaign.")
      );
    }
  };

  const handleRemoveCampaign = async (campaign) => {
    if (!window.confirm(t("Ondoa kampeni?", "Remove campaign?"))) return;
    if (busy[`campaign-${campaign.id}`]) return;
    setBusy((b) => ({ ...b, [`campaign-${campaign.id}`]: true }));
    setError("");
    const res = await removeCampaignAsync(campaign.id);
    setBusy((b) => {
      const next = { ...b };
      delete next[`campaign-${campaign.id}`];
      return next;
    });
    if (!res.ok) {
      setError(
        res.error?.message ||
          t("Imeshindwa kuondoa kampeni.", "Failed to remove campaign.")
      );
    }
  };

  // ============================================================
  // TABS
  // ============================================================
  const TABS = [
    {
      key: "boost",
      label: t("Boost", "Boost"),
      icon: Rocket,
      count: promotions.counts.boosted,
      color: COLORS.gold,
    },
    {
      key: "advertise",
      label: t("Matangazo", "Advertisements"),
      icon: Megaphone,
      count: promotions.counts.advertised,
      color: COLORS.rust,
    },
    {
      key: "leading",
      label: t("Leading", "Leading"),
      icon: TrendingUp,
      count: promotions.counts.leading,
      color: COLORS.green,
    },
    {
      key: "reservation",
      label: t("Uhifadhi", "Reservation"),
      icon: HandCoins,
      count: promotions.counts.reserved,
      color: "#2563EB",
    },
    {
      key: "success",
      label: t("Ada ya Mafanikio", "Success Fee"),
      icon: Wallet,
      count: promotions.counts.successFee,
      color: "#7C3AED",
    },
    {
      key: "listing",
      label: t("Ada ya Kuchapisha", "Listing Fee"),
      icon: CreditCard,
      count: promotions.counts.listingFee,
      color: "#0891B2",
    },
    {
      key: "campaigns",
      label: t("Kampeni", "Campaigns"),
      icon: Sparkles,
      count: promotions.counts.campaigns,
      color: COLORS.gold,
    },
  ];

  // ============================================================
  // TAB CONTENT
  // ============================================================
  const renderTabContent = () => {
    const promoListProps = (type) => ({
      lang,
      type,
      onPause: (l) => handlePause(l, type),
      onResume: (l) => handleResume(l, type),
      onCancel: (l) => handleCancel(l, type),
      isBusy: (l) => isListingBusy(l.id),
    });

    if (activeTab === "boost") {
      return promotions.boostedListings.length === 0 ? (
        <EmptyState
          icon={Rocket}
          title={t("Hakuna Boosted Listings", "No Boosted Listings")}
          subtitle={t(
            "Mali zenye boost zitaonekana hapa.",
            "Boosted listings will appear here."
          )}
        />
      ) : (
        <div className="flex flex-col gap-3 w-full min-w-0">
          {promotions.boostedListings.map((l) => (
            <PromotionCard
              key={l.id}
              listing={l}
              {...promoListProps("boost")}
              isBusy={isListingBusy(l.id)}
              isPaused={l.paused_by_admin || l.status === "PAUSED"}
            />
          ))}
        </div>
      );
    }

    if (activeTab === "advertise") {
      return promotions.advertisedListings.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={t("Hakuna Matangazo", "No Advertisements")}
          subtitle={t(
            "Mali zenye banner zitaonekana hapa.",
            "Advertised listings will appear here."
          )}
        />
      ) : (
        <div className="flex flex-col gap-3 w-full min-w-0">
          {promotions.advertisedListings.map((l) => (
            <PromotionCard
              key={l.id}
              listing={l}
              {...promoListProps("advertise")}
              isBusy={isListingBusy(l.id)}
              isPaused={l.paused_by_admin || l.active === false}
            />
          ))}
        </div>
      );
    }

    if (activeTab === "leading") {
      return promotions.leadingListings.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title={t("Hakuna Leading Listings", "No Leading Listings")}
          subtitle={t(
            "Mali zenye leading zitaonekana hapa.",
            "Leading listings will appear here."
          )}
        />
      ) : (
        <div className="flex flex-col gap-3 w-full min-w-0">
          {promotions.leadingListings.map((l) => (
            <PromotionCard
              key={l.id}
              listing={l}
              {...promoListProps("leading")}
              isBusy={isListingBusy(l.id)}
              isPaused={l.paused_by_admin || l.status === "PAUSED"}
            />
          ))}
        </div>
      );
    }

    if (activeTab === "reservation") {
      return promotions.reservedListings.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title={t("Hakuna Reservations", "No Reservations")}
          subtitle={t(
            "Mali zilizohifadhiwa zitaonekana hapa.",
            "Reserved listings will appear here."
          )}
        />
      ) : (
        <div className="flex flex-col gap-3 w-full min-w-0">
          {promotions.reservedListings.map((l) => (
            <PromotionCard
              key={l.id}
              listing={l}
              {...promoListProps("reservation")}
              isBusy={isListingBusy(l.id)}
              isPaused={l.paused_by_admin || l.status === "PAUSED"}
            />
          ))}
        </div>
      );
    }

    if (activeTab === "success") {
      return promotions.successFeeDeals.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={t("Hakuna Success Fee", "No Success Fee")}
          subtitle={t(
            "Miamala ya success fee itaonekana hapa.",
            "Success fee transactions will appear here."
          )}
        />
      ) : (
        <div className="flex flex-col gap-3 w-full min-w-0">
          {promotions.successFeeDeals.map((l) => (
            <PromotionCard
              key={l.id}
              listing={l}
              lang={lang}
              type="success"
              showActions={false}
            />
          ))}
        </div>
      );
    }

    if (activeTab === "listing") {
      return promotions.listingFeeTransactions.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={t("Hakuna Listing Fee", "No Listing Fee")}
          subtitle={t(
            "Miamala ya listing fee itaonekana hapa.",
            "Listing fee transactions will appear here."
          )}
        />
      ) : (
        <div className="flex flex-col gap-3 w-full min-w-0">
          {promotions.listingFeeTransactions.map((l) => (
            <PromotionCard
              key={l.id}
              listing={l}
              lang={lang}
              type="listing"
              showActions={false}
            />
          ))}
        </div>
      );
    }

    if (activeTab === "campaigns") {
      return (
        <div className="flex flex-col gap-3 w-full min-w-0">
          <button
            onClick={() => {
              setAddingCampaign(true);
              setEditingCampaign(null);
              setError("");
            }}
            disabled={addingCampaign || !!editingCampaign}
            style={{ background: COLORS.gold, color: COLORS.night }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg self-start shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={13} />
            {t("Kampeni Mpya", "New Campaign")}
          </button>

          {addingCampaign && (
            <CampaignForm
              initial={{}}
              lang={lang}
              saving={!!busy.campaignSave}
              onSave={handleAddCampaign}
              onCancel={() => setAddingCampaign(false)}
            />
          )}

          {editingCampaign && (
            <CampaignForm
              initial={editingCampaign}
              lang={lang}
              saving={!!busy.campaignSave}
              onSave={(form) =>
                handleUpdateCampaign(editingCampaign.id, form)
              }
              onCancel={() => setEditingCampaign(null)}
            />
          )}

          {promotions.campaigns.length === 0 && !addingCampaign ? (
            <EmptyState
              icon={Sparkles}
              title={t("Hakuna Kampeni", "No Campaigns")}
              subtitle={t(
                "Kampeni za matangazo zitaonekana hapa.",
                "Promotional campaigns will appear here."
              )}
            />
          ) : (
            promotions.campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                lang={lang}
                isBusy={!!busy[`campaign-${campaign.id}`]}
                onEdit={(c) => {
                  setEditingCampaign(c);
                  setAddingCampaign(false);
                  setError("");
                }}
                onRemove={handleRemoveCampaign}
              />
            ))
          )}
        </div>
      );
    }

    return null;
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full max-w-7xl mx-auto min-w-0 overflow-hidden">
      <SectionHeader
        title={t("Matangazo & Kampeni", "Promotions & Campaigns")}
        subtitle={t(
          "Fuatilia na simamia promotions. Unaweza kusimamisha promotion kama kuna mkanganyiko wa malipo.",
          "Track and manage promotions. You can pause a promotion if there's a payment conflict."
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

      {/* Stats — 6 stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-5 w-full">
        <StatBox
          label={t("Boost", "Boost")}
          value={promotions.counts.boosted}
          icon={Rocket}
          color={COLORS.gold}
        />
        <StatBox
          label={t("Matangazo", "Advertisements")}
          value={promotions.counts.advertised}
          icon={Megaphone}
          color={COLORS.rust}
        />
        <StatBox
          label={t("Leading", "Leading")}
          value={promotions.counts.leading}
          icon={TrendingUp}
          color={COLORS.green}
        />
        <StatBox
          label={t("Uhifadhi", "Reservations")}
          value={promotions.counts.reserved}
          icon={HandCoins}
          color="#2563EB"
        />
        <StatBox
          label={t("Success Fee", "Success Fee")}
          value={promotions.counts.successFee}
          icon={Wallet}
          color="#7C3AED"
        />
        <StatBox
          label={t("Listing Fee", "Listing Fee")}
          value={promotions.counts.listingFee}
          icon={CreditCard}
          color="#0891B2"
        />
      </div>

      {/* Tabs */}
      <div className="flex justify-start sm:justify-center gap-2 mb-4 overflow-x-auto pb-2 w-full min-w-0">
        {TABS.map(({ key, label, icon: Icon, count, color }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                background: isActive ? COLORS.night : "white",
                color: isActive ? COLORS.sand : "var(--text-primary)",
                borderColor: COLORS.sandLine,
              }}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border whitespace-nowrap shrink-0"
            >
              <Icon size={13} color={isActive ? COLORS.gold : color} />
              <span>{label}</span>
              <span
                style={{
                  background: isActive
                    ? "rgba(245,243,236,0.18)"
                    : COLORS.sandLine,
                  color: isActive ? COLORS.sand : "var(--text-primary)",
                }}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="w-full min-w-0">{renderTabContent()}</div>

      {/* Confirm Action Modal */}
      <ConfirmActionModal
        action={confirmAction}
        lang={lang}
        busy={!!actionBusy[`${confirmAction?.type}-${confirmAction?.id}`]}
        onConfirm={handleConfirmAction}
        onClose={() => !actionBusy && setConfirmAction(null)}
      />
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================
function StatBox({ label, value, icon: Icon, color }) {
  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-xl border p-2.5 sm:p-3 min-w-0 w-full overflow-hidden"
    >
      <div
        style={{ background: `${color}15` }}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-1.5 shrink-0"
      >
        <Icon size={13} color={color} />
      </div>
      <p className="text-sm sm:text-base lg:text-lg font-bold text-primary break-words leading-tight">
        {value}
      </p>
      <p className="text-[10px] text-secondary leading-tight mt-0.5 break-words">
        {label}
      </p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div
      style={{ borderColor: COLORS.sandLine, background: "white" }}
      className="rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center w-full"
    >
      <Icon size={40} className="mx-auto text-muted mb-3" />
      <h3 className="font-semibold text-primary mb-1 break-words">{title}</h3>
      <p className="text-sm text-secondary break-words">{subtitle}</p>
    </div>
  );
}